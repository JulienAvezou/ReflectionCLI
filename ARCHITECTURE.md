# Architecture

ReflectionCLI is a local-first TypeScript command-line tool for developers who use AI coding assistants. Its core job is to capture reflection, comprehension debt, explain-back attempts, decision records, and AI usage audits directly inside the developer's Git workflow without requiring a hosted service.

The architecture is intentionally small, but it is designed around clear boundaries: command parsing and prompting, domain analysis, typed persistence, Git hook integration, and human-readable reporting.

## System Overview

```text
User
  |
  | reflection <command>
  | git-reflect <command>
  v
bin/reflection or bin/git-reflect
  |
  v
src/index.ts
  |
  +--> src/commands.ts   command handlers and interactive flows
  +--> src/hook.ts       pre-commit reflection workflow
  +--> src/setup.ts      hook install, uninstall, and verification
  |
  +--> src/thinking.ts   scoring, recommendations, audits, analysis
  +--> src/report.ts     weekly Markdown report generation
  +--> src/format.ts     terminal and Markdown-friendly formatting
  |
  v
src/storage.ts
  |
  v
.git/git-reflect/log.json
```

The CLI is distributed as two executable commands:

- `reflection`: the primary direct command for thinking workflows.
- `git-reflect`: the legacy-compatible command and Git hook entry point.

Both commands route through the same TypeScript application logic.

## Frontend

ReflectionCLI does not have a browser or mobile frontend. The user interface is the terminal.

That terminal interface still has product-level design decisions:

- Interactive prompts are handled with `inquirer`, which supports guided workflows for reflection, learning extraction, explain-back sessions, AI audits, decisions, and scoring.
- Commands support noninteractive flags for repeatability, scripting, and future automation.
- Output formatting is centralized in `src/format.ts` so persisted domain objects can be rendered consistently as terminal text or Markdown-like reports.
- The weekly report generator in `src/report.ts` produces structured Markdown that can be saved, reviewed, or copied into a personal knowledge base.

This keeps the experience close to where developers already work: Git, terminal sessions, and local project directories.

## Backend

There is no hosted backend. The "backend" is a local Node.js runtime that executes CLI commands on the developer's machine.

The backend responsibilities are split across small modules:

- `src/index.ts`: process entry point, top-level command routing, version/help output, and error handling.
- `src/commands.ts`: command-specific workflows, argument parsing, validation, prompting, and orchestration.
- `src/hook.ts`: Git pre-commit execution path. It detects branch and commit context, prompts for reflection, and stores the resulting entry.
- `src/setup.ts`: installs and removes the pre-commit hook, including executable permissions and hook backup behavior.
- `src/thinking.ts`: pure domain logic for thinking mode recommendations, AI outsourcing risk, scoring, heatmap analysis, prompt improvement, archetype scoring, and weekly practice generation.
- `src/report.ts`: derives weekly summaries from the persisted reflection log.
- `src/storage.ts`: normalized JSON persistence and ID generation.

The implementation favors a thin-command, typed-domain approach. Command handlers collect input and delegate to storage or analysis helpers instead of embedding all behavior in the CLI entry point.

## Database

ReflectionCLI uses a local JSON data store instead of an external database.

Data is stored per Git repository at:

```text
.git/git-reflect/log.json
```

This storage model is deliberate:

- It keeps reflection data project-local.
- It avoids accounts, network access, database credentials, and cloud synchronization.
- It allows developers to inspect or export their data directly.
- It keeps sensitive reflections out of application servers because there are none.

The storage layer is still structured like a small persistence boundary:

- `ReflectionLog` in `src/types.ts` defines the full persisted schema.
- `readLog()` creates a default log when none exists.
- `normalizeLog()` backfills missing arrays and stats so older or partial logs can still be read.
- `writeLog()` writes to a process-specific temporary file and then renames it, reducing the risk of partially written JSON.
- IDs are generated with stable prefixes such as `debt-001`, `learn-001`, `decision-001`, and `prompt-001`.

The log currently stores:

- Commit reflection entries
- Comprehension debt items
- Learning entries
- Explain-back entries
- Thinking mode sessions
- Thinking scores
- AI outsourcing audits
- Decision records and decision reviews
- System comprehension heatmaps
- Cognitive archetype results
- Prompt reflection entries

This gives the project a real domain model rather than treating the log as an untyped append-only blob.

## Auth

There is no authentication layer because the tool does not expose a network service and does not sync data to a remote account.

Security and access control are handled by the local environment:

- Data lives inside the current repository's `.git` directory.
- File access follows the user's operating system permissions.
- The CLI does not request tokens, API keys, passwords, or OAuth grants.
- The Git hook runs locally as part of the user's existing Git workflow.

