#!/usr/bin/env node

import * as readline from 'readline';
import { SecureConfig } from './config-secure';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(prompt: string): Promise<string> {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
}

function hideInput(): void {
  // Hide input for token entry
  if (process.stdin.isTTY) {
    process.stdin.setRawMode(true);
  }
}

function showInput(): void {
  if (process.stdin.isTTY) {
    process.stdin.setRawMode(false);
  }
}

async function securePrompt(prompt: string): Promise<string> {
  process.stdout.write(prompt);
  
  let input = '';
  
  return new Promise((resolve) => {
    process.stdin.on('data', function onData(char) {
      const str = char.toString();
      
      switch (str) {
        case '\n':
        case '\r':
        case '\u0004': // Ctrl+D
          process.stdin.removeListener('data', onData);
          process.stdout.write('\n');
          showInput();
          resolve(input);
          break;
        case '\u0003': // Ctrl+C
          process.stdin.removeListener('data', onData);
          showInput();
          process.exit();
          break;
        case '\u007f': // Backspace
          if (input.length > 0) {
            input = input.slice(0, -1);
            process.stdout.write('\b \b');
          }
          break;
        default:
          input += str;
          process.stdout.write('*');
          break;
      }
    });
    
    hideInput();
  });
}

async function main() {
  console.log('🔐 Roam MCP Secure Setup\n');
  console.log('This will store your API token securely in macOS Keychain.\n');

  try {
    // Get configuration
    const graphName = await question('Enter your Roam graph name: ');
    if (!graphName.trim()) {
      throw new Error('Graph name is required');
    }

    const apiToken = await securePrompt('Enter your Roam API token (hidden): ');
    if (!apiToken.trim()) {
      throw new Error('API token is required');
    }

    const dailyFormat = await question('Daily note format (press Enter for default): ');
    
    console.log('\n🔄 Storing credentials securely...');

    // Store configuration
    await SecureConfig.setupSecureConfig({
      apiToken: apiToken.trim(),
      graphName: graphName.trim(),
      dailyNoteFormat: dailyFormat.trim() || undefined
    });

    console.log('\n✅ Setup complete!');
    console.log('\nYour API token is now stored securely in macOS Keychain.');
    console.log('The token will be automatically retrieved when the server starts.');
    
    // Clear token from memory
    const buffer = Buffer.from(apiToken);
    buffer.fill(0);

  } catch (error) {
    console.error('\n❌ Setup failed:', error);
    process.exit(1);
  } finally {
    rl.close();
  }
}

// Handle interrupts gracefully
process.on('SIGINT', () => {
  showInput();
  console.log('\n\nSetup cancelled.');
  process.exit(0);
});

main();