import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { RoamConfig } from './types';
import { KeychainStorage, SecureConfigManager, SecureToken } from './security/keychain';

/**
 * Configuration manager using macOS Keychain for secure token storage
 */
export class KeychainConfig {
  private static readonly CONFIG_DIR = path.join(os.homedir(), '.roam-mcp');
  private static readonly CONFIG_FILE = 'config.json';
  private static tokenCache: SecureToken | null = null;

  /**
   * Load configuration with Keychain-stored token
   */
  static loadConfig(): RoamConfig {
    // Load settings from file
    const configPath = path.join(this.CONFIG_DIR, this.CONFIG_FILE);
    
    if (!fs.existsSync(configPath)) {
      throw new Error(
        'Configuration not found. Please run: npm run setup:keychain'
      );
    }

    const settings = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    
    // Get token from Keychain
    const apiToken = KeychainStorage.getToken(settings.graphName);
    
    // Create secure token wrapper
    this.tokenCache = new SecureToken(apiToken);
    
    return {
      apiToken,
      graphName: settings.graphName,
      dailyNoteFormat: settings.dailyNoteFormat || 'MMMM Do, YYYY',
      defaultTimeout: settings.defaultTimeout || 30000
    };
  }

  /**
   * Save configuration with Keychain token storage
   */
  static async saveConfig(config: {
    apiToken: string;
    graphName: string;
    dailyNoteFormat?: string;
    defaultTimeout?: number;
  }): Promise<void> {
    // Verify keychain integrity first
    if (!KeychainStorage.verifyKeychainIntegrity()) {
      throw new Error('Keychain integrity check failed. Please check for malware.');
    }

    // Store token in Keychain
    await KeychainStorage.storeToken(config.graphName, config.apiToken);

    // Create config directory
    if (!fs.existsSync(this.CONFIG_DIR)) {
      fs.mkdirSync(this.CONFIG_DIR, { mode: 0o700 });
    }

    // Save other settings to file (no token)
    const settings = {
      graphName: config.graphName,
      dailyNoteFormat: config.dailyNoteFormat || 'MMMM Do, YYYY',
      defaultTimeout: config.defaultTimeout || 30000,
      version: '1.0.0',
      createdAt: new Date().toISOString(),
      storageType: 'keychain'
    };

    const configPath = path.join(this.CONFIG_DIR, this.CONFIG_FILE);
    fs.writeFileSync(
      configPath,
      JSON.stringify(settings, null, 2),
      { mode: 0o600 }
    );

    console.log('✅ Configuration saved');
    console.log('✅ API token stored securely in macOS Keychain');
  }

  /**
   * Clear all stored configuration
   */
  static async clearConfig(): Promise<void> {
    try {
      // Load settings to get graph name
      const configPath = path.join(this.CONFIG_DIR, this.CONFIG_FILE);
      if (fs.existsSync(configPath)) {
        const settings = JSON.parse(fs.readFileSync(configPath, 'utf8'));
        
        // Delete token from Keychain
        KeychainStorage.deleteToken(settings.graphName);
        
        // Delete config file
        fs.unlinkSync(configPath);
      }

      // Clear token cache
      if (this.tokenCache) {
        this.tokenCache.destroy();
        this.tokenCache = null;
      }

      console.log('✅ Configuration cleared');
    } catch (error) {
      console.error('Error clearing configuration:', error);
    }
  }

  /**
   * Check if configuration exists
   */
  static hasConfig(): boolean {
    const configPath = path.join(this.CONFIG_DIR, this.CONFIG_FILE);
    if (!fs.existsSync(configPath)) {
      return false;
    }

    try {
      const settings = JSON.parse(fs.readFileSync(configPath, 'utf8'));
      return KeychainStorage.hasToken(settings.graphName);
    } catch {
      return false;
    }
  }

  /**
   * Get secure token for temporary use
   */
  static getSecureToken(): SecureToken | null {
    return this.tokenCache;
  }

  /**
   * Validate configuration
   */
  static validateConfig(config: RoamConfig): void {
    if (!config.apiToken || config.apiToken.trim() === '') {
      throw new Error('API token cannot be empty');
    }

    if (!config.graphName || config.graphName.trim() === '') {
      throw new Error('Graph name cannot be empty');
    }

    if (config.defaultTimeout && config.defaultTimeout < 1000) {
      throw new Error('Default timeout must be at least 1000ms');
    }

    // Check for suspicious patterns in config
    const suspiciousPatterns = [
      /[<>\"\']/,  // Potential XSS
      /\$\{/,       // Template injection
      /eval|exec/i  // Code execution
    ];

    for (const pattern of suspiciousPatterns) {
      if (pattern.test(config.graphName)) {
        throw new Error('Invalid characters in graph name');
      }
    }
  }

  /**
   * Migrate from .env to Keychain storage
   */
  static async migrateFromEnv(): Promise<boolean> {
    try {
      // Check if .env exists
      const envPath = path.join(process.cwd(), '.env');
      if (!fs.existsSync(envPath)) {
        return false;
      }

      // Load .env file
      const envContent = fs.readFileSync(envPath, 'utf8');
      const envVars: any = {};
      
      envContent.split('\n').forEach(line => {
        const [key, ...valueParts] = line.split('=');
        if (key && valueParts.length > 0) {
          envVars[key.trim()] = valueParts.join('=').trim();
        }
      });

      if (envVars.ROAM_API_TOKEN && envVars.ROAM_GRAPH_NAME) {
        // Save to Keychain
        await this.saveConfig({
          apiToken: envVars.ROAM_API_TOKEN,
          graphName: envVars.ROAM_GRAPH_NAME,
          dailyNoteFormat: envVars.DAILY_NOTE_FORMAT,
          defaultTimeout: envVars.DEFAULT_TIMEOUT ? parseInt(envVars.DEFAULT_TIMEOUT) : undefined
        });

        // Backup and remove .env
        const backupPath = envPath + '.backup';
        fs.renameSync(envPath, backupPath);
        
        console.log('✅ Migrated from .env to Keychain storage');
        console.log(`📁 .env backed up to: ${backupPath}`);
        return true;
      }
    } catch (error) {
      console.error('Migration failed:', error);
    }
    
    return false;
  }
}