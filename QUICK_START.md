# Quick Start Guide - Roam MCP Server

Get up and running in 5 minutes with the CLI tool! 🚀

## 1️⃣ Prerequisites

- Node.js 16+ installed
- macOS (for Keychain security)
- Roam Research API token

## 2️⃣ Build the Project

```bash
cd /Users/dhilbarroshan/Developer/roam-mcp
npm install
npm run build
```

## 3️⃣ Run Setup

```bash
./roam-mcp-cli setup
```

Enter when prompted:
- Your graph name (e.g., "my-knowledge-base")
- Your API token (input will be hidden)

## 4️⃣ Start the Server

```bash
./roam-mcp-cli start
```

## 5️⃣ Configure Claude Desktop

Add to your MCP servers configuration:

```json
{
  "mcpServers": {
    "roam-research": {
      "command": "node",
      "args": ["/Users/dhilbarroshan/Developer/roam-mcp/dist/server-keychain.js"]
    }
  }
}
```

Restart Claude Desktop.

## 6️⃣ Test Your Connection

Ask Claude:
> "Can you show me stats about my Roam graph?"

## Daily Usage Commands

```bash
# Check if server is running
./roam-mcp-cli status

# Stop the server
./roam-mcp-cli stop

# Restart the server
./roam-mcp-cli restart

# Interactive mode (menu-driven)
./roam-mcp-cli
```

## Status Check Output

Running server shows:
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

## Common Commands to Try in Claude

- 📄 "Show me my page about [topic]"
- 🔍 "Search for [keyword] in my graph"
- ✅ "Create a TODO: [task]"
- 📝 "Add this to today's daily note: [content]"
- 🏷️ "Find all blocks tagged with #[tag]"

## Need Help?

- **Full CLI Guide**: See [CLI_GUIDE.md](CLI_GUIDE.md)
- **Detailed Setup**: See [SETUP_GUIDE.md](SETUP_GUIDE.md)
- **Security Info**: See [SECURITY_GUIDE.md](SECURITY_GUIDE.md)

Happy Roaming with Claude! 🧠✨