import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import { RoamConfig } from './types';

const SERVICE_NAME = 'roam-mcp';
const ACCOUNT_NAME = 'api-token';

export class SecureConfig {
  private static config: RoamConfig | null = null;

  /**
   * Store API token in macOS Keychain
   */
  static async storeTokenInKeychain(token: string): Promise<void> {
    try {
      // Delete existing token if any
      try {
        execSync(`security delete-generic-password -s "${SERVICE_NAME}" -a "${ACCOUNT_NAME}"`, {
          stdio: 'ignore'
        });
      } catch {
        // Ignore error if password doesn't exist
      }

      // Add new token to keychain
      execSync(
        `security add-generic-password -s "${SERVICE_NAME}" -a "${ACCOUNT_NAME}" -w "${token}" -T "" -U`,
        { stdio: 'ignore' }
      );
      
      console.log('✅ Token stored securely in macOS Keychain');
    } catch (error) {
      throw new Error('Failed to store token in Keychain: ' + error);
    }
  }

  /**
   * Retrieve API token from macOS Keychain
   */
  private static getTokenFromKeychain(): string {
    try {
      const token = execSync(
        `security find-generic-password -s "${SERVICE_NAME}" -a "${ACCOUNT_NAME}" -w`,
        { encoding: 'utf8' }
      ).trim();
      
      if (!token) {
        throw new Error('Token not found in Keychain');
      }
      
      return token;
    } catch (error) {
      throw new Error(
        'Failed to retrieve token from Keychain. Please run: npm run setup-token'
      );
    }
  }

  /**
   * Load configuration with secure token retrieval
   */
  static loadSecureConfig(): RoamConfig {
    if (this.config) {
      return this.config;
    }

    // Try to load from secure config file first
    const configPath = path.join(process.env.HOME || '', '.roam-mcp', 'config.json');
    
    if (!fs.existsSync(configPath)) {
      throw new Error(
        'Configuration not found. Please run: npm run setup'
      );
    }

    const configData = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    
    // Get token from Keychain, never from file or env
    const apiToken = this.getTokenFromKeychain();
    
    this.config = {
      apiToken,
      graphName: configData.graphName,
      dailyNoteFormat: configData.dailyNoteFormat || 'MMMM Do, YYYY',
      defaultTimeout: configData.defaultTimeout || 30000
    };

    return this.config;
  }

  /**
   * Setup secure configuration
   */
  static async setupSecureConfig(config: {
    apiToken: string;
    graphName: string;
    dailyNoteFormat?: string;
    defaultTimeout?: number;
  }): Promise<void> {
    // Store token in Keychain
    await this.storeTokenInKeychain(config.apiToken);

    // Store other config in file (without token)
    const configDir = path.join(process.env.HOME || '', '.roam-mcp');
    if (!fs.existsSync(configDir)) {
      fs.mkdirSync(configDir, { mode: 0o700 }); // Only owner can access
    }

    const configPath = path.join(configDir, 'config.json');
    const configData = {
      graphName: config.graphName,
      dailyNoteFormat: config.dailyNoteFormat,
      defaultTimeout: config.defaultTimeout
    };

    fs.writeFileSync(
      configPath,
      JSON.stringify(configData, null, 2),
      { mode: 0o600 } // Only owner can read/write
    );

    console.log('✅ Configuration saved securely');
  }

  /**
   * Clear all stored credentials
   */
  static async clearCredentials(): Promise<void> {
    try {
      execSync(`security delete-generic-password -s "${SERVICE_NAME}" -a "${ACCOUNT_NAME}"`, {
        stdio: 'ignore'
      });
      console.log('✅ Token removed from Keychain');
    } catch {
      console.log('No token found in Keychain');
    }

    const configPath = path.join(process.env.HOME || '', '.roam-mcp', 'config.json');
    if (fs.existsSync(configPath)) {
      fs.unlinkSync(configPath);
      console.log('✅ Configuration file removed');
    }
  }
}

// Additional security: Clear sensitive data from memory
export function clearSensitiveData(data: any): void {
  if (typeof data === 'string') {
    // Overwrite string memory (best effort in JS)
    const buffer = Buffer.from(data);
    buffer.fill(0);
  } else if (data && typeof data === 'object') {
    if (data.apiToken) {
      const buffer = Buffer.from(data.apiToken);
      buffer.fill(0);
      delete data.apiToken;
    }
  }
}