# Example: Using git-reflect

This document shows what using git-reflect looks like in practice.

## Initial Installation

```bash
$ git-reflect install
✅ git-reflect hook installed successfully!
📝 Next time you commit, you will be prompted with reflection questions.
```

## Making a Commit with Reflection

```bash
$ git add .
$ git commit -m "Add user authentication endpoint"

✨ Take a moment to reflect on your changes:

🎯 What was the intent of these changes?
> Implement JWT-based authentication for API endpoints to secure user data

🔧 What problem did you solve?
> Users had no way to authenticate with the API, making it impossible to restrict access to protected resources

📚 What did you learn while making these changes?
> JWT expiration timing is critical - I learned that short-lived tokens with refresh token rotation is the standard pattern

🤔 What would you do differently if you rewrote this?
> I would extract auth middleware into a separate utility module earlier instead of having it inline in each handler

💪 How confident are you in this code? Why?
> Medium-high. I followed RFC 7519 for JWT format and used well-tested libraries, but edge cases around clock skew and token revocation could use more thought

✅ What testing did you do?
> Unit tests for auth middleware, manual testing of token generation and validation, tested expired token rejection

⚠️  Any technical debt or TODOs introduced?
> TODO: Implement token revocation list for logout functionality
> TODO: Add rate limiting to auth endpoint to prevent brute force attacks

📝 Reflection saved! Your entry has been added to .git/git-reflect/log.json
```

## Viewing Your Reflection Log

```bash
$ cat .git/git-reflect/log.json | jq .entries[-1]

{
  "timestamp": "2026-02-13T16:30:00.000Z",
  "date": "2026-02-13",
  "branchName": "feature/auth",
  "commitMessage": "Add user authentication endpoint",
  "answers": {
    "intent": "Implement JWT-based authentication for API endpoints to secure user data",
    "problemSolved": "Users had no way to authenticate with the API, making it impossible to restrict access to protected resources",
    "learned": "JWT expiration timing is critical - I learned that short-lived tokens with refresh token rotation is the standard pattern",
    "wouldDoDifferently": "I would extract auth middleware into a separate utility module earlier instead of having it inline in each handler",
    "confidence": "Medium-high. I followed RFC 7519 for JWT format and used well-tested libraries, but edge cases around clock skew and token revocation could use more thought",
    "testing": "Unit tests for auth middleware, manual testing of token generation and validation, tested expired token rejection",
    "technicalDebt": "TODO: Implement token revocation list for logout functionality\nTODO: Add rate limiting to auth endpoint to prevent brute force attacks"
  }
}
```

## Skipping Reflection (Not Recommended!)

If you need to bypass reflection for WIP commits or hotfixes, use `--no-verify`:

```bash
$ git commit -m "WIP: debugging" --no-verify
# Skips pre-commit hook entirely - no reflection captured
```

## Building Your Reflection Dataset

Over time, your reflection log becomes a personal knowledge base:

```bash
# See all reflections on a topic
$ cat .git/git-reflect/log.json | jq '.entries[] | select(.answers.learned | contains("async"))'

# Get stats
$ cat .git/git-reflect/log.json | jq '.stats'

{
  "totalCommits": 47,
  "projectStartDate": "2026-02-01"
}

# Export reflections for personal review
$ cat .git/git-reflect/log.json | jq '.entries[].answers' > reflections.json
```

## The Power of Structured Reflection

After a few weeks, patterns emerge:

- **What you consistently learn**: Highlights knowledge gaps and growth areas
- **Confidence trends**: Showing improvement over time or flagging complexity
- **Technical debt**: TODOs become a roadmap for refactoring
- **Decision rationale**: Future you can understand why past decisions were made

This is your personal developer journal, captured through deliberate reflection. 🧠
