# ReflectionCLI

ReflectionCLI is a local-first command-line reflection tool for developers who use AI coding tools. It helps you preserve understanding, identify comprehension debt, and turn coding sessions into learning moments.

The CLI can still run as `git-reflect` for the existing Git hook workflow, and it also exposes a `reflection` command for direct thinking workflows.

## Why It Exists

AI-assisted development can make teams faster, but it can also hide gaps in understanding. ReflectionCLI gives those gaps a place to go before they become long-term comprehension debt.

Use it to capture:

- what you learned during a coding session
- where AI helped
- what you may have outsourced to AI
- what you still do not fully understand
- explain-back attempts for active recall
- weekly patterns across projects and sessions
- thinking mode recommendations before AI work
- AI outsourcing audits, decision reviews, and prompt quality reflections

Everything is stored locally in `.git/git-reflect/log.json`.

## Features

- Comprehension debt tracker
- Learning extraction command
- Explain-back mode
- Weekly thinking report
- Thinking mode assessment
- Thinking score self-assessment
- AI outsourcing audit
- Decision journal
- System comprehension heatmap
- Cognitive archetype assessment
- Weekly practice generator
- Prompt reflection
- Existing Git pre-commit reflection hook
- Human-readable JSON storage
- No authentication, cloud sync, or external services

## Installation

### From Source

```bash
git clone https://github.com/JulienAvezou/ReflectionCLI.git
cd ReflectionCLI
npm install
npm run build
npm link
```

After linking, both commands are available:

```bash
reflection --help
git-reflect --help
```

### Git Hook Setup

```bash
git-reflect install
```

The hook asks reflection questions before commits and saves answers to `.git/git-reflect/log.json`.

## Usage

Run commands from inside a Git repository. ReflectionCLI stores project-local data under that repository's `.git` directory.

### Add Comprehension Debt

```bash
reflection debt add "Understand why the cache invalidates on user updates" \
  --project api \
  --tags cache,ai \
  --context "AI generated most of the invalidation logic" \
  --source-reflection commit-2026-06-02
```

Interactive mode is also supported:

```bash
reflection debt add
```

### List Open Debt

```bash
reflection debt list
```

Other filters:

```bash
reflection debt list --all
reflection debt list --resolved
reflection debt list --project api
reflection debt list --tag cache
```

### Show Debt

```bash
reflection debt show debt-001
```

### Resolve Debt

```bash
reflection debt resolve debt-001
```

### Extract Learning

```bash
reflection learn
```

The command prompts for:

- What I understood
- What AI helped with
- What I may have outsourced to AI
- What I still do not fully understand
- Reusable pattern
- Explain-back question
- Next learning action

You can also provide every section with flags:

```bash
reflection learn \
  --project cli \
  --understood "The storage layer normalizes old log files." \
  --ai-helped "AI helped draft edge case tests." \
  --outsourced "I let AI choose some parser details." \
  --unclear "I need to review inquirer validation behavior." \
  --pattern "Keep storage pure and command handlers thin." \
  --question "Can I explain how log migration works?" \
  --next "Read the command parser and tests again tomorrow."
```

To use a file as source context for the interactive prompt:

```bash
reflection learn --from session-notes.md --project cli
```

### Explain-Back Mode

```bash
reflection explain
```

The command asks:

- Can you explain this without looking at the code?
- What tradeoff did you make?
- What would break if this assumption changed?
- How would you explain this to another developer?

If you mark the explanation as `weak` or `incomplete`, ReflectionCLI can create a linked comprehension debt item.

Noninteractive example:

```bash
reflection explain \
  --project cli \
  --topic "Weekly report aggregation" \
  --without-code "It scans local log entries within a date range." \
  --tradeoff "Simple markdown generation instead of analytics." \
  --changed-assumption "Very large logs may need pagination or indexing." \
  --explain-to-developer "The report is a projection of local reflection data." \
  --assessment incomplete \
  --create-debt
```

### Weekly Thinking Report

```bash
reflection weekly
```

Save the report as markdown:

```bash
reflection weekly --output weekly-thinking-report.md
```

Choose a date range:

```bash
reflection weekly --since 2026-05-25 --until 2026-06-02
```

