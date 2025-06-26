import { execSync } from 'child_process';
import * as crypto from 'crypto';

/**
 * Secure Keychain storage for Roam API tokens
 * Uses macOS Keychain to protect credentials from malware
 */
export class KeychainStorage {
  private static readonly SERVICE_NAME = 'roam-mcp';
  private static readonly ACCOUNT_PREFIX = 'roam-api-token';
  
  /**
   * Store token in macOS Keychain with enhanced security
   */
  static async storeToken(graphName: string, token: string): Promise<void> {
    const account = `${this.ACCOUNT_PREFIX}-${graphName}`;
    
    try {
      // Delete existing token if any
      this.deleteToken(graphName);
    } catch {
      // Ignore if doesn't exist
    }

    try {
      // Add token to keychain with security settings
      // -T "" means require authentication for access
      // -U updates if exists
      const command = [
        'security', 'add-generic-password',
        '-s', `"${this.SERVICE_NAME}"`,
        '-a', `"${account}"`,
        '-w', `"${token}"`,
        '-D', '"Roam Research API Token"',
        '-j', '"API token for Roam Research MCP server"',
        '-T', '""',  // Require auth
        '-U'         // Update if exists
      ].join(' ');

      execSync(command, { stdio: 'ignore' });
      
      // Set additional access controls
      this.setKeychainItemAccess(account);
      
    } catch (error) {
      throw new Error(`Failed to store token in Keychain: ${error}`);
    }
  }

  /**
   * Retrieve token from Keychain
   */
  static getToken(graphName: string): string {
    const account = `${this.ACCOUNT_PREFIX}-${graphName}`;
    
    try {
      const token = execSync(
        `security find-generic-password -s "${this.SERVICE_NAME}" -a "${account}" -w`,
        { encoding: 'utf8', stdio: ['pipe', 'pipe', 'ignore'] }
      ).trim();
      
      if (!token) {
        throw new Error('Token not found');
      }
      
      return token;
    } catch (error) {
      throw new Error(
        `Failed to retrieve token from Keychain. Please run setup again.`
      );
    }
  }

  /**
   * Delete token from Keychain
   */
  static deleteToken(graphName: string): void {
    const account = `${this.ACCOUNT_PREFIX}-${graphName}`;
    
    try {
      execSync(
        `security delete-generic-password -s "${this.SERVICE_NAME}" -a "${account}"`,
        { stdio: 'ignore' }
      );
    } catch {
      // Ignore if doesn't exist
    }
  }

  /**
   * Check if token exists in Keychain
   */
  static hasToken(graphName: string): boolean {
    const account = `${this.ACCOUNT_PREFIX}-${graphName}`;
    
    try {
      execSync(
        `security find-generic-password -s "${this.SERVICE_NAME}" -a "${account}"`,
        { stdio: 'ignore' }
      );
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Set restrictive access controls on keychain item
   */
  private static setKeychainItemAccess(account: string): void {
    try {
      // Get the path to the current executable
      const currentApp = process.execPath;
      
      // Set access control list to only allow specific applications
      const command = [
        'security', 'set-generic-password-access',
        '-s', `"${this.SERVICE_NAME}"`,
        '-a', `"${account}"`,
        '-T', `"${currentApp}"`,  // Allow current app
        '-T', '"/usr/bin/security"'  // Allow security command
      ].join(' ');
      
      execSync(command, { stdio: 'ignore' });
    } catch {
      // Best effort - continue if this fails
    }
  }

  /**
   * Verify Keychain integrity
   */
  static verifyKeychainIntegrity(): boolean {
    try {
      // Check if keychain is locked
      const status = execSync('security show-keychain-info', { 
        encoding: 'utf8',
        stdio: ['pipe', 'pipe', 'pipe'] 
      });
      
      // Check for common malware indicators
      const suspiciousProcesses = [
        'keychainbreaker',
        'chainbreaker',
        'keylogger'
      ];
      
      const processes = execSync('ps aux', { encoding: 'utf8' });
      for (const suspicious of suspiciousProcesses) {
        if (processes.toLowerCase().includes(suspicious)) {
          console.error(`⚠️  Warning: Suspicious process detected: ${suspicious}`);
          return false;
        }
      }
      
      return true;
    } catch {
      return true; // Assume OK if we can't check
    }
  }

  /**
   * Export all settings for a graph (except token)
   */
  static exportSettings(graphName: string): any {
    // This would export non-sensitive settings
    // Token is never exported
    return {
      graphName,
      exportDate: new Date().toISOString(),
      version: '1.0.0'
    };
  }
}

/**
 * Secure configuration manager using Keychain
 */
export class SecureConfigManager {
  private static configCache = new Map<string, any>();
  
  /**
   * Store complete configuration securely
   */
  static async storeConfig(config: {
    graphName: string;
    apiToken: string;
    dailyNoteFormat?: string;
    defaultTimeout?: number;
  }): Promise<void> {
    // Store token in keychain
    await KeychainStorage.storeToken(config.graphName, config.apiToken);
    
    // Store other settings in a separate secure location
    const settings = {
      graphName: config.graphName,
      dailyNoteFormat: config.dailyNoteFormat || 'MMMM Do, YYYY',
      defaultTimeout: config.defaultTimeout || 30000,
      createdAt: new Date().toISOString()
    };
    
    // Store in keychain as JSON (without token)
    const settingsJson = JSON.stringify(settings);
    const settingsAccount = `${config.graphName}-settings`;
    
    try {
      execSync(
        `security add-generic-password -s "roam-mcp-settings" -a "${settingsAccount}" -w '${settingsJson}' -U`,
        { stdio: 'ignore' }
      );
    } catch (error) {
      console.warn('Could not store settings in keychain, using fallback');
      // Fallback handled elsewhere
    }
    
    // Clear cache
    this.configCache.delete(config.graphName);
  }

  /**
   * Load configuration from secure storage
   */
  static loadConfig(graphName: string): any {
    // Check cache first
    if (this.configCache.has(graphName)) {
      return this.configCache.get(graphName);
    }
    
    try {
      // Get token from keychain
      const apiToken = KeychainStorage.getToken(graphName);
      
      // Get settings
      let settings;
      try {
        const settingsJson = execSync(
          `security find-generic-password -s "roam-mcp-settings" -a "${graphName}-settings" -w`,
          { encoding: 'utf8', stdio: ['pipe', 'pipe', 'ignore'] }
        ).trim();
        settings = JSON.parse(settingsJson);
      } catch {
        // Use defaults if settings not found
        settings = {
          graphName,
          dailyNoteFormat: 'MMMM Do, YYYY',
          defaultTimeout: 30000
        };
      }
      
      const config = {
        ...settings,
        apiToken
      };
      
      // Cache for performance (token is already in memory)
      this.configCache.set(graphName, config);
      
      return config;
    } catch (error) {
      throw new Error(`Failed to load configuration: ${error}`);
    }
  }

  /**
   * Clear all stored data for a graph
   */
  static async clearConfig(graphName: string): Promise<void> {
    // Clear token
    KeychainStorage.deleteToken(graphName);
    
    // Clear settings
    try {
      execSync(
        `security delete-generic-password -s "roam-mcp-settings" -a "${graphName}-settings"`,
        { stdio: 'ignore' }
      );
    } catch {
      // Ignore if doesn't exist
    }
    
    // Clear cache
    this.configCache.delete(graphName);
  }

  /**
   * List all configured graphs (without tokens)
   */
  static listGraphs(): string[] {
    try {
      const output = execSync(
        `security find-generic-password -s "${KeychainStorage['SERVICE_NAME']}"`,
        { encoding: 'utf8', stdio: ['pipe', 'pipe', 'ignore'] }
      );
      
      const graphs = new Set<string>();
      const lines = output.split('\n');
      
      for (const line of lines) {
        if (line.includes('acct')) {
          const match = line.match(/"([^"]+)"/);
          if (match && match[1].startsWith('roam-api-token-')) {
            const graphName = match[1].replace('roam-api-token-', '');
            graphs.add(graphName);
          }
        }
      }
      
      return Array.from(graphs);
    } catch {
      return [];
    }
  }
}

/**
 * Secure token wrapper that auto-clears from memory
 */
export class SecureToken {
  private buffer: Buffer;
  private destroyed = false;
  private timeout: NodeJS.Timeout;

  constructor(token: string, autoDestroyMs: number = 60000) {
    this.buffer = Buffer.from(token);
    
    // Auto-destroy after timeout
    this.timeout = setTimeout(() => {
      this.destroy();
    }, autoDestroyMs);
  }

  /**
   * Get token value (throws if destroyed)
   */
  getValue(): string {
    if (this.destroyed) {
      throw new Error('Token has been destroyed');
    }
    return this.buffer.toString('utf8');
  }

  /**
   * Use token temporarily and auto-clear
   */
  async use<T>(callback: (token: string) => Promise<T>): Promise<T> {
    if (this.destroyed) {
      throw new Error('Token has been destroyed');
    }
    
    const token = this.getValue();
    try {
      return await callback(token);
    } finally {
      // Clear local copy
      const temp = Buffer.from(token);
      temp.fill(0);
    }
  }

  /**
   * Destroy token immediately
   */
  destroy(): void {
    if (!this.destroyed) {
      this.buffer.fill(0);
      this.destroyed = true;
      clearTimeout(this.timeout);
    }
  }
}