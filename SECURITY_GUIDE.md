# Security Guide - Roam MCP Server

## Overview

This guide explains the security measures available to protect your Roam API token from malware and unauthorized access.

## Threat Model

Even on a "secure" laptop, your API token faces these risks:
- **Malware** reading `.env` files or environment variables
- **Memory scrapers** extracting tokens from process memory  
- **Keyloggers** capturing tokens during input
- **Process injection** hijacking the Node.js process
- **File system scanners** searching for credentials

## Security Levels

### 🔴 Basic Setup (Current - Not Secure Against Malware)
- Token stored in `.env` file (plain text)
- Readable by any process running as your user
- Vulnerable to basic malware

### 🟡 Keychain Storage (Recommended)
- Token stored in macOS Keychain (encrypted)
- Protected by macOS security framework
- Requires user authentication to access
- Significantly harder for malware to access

### 🟢 Maximum Security (Paranoid Mode)
- Keychain storage + runtime protection
- In-memory encryption
- Process isolation
- Anti-debugging measures
- Suspicious activity monitoring

## Setting Up Secure Storage

### Option 1: Keychain Storage (Recommended)

1. **Build the project:**
   ```bash
   npm run build
   ```

2. **Run secure setup:**
   ```bash
   npm run setup:secure
   ```
   
   This will:
   - Prompt for your credentials
   - Store API token in macOS Keychain
   - Save other config in `~/.roam-mcp/config.json`
   - Hide your token input while typing

3. **Update Claude Desktop config:**
   ```json
   {
     "mcpServers": {
       "roam-research": {
         "command": "node",
         "args": ["/path/to/roam-mcp/dist/server-secure.js"]
       }
     }
   }
   ```

4. **Start secure server:**
   ```bash
   npm run start:secure
   ```

### Option 2: Maximum Security Mode

For highest security, use additional runtime protections:

1. **Enable System Integrity Protection (SIP):**
   - Already enabled by default on macOS
   - Prevents system-level tampering

2. **Use a dedicated user account:**
   ```bash
   # Create limited user for MCP
   sudo dscl . -create /Users/roam-mcp
   sudo dscl . -create /Users/roam-mcp UserShell /usr/bin/false
   ```

3. **Run with reduced privileges:**
   ```bash
   # Run server as restricted user
   sudo -u roam-mcp npm run start:secure
   ```

## Security Features Explained

### 1. **macOS Keychain Integration**
- Tokens encrypted with your login password
- Hardware-backed encryption on M1 Macs
- Requires explicit user consent for access
- Protected by macOS security policies

### 2. **Runtime Protection**
- **Memory Encryption**: Tokens encrypted in RAM
- **Anti-Debugging**: Prevents debugger attachment
- **Process Monitoring**: Detects suspicious child processes
- **Auto-Cleanup**: Clears sensitive data on exit

### 3. **Input Validation**
- Prevents query injection attacks
- Sanitizes user inputs
- Rate limiting to prevent abuse
- Blocks dangerous operations

### 4. **Access Controls**
- File permissions (600) on config files
- Directory permissions (700) on config directory
- Process umask for new files
- No network exposure (stdio only)

## Best Practices

### 1. **Token Management**
- ✅ Use read-only tokens when possible
- ✅ Rotate tokens regularly
- ✅ Different tokens for different purposes
- ✅ Monitor token usage in Roam

### 2. **System Security**
- ✅ Keep macOS updated
- ✅ Enable FileVault disk encryption
- ✅ Use strong login password
- ✅ Enable firewall
- ✅ Regular malware scans

### 3. **Operational Security**
- ✅ Never share your token
- ✅ Don't store tokens in git
- ✅ Clear terminal history after setup
- ✅ Use secure communication channels

## Keychain Security Details

### Why Keychain is Secure Against Malware

1. **Protected by macOS Security Framework**
   - Requires authorization to access
   - Sandboxed from unauthorized apps
   - Encrypted with login password

2. **Additional Protections on M1 Macs**
   - Secure Enclave integration
   - Hardware-based key storage
   - Biometric authentication option

3. **Malware Limitations**
   - Cannot access without triggering security prompt
   - Requires explicit user consent
   - Logged in Security & Privacy preferences

### Potential Weaknesses

Even with Keychain:
- **Sophisticated malware** with system-level access
- **Trojaned system libraries**
- **Hardware keyloggers**
- **Physical access attacks**

For these threats, consider:
- Using a dedicated device for sensitive operations
- Hardware security keys (future enhancement)
- Network isolation

## Monitoring & Detection

### Check for Unauthorized Access

1. **Monitor Keychain access:**
   ```bash
   # Check Keychain access logs
   log show --predicate 'subsystem == "com.apple.securityd"' --last 1h
   ```

2. **Check for suspicious processes:**
   ```bash
   # List processes accessing Keychain
   lsof | grep -i keychain
   ```

3. **Review Claude Desktop logs:**
   ```bash
   # Check for unusual MCP activity
   tail -f ~/Library/Logs/Claude/mcp.log
   ```

### Security Alerts

The secure server will alert you to:
- 🚨 Unauthorized Keychain access attempts
- 🚨 Suspicious command execution
- 🚨 Debugger attachment attempts
- 🚨 Rate limit violations

## Recovery Procedures

### If You Suspect Compromise

1. **Immediately revoke token in Roam:**
   - Settings → Graph → API Tokens → Revoke

2. **Clear stored credentials:**
   ```bash
   npm run clear:credentials
   ```

3. **Generate new token and re-setup:**
   ```bash
   npm run setup:secure
   ```

4. **Review access logs in Roam**

### Backup Security

1. **Export Keychain item (encrypted):**
   ```bash
   security export -t identities -f pkcs12 -P "backup-password" \
     -o roam-backup.p12
   ```

2. **Store backup securely:**
   - Encrypted external drive
   - Secure cloud storage
   - Physical safe

## FAQ

### Q: Is Keychain 100% secure against all malware?
**A:** No, but it's significantly more secure than plain text storage. Sophisticated malware with root access could potentially compromise it, but this requires much more effort and triggers more security warnings.

### Q: Should I use the secure version for daily use?
**A:** Yes, the performance overhead is minimal, and the security benefits are significant. The secure version is recommended for all users.

### Q: Can I use both versions?
**A:** Yes, but not simultaneously. The secure version is backward compatible - it just adds security layers.

### Q: What about other platforms?
**A:** This guide focuses on macOS. For other platforms:
- **Windows**: Use Windows Credential Manager
- **Linux**: Use libsecret or KWallet

## Conclusion

While no system is 100% secure, these measures significantly raise the bar for attackers:
- Basic malware ❌ Cannot read Keychain without triggering alerts
- Advanced malware ⚠️ Requires sophisticated techniques and root access
- Nation-state actors ✅ Physical security and air-gapped systems recommended

For most users, Keychain storage with the secure server provides excellent protection against common threats while maintaining usability.