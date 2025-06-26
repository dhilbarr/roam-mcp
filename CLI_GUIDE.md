# Roam MCP CLI Guide

A complete guide for using the Roam MCP command-line interface to manage your Roam Research integration with Claude.

## Table of Contents
- [Installation](#installation)
- [First-Time Setup](#first-time-setup)
- [Managing the Server](#managing-the-server)
- [Checking Status](#checking-status)
- [Stopping the Server](#stopping-the-server)
- [Interactive Mode](#interactive-mode)
- [Troubleshooting](#troubleshooting)
- [Quick Reference](#quick-reference)

## Installation

### Prerequisites
- macOS (for Keychain security)
- Node.js 16+ installed
- Claude Desktop app

### Getting Started
1. Clone or download the roam-mcp folder
2. Navigate to the directory:
   ```bash
   cd /path/to/roam-mcp
   ```
3. Build the project:
   ```bash
   npm install
   npm run build
   ```

## First-Time Setup

### Step 1: Run Setup Command
```bash
./roam-mcp-cli setup
```

### Step 2: Enter Your Credentials
You'll be prompted for:

1. **Graph name**: Enter your Roam graph name exactly as it appears in your URL
   ```
   Graph name: my-knowledge-base
   ```

2. **API token**: Paste your Roam API token (input will be hidden)
   ```
   API token (hidden): ********
   ```

### Step 3: Wait for Confirmation
The setup will:
- Store your token securely in macOS Keychain
- Test the connection to your graph
- Show success message

Example output:
```
🔐 Roam MCP Setup
Configure your Roam Research API credentials

Graph name: my-knowledge-base
API token (hidden): ********

🔄 Storing credentials securely...
✅ Configuration saved
✅ API token stored securely in macOS Keychain
✅ Connection successful!

✅ Setup complete!
You can now start the server with: roam-mcp start
```

### Getting Your Roam API Token
1. Open your Roam Research graph
2. Click **...** menu → **Settings** → **Graph** → **API Tokens**
3. Generate a new token with read/write permissions
4. Copy the token for setup

## Managing the Server

### Starting the Server
```bash
./roam-mcp-cli start
```

Output:
```
🚀 Starting Roam MCP server...
✅ Server started successfully!
   PID: 12345
   Status: Running with Keychain security
```

### Restarting the Server
```bash
./roam-mcp-cli restart
```

This will stop the current server and start a new instance.

## Checking Status

### Basic Status Check
```bash
./roam-mcp-cli status
```

Output when running:
```
📊 Roam MCP Server Status
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
● Status: Running
  PID: 12345
  Started: 3:09PM
  CPU: 0.0%
  Memory: 0.2%

✅ Your Roam graph is accessible to Claude
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

Output when stopped:
```
📊 Roam MCP Server Status
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
● Status: Stopped

⚠️  Claude cannot access your Roam graph
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

### Testing Connection
```bash
./roam-mcp-cli test
```

This will verify:
- API token is valid
- Graph name is correct
- Connection to Roam is working
- Display number of pages in your graph

## Stopping the Server

### Graceful Shutdown
```bash
./roam-mcp-cli stop
```

Output:
```
🛑 Stopping Roam MCP server...
✅ Server stopped successfully
```

### Force Stop (if needed)
If the server doesn't stop gracefully:
```bash
pkill -f "node.*server-keychain"
```

## Interactive Mode

For a user-friendly menu interface, run without arguments:
```bash
./roam-mcp-cli
```

This displays an interactive menu:
```
📊 Roam MCP Server Status
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
● Status: Running
  PID: 12345
  Started: 3:09PM
  CPU: 0.0%
  Memory: 0.2%

✅ Your Roam graph is accessible to Claude
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Available actions:
  1) Start server
  2) Stop server
  3) Restart server
  4) Test connection
  5) Show logs
  6) Setup credentials
  7) Refresh status
  q) Quit

Select action: _
```

## Troubleshooting

### Server Won't Start
1. Check if already running:
   ```bash
   ./roam-mcp-cli status
   ```
2. Stop any existing instances:
   ```bash
   ./roam-mcp-cli stop
   ```
3. Try starting again:
   ```bash
   ./roam-mcp-cli start
   ```

### Connection Fails
1. Test your credentials:
   ```bash
   ./roam-mcp-cli test
   ```
2. Re-run setup if needed:
   ```bash
   ./roam-mcp-cli setup
   ```

### Claude Can't Access Graph
1. Ensure server is running:
   ```bash
   ./roam-mcp-cli status
   ```
2. Restart Claude Desktop completely
3. Check Claude Desktop MCP configuration

### View Recent Activity
```bash
./roam-mcp-cli logs
```

## Quick Reference

### Command Reference
| Command | Description | Example |
|---------|-------------|---------|
| `setup` | Configure API credentials | `./roam-mcp-cli setup` |
| `start` | Start the server | `./roam-mcp-cli start` |
| `stop` | Stop the server | `./roam-mcp-cli stop` |
| `restart` | Restart the server | `./roam-mcp-cli restart` |
| `status` | Check server status | `./roam-mcp-cli status` |
| `test` | Test Roam connection | `./roam-mcp-cli test` |
| `logs` | Show recent activity | `./roam-mcp-cli logs` |
| `help` | Display help message | `./roam-mcp-cli help` |
| _(none)_ | Interactive mode | `./roam-mcp-cli` |

### Status Indicators
- 🟢 **Green**: Server running, everything OK
- 🔴 **Red**: Server stopped or error
- 🟡 **Yellow**: Warning or action needed
- 🔵 **Blue**: Information or process running

### Making It Easier to Access
Add to your shell configuration (`~/.zshrc` or `~/.bash_profile`):
```bash
alias roam-mcp='/path/to/roam-mcp/roam-mcp-cli'
```

Then use from anywhere:
```bash
roam-mcp status
roam-mcp start
roam-mcp stop
```

## Complete Workflow Example

### Initial Setup (First Time Only)
```bash
# 1. Navigate to project
cd /Users/username/roam-mcp

# 2. Run setup
./roam-mcp-cli setup
# Enter: your-graph-name
# Enter: your-api-token (hidden)

# 3. Configure Claude Desktop
# Add server path to MCP settings
```

### Daily Usage
```bash
# Morning: Start the server
./roam-mcp-cli start

# Check it's running
./roam-mcp-cli status

# Use Claude throughout the day...

# Evening: Stop the server
./roam-mcp-cli stop
```

### If Issues Arise
```bash
# Quick diagnostic
./roam-mcp-cli test

# Full restart
./roam-mcp-cli restart

# Check what's happening
./roam-mcp-cli logs
```

## Security Notes

- API tokens are stored in macOS Keychain (encrypted)
- Never stored in files or environment variables
- Each user has their own secure configuration
- Tokens are hidden during input
- Only accessible with your macOS login

## Tips for Sharing

When sharing this tool with others:

1. **Share the entire `roam-mcp` folder**
2. **Have them run**:
   ```bash
   npm install
   npm run build
   ./roam-mcp-cli setup
   ```
3. **They enter their own credentials** during setup
4. **Each person's token is stored securely** in their own Keychain

The CLI makes it easy for anyone to set up and manage their own Roam MCP server!