# Troubleshooting git-reflect

## Issues and Solutions

### Hook doesn't run when committing

**Symptoms**: You commit but don't see reflection prompts

**Solutions**:
1. Verify the hook is installed:
   ```bash
   git-reflect verify
   ```

2. Check if hook exists and is executable:
   ```bash
   ls -la .git/hooks/pre-commit
   ```
   Should show `-rwxr-xr-x` (executable)

3. Check if you're using `--no-verify`:
   ```bash
   git commit --no-verify  # This skips the hook
   ```

4. Reinstall the hook:
   ```bash
   git-reflect install
   ```

### "Not inside a git repository" error

**Symptoms**: `git-reflect install` fails with this message

**Solution**: Make sure you're in a git repository:
```bash
git init  # Initialize git if needed
git-reflect install
```

### Hook installation fails with permission error

**Symptoms**: Cannot write to `.git/hooks/`

**Solution**: Check `.git` directory permissions:
```bash
ls -ld .git
chmod 755 .git
git-reflect install
```

### Reflection log is corrupted or unreadable

**Symptoms**: `npm test` fails with JSON parse errors

**Solution**: The log has automatic recovery - it will reset to default on next commit. To manually fix:
```bash
# Backup current log
cp .git/git-reflect/log.json .git/git-reflect/log.json.backup

# Delete corrupted file
rm .git/git-reflect/log.json

# Next commit will create a fresh log
git add .
git commit -m "Recovered from corrupted log"
```

### Can't uninstall the hook

**Symptoms**: `git-reflect uninstall` doesn't work

**Solution**: Manually remove:
```bash
rm .git/hooks/pre-commit
rm -rf .git/git-reflect/
```

### Node.js version compatibility

**Symptoms**: "require() of ES modules is not supported" or similar

**Solution**: Ensure you're using Node 18 or higher:
```bash
node --version
# v18.0.0 or higher required
```

Update Node via nvm:
```bash
nvm install 22
nvm use 22
npm rebuild
```

### Commit still goes through after cancelling reflection

**Symptoms**: You cancel the reflection prompt (Ctrl+C) but commit succeeds

**Solution**: This shouldn't happen. If it does, you may have used `--no-verify`. Make sure to let the hook complete.

## Contributing to Troubleshooting

If you encounter an issue not listed here, please open an issue on GitHub:
https://github.com/JulienAvezou/git-reflect/issues

Include:
- Node version (`node --version`)
- OS (macOS/Linux)
- git version (`git --version`)
- Steps to reproduce
- Error message or log output
