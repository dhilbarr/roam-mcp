# Contributing to Roam MCP Server

Thank you for your interest in contributing to the Roam MCP Server! This document provides guidelines and instructions for contributing.

## Code of Conduct

By participating in this project, you agree to abide by our Code of Conduct:
- Be respectful and inclusive
- Welcome newcomers and help them get started
- Focus on constructive criticism
- Respect differing opinions and experiences

## How to Contribute

### Reporting Bugs

Before creating bug reports, please check existing issues to avoid duplicates. When creating a bug report, include:

- **Clear title and description**
- **Steps to reproduce**
- **Expected behavior**
- **Actual behavior**
- **System information** (OS version, Node.js version)
- **Relevant logs or error messages**

### Suggesting Features

Feature suggestions are welcome! Please include:

- **Use case**: Why is this feature needed?
- **Proposed solution**: How should it work?
- **Alternatives considered**: What other approaches did you think about?
- **Additional context**: Mockups, examples, etc.

### Pull Requests

1. **Fork the repository** and create your branch from `main`
2. **Install dependencies**: `npm install`
3. **Make your changes**:
   - Follow the existing code style
   - Add tests if applicable
   - Update documentation
4. **Test your changes**:
   ```bash
   npm run build
   npm test  # if tests exist
   ./roam-mcp-cli test  # test connection
   ```
5. **Commit your changes**:
   - Use clear, descriptive commit messages
   - Reference issues and pull requests
6. **Push to your fork** and submit a pull request

### Development Setup

```bash
# Clone your fork
git clone https://github.com/yourusername/roam-mcp.git
cd roam-mcp

# Install dependencies
npm install

# Build the project
npm run build

# Set up credentials for testing
./roam-mcp-cli setup

# Start development
npm run dev:keychain
```

## Code Style Guidelines

### TypeScript

- Use TypeScript for all new code
- Enable strict mode
- Provide proper type annotations
- Avoid `any` type when possible

### General

- Use meaningful variable and function names
- Keep functions small and focused
- Add comments for complex logic
- Follow existing patterns in the codebase

### Security

- Never commit credentials or tokens
- Use secure storage (Keychain) for sensitive data
- Validate all user inputs
- Follow the principle of least privilege

## Testing

- Test your changes thoroughly
- Include edge cases
- Verify security implications
- Test on macOS (primary platform)

## Documentation

- Update README.md if adding new features
- Document new CLI commands
- Add JSDoc comments to functions
- Update setup guides if needed

## Security Vulnerabilities

If you discover a security vulnerability, please:
1. **Do NOT** open a public issue
2. Email the maintainers directly
3. Provide details and steps to reproduce
4. Allow time for a fix before disclosure

## Project Structure

```
roam-mcp/
├── src/
│   ├── server-*.ts      # Server implementations
│   ├── config-*.ts      # Configuration modules
│   ├── tools/           # MCP tool implementations
│   ├── utils/           # Utility functions
│   └── security/        # Security modules
├── docs/                # Documentation
├── roam-mcp-cli         # CLI tool
└── package.json
```

## Release Process

1. Update version in `package.json`
2. Update CHANGELOG.md
3. Create a pull request
4. After merge, create a GitHub release
5. Tag the release with semantic versioning

## Questions?

Feel free to open an issue for questions or join our discussions. We're here to help!

## Recognition

Contributors will be recognized in:
- The project README
- Release notes
- Contributors list

Thank you for contributing to make Roam MCP Server better! 🎉