# Contributing to git-reflect

We'd love your contributions! This guide will help you get started.

## Development Setup

```bash
# Clone the repo
git clone https://github.com/JulienAvezou/git-reflect.git
cd git-reflect

# Install dependencies
npm install

# Build the TypeScript
npm run build

# Watch mode for development
npm run dev

# Run tests
npm test

# Run linter
npm run lint

# Format code
npm run format
```

## Project Structure

```
src/
├── index.ts       # CLI entry point
├── hook.ts        # Pre-commit hook logic
├── questions.ts   # Reflection question definitions
├── storage.ts     # Log.json read/write
├── setup.ts       # Hook installation logic
└── types.ts       # TypeScript interfaces

tests/
└── *.test.ts      # Unit tests

bin/
└── git-reflect    # Executable wrapper
```

## Making Changes

1. Create a branch: `git checkout -b feature/your-feature`
2. Make your changes
3. Write tests for new functionality
4. Run `npm test` and `npm run lint`
5. Commit: `git commit -m "Add your feature"`
6. Push and open a pull request

## Testing

Run the full test suite:
```bash
npm test
```

Run a specific test file:
```bash
npm test -- tests/storage.test.ts
```

Run tests in watch mode:
```bash
npm test -- --watch
```

## Code Style

We use ESLint and Prettier. Format your code before committing:

```bash
npm run format
npm run lint
```

## Commit Guidelines

- Use clear, descriptive commit messages
- Start with a verb: "Add feature", "Fix bug", "Update docs"
- Reference issues when relevant: "Fix #123"

## Questions?

Open an issue on GitHub or reach out to the maintainers.

Thanks for contributing! 🎉
