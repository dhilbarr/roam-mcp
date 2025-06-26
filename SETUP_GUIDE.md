# Roam Research MCP Server - Complete Setup Guide

This guide will walk you through setting up the Roam Research MCP server step by step, from getting your API credentials to using it with Claude Desktop.

## Table of Contents
1. [Prerequisites](#prerequisites)
2. [Getting Your Roam API Token](#getting-your-roam-api-token)
3. [Installation](#installation)
4. [Setup Options](#setup-options)
   - [Standard Setup](#standard-setup-quick-start)
   - [Secure Setup](#secure-setup-recommended-)
5. [Configuring Claude Desktop](#configuring-claude-desktop)
6. [Testing Your Setup](#testing-your-setup)
7. [Using the Server](#using-the-server)
8. [Troubleshooting](#troubleshooting)
9. [Security Comparison](#security-comparison)

## Prerequisites

Before starting, make sure you have:
- ✅ Node.js 16 or higher installed ([Download Node.js](https://nodejs.org/))
- ✅ Claude Desktop app installed
- ✅ A Roam Research account with API access
- ✅ macOS (for Secure Mode - Standard Mode works on all platforms)
- ✅ Basic familiarity with terminal/command line

To check if Node.js is installed:
```bash
node --version
# Should output v16.0.0 or higher
```

## Getting Your Roam API Token

### Step 1: Open Your Roam Graph
1. Go to [Roam Research](https://roamresearch.com)
2. Log in to your account
3. Open the graph you want to connect to Claude

### Step 2: Access Developer Settings
1. Click on the **...** (three dots) menu in the top right
2. Select **Settings**
3. In the settings panel, click on **Graph**
4. Look for the **API Tokens** section

### Step 3: Create an API Token
1. Click **"Manage API Tokens"** or **"Generate Token"**
2. Give your token a descriptive name (e.g., "Claude MCP Access")
3. Select the appropriate permissions:
   - ✅ Read access (required)
   - ✅ Write access (if you want Claude to create/edit content)
   - ✅ Delete access (if you want Claude to delete blocks)
4. Click **Create Token**
5. **IMPORTANT**: Copy the token immediately - you won't see it again!

### Step 4: Note Your Graph Name
Your graph name is shown in the URL when you're using Roam:
- Example: `https://roamresearch.com/#/app/YourGraphName`
- In this case, your graph name is `YourGraphName`

## Installation

### Step 1: Open Terminal
- **macOS**: Press `Cmd + Space`, type "Terminal", press Enter
- **Windows**: Press `Win + R`, type "cmd", press Enter
- **Linux**: Press `Ctrl + Alt + T`

### Step 2: Navigate to the Project
```bash
cd /Users/dhilbarroshan/Developer/roam-mcp
```

### Step 3: Install Dependencies
```bash
npm install
```

### Step 4: Build the Project
```bash
npm run build
```

## Setup Options

You can choose between three setup methods:

### 🎯 Recommended: CLI Tool (New!)

The easiest way to set up and manage your Roam MCP server:

```bash
# Run setup
./roam-mcp-cli setup

# Start server
./roam-mcp-cli start

# Check status
./roam-mcp-cli status

# Stop server
./roam-mcp-cli stop
```

See [CLI_GUIDE.md](CLI_GUIDE.md) for complete CLI documentation.

### Alternative Setup Methods

### Standard Setup (Quick Start)

Best for:
- Personal use on secure devices
- Quick testing and development
- Trusted environments

#### Step 1: Create Configuration File
```bash
cp .env.example .env
```

#### Step 2: Edit the Configuration
Open the `.env` file in a text editor:

**Option A - Using nano (in terminal):**
```bash
nano .env
```

**Option B - Using TextEdit (macOS):**
```bash
open -e .env
```

**Option C - Using VS Code (if installed):**
```bash
code .env
```

#### Step 3: Add Your Credentials
Replace the placeholder values:
```env
ROAM_API_TOKEN=your_actual_token_here
ROAM_GRAPH_NAME=YourGraphName

# Optional settings
DAILY_NOTE_FORMAT="MMMM Do, YYYY"
DEFAULT_TIMEOUT=30000
```

Save the file:
- **nano**: Press `Ctrl + X`, then `Y`, then Enter
- **Other editors**: Use `Cmd + S` (macOS) or `Ctrl + S` (Windows/Linux)

#### Step 4: Verify Setup
```bash
node test-setup.js
```

### Secure Setup (Recommended) 🔐

Best for:
- Graphs containing sensitive information
- Shared or less trusted devices
- Protection against malware
- Maximum security

#### Step 1: Run Secure Setup Wizard
```bash
npm run setup:secure
```

#### Step 2: Follow the Interactive Prompts
The wizard will:
1. Ask for your graph name
2. Prompt for your API token (input will be hidden)
3. Ask for optional settings

Example session:
```
🔐 Roam MCP Secure Setup

This will store your API token securely in macOS Keychain.

Enter your Roam graph name: MyKnowledgeBase
Enter your Roam API token (hidden): ********
Daily note format (press Enter for default): 

🔄 Storing credentials securely...

✅ Setup complete!

Your API token is now stored securely in macOS Keychain.
```

#### Step 3: Grant Keychain Access
You may see a macOS prompt asking for permission to access the Keychain. Click "Always Allow" for smooth operation.

#### What Happens Behind the Scenes
- Your API token is stored in macOS Keychain (encrypted)
- Other settings saved in `~/.roam-mcp/config.json`
- Token never stored in plain text files
- Protected by your macOS login password

## Configuring Claude Desktop

The configuration differs slightly based on which setup mode you chose:

### For Standard Setup

1. Open Claude Desktop
2. Click your profile icon → **Settings** → **Developer** → **MCP Servers**
3. Click **Edit Config**
4. Add this configuration:

```json
{
  "mcpServers": {
    "roam-research": {
      "command": "node",
      "args": ["/Users/dhilbarroshan/Developer/roam-mcp/dist/server.js"]
    }
  }
}
```

### For Secure Setup

Use the secure server instead:

```json
{
  "mcpServers": {
    "roam-research": {
      "command": "node",
      "args": ["/Users/dhilbarroshan/Developer/roam-mcp/dist/server-secure.js"]
    }
  }
}
```

### Important Notes
- Use the full absolute path to the server file
- Keep any existing servers in your configuration
- Ensure proper JSON syntax (watch for commas)

### Step 4: Save and Restart
1. Save the configuration file
2. **Completely quit Claude Desktop** (Cmd+Q on macOS)
3. Reopen Claude Desktop
4. The server should now be active

## Testing Your Setup

### Basic Connection Test
In a new Claude conversation, try:
```
"Can you connect to my Roam Research graph and tell me how many pages I have?"
```

Expected response: Information about total pages, blocks, and recent activity.

### Progressive Testing

1. **Read Test**
   ```
   "Show me my page titled 'Daily Notes'"
   ```

2. **Search Test**
   ```
   "Search for mentions of 'project' in my graph"
   ```

3. **Create Test** (if write access enabled)
   ```
   "Create a new page called 'Test Page from Claude' with some sample content"
   ```

4. **Advanced Test**
   ```
   "Find all my TODOs from the last week"
   ```

## Using the Server

### Example Commands You Can Use

#### Working with Pages
- "Show me my page about [topic]"
- "Create a new page called [title]"
- "List all my pages that mention [keyword]"
- "Export my [page name] page as markdown"

#### Managing Blocks
- "Add this text to my [page name] page"
- "Update the block that says [text] to say [new text]"
- "Show me the full content under [page name]"

#### Searching Your Graph
- "Find all mentions of [term] in my graph"
- "Show me all blocks tagged with #[tag]"
- "Find pages that reference [page name]"
- "What pages have I created in the last week?"

#### Daily Notes & TODOs
- "Add this to today's daily note"
- "Create a TODO: [task description]"
- "Show me all my open TODOs"
- "Mark the TODO about [task] as complete"

#### Advanced Queries
- "Show me all orphan pages"
- "Analyze my tag usage"
- "Find all pages created by [email]"

### Pro Tips

1. **Be Specific**: Instead of "show me my notes", say "show me my page titled 'Project Planning'"

2. **Use Natural Language**: Claude understands context
   - "Add a note about our meeting to today's daily"
   - "Find where I mentioned machine learning"

3. **Chain Commands**: 
   - "Find my Goals page and add a new goal about learning Spanish"

4. **Batch Operations**:
   - "Create TODOs for: call John, email Sarah, review proposal"

## Troubleshooting

### Connection Issues

#### "Server not found" in Claude
**For both modes:**
1. Verify the path exists:
   ```bash
   # Standard mode
   ls /Users/dhilbarroshan/Developer/roam-mcp/dist/server.js
   
   # Secure mode
   ls /Users/dhilbarroshan/Developer/roam-mcp/dist/server-secure.js
   ```
2. Ensure you built the project: `npm run build`
3. Restart Claude Desktop completely

#### "API Token Invalid"
**Standard Mode:**
1. Check `.env` file has correct token
2. No extra quotes or spaces around token
3. Token hasn't expired in Roam

**Secure Mode:**
1. Re-run `npm run setup:secure`
2. Make sure to grant Keychain access
3. Check token permissions in Roam

#### "Graph not found"
1. Verify graph name matches exactly (case-sensitive)
2. No spaces in graph name
3. Use the name from your Roam URL

### Security Issues (Secure Mode Only)

#### "Keychain access denied"
1. Open Keychain Access app
2. Search for "roam-mcp"
3. Double-click the entry
4. Check "Allow all applications to access this item"

#### "Cannot read token from Keychain"
```bash
# Clear and re-add credentials
npm run clear:credentials
npm run setup:secure
```

### Build Errors
```bash
# Clean rebuild
rm -rf node_modules dist
npm install
npm run build
```

### Debugging Commands

```bash
# Test standard configuration
node test-setup.js

# View secure configuration (without token)
cat ~/.roam-mcp/config.json

# Clear all credentials (both modes)
npm run clear:credentials
rm -f .env

# Check if server starts
npm start           # Standard mode
npm run start:secure # Secure mode
```

## Security Comparison

### Standard Mode
- ✅ Quick and easy setup
- ✅ Works on all platforms
- ❌ Token stored in plain text
- ❌ Vulnerable to file system access
- 📍 Best for: Trusted personal devices

### Secure Mode
- ✅ Token encrypted in Keychain
- ✅ Protected by macOS security
- ✅ Resistant to basic malware
- ✅ Runtime memory protection
- ❌ macOS only
- ❌ Slightly more complex setup
- 📍 Best for: Sensitive data, shared devices

## Next Steps

Now that your server is set up:

1. **Explore Features**: Try different commands
2. **Create Workflows**: Set up regular tasks
3. **Read Security Guide**: Learn about advanced protection
4. **Customize**: Modify tools for your needs

## Getting Help

If you're still having issues:

1. **Check the Logs**: 
   ```bash
   # Run server manually to see errors
   npm start  # or npm run start:secure
   ```

2. **Community Support**: Report issues on GitHub

3. **Security Questions**: See [SECURITY_GUIDE.md](SECURITY_GUIDE.md)

Enjoy using Claude with your Roam Research graph! 🎉