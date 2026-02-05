# 🤝 Contributing to AgentMemory Protocol

First off, thanks for taking the time to contribute! 🎉

AgentMemory is built by the community, for the community. Whether you're fixing a bug, adding a feature, or improving docs, your contribution matters.

## 🌟 How Can I Contribute?

### 1. Reporting Bugs 🐛

Found a bug? Help us squash it!

**Before submitting:**
- Check existing [issues](https://github.com/thibautcampana/agentmemory-protocol/issues)
- Try to reproduce on latest version

**Bug report should include:**
- Clear description
- Steps to reproduce
- Expected vs actual behavior
- Environment (OS, Node version, Solana CLI version)
- Screenshots/logs if applicable

### 2. Suggesting Features 💡

Have an idea? We want to hear it!

**Feature requests should include:**
- Use case (why is this needed?)
- Proposed solution
- Alternative solutions considered
- Impact on existing functionality

### 3. Code Contributions 💻

#### Getting Started
```bash
# Fork the repo
git clone https://github.com/YOUR_USERNAME/agentmemory-protocol
cd agentmemory-protocol

# Install dependencies
npm install

# Create a branch
git checkout -b feature/your-feature-name
```

#### Development Workflow
```bash
# Build
anchor build

# Run tests
anchor test

# Run local validator
solana-test-validator

# Format code
cargo fmt
npm run format
```

#### Commit Guidelines

Use conventional commits:
```
feat: add batch logging support
fix: resolve PDA derivation bug
docs: update deployment guide
test: add attestation integration tests
refactor: optimize merkle root computation
```

#### Pull Request Process

1. **Update tests** - Add/update tests for your changes
2. **Update docs** - Document new features/APIs
3. **Run tests** - Ensure all tests pass
4. **Format code** - Follow project style
5. **Write clear PR description**:
   - What does this change?
   - Why is it needed?
   - How was it tested?
6. **Link related issues** - Use "Fixes #123"

### 4. Documentation 📚

Docs can always be better!

**Areas to improve:**
- Code comments
- README examples
- API documentation
- Tutorial videos
- Integration guides

### 5. Testing 🧪

Help us test:
- **Devnet testing** - Try new features on devnet
- **Edge cases** - Test boundary conditions
- **Performance** - Benchmark high-load scenarios
- **Security** - Report vulnerabilities privately

## 🎯 Priority Areas

We're especially looking for help with:

1. **Security audits** - Review smart contract code
2. **SDK improvements** - Better TypeScript ergonomics
3. **Integration examples** - Real-world use cases
4. **Performance optimization** - Reduce transaction costs
5. **UI/Dashboard** - Public agent reputation viewer

## 📋 Code Style

### Rust (Smart Contract)
```rust
// Use descriptive names
pub fn log_decision(ctx: Context<LogDecision>, input: String) -> Result<()> {
    // Clear comments for complex logic
    let agent_account = &mut ctx.accounts.agent_account;
    
    // Handle errors explicitly
    require!(input.len() <= MAX_INPUT_SIZE, ErrorCode::InputTooLarge);
    
    Ok(())
}
```

### TypeScript (SDK)
```typescript
// Use async/await
export async function logDecision(
  connection: Connection,
  agentId: string,
  decision: Decision
): Promise<TransactionSignature> {
  // Type everything
  const tx = new Transaction();
  
  // Add helpful comments
  // ... implementation
  
  return signature;
}
```

## 🚫 Code of Conduct

### Be Respectful
- Constructive feedback only
- No harassment, discrimination, or toxicity
- Assume good intent

### Be Collaborative
- Help newcomers
- Share knowledge
- Give credit where due

### Be Professional
- On-topic discussions
- No spam or self-promotion
- Respect maintainers' time

## 🏆 Recognition

Contributors will be:
- Listed in `CONTRIBUTORS.md`
- Mentioned in release notes
- Given credit in documentation
- Eligible for bounties (when available)

## 📞 Getting Help

Stuck? Ask for help:
- **GitHub Discussions** - General questions
- **Discord** - Real-time chat
- **Issues** - Bug reports & feature requests
- **Twitter** - [@ThibautCampana](https://x.com/ThibautCampana)

## 🎁 Bounties & Grants

We offer bounties for:
- Critical bug fixes
- Security vulnerabilities
- Major features
- Integration guides

Check [BOUNTIES.md](BOUNTIES.md) for active bounties.

## 📜 License

By contributing, you agree that your contributions will be licensed under the MIT License.

## 🚀 First Contribution?

New to open source? Start here:
- [Good First Issues](https://github.com/thibautcampana/agentmemory-protocol/labels/good%20first%20issue)
- [Documentation](https://github.com/thibautcampana/agentmemory-protocol/labels/documentation)
- [Tests](https://github.com/thibautcampana/agentmemory-protocol/labels/tests)

## 🙏 Thank You!

Every contribution, no matter how small, helps build the trust layer for autonomous AI.

**Let's build the future together.** 🧠🚀

---

Questions? DM [@ThibautCampana](https://x.com/ThibautCampana) or open a discussion!