### Thinking Mode Assessment

```bash
reflection mode
```

Thinking modes help you choose how to work with AI:

- `Explore`: use when you do not fully understand the problem yet
- `Challenge`: use when you have a plan but it may be wrong
- `Decide`: use when you need to choose between options
- `Audit`: use when you need to verify quality or correctness
- `Reflect`: use when you want to learn from completed work

Noninteractive example:

```bash
reflection mode --goal "choose between Redis caching and local memory cache" --project api
```

### Thinking Score

```bash
reflection score
```

The score is a lightweight habit check, not vanity analytics. It scores five dimensions out of 10 for a total out of 50:

- Understanding
- Verification
- Reflection
- Decision Quality
- AI Dependency

Noninteractive example:

```bash
reflection score \
  --understanding 4,5 \
  --verification 2,3 \
  --reflection 4,4 \
  --decisionQuality 3,3 \
  --aiDependency 4,5
```

### AI Outsourcing Audit

```bash
reflection audit
```

The audit checks whether AI may have carried too much judgment. It outputs risk level, main risk areas, and one next action.

```bash
reflection audit \
  --ai-generated yes \
  --verified no \
  --can-explain no \
  --edge-cases no \
  --alternatives no \
  --challenged no \
  --create-debt \
  --create-explain
```

### Decision Journal

```bash
reflection decide
reflection decisions
reflection decision show decision-001
reflection decision review decision-001
```

Record decision context, options, chosen option, reasoning, tradeoffs, expected outcome, review date, project, and tags.

```bash
reflection decide \
  --project api \
  --tags caching,performance \
  --title "Use Redis for session cache" \
  --context "Need shared cache across instances" \
  --options "Redis|In-memory cache|Database table" \
  --chosen "Redis" \
  --reasoning "Shared state and expiry support are built in" \
  --tradeoffs "Adds infrastructure dependency" \
  --expected "Lower latency and consistent sessions" \
  --review-date 2026-06-16
```

Review later:

```bash
reflection decision review decision-001 \
  --what-happened "Latency improved, ops complexity increased" \
  --was-good "Yes" \
  --what-changed "Traffic grew faster than expected" \
  --same-again "Yes, with better monitoring" \
  --lessons "Add observability when adding infrastructure"
```

### System Comprehension Heatmap

```bash
reflection heatmap
reflection heatmap update
reflection heatmap report
```

Default areas are Frontend, Backend, Database, Infrastructure, CI/CD, Testing, Security, Observability, Product Logic, and External APIs. Scores use a 1-5 scale by default.

```bash
reflection heatmap update \
  --project api \
  --scale 5 \
  --scores "Frontend:3,Backend:4,Database:2,Security:2,Testing:4"
```

### Cognitive Archetype Assessment

```bash
reflection archetype
```

Archetypes describe your AI collaboration pattern:

- `AI Autopilot`: relies heavily on AI without enough verification
- `AI Assistant`: uses AI mostly for execution support
- `AI Challenger`: uses AI to critique and improve thinking
- `AI Architect`: uses AI strategically while preserving judgment

Noninteractive example:

```bash
reflection archetype --answers "AI Challenger|AI Challenger|AI Architect|AI Assistant"
```

### Weekly Practice Generator

```bash
reflection practice
```

Generates one 10-20 minute exercise from recent local data. Example:

```markdown
# Practice: Verify One AI-Assisted Choice

## Why this practice matters
Your recent audit suggests some judgment may have been outsourced to AI.

## Steps
1. Pick one AI-generated solution from this week.
2. Explain why it works without looking at the code.
3. Name two assumptions it makes.
4. Test or reason through one case where it could fail.

## Reflection question
What part of this solution do I now understand better than before?
```

### Prompt Reflection

```bash
reflection prompt
```

Reflect on a prompt you used with AI, what it produced, what worked, hidden assumptions, and how to improve it.

```bash
reflection prompt \
  --project cli \
  --tags prompts,testing \
  --prompt "Write unit tests for this parser" \
  --goal "Improve parser coverage" \
  --output "Generated happy path tests" \
  --worked "It identified basic branches" \
  --unclear "It did not know our edge cases" \
  --assumptions "Parser behavior was fully visible" \
  --lessons "Include edge cases and expected failures"
```

## Commands

| Command | Purpose |
| --- | --- |
| `reflection debt add [title]` | Add comprehension debt |
| `reflection debt list` | List open comprehension debt |
| `reflection debt resolve <id>` | Mark debt as resolved |
| `reflection debt show <id>` | Show one debt item |
| `reflection learn` | Extract learning from a coding session |
| `reflection explain` | Run explain-back active recall |
| `reflection weekly` | Generate a weekly thinking report |
| `reflection mode` | Recommend a thinking mode |
| `reflection score` | Score thinking quality habits |
| `reflection audit` | Audit AI outsourcing risk |
| `reflection decide` | Record a technical decision |
| `reflection decisions` | List decisions |
| `reflection decision show <id>` | Show a decision |
| `reflection decision review <id>` | Review a decision outcome |
| `reflection heatmap` | Create/update a comprehension heatmap |
| `reflection heatmap report` | Show the latest heatmap |
| `reflection archetype` | Assess AI collaboration archetype |
| `reflection practice` | Generate a focused practice exercise |
| `reflection prompt` | Reflect on prompt quality |
| `git-reflect install` | Install the pre-commit hook |
| `git-reflect uninstall` | Remove the pre-commit hook |

## Example Workflows

### After an AI-Assisted Feature

```bash
reflection mode --goal "verify the implementation before merging"
reflection learn --project api
reflection audit --project api
reflection explain --project api
reflection debt list
```

Use this when AI helped you complete a feature and you want to separate real understanding from shipped output.

### Before Ending the Week

```bash
reflection debt list --all
reflection weekly --output weekly-thinking-report.md
```

Review the report, then pick one open debt item as next week's learning focus.

### Before a Technical Choice

```bash
reflection mode --goal "choose between two persistence strategies"
reflection decide --project backend
reflection decision show decision-001
```

Use this when the quality of the decision matters more than generating code quickly.

### Improve AI Collaboration

```bash
reflection archetype
reflection prompt --project cli
reflection practice
```

Use this to inspect your collaboration habits and pick one concrete practice.

### After a Weak Explain-Back

```bash
reflection explain --project frontend
reflection debt list --tag explain-back
```

Use the generated debt item as a concrete follow-up instead of leaving the gap vague.

## Comprehension Debt Examples

Good debt items are specific and actionable:

- `debt-001 OPEN [api] Understand how token refresh race conditions are avoided #auth #ai`
- `debt-002 OPEN [frontend] Explain why optimistic updates do not duplicate cache entries #react-query`
- `debt-003 RESOLVED [cli] Understand how old log files are migrated #storage`

A useful item usually answers: "What exactly would I struggle to explain tomorrow?"

## Weekly Report Example

```markdown
# Weekly Thinking Report

Period: 2026-05-27 to 2026-06-02

## Projects worked on
- cli
- api

## Main topics
- storage
- auth
- explain-back

## What I learned
- Small command modules are easier to test.
- Token refresh needs explicit failure handling.

## Open comprehension debt
- debt-001: Understand prompt validation

## Resolved comprehension debt
- debt-002: Understand report grouping

## AI usage reflections
- AI helped draft edge case tests.
- I outsourced some parser details.

## Recurring gaps
- prompts (2x)

## Questions to revisit
- Can I explain the report date range?
- Understand prompt validation

## Suggested focus for next week
- prompts (2x)
```

## Storage Format

Data is stored in `.git/git-reflect/log.json`:

```json
{
  "version": "1.0",
  "entries": [],
  "comprehensionDebt": [],
  "learningEntries": [],
  "explainBackEntries": [],
  "thinkingModeSessions": [],
  "thinkingScores": [],
  "outsourcingAudits": [],
  "decisionEntries": [],
  "heatmapSnapshots": [],
  "archetypeResults": [],
  "promptReflections": [],
  "stats": {
    "totalCommits": 0,
    "projectStartDate": "2026-06-02"
  }
}
```

The file is intentionally human-readable and project-local.

## Development

```bash
npm install
npm run build
npm test
```

## License

MIT. See [LICENSE](./LICENSE).
