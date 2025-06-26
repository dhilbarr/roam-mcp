#!/usr/bin/env node

import * as readline from 'readline';
import { KeychainConfig } from './config-keychain';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(prompt: string): Promise<string> {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
}

function hiddenQuestion(prompt: string): Promise<string> {
  return new Promise((resolve) => {
    const stdin = process.stdin;
    const stdout = process.stdout;

    // Print prompt
    stdout.write(prompt);

    // Store original settings
    const wasRaw = stdin.isRaw;
    
    // Hide input
    if (stdin.setRawMode) {
      stdin.setRawMode(true);
    }
    
    let input = '';
    
    stdin.on('data', function onData(char) {
      const str = char.toString();
      
      switch (str) {
        case '\n':
        case '\r':
        case '\u0004': // Ctrl+D
          stdin.removeListener('data', onData);
          if (stdin.setRawMode) {
            stdin.setRawMode(wasRaw);
          }
          stdout.write('\n');
          resolve(input);
          break;
        case '\u0003': // Ctrl+C
          stdin.removeListener('data', onData);
          if (stdin.setRawMode) {
            stdin.setRawMode(wasRaw);
          }
          stdout.write('\n');
          process.exit();
          break;
        case '\u007f': // Backspace
        case '\b':
          if (input.length > 0) {
            input = input.slice(0, -1);
            stdout.write('\b \b');
          }
          break;
        default:
          // Regular character
          input += str;
          stdout.write('*');
          break;
      }
    });
  });
}

async function main() {
  console.log('🔐 Roam MCP Keychain Setup\n');
  console.log('This will store your API token securely in macOS Keychain.');
  console.log('Your token will be encrypted and protected by macOS security.\n');

  try {
    // Check for existing configuration
    if (KeychainConfig.hasConfig()) {
      const overwrite = await question('Configuration already exists. Overwrite? (y/N): ');
      if (overwrite.toLowerCase() !== 'y') {
        console.log('Setup cancelled.');
        process.exit(0);
      }
    }

    // Check for migration opportunity
    const migrated = await KeychainConfig.migrateFromEnv();
    if (migrated) {
      console.log('\n✅ Successfully migrated from .env to Keychain!');
      const verify = await question('\nWould you like to test the connection? (Y/n): ');
      if (verify.toLowerCase() !== 'n') {
        await testConnection();
      }
      process.exit(0);
    }

    // Get configuration
    console.log('Please provide your Roam Research credentials:\n');
    
    const graphName = await question('Graph name: ');
    if (!graphName.trim()) {
      throw new Error('Graph name is required');
    }

    const apiToken = await hiddenQuestion('API token (hidden): ');
    if (!apiToken.trim()) {
      throw new Error('API token is required');
    }

    console.log('\nOptional settings (press Enter to use defaults):\n');
    
    const dailyFormat = await question('Daily note format (default: MMMM Do, YYYY): ');
    const timeoutStr = await question('API timeout in ms (default: 30000): ');
    
    // Validate inputs
    const config = {
      apiToken: apiToken.trim(),
      graphName: graphName.trim(),
      dailyNoteFormat: dailyFormat.trim() || undefined,
      defaultTimeout: timeoutStr.trim() ? parseInt(timeoutStr.trim()) : undefined
    };

    // Validate configuration
    KeychainConfig.validateConfig({
      ...config,
      dailyNoteFormat: config.dailyNoteFormat || 'MMMM Do, YYYY',
      defaultTimeout: config.defaultTimeout || 30000
    });

    console.log('\n🔄 Storing credentials securely...');

    // Save configuration
    await KeychainConfig.saveConfig(config);

    console.log('\n✅ Setup complete!\n');
    console.log('Your API token is now stored in macOS Keychain with the following security:');
    console.log('  • Encrypted with your login password');
    console.log('  • Protected by macOS security framework');
    console.log('  • Requires authentication for access');
    console.log('  • Resistant to file-based malware\n');
    
    console.log('To use with Claude Desktop, update your MCP configuration to use:');
    console.log('  /path/to/roam-mcp/dist/server-keychain.js\n');

    // Test connection
    const test = await question('Would you like to test the connection? (Y/n): ');
    if (test.toLowerCase() !== 'n') {
      await testConnection();
    }

  } catch (error: any) {
    console.error('\n❌ Setup failed:', error.message);
    if (error.message.includes('Keychain')) {
      console.error('\nTroubleshooting tips:');
      console.error('  • Make sure you\'re running on macOS');
      console.error('  • Check that Keychain Access is not locked');
      console.error('  • Try running with admin privileges if needed');
    }
    process.exit(1);
  } finally {
    rl.close();
  }
}

async function testConnection() {
  console.log('\n🔄 Testing connection...');
  
  try {
    // Load config
    const config = KeychainConfig.loadConfig();
    console.log('✅ Configuration loaded successfully');
    
    // Import and test client
    const { RoamClient } = await import('./roam-client');
    const client = new RoamClient(config);
    
    console.log('🔄 Connecting to Roam Research...');
    await client.initialize();
    
    console.log('✅ Connection successful!');
    console.log(`✅ Connected to graph: ${config.graphName}`);
    
    // Try a simple query
    const testQuery = '[:find (count ?e) :where [?e :node/title]]';
    const result = await client.query(testQuery);
    if (result && result[0]) {
      console.log(`✅ Graph contains ${result[0][0]} pages`);
    }
    
  } catch (error: any) {
    console.error('❌ Connection test failed:', error.message);
    console.error('\nPlease verify:');
    console.error('  • Your API token is correct');
    console.error('  • Your graph name matches exactly');
    console.error('  • The token has appropriate permissions');
  }
}

// Handle interrupts gracefully
process.on('SIGINT', () => {
  console.log('\n\nSetup cancelled.');
  process.exit(0);
});

// Run if called directly
if (require.main === module) {
  main();
}