# Branch Protection Configuration

This document outlines the recommended branch protection settings for the `main` branch to ensure code quality and security.

## 🔒 Required GitHub Branch Protection Settings

### Access the Settings:
1. Go to your repository on GitHub
2. Navigate to **Settings** → **Branches**
3. Click **Add rule** or edit the existing rule for `main`

### Recommended Protection Rules:

#### ✅ **Require Pull Request Reviews Before Merging**
- **Required approvals**: 1 (or more for critical projects)
- ☑️ Dismiss stale pull request approvals when new commits are pushed
- ☑️ Require review from Code Owners (if you have a CODEOWNERS file)
- ☐ Require approval of the most recent reviewable push
- ☐ Restrict who can dismiss pull request reviews (optional)

#### ✅ **Require Status Checks to Pass Before Merging**
- ☑️ Require branches to be up to date before merging
- **Required status checks** (add these):
  - `CI Success` (from ci.yml)
  - `Validate` (from ci.yml)
  - `Lint` (from ci.yml)
  - `Build` (from ci.yml)
  - `Test` (from ci.yml)
  - `PR Validation` (from pr-checks.yml)
  - `Code Analysis` (from code-quality.yml)
  - `CodeQL Analysis` (from security.yml) - optional but recommended

#### ✅ **Require Conversation Resolution Before Merging**
- ☑️ Require conversation resolution before merging
  - This ensures all review comments are addressed

#### ✅ **Require Signed Commits** (Optional but Recommended)
- ☑️ Require signed commits
  - Enhances security by verifying commit authenticity

#### ✅ **Require Linear History** (Optional)
- ☑️ Require linear history
  - Keeps git history clean (prevents merge commits)
  - Alternative: Allow merge commits if you prefer

#### ✅ **Include Administrators**
- ☑️ Include administrators
  - Even admins must follow these rules

#### ✅ **Restrict Who Can Push to Matching Branches**
- ☑️ Restrict pushes that create matching branches
- Add only CI/CD service accounts if needed
- **Do not add individual developers** - they should use PRs

#### ✅ **Allow Force Pushes**
- ☐ Do **NOT** allow force pushes
  - Protects against accidental history rewrites

#### ✅ **Allow Deletions**
- ☐ Do **NOT** allow deletions
  - Prevents accidental branch deletion

---

## 🚀 Quick Setup Script

You can also use the GitHub CLI to set this up:

```bash
# Install GitHub CLI if you haven't: https://cli.github.com/

gh api repos/{owner}/{repo}/branches/main/protection \
  --method PUT \
  --field required_status_checks='{"strict":true,"contexts":["CI Success","Validate","Lint","Build","Test","PR Validation","Code Analysis"]}' \
  --field enforce_admins=true \
  --field required_pull_request_reviews='{"dismissal_restrictions":{},"dismiss_stale_reviews":true,"require_code_owner_reviews":false,"required_approving_review_count":1}' \
  --field restrictions=null \
  --field required_linear_history=true \
  --field allow_force_pushes=false \
  --field allow_deletions=false \
  --field required_conversation_resolution=true
```

**Note**: Replace `{owner}/{repo}` with your GitHub username and repository name.

---

## 📋 Verification Checklist

After setting up branch protection:

- [ ] Try to push directly to `main` - should be blocked
- [ ] Create a test PR from a feature branch
- [ ] Verify CI workflows run automatically
- [ ] Try to merge before CI completes - should be blocked
- [ ] Try to merge without approval (if required) - should be blocked
- [ ] Verify merge is successful after approval and CI passes

---

## 🔄 CI/CD Workflows Overview

### 1. **CI Workflow** (`ci.yml`)
- Runs on every push and PR
- Jobs: Validate, Lint, Build, Test, Security
- Required for merge

### 2. **PR Checks** (`pr-checks.yml`)
- Validates PR title and description
- Checks for merge conflicts
- Ensures proper base branch

### 3. **Code Quality** (`code-quality.yml`)
- Code analysis
- Dependency review
- Checks for console.logs, TODOs

### 4. **Security** (`security.yml`)
- CodeQL analysis
- Secret scanning
- NPM security audit
- Runs weekly and on every PR

---

## 🎯 Best Practices

### For Developers:
1. **Always work in feature branches**
   ```bash
   git checkout -b feature/my-new-feature
   ```

2. **Keep your branch up to date**
   ```bash
   git fetch origin
   git rebase origin/main
   ```

3. **Push your feature branch**
   ```bash
   git push origin feature/my-new-feature
   ```

4. **Create a PR on GitHub**
   - Use a descriptive title
   - Add a detailed description
   - Link related issues
   - Request reviews from team members

5. **Address review comments**
   - Make requested changes
   - Push new commits
   - Mark conversations as resolved

6. **Merge when ready**
   - Ensure all CI checks pass
   - Get required approvals
   - Use "Squash and merge" for clean history (recommended)

### For Reviewers:
1. Review code thoroughly
2. Test locally if needed
3. Leave constructive feedback
4. Approve only when satisfied
5. Ensure CI passes before approving

---

## 🛠️ Additional Recommendations

### Create a CODEOWNERS file
Create `.github/CODEOWNERS` to auto-assign reviewers:

```
# Default owners for everything
*       @your-team

# Specific paths
/apps/api/              @backend-team
/apps/dashboard/        @frontend-team
/packages/              @platform-team
*.md                    @docs-team
```

### Create PR templates
Create `.github/pull_request_template.md`:

```markdown
## Description
<!-- Describe your changes -->

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
<!-- How was this tested? -->

## Checklist
- [ ] Code follows project style guidelines
- [ ] Self-review completed
- [ ] Comments added for complex code
- [ ] Documentation updated
- [ ] No new warnings
- [ ] Tests added/updated
- [ ] All tests pass
```

---

## 📞 Support

If you encounter issues with CI/CD or branch protection:
1. Check the Actions tab for detailed logs
2. Review this documentation
3. Contact the team lead or DevOps

## 🔗 Useful Links

- [GitHub Branch Protection](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-protected-branches)
- [GitHub Actions](https://docs.github.com/en/actions)
- [Nx Affected Commands](https://nx.dev/concepts/affected)

