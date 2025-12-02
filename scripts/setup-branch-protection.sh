#!/bin/bash

# Branch Protection Setup Script
# This script helps set up branch protection rules for the main branch
# Requires: GitHub CLI (gh) - Install from https://cli.github.com/

set -e

echo "🔒 Toggle Kit - Branch Protection Setup"
echo "========================================"
echo ""

# Check if gh is installed
if ! command -v gh &> /dev/null; then
    echo "❌ GitHub CLI (gh) is not installed."
    echo "📥 Install it from: https://cli.github.com/"
    echo "   macOS: brew install gh"
    echo "   Linux: Check your package manager"
    echo "   Windows: Check the GitHub CLI website"
    exit 1
fi

# Check if logged in
if ! gh auth status &> /dev/null; then
    echo "🔐 Not logged in to GitHub CLI"
    echo "Please run: gh auth login"
    exit 1
fi

echo "✅ GitHub CLI is installed and authenticated"
echo ""

# Get repository info
REPO=$(gh repo view --json nameWithOwner -q .nameWithOwner)
if [ -z "$REPO" ]; then
    echo "❌ Could not detect repository. Are you in a git repository?"
    exit 1
fi

echo "📦 Repository: $REPO"
echo ""

# Confirm with user
read -p "Do you want to set up branch protection for 'main'? (y/n) " -n 1 -r
echo ""
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "❌ Setup cancelled"
    exit 0
fi

echo ""
echo "🚀 Setting up branch protection rules..."
echo ""

# Create the branch protection rule
# Note: This requires admin access to the repository
gh api repos/$REPO/branches/main/protection \
  --method PUT \
  --field required_status_checks='{
    "strict": true,
    "contexts": [
      "CI Success",
      "Validate",
      "Lint", 
      "Build",
      "Test",
      "PR Validation",
      "Code Analysis"
    ]
  }' \
  --field enforce_admins=true \
  --field required_pull_request_reviews='{
    "dismiss_stale_reviews": true,
    "require_code_owner_reviews": true,
    "required_approving_review_count": 1
  }' \
  --field restrictions=null \
  --field required_linear_history=true \
  --field allow_force_pushes=false \
  --field allow_deletions=false \
  --field required_conversation_resolution=true \
  2>&1

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Branch protection rules applied successfully!"
    echo ""
    echo "📋 Summary of protection rules:"
    echo "   • Require pull request reviews (1 approval required)"
    echo "   • Require status checks to pass"
    echo "   • Dismiss stale reviews when new commits are pushed"
    echo "   • Require code owner reviews (via CODEOWNERS file)"
    echo "   • Require conversation resolution"
    echo "   • Require linear history"
    echo "   • Include administrators"
    echo "   • No force pushes allowed"
    echo "   • No deletions allowed"
    echo ""
    echo "🎯 Next steps:"
    echo "   1. Push your initial commit to main (if not done already)"
    echo "   2. Create a feature branch for your next changes"
    echo "   3. Open a PR to test the workflow"
    echo ""
    echo "📚 For more details, see: .github/BRANCH_PROTECTION.md"
else
    echo ""
    echo "❌ Failed to set up branch protection"
    echo ""
    echo "This could be because:"
    echo "   1. You don't have admin access to the repository"
    echo "   2. The repository doesn't exist yet on GitHub"
    echo "   3. The main branch doesn't exist yet"
    echo ""
    echo "🔧 Manual setup required:"
    echo "   1. Push your initial commit: git push -u origin main"
    echo "   2. Go to: https://github.com/$REPO/settings/branches"
    echo "   3. Click 'Add rule' and follow the guide in .github/BRANCH_PROTECTION.md"
    echo ""
    exit 1
fi