This is a privacy-preserving design, but it also means multi-user collaboration, cloud sync, and centralized access control are intentionally out of scope for the current architecture.

## AI Integration

ReflectionCLI is designed for AI-assisted developers, but it does not call an AI model directly.

The AI integration is behavioral and workflow-oriented:

- `learn` asks what AI helped with, what may have been outsourced, what remains unclear, and what reusable pattern was learned.
- `audit` calculates outsourcing risk based on whether AI-generated output was verified, explainable, tested, compared, and challenged.
- `mode` recommends a thinking mode before using AI: `Explore`, `Challenge`, `Decide`, `Audit`, or `Reflect`.
- `prompt` records the original prompt, AI output, hidden assumptions, unclear parts, and an improved prompt.
- `explain` turns weak or incomplete understanding into optional comprehension debt.
- `weekly` aggregates AI usage reflections and recurring gaps into a Markdown report.

This choice is important architecturally: the tool avoids becoming another AI wrapper. Instead, it creates a local system of record for how the developer thinks with AI, verifies AI output, and turns AI-assisted sessions into durable learning.

## Deployment

ReflectionCLI is deployed as a Node.js CLI package.

The source is TypeScript under `src/`, compiled by `tsc` into `dist/`. Executable wrappers live in `bin/` and point to the compiled JavaScript.

Current package characteristics:

- Runtime: Node.js 18+
- Language: TypeScript
- Build: `npm run build`
- Tests: Jest with `ts-jest`
- Commands: `reflection` and `git-reflect`
- Local development install path: `npm install`, `npm run build`, `npm link`

The CLI can be used directly after linking, and the Git hook can be installed with:

```bash
git-reflect install
```

Once installed, the hook invokes:

```bash
git-reflect --hook
```

That path prompts the user before a commit and persists the reflection entry locally.

## Engineering Depth

The project demonstrates several engineering concerns beyond a basic CLI scaffold.

### Local-first product architecture

ReflectionCLI avoids backend infrastructure by making the repository itself the boundary for data ownership. This reduces operational complexity while improving privacy for potentially sensitive reflections about work, AI usage, uncertainty, and technical debt.

### Typed domain model

The project has explicit TypeScript interfaces for each major concept: reflections, learning entries, explain-back sessions, decisions, audits, heatmaps, scores, archetypes, and prompt reflections. This makes the CLI easier to extend without losing schema clarity.

### Backward-compatible persistence

The storage layer normalizes partial logs and fills missing collections. That matters because a developer tool's data format is likely to evolve as new reflection workflows are added.

### Atomic-ish local writes

`writeLog()` writes JSON to a temporary file before renaming it into place. For a local CLI, this is a pragmatic reliability improvement that reduces the chance of corrupting the main log if the process exits during a write.

### Git workflow integration

The pre-commit hook connects to `/dev/tty` so interactive prompts work during Git hook execution. Hook installation also backs up an existing hook before replacing it, which acknowledges real-world developer environments.

### Pure analysis helpers

Thinking mode recommendation, scoring, audit risk calculation, heatmap analysis, archetype scoring, prompt improvement, and practice generation are implemented as reusable functions in `src/thinking.ts`. This keeps domain logic testable without needing to run an interactive CLI session.

### Reporting pipeline

The weekly report is derived from the same persisted log rather than from separate analytics state. This creates a simple data flow: capture events locally, normalize them, aggregate them by date range, and render Markdown.

### Testable module boundaries

Tests are organized around storage, report generation, questions, and thinking logic. That coverage targets the code most likely to affect correctness: persistence behavior, domain calculations, and generated output.

## Tradeoffs

The current architecture intentionally chooses simplicity and privacy over centralized features.

- No hosted backend means no cloud sync, team dashboard, or remote analytics.
- JSON storage is easy to inspect, but it is not optimized for very large logs.
- Terminal UX is fast and developer-native, but it does not provide visual dashboards.
- No direct AI API calls keeps the tool vendor-neutral, but recommendations are rule-based rather than model-generated.
- A single local log file is easy to manage, but future concurrent writes may require stronger locking if multiple processes write at once.

These tradeoffs are appropriate for the current product goal: a lightweight, local-first reflection system that helps developers preserve understanding while using AI tools.

## Future Architecture Opportunities

Potential next steps that fit the existing structure:

- Add schema version migrations for larger persistence changes.
- Add file locking or append-only event storage for stronger concurrent-write behavior.
- Add export commands for Markdown, CSV, or knowledge-base formats.
- Add optional encrypted storage for more sensitive reflections.
- Add an optional dashboard that reads the same local log without changing the core persistence model.
- Add optional AI provider integrations for summarization while preserving local-first defaults.
- Add package publishing and release automation for easier installation.

