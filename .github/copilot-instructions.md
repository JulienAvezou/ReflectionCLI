# GitHub Copilot Instructions for ReflectionCLI

## Project Overview

ReflectionCLI is a local-first TypeScript CLI for AI-assisted developers. It helps users preserve understanding, reduce comprehension debt, run explain-back sessions, audit AI outsourcing risk, record decisions, track system comprehension, and generate weekly thinking reports.

The package still exposes `git-reflect` for the original Git hook workflow, and also exposes `reflection` for direct thinking workflows.

## Build, Test, And Lint

```bash
npm run build
npm run lint
npm test
npm test -- --coverage
```

For local CLI testing:

```bash
npm run build
node bin/reflection --help
node bin/git-reflect --help
```

Run commands from inside a Git repository because storage is project-local under `.git/git-reflect/log.json`.

## Architecture

- `src/index.ts`: top-level CLI dispatcher and help text.
- `src/commands.ts`: command handlers for reflection workflows.
- `src/storage.ts`: local JSON persistence and schema normalization.
- `src/types.ts`: shared TypeScript data model.
- `src/thinking.ts`: pure thinking calculations and recommendations.
- `src/format.ts`: terminal and markdown-style output formatting.
- `src/report.ts`: weekly report generation.
- `src/hook.ts`: original pre-commit reflection hook.
- `src/setup.ts`: Git hook installation and verification.
- `src/questions.ts`: original commit reflection questions.

## Data Model

All data is stored locally in `.git/git-reflect/log.json`. The log includes:

- `entries`
- `comprehensionDebt`
- `learningEntries`
- `explainBackEntries`
- `thinkingModeSessions`
- `thinkingScores`
- `outsourcingAudits`
- `decisionEntries`
- `heatmapSnapshots`
- `archetypeResults`
- `promptReflections`
- `stats`

Storage must normalize older logs so existing Tier 1 data keeps working.

## Commands

Core workflows:

- `reflection debt add|list|resolve|show`
- `reflection learn`
- `reflection explain`
- `reflection weekly`
- `reflection mode`
- `reflection score`
- `reflection audit`
- `reflection decide`
- `reflection decisions`
- `reflection decision show|review`
- `reflection heatmap update|report`
- `reflection archetype`
- `reflection practice`
- `reflection prompt`

Git hook workflow:

- `git-reflect install`
- `git-reflect uninstall`
- `git-reflect verify`

## Engineering Conventions

- Keep the app local-first; do not add authentication or cloud dependencies.
- Prefer small, testable pure functions for scoring, recommendations, reports, and formatting.
- Keep `commands.ts` as a thin shell over storage and pure logic.
- Preserve existing CLI behavior and data compatibility.
- Use helpful error messages for invalid input.
- Rebuild `dist/` after source changes because generated files are tracked.
- Add focused Jest tests for new behavior and backwards compatibility.
