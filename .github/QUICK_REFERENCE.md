# 🎯 CI/CD Quick Reference

## Common Commands

### 🌿 Branch Operations

```bash
# Create and switch to new feature branch
git checkout -b feature/my-feature

# Create and switch to new bugfix branch
git checkout -b fix/bug-description

# Create and switch to new hotfix branch
git checkout -b hotfix/critical-issue

# Switch back to main
git checkout main

# Update main branch
git pull origin main

# Delete local branch
git branch -d feature/my-feature

# Delete remote branch
git push origin --delete feature/my-feature
```

### 📤 Push & Pull

```bash
# Push new branch to remote
git push -u origin feature/my-feature

# Push changes to existing branch
git push

# Pull latest changes
git pull

# Fetch without merge
git fetch origin
```

### 🔄 Keeping Branch Updated

```bash
# Rebase on main (recommended)
git checkout feature/my-feature
git fetch origin
git rebase origin/main

# If conflicts, resolve them then:
git rebase --continue

# Or abort rebase
git rebase --abort

# Merge main into branch (alternative)
git checkout feature/my-feature
git merge origin/main
```

### ✅ Commit Best Practices

```bash
# Stage all changes
git add .

# Stage specific files
git add path/to/file

# Commit with conventional commit message
git commit -m "feat: Add new feature"
git commit -m "fix: Resolve bug in component"
git commit -m "docs: Update README"
git commit -m "refactor: Improve code structure"
git commit -m "test: Add unit tests"
git commit -m "chore: Update dependencies"

# Amend last commit (before pushing)
git commit --amend -m "feat: Add new feature with corrections"
```

### 🚀 GitHub CLI Commands

```bash
# Login to GitHub
gh auth login

# Create PR from current branch
gh pr create --title "feat: My feature" --body "Description"

# Create PR interactively
gh pr create

# View PR status
gh pr status

# View PR checks
gh pr checks

# Merge PR
gh pr merge --squash

# List PRs
gh pr list

# View a specific PR
gh pr view 123
```

## Conventional Commit Types

```
feat:     New feature
fix:      Bug fix
docs:     Documentation changes
style:    Code style changes (formatting, no logic change)
refactor: Code refactoring
perf:     Performance improvements
test:     Adding or updating tests
build:    Build system changes
ci:       CI/CD changes
chore:    Other changes (dependencies, etc.)
revert:   Revert previous commit
```

## Workflow Scripts

```bash
# Verify CI/CD setup
./scripts/verify-ci-setup.sh

# Set up branch protection (requires GitHub CLI)
./scripts/setup-branch-protection.sh

# Run all linters locally
pnpm lint

# Run all tests locally
pnpm test

# Build all projects
pnpm build

# Run affected linting only
pnpm nx affected --target=lint

# Run affected tests only
pnpm nx affected --target=test

# Run affected builds only
pnpm nx affected --target=build
```

## Nx Affected Commands

```bash
# Lint only changed projects
pnpm nx affected --target=lint --base=main

# Test only changed projects
pnpm nx affected --target=test --base=main

# Build only changed projects
pnpm nx affected --target=build --base=main

# See what would be affected
pnpm nx affected:apps --base=main
pnpm nx affected:libs --base=main

# Run all targets on affected projects
pnpm nx affected --all
```

## PR Workflow Shortcuts

```bash
# Complete PR workflow in one go
git checkout -b feature/my-feature
# ... make changes ...
git add .
git commit -m "feat: Add feature"
git push -u origin feature/my-feature
gh pr create --fill

# Update PR after review
# ... make changes ...
git add .
git commit -m "fix: Address review comments"
git push
```

## Emergency Commands

```bash
# Abort merge
git merge --abort

# Abort rebase
git rebase --abort

# Undo last commit (keep changes)
git reset --soft HEAD~1

# Undo last commit (discard changes) - USE WITH CAUTION
git reset --hard HEAD~1

# Discard local changes
git checkout -- path/to/file

# Stash changes temporarily
git stash
git stash pop

# View stash
git stash list
```

## GitHub Actions

```bash
# Trigger workflow manually (if configured)
gh workflow run ci.yml

# View workflow runs
gh run list

# View specific run
gh run view <run-id>

# Watch a run in real-time
gh run watch

# Re-run failed jobs
gh run rerun <run-id>
```

## Checking Status

```bash
# View local status
git status

# View log
git log --oneline -10

# View what changed
git diff

# View staged changes
git diff --cached

# View remote branches
git branch -r

# View all branches
git branch -a
```

## CI/CD Status Checks

```bash
# Check if main is protected
gh api repos/:owner/:repo/branches/main/protection

# List required status checks
gh api repos/:owner/:repo/branches/main/protection/required_status_checks

# View recent workflow runs
gh run list --limit 10

# View recent PR checks
gh pr checks <PR-number>
```

## Troubleshooting

```bash
# Branch protection blocking push?
# → Use PR workflow instead

# CI failing on PR?
# 1. View logs: gh pr checks
# 2. Fix issues locally
# 3. Push new commits

# Merge conflicts?
# 1. git fetch origin
# 2. git rebase origin/main
# 3. Resolve conflicts
# 4. git rebase --continue
# 5. git push --force-with-lease

# Can't delete branch?
# → Branch is protected or has unmerged commits

# Need to update PR title/description?
gh pr edit <PR-number> --title "New title" --body "New description"
```

## File Locations

```
.github/
├── workflows/
│   ├── ci.yml                      # Main CI pipeline
│   ├── pr-checks.yml               # PR validation
│   ├── code-quality.yml            # Code quality checks
│   └── security.yml                # Security scans
├── BRANCH_PROTECTION.md            # Setup guide
├── CI_CD_ARCHITECTURE.md           # Architecture overview
├── CODEOWNERS                      # Auto-reviewers
└── pull_request_template.md        # PR template

scripts/
├── setup-branch-protection.sh      # Automate protection setup
└── verify-ci-setup.sh              # Verify configuration

CI_CD_SETUP.md                      # Quick start guide
```

## Status Check Names

Required checks for merging to main:

- `CI Success` - Overall CI status
- `Validate` - Basic validation
- `Lint` - Code linting
- `Build` - Build check
- `Test` - Test suite
- `PR Validation` - PR metadata
- `Code Analysis` - Quality analysis

Optional (advisory):
- `Security Audit` - Security checks

## Quick Links

```bash
# View repository in browser
gh repo view --web

# View Actions tab
gh browse /actions

# View Settings → Branches
gh browse /settings/branches

# View specific PR
gh pr view 123 --web

# View commits in PR
gh pr diff 123
```

## Git Aliases (Optional)

Add these to your `~/.gitconfig`:

```ini
[alias]
    st = status
    co = checkout
    br = branch
    ci = commit
    ca = commit --amend
    pl = pull
    ps = push
    rb = rebase
    lg = log --oneline --graph --all
    last = log -1 HEAD
    unstage = reset HEAD --
    undo = reset --soft HEAD~1
```

Then use: `git st` instead of `git status`, etc.

## Environment Variables

```bash
# Set default branch for new repos
git config --global init.defaultBranch main

# Set your identity
git config --global user.name "Your Name"
git config --global user.email "your.email@example.com"

# Enable GPG signing (optional)
git config --global commit.gpgsign true
git config --global user.signingkey YOUR_GPG_KEY
```

## Resources

- Main Setup Guide: `CI_CD_SETUP.md`
- Architecture: `.github/CI_CD_ARCHITECTURE.md`
- Branch Protection: `.github/BRANCH_PROTECTION.md`
- GitHub CLI Docs: https://cli.github.com/manual/
- Nx Docs: https://nx.dev/

---

**Tip**: Bookmark this file for quick reference! 📌

