# Contributing to AI Football Match Report Generator

First off, thank you for considering contributing to this project! 🎉

## 🤔 How Can I Contribute?

### Reporting Bugs

Before creating bug reports, please check existing issues to avoid duplicates. When you create a bug report, include as many details as possible:

- **Use a clear and descriptive title**
- **Describe the exact steps to reproduce the problem**
- **Provide specific examples**
- **Describe the behavior you observed and what you expected**
- **Include screenshots if applicable**
- **Include your environment details** (OS, Node.js version, browser, etc.)

### Suggesting Enhancements

Enhancement suggestions are tracked as GitHub issues. When creating an enhancement suggestion, include:

- **Use a clear and descriptive title**
- **Provide a step-by-step description of the suggested enhancement**
- **Explain why this enhancement would be useful**
- **List any alternative solutions or features you've considered**

### Pull Requests

1. Fork the repo and create your branch from `main`
2. If you've added code that should be tested, add tests
3. Ensure the test suite passes (`pnpm test` if available)
4. Make sure your code follows the existing code style
5. Update documentation as needed
6. Write a clear commit message

## 💻 Development Setup

1. **Clone your fork**
   ```bash
   git clone https://github.com/your-username/ai-football-rag.git
   cd ai-football-rag
   ```

2. **Install dependencies**
   ```bash
   pnpm install
   ```

3. **Create environment file**
   ```bash
   cp .env.local.example .env.local
   # Add your API keys
   ```

4. **Run development server**
   ```bash
   pnpm dev
   ```

## 📝 Code Style

- Use TypeScript for all new code
- Follow the existing code formatting (ESLint + Prettier)
- Write meaningful commit messages
- Add comments for complex logic
- Keep functions small and focused
- Use descriptive variable and function names

## 🧪 Testing

- Test your changes thoroughly before submitting
- Include both happy path and edge cases
- Test with the free tier API limits in mind

## 📚 Documentation

- Update README.md if you change functionality
- Add inline comments for complex code
- Update relevant documentation in `/docs`
- Include JSDoc comments for public APIs

## 🔄 Git Commit Messages

- Use the present tense ("Add feature" not "Added feature")
- Use the imperative mood ("Move cursor to..." not "Moves cursor to...")
- Limit the first line to 72 characters or less
- Reference issues and pull requests after the first line

Examples:
```
feat: add streaming response for chat API
fix: resolve API rate limit errors
docs: update installation instructions
refactor: simplify fixture fetching logic
```

## 🚀 Release Process

Maintainers will handle releases. Version numbers follow [Semantic Versioning](https://semver.org/).

## 📄 License

By contributing, you agree that your contributions will be licensed under the MIT License.

## 💬 Questions?

Feel free to open an issue with your question or reach out to the maintainers.

---

Thank you for contributing! 🙌
