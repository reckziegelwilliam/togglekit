#!/bin/bash

# Verify CI/CD Setup Script
# This script checks that all CI/CD components are properly configured

set -e

echo "🔍 Toggle Kit - CI/CD Configuration Verification"
echo "==============================================="
echo ""

ERRORS=0
WARNINGS=0

# Function to check file exists
check_file() {
    if [ -f "$1" ]; then
        echo "✅ $1"
    else
        echo "❌ Missing: $1"
        ((ERRORS++))
    fi
}

# Function to check directory exists
check_dir() {
    if [ -d "$1" ]; then
        echo "✅ $1"
    else
        echo "❌ Missing directory: $1"
        ((ERRORS++))
    fi
}

echo "📁 Checking directory structure..."
check_dir ".github"
check_dir ".github/workflows"
echo ""

echo "📄 Checking workflow files..."
check_file ".github/workflows/ci.yml"
check_file ".github/workflows/pr-checks.yml"
check_file ".github/workflows/code-quality.yml"
check_file ".github/workflows/security.yml"
echo ""

echo "📋 Checking supporting files..."
check_file ".github/BRANCH_PROTECTION.md"
check_file ".github/pull_request_template.md"
check_file ".github/CODEOWNERS"
echo ""

echo "🔧 Checking configuration files..."
check_file "package.json"
check_file "pnpm-workspace.yaml"
check_file "nx.json"
check_file ".eslintrc.js"
echo ""

echo "📦 Checking package scripts..."
if [ -f "package.json" ]; then
    if grep -q '"lint"' package.json; then
        echo "✅ lint script found"
    else
        echo "⚠️  No lint script in package.json"
        ((WARNINGS++))
    fi
    
    if grep -q '"build"' package.json; then
        echo "✅ build script found"
    else
        echo "⚠️  No build script in package.json"
        ((WARNINGS++))
    fi
    
    if grep -q '"test"' package.json; then
        echo "✅ test script found"
    else
        echo "⚠️  No test script in package.json"
        ((WARNINGS++))
    fi
fi
echo ""

echo "🔍 Checking Git configuration..."
if [ -d ".git" ]; then
    echo "✅ Git repository initialized"
    
    # Check if remote is set
    if git remote -v | grep -q "origin"; then
        echo "✅ Git remote configured"
        REMOTE=$(git remote get-url origin)
        echo "   Remote: $REMOTE"
    else
        echo "⚠️  No git remote configured"
        echo "   Run: git remote add origin <your-repo-url>"
        ((WARNINGS++))
    fi
    
    # Check current branch
    CURRENT_BRANCH=$(git branch --show-current)
    if [ -n "$CURRENT_BRANCH" ]; then
        echo "✅ Current branch: $CURRENT_BRANCH"
    else
        echo "⚠️  No branch checked out (empty repository?)"
        ((WARNINGS++))
    fi
else
    echo "❌ Not a git repository"
    ((ERRORS++))
fi
echo ""

echo "🧪 Checking if workflows are valid..."
if command -v gh &> /dev/null; then
    echo "Validating workflows with GitHub CLI..."
    for workflow in .github/workflows/*.yml; do
        if [ -f "$workflow" ]; then
            echo "   Checking: $workflow"
            # Note: This is a basic check, full validation happens on GitHub
            if grep -q "name:" "$workflow" && grep -q "on:" "$workflow" && grep -q "jobs:" "$workflow"; then
                echo "   ✅ Basic structure valid"
            else
                echo "   ⚠️  Workflow structure might be invalid"
                ((WARNINGS++))
            fi
        fi
    done
else
    echo "⚠️  GitHub CLI not installed - skipping workflow validation"
    echo "   Install from: https://cli.github.com/"
    ((WARNINGS++))
fi
echo ""

echo "📊 Summary"
echo "=========="
echo "Errors: $ERRORS"
echo "Warnings: $WARNINGS"
echo ""

if [ $ERRORS -eq 0 ] && [ $WARNINGS -eq 0 ]; then
    echo "✅ All checks passed! Your CI/CD setup looks good."
    echo ""
    echo "🚀 Next steps:"
    echo "   1. Commit all changes: git add . && git commit -m 'Set up CI/CD'"
    echo "   2. Push to GitHub: git push origin main"
    echo "   3. Set up branch protection: ./scripts/setup-branch-protection.sh"
    echo "   4. Create a test PR to verify workflows"
    exit 0
elif [ $ERRORS -eq 0 ]; then
    echo "⚠️  Setup complete with warnings. Review the warnings above."
    exit 0
else
    echo "❌ Setup incomplete. Please fix the errors above."
    exit 1
fi

