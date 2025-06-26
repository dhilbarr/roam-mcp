# Keychain Setup Guide - Roam MCP Server

This guide explains how to use macOS Keychain for secure API token storage, providing protection against malware and unauthorized access.

## Why Use Keychain?

### Security Benefits
- **Encrypted Storage**: Tokens are encrypted with your login password
- **OS-Level Protection**: Protected by macOS security framework
- **Malware Resistant**: Significantly harder for malware to access than files
- **Access Control**: Requires user authentication for access
- **No Plain Text**: Token never stored in files or environment variables

### Comparison with Other Methods

| Feature | .env File | Keychain | Secure Mode |
|---------|-----------|----------|-------------|
| Setup Complexity | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐ |
| Security Level | ⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| Malware Protection | ❌ | ✅ | ✅ |
| Cross-Platform | ✅ | ❌ (macOS) | ❌ (macOS) |
| Performance | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐ |

## Quick Start

### 1. Build the Project
```bash
cd /Users/dhilbarroshan/Developer/roam-mcp
npm run build
```

### 2. Run Keychain Setup
```bash
npm run setup:keychain
```

### 3. Follow the Interactive Prompts
```
🔐 Roam MCP Keychain Setup

This will store your API token securely in macOS Keychain.
Your token will be encrypted and protected by macOS security.

Please provide your Roam Research credentials:

Graph name: YourGraphName
API token (hidden): ********

Optional settings (press Enter to use defaults):

Daily note format (default: MMMM Do, YYYY): 
API timeout in ms (default: 30000): 

🔄 Storing credentials securely...

✅ Setup complete!
```

### 4. Configure Claude Desktop
Update your MCP configuration to use the Keychain server:

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

### 5. Restart Claude Desktop
Completely quit and restart Claude Desktop for changes to take effect.

## Detailed Setup Process

### Step 1: Understanding Keychain Storage

When you use Keychain setup:
1. Your API token is stored in macOS Keychain (same place as your passwords)
2. It's encrypted with your login password
3. Access requires authentication (password/Touch ID)
4. Malware can't read it without triggering security prompts

### Step 2: First-Time Setup

If you have an existing `.env` file, the setup will offer to migrate:
```bash
npm run setup:keychain
# Automatically detects .env and offers migration
```

### Step 3: Keychain Access Permissions

You may see a macOS prompt:
```
"node" wants to use your confidential information 
stored in "roam-mcp" in your keychain.
```

Click **"Always Allow"** for smooth operation.

### Step 4: Verify Setup

Test your connection:
```bash
npm run dev:keychain
```

You should see:
```
🔐 Roam MCP server running with Keychain security
💡 API token is protected by macOS Keychain
✅ Secure connection established via Keychain
```

## Security Features

### 1. Token Protection
- Stored in system Keychain (not files)
- Encrypted at rest
- Requires authentication to access
- Automatic cleanup on uninstall

### 2. Access Controls
- Only authorized apps can access
- Access attempts are logged
- User prompted for suspicious access
- Can require password/Touch ID

### 3. Runtime Security
- Token only decrypted when needed
- Memory cleared after use
- No environment variable exposure
- Suspicious activity monitoring

## Managing Your Configuration

### View Stored Graphs
```bash
# List all configured graphs (no tokens shown)
node -e "
const { SecureConfigManager } = require('./dist/security/keychain');
console.log('Configured graphs:', SecureConfigManager.listGraphs());
"
```

### Update Configuration
```bash
# Re-run setup to update
npm run setup:keychain
```

### Clear Configuration
```bash
# Remove all stored credentials
npm run clear:credentials
```

### Switch Graphs
If you have multiple graphs:
1. Run setup for each graph
2. The most recent setup becomes active
3. Future: Graph switching support planned

## Troubleshooting

### "Keychain Access Denied"

**Solution 1**: Grant Access in Keychain Access app
1. Open Keychain Access (Spotlight → "Keychain Access")
2. Search for "roam-mcp"
3. Double-click the entry
4. Go to "Access Control" tab
5. Add your terminal app or select "Allow all applications"

**Solution 2**: Reset and retry
```bash
npm run clear:credentials
npm run setup:keychain
```

### "Token Not Found"

This means Keychain doesn't have your token:
```bash
# Check if configuration exists
ls ~/.roam-mcp/config.json

# Re-run setup
npm run setup:keychain
```

### "Keychain is Locked"

Unlock your Keychain:
```bash
security unlock-keychain
# Enter your login password when prompted
```

### Migration Issues

If migration from `.env` fails:
1. Keep your `.env` file as backup
2. Run setup manually:
   ```bash
   npm run setup:keychain
   ```
3. Enter credentials manually
4. Delete `.env` after confirming it works

## Advanced Usage

### Using with Multiple Graphs

Currently, store one graph at a time. To switch:
```bash
npm run setup:keychain
# Enter credentials for the new graph
```

### Backup Considerations

Keychain items are included in:
- macOS backups (Time Machine)
- iCloud Keychain sync (if enabled)
- System migrations

To export for backup:
```bash
# Export (requires authentication)
security find-generic-password -s "roam-mcp" -g
```

### Security Audit

Check Keychain access logs:
```bash
# View recent Keychain access
log show --predicate 'subsystem == "com.apple.securityd"' --last 1h | grep roam-mcp
```

## Best Practices

### Do's
- ✅ Use unique API tokens for each application
- ✅ Rotate tokens periodically
- ✅ Use read-only tokens when possible
- ✅ Keep macOS updated
- ✅ Use strong login password

### Don'ts
- ❌ Share your Keychain between users
- ❌ Disable Keychain password requirements
- ❌ Grant access to unknown applications
- ❌ Store tokens in multiple places

## Comparison: Keychain vs Secure Mode

| Aspect | Keychain Mode | Full Secure Mode |
|--------|---------------|------------------|
| Setup Complexity | Medium | High |
| Token Storage | macOS Keychain | Keychain + Encryption |
| Memory Protection | Basic | Advanced |
| Anti-Debugging | No | Yes |
| Process Monitoring | Basic | Advanced |
| Performance Impact | Minimal | Small |
| Best For | Most users | High-security needs |

## FAQ

### Q: Is Keychain storage really secure?
**A**: Yes, it's significantly more secure than file storage. Keychain uses:
- Hardware encryption on M1 Macs
- OS-level access controls
- Audit logging
- User authentication requirements

### Q: Can malware access Keychain?
**A**: Sophisticated malware with system access could potentially access Keychain, but it would:
- Trigger security prompts
- Leave audit logs
- Require elevated privileges
- Be much harder than reading files

### Q: Do I need the full secure mode?
**A**: For most users, Keychain mode provides excellent security. Use full secure mode if:
- Handling extremely sensitive data
- Operating in high-risk environments
- Required by security policies

### Q: Can I use this on other platforms?
**A**: Keychain is macOS-specific. For other platforms:
- **Windows**: Use Windows Credential Manager (future support)
- **Linux**: Use Secret Service API (future support)

## Next Steps

1. **Test Your Setup**: Try various Claude commands
2. **Monitor Usage**: Check audit logs periodically
3. **Stay Updated**: Keep the server and macOS updated
4. **Report Issues**: File bugs on GitHub

Your Roam API token is now protected by military-grade encryption and OS-level security! 🔐