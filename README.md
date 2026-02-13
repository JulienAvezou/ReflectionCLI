# git-reflect

> Thoughtful coding through structured reflection. Before each commit, answer reflective questions to build your personal developer knowledge dataset. A tool designed to counteract cognitive offloading and promote deeper thinking in your development workflow.

## Features

- 🧠 **7 Structured Reflection Questions** — Guides developers to think deeply about their changes
- 📝 **Persistent Reflection Log** — All responses stored in `.git/git-reflect/log.json`
- 🪝 **Git Hook Integration** — Seamlessly integrates into your commit workflow
- 🔒 **Local & Private** — Your reflections stay on your machine
- 🎯 **Zero Configuration** — Works out of the box after installation
- 🍎 **MacOS & Linux** — Full support for Unix-like systems

## Installation

### From NPM (Coming Soon)
```bash
npm install -g git-reflect
git-reflect install
```

### From Source
```bash
git clone https://github.com/JulienAvezou/git-reflect.git
cd git-reflect
npm install
npm run build
npm link  # Make git-reflect available globally
git-reflect install
```

## Quick Start

1. **Install the hook**:
   ```bash
   git-reflect install
   ```

2. **Make changes and commit**:
   ```bash
   git add .
   git commit -m "Your commit message"
   ```

3. **Answer reflection questions** — You'll be prompted with 7 thoughtful questions before the commit completes.

4. **View your reflections**:
   ```bash
   cat .git/git-reflect/log.json | jq .
   ```

## The Reflection Questions

Before each commit, you'll be asked:

1. **What was the intent of these changes?** — Clarify your goal
2. **What problem did you solve?** — Articulate the issue addressed
3. **What did you learn?** — Capture new knowledge or insights
4. **What would you do differently?** — Critical thinking about implementation
5. **How confident are you? Why?** — Risk assessment and quality awareness
6. **What testing did you do?** — Reflect on validation approach
7. **Any technical debt?** — Awareness of shortcuts or future work

## Reflection Log Format

Responses are stored in `.git/git-reflect/log.json`:

```json
{
  "version": "1.0",
  "entries": [
    {
      "timestamp": "2026-02-13T17:30:00.000Z",
      "date": "2026-02-13",
      "branchName": "feature/new-api",
      "commitMessage": "Add user authentication",
      "answers": {
        "intent": "Implement JWT-based auth",
        "problemSolved": "Users couldn't authenticate",
        "learned": "JWT expiration handling requires careful timing",
        "wouldDoDifferently": "Extract auth logic to separate module earlier",
        "confidence": "High - followed established patterns",
        "testing": "Unit tests + manual testing",
        "technicalDebt": "TODO: Add refresh token rotation"
      }
    }
  ],
  "stats": {
    "totalCommits": 1,
    "projectStartDate": "2026-02-13"
  }
}
```

## Usage

### Install the hook
```bash
git-reflect install
```

### Skip reflection (discouraged!)
Use git's standard `--no-verify` flag:
```bash
git commit --no-verify
```

### View your reflection log
```bash
# Pretty print the log
cat .git/git-reflect/log.json | jq .

# Get last entry
cat .git/git-reflect/log.json | jq '.entries[-1]'

# Get stats
cat .git/git-reflect/log.json | jq '.stats'
```

## Uninstall

To remove the git hook:
```bash
rm .git/hooks/pre-commit
rm -rf .git/git-reflect/
```

## Why Reflection?

AI-assisted development is powerful, but it can encourage cognitive offloading — letting tools do the thinking instead of developing deeper understanding. **git-reflect** interrupts this pattern by making reflection part of your workflow.

Each answer becomes part of your personal knowledge base, documenting not just *what* you built, but *why* you built it that way and *what* you learned. Over time, this dataset reveals patterns in your thinking and helps you grow as a developer.

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md) for development guidelines.

## License

MIT — See [LICENSE](./LICENSE) file for details.

---

Made with 🧠 by developers who believe thoughtful code is better code.
