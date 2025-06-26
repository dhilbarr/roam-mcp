# Roam Research MCP Server

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D16.0.0-brightgreen)](https://nodejs.org)
[![Platform](https://img.shields.io/badge/platform-macOS-blue)](https://www.apple.com/macos)

A Model Context Protocol (MCP) server that enables Claude Desktop to interact with your Roam Research graph. Features secure credential storage, comprehensive API access, and an easy-to-use CLI tool.

## ✨ Features

- 🔐 **Secure Authentication** - API tokens stored in macOS Keychain
- 📝 **Full CRUD Operations** - Create, read, update, and delete pages and blocks
- 🔍 **Advanced Search** - Full-text search, tag queries, and reference tracking
- 📊 **Graph Analytics** - Statistics, orphan pages, and tag analysis
- ✅ **TODO Management** - Create and track TODOs in daily notes
- 🎯 **Easy CLI Tool** - Simple command-line interface for setup and management
- 🚀 **High Performance** - Efficient API usage with connection pooling

## 📋 Prerequisites

- macOS (for Keychain security)
- Node.js 16 or higher
- Claude Desktop app
- Roam Research account with API access

## 🚀 Quick Start

### 1. Clone and Install

```bash
git clone https://github.com/yourusername/roam-mcp.git
cd roam-mcp
npm install
npm run build
```

### 2. Set Up Your Credentials

```bash
./roam-mcp-cli setup
```

Enter your:
- Roam graph name
- API token (input will be hidden)

### 3. Configure Claude Desktop

```bash
./roam-mcp-cli start
```

This will show you the exact configuration to add to Claude Desktop with your specific path.

### 4. Test the Connection

Ask Claude: "Can you show me stats about my Roam graph?"

## 🛠️ CLI Commands

```bash
./roam-mcp-cli setup     # Configure credentials
./roam-mcp-cli start     # Show Claude Desktop config
./roam-mcp-cli status    # Check if ready
./roam-mcp-cli test      # Test Roam connection
./roam-mcp-cli           # Interactive mode
```

## 📚 Documentation

- [CLI Guide](CLI_GUIDE.md) - Complete CLI tool documentation
- [Setup Guide](SETUP_GUIDE.md) - Detailed setup instructions
- [Security Guide](SECURITY_GUIDE.md) - Security features and best practices
- [API Documentation](docs/API.md) - Available MCP tools and methods

## 🔧 Available Tools

### Page Operations
- `roam_get_page` - Retrieve page content
- `roam_create_page` - Create new pages
- `roam_update_page` - Update existing pages
- `roam_list_pages` - List pages with filters

### Block Operations
- `roam_create_block` - Create new blocks
- `roam_update_block` - Update block content
- `roam_delete_block` - Delete blocks
- `roam_move_block` - Move blocks in hierarchy

### Search & Query
- `roam_search` - Full-text search
- `roam_search_by_tag` - Find tagged blocks
- `roam_search_references` - Find page/block references
- `roam_query` - Execute custom Datalog queries

### Daily Notes & TODOs
- `roam_get_daily_note` - Get/create daily notes
- `roam_create_todo` - Create TODO items
- `roam_list_todos` - List open TODOs
- `roam_complete_todo` - Mark TODOs complete

## 🔒 Security

- API tokens are stored in macOS Keychain (encrypted)
- No credentials in code or config files
- Secure token input (hidden from display)
- Process isolation and monitoring
- Rate limiting and input validation

## 🤝 Contributing

Contributions are welcome! Please:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Anthropic](https://anthropic.com) for Claude and MCP
- [Roam Research](https://roamresearch.com) for the API
- The MCP community for inspiration and support

## ⚠️ Disclaimer

This project is not officially affiliated with Roam Research or Anthropic. Use at your own risk.

## 🐛 Reporting Issues

Found a bug or have a feature request? Please open an issue on GitHub with:
- Your OS version
- Node.js version
- Steps to reproduce
- Expected vs actual behavior

## 📊 Project Status

This project is actively maintained. See our [roadmap](docs/ROADMAP.md) for planned features.

---

Made with ❤️ for the Roam Research community