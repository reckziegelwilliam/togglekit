# 🚀 CI/CD & Branch Protection Setup Guide

This guide will walk you through setting up a comprehensive CI/CD pipeline and branch protection for Toggle Kit.

## 📋 What's Been Set Up

### ✅ GitHub Actions Workflows

1. **CI Workflow** (`.github/workflows/ci.yml`)
   - Validates code quality
   - Runs linting
   - Builds all affected projects
   - Runs tests with coverage
   - Security audit
   - Parallel job execution for speed

2. **PR Checks** (`.github/workflows/pr-checks.yml`)
   - Validates PR title and description
   - Checks for merge conflicts
   - Ensures proper base branch

3. **Code Quality** (`.github/workflows/code-quality.yml`)
   - Code analysis
   - Dependency review
   - Checks for console logs and TODOs
   - Bundle size analysis

4. **Security Checks** (`.github/workflows/security.yml`)
   - CodeQL static analysis
   - Secret scanning with TruffleHog
   - NPM vulnerability audit
   - Scheduled weekly scans

### ✅ Supporting Files

- **CODEOWNERS** - Auto-assigns reviewers for PRs
- **PR Template** - Standardized PR descriptions
- **Branch Protection Guide** - Detailed setup instructions

### ✅ Helper Scripts

- `scripts/setup-branch-protection.sh` - Automates branch protection setup
- `scripts/verify-ci-setup.sh` - Verifies CI/CD configuration

## 🎯 Quick Start

### Step 1: Verify Setup

Run the verification script to ensure everything is configured correctly:

```bash
./scripts/verify-ci-setup.sh
```

### Step 2: Commit and Push Initial Setup

If you haven't pushed to GitHub yet:

```bash
# Initialize git (if not already done)
git init

# Add all files
git add .

# Commit
git commit -m "feat: Set up CI/CD pipeline and branch protection"

# Add remote (replace with your repo URL)
git remote add origin https://github.com/YOUR_USERNAME/togglekit.git

# Push to GitHub
git push -u origin main
```

### Step 3: Set Up Branch Protection

#### Option A: Automated (Recommended)

Use the GitHub CLI script:

```bash
# First, install GitHub CLI if you haven't
# macOS: brew install gh
# Or visit: https://cli.github.com/

# Login to GitHub
gh auth login

# Run the setup script
./scripts/setup-branch-protection.sh
```

#### Option B: Manual Setup via GitHub UI

1. Go to your repository on GitHub
2. Navigate to **Settings** → **Branches**
3. Click **Add rule** for branch name pattern `main`
4. Enable these settings:

   **Required:**
   - ✅ Require a pull request before merging
     - Required approvals: 1
     - Dismiss stale pull request approvals when new commits are pushed
     - Require review from Code Owners
   
   - ✅ Require status checks to pass before merging
     - Require branches to be up to date before merging
     - Status checks required:
       - `CI Success`
       - `Validate`
       - `Lint`
       - `Build`
       - `Test`
       - `PR Validation`
       - `Code Analysis`
   
   - ✅ Require conversation resolution before merging
   - ✅ Include administrators
   - ✅ Restrict who can push to matching branches (empty = only PRs)
   - ✅ Require linear history

   **Disabled:**
   - ❌ Allow force pushes
   - ❌ Allow deletions

5. Click **Create** or **Save changes**

## 🔄 Development Workflow

### Creating a Feature Branch

```bash
# Create and switch to a new branch
git checkout -b feature/your-feature-name

# Make your changes
# ... edit files ...

# Commit your changes
git add .
git commit -m "feat: Add your feature description"

# Push to GitHub
git push origin feature/your-feature-name
```

### Creating a Pull Request

1. Go to GitHub and click "Create Pull Request"
2. Fill out the PR template with:
   - Clear description of changes
   - Type of change
   - Testing performed
   - Screenshots (if UI changes)
3. Link related issues using keywords:
   - `Closes #123`
   - `Fixes #456`
   - `Related to #789`
4. Request reviews from team members
5. Wait for CI checks to pass

### Merging a PR

1. Ensure all required checks pass ✅
2. Get required approvals (1 minimum)
3. Resolve all conversations
4. Click "Squash and merge" (recommended for clean history)
5. Delete the feature branch after merging

## 🛡️ What's Protected

With branch protection enabled:

- ❌ **Cannot** push directly to `main`
- ❌ **Cannot** force push to `main`
- ❌ **Cannot** delete `main`
- ❌ **Cannot** merge failing PRs
- ❌ **Cannot** merge without approvals
- ✅ **Must** use pull requests
- ✅ **Must** pass all CI checks
- ✅ **Must** get code review approval
- ✅ **Must** resolve all review comments

## 🧪 Testing the Setup

### Test 1: Try Direct Push (Should Fail)

```bash
# On main branch
git checkout main
echo "test" >> test.txt
git add test.txt
git commit -m "test: direct push"
git push origin main
# ❌ Should be rejected by GitHub
```

### Test 2: Create a PR (Should Work)

```bash
# Create feature branch
git checkout -b test/ci-setup

# Make a change
echo "# Test" >> TEST.md
git add TEST.md
git commit -m "test: Verify CI/CD setup"

# Push and create PR
git push origin test/ci-setup
# Then create PR on GitHub
# ✅ Should trigger all CI workflows
```

## 📊 Monitoring CI/CD

### View Workflow Runs

1. Go to your repository on GitHub
2. Click the **Actions** tab
3. See all workflow runs and their status

### Debugging Failed Checks

If a check fails:

1. Click on the failed workflow run
2. Click on the failed job
3. Expand the failed step to see logs
4. Fix the issue locally
5. Push new commits to your PR branch
6. Workflows will automatically re-run

## 🔐 Security Features

### CodeQL Analysis
- Scans for security vulnerabilities
- Runs on every PR and push to main
- Finds common security issues

### Secret Scanning
- Detects accidentally committed secrets
- API keys, tokens, passwords
- Runs on every push

### Dependency Scanning
- Checks for vulnerable dependencies
- Reviews new dependencies in PRs
- Weekly automated scans

## 🎨 Customization

### Adding More Status Checks

Edit `.github/workflows/ci.yml` to add more jobs, then update branch protection to require them.

### Changing Required Approvals

In GitHub Settings → Branches → Edit rule:
- Change "Required number of approvals before merging"

### Adding More Reviewers

Edit `.github/CODEOWNERS` to add team members:

```
# Add teams or users
*       @your-team @user1 @user2

# Path-specific owners
/apps/api/      @backend-team
```

### Custom PR Template

Edit `.github/pull_request_template.md` to customize the PR template.

## 📚 Additional Resources

- [GitHub Branch Protection Documentation](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-protected-branches)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Nx Affected Commands](https://nx.dev/concepts/affected)
- [GitHub CLI Documentation](https://cli.github.com/manual/)

## 🆘 Troubleshooting

### "Required status checks not found"

This happens when CI workflows haven't run yet. Solutions:
1. Create a test PR first to trigger workflows
2. Wait for workflows to run at least once
3. Then enable status checks in branch protection

### "Cannot push to protected branch"

This is expected! Use the PR workflow:
1. Create a feature branch
2. Push to feature branch
3. Open a PR to main

### Workflows not running

Check:
1. `.github/workflows/` files are committed
2. Workflows are in the correct directory
3. YAML syntax is valid
4. Repository has Actions enabled (Settings → Actions)

## ✨ Benefits

With this setup, you get:

- ✅ **Code Quality**: Automated linting and testing
- ✅ **Security**: Vulnerability scanning and secret detection
- ✅ **Collaboration**: Structured PR process with reviews
- ✅ **Clean History**: Linear git history via squash merges
- ✅ **Documentation**: PR templates and automated checks
- ✅ **Confidence**: Can't merge broken code
- ✅ **Best Practices**: Industry-standard CI/CD pipeline

## 🎯 Next Steps

1. ✅ Run verification: `./scripts/verify-ci-setup.sh`
2. ✅ Commit and push to GitHub
3. ✅ Set up branch protection: `./scripts/setup-branch-protection.sh`
4. ✅ Create a test PR to verify everything works
5. ✅ Add team members as collaborators
6. ✅ Start building features with confidence!

---

**Need help?** Check `.github/BRANCH_PROTECTION.md` for detailed configuration options.

