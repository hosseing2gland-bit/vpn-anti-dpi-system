# Contributing to VPN Anti-DPI System 🤝

Thank you for your interest in contributing! This document provides guidelines for contributing to the project.

---

## Table of Contents

1. [Code of Conduct](#code-of-conduct)
2. [How Can I Contribute?](#how-can-i-contribute)
3. [Development Setup](#development-setup)
4. [Coding Standards](#coding-standards)
5. [Commit Messages](#commit-messages)
6. [Pull Request Process](#pull-request-process)
7. [Testing](#testing)

---

## Code of Conduct

This project adheres to a code of conduct. By participating, you are expected to uphold this code.

### Our Standards

✅ Be respectful and inclusive  
✅ Accept constructive criticism gracefully  
✅ Focus on what's best for the community  
✅ Show empathy towards other contributors  

❌ No harassment, trolling, or discriminatory behavior  
❌ No spam or off-topic discussions  

---

## How Can I Contribute?

### Reporting Bugs 🐛

Before reporting a bug:

1. Check [existing issues](https://github.com/hosseing2gland-bit/vpn-anti-dpi-system/issues)
2. Ensure you're using the latest version
3. Test with default configuration

When reporting, include:

- **Description**: Clear and descriptive title
- **Steps to Reproduce**: Detailed steps to reproduce the issue
- **Expected Behavior**: What you expected to happen
- **Actual Behavior**: What actually happened
- **Environment**: OS, Node.js version, Docker version
- **Logs**: Relevant error messages or logs
- **Screenshots**: If applicable

### Suggesting Features 💡

Feature requests are welcome! Please:

1. Search [existing feature requests](https://github.com/hosseing2gland-bit/vpn-anti-dpi-system/issues?q=is%3Aissue+label%3Aenhancement)
2. Provide clear use case
3. Explain why this feature would be useful
4. Include mockups or examples if possible

### Submitting Code 💻

We love pull requests! Follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Test thoroughly
5. Commit with descriptive messages
6. Push to your fork
7. Open a Pull Request

---

## Development Setup

### Prerequisites

- Node.js 18+
- Docker & Docker Compose
- Git
- Code editor (VS Code recommended)

### Setup Steps

```bash
# Clone your fork
git clone https://github.com/YOUR_USERNAME/vpn-anti-dpi-system.git
cd vpn-anti-dpi-system

# Add upstream remote
git remote add upstream https://github.com/hosseing2gland-bit/vpn-anti-dpi-system.git

# Install dependencies
cd server/vpn-server
npm install

cd ../../mobile-app
npm install

# Start development environment
cd ../server
docker-compose up -d
```

### Running Tests

```bash
# Server tests
cd server/vpn-server
npm test

# Mobile tests
cd mobile-app
npm test
```

---

## Coding Standards

### JavaScript/TypeScript

- Use **ES6+** features
- Follow **ESLint** rules (`.eslintrc.js`)
- Use **async/await** instead of promises
- Add **JSDoc** comments for functions
- Keep functions small and focused
- Use meaningful variable names

### Example

```javascript
/**
 * Encrypt data using ChaCha20-Poly1305
 * @param {string} plaintext - Data to encrypt
 * @param {Buffer} key - Encryption key
 * @param {Buffer} nonce - Nonce for encryption
 * @returns {Buffer} Encrypted data
 */
function encrypt(plaintext, key, nonce) {
  const cipher = crypto.createCipheriv('chacha20-poly1305', key, nonce);
  const encrypted = cipher.update(plaintext);
  const final = cipher.final();
  const authTag = cipher.getAuthTag();
  return Buffer.concat([nonce, authTag, encrypted, final]);
}
```

### File Structure

```
server/
  vpn-server/
    ├── server-phase6.js   # Phase 6 implementation
    ├── server-phase7.js   # Phase 7 implementation
    ├── setup-database.js # Database setup
    └── package.json

mobile-app/
  src/
    ├── services/         # Core services
    ├── components/       # Reusable components
    ├── screens/          # App screens
    └── utils/            # Helper functions
```

---

## Commit Messages

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Types

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation only
- `style`: Code style changes (formatting, semicolons, etc.)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

### Examples

```bash
feat(server): add QUIC protocol support

fix(mobile): resolve certificate pinning issue on Android

docs: update deployment guide with Nginx configuration

refactor(crypto): simplify encryption function
```

---

## Pull Request Process

### Before Submitting

1. ✅ Ensure code follows style guidelines
2. ✅ Update documentation if needed
3. ✅ Add tests for new features
4. ✅ All tests pass
5. ✅ No merge conflicts with main branch
6. ✅ Commit messages follow conventions

### PR Template

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
Describe how you tested your changes

## Screenshots (if applicable)
Add screenshots here

## Checklist
- [ ] Code follows style guidelines
- [ ] Self-review completed
- [ ] Comments added for complex code
- [ ] Documentation updated
- [ ] No new warnings
- [ ] Tests added/updated
- [ ] All tests pass
```

### Review Process

1. Submit PR with clear description
2. Wait for automated checks to pass
3. Address review feedback
4. Request re-review if needed
5. Maintainer will merge once approved

---

## Testing

### Unit Tests

```javascript
// Example test
describe('CryptoService', () => {
  it('should encrypt and decrypt correctly', () => {
    const plaintext = 'Hello, World!';
    const encrypted = CryptoService.encrypt(plaintext);
    const decrypted = CryptoService.decrypt(encrypted);
    expect(decrypted).toBe(plaintext);
  });
});
```

### Integration Tests

Test complete workflows:

```bash
# Test server authentication
node client-phase6.js

# Test mobile app connection
npm run test:e2e
```

---

## Areas for Contribution

### High Priority

- 🔴 **QUIC Protocol Implementation** (Phase 7)
- 🔴 **Admin Dashboard** (Phase 8)
- 🔴 **Load Balancing** (Phase 9)
- 🔴 **Automated Testing Suite**

### Medium Priority

- 🟡 **Mobile App UI/UX Improvements**
- 🟡 **Documentation Translations**
- 🟡 **Performance Optimizations**
- 🟡 **Security Audits**

### Good First Issues

- 🟢 **Add more unit tests**
- 🟢 **Improve error messages**
- 🟢 **Fix typos in documentation**
- 🟢 **Add code comments**

---

## Security Issues

⚠️ **DO NOT** open public issues for security vulnerabilities.

Instead:

1. Email: security@example.com (replace with actual email)
2. Use GitHub Security Advisories
3. Include:
   - Description of vulnerability
   - Steps to reproduce
   - Potential impact
   - Suggested fix (if any)

We'll respond within 48 hours.

---

## Recognition

All contributors will be recognized in:

- 🌟 **README.md** Contributors section
- 🌟 **Release notes**
- 🌟 **Project website** (if applicable)

Significant contributors may become maintainers.

---

## Questions?

Feel free to:

- Open a [Discussion](https://github.com/hosseing2gland-bit/vpn-anti-dpi-system/discussions)
- Join our community chat
- Email the maintainers

---

## License

By contributing, you agree that your contributions will be licensed under the MIT License.

---

**Thank you for making VPN Anti-DPI System better! 🚀**
