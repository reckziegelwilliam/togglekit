# 🔒 Branch Protection & CI/CD Architecture

## Overview Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         Developer Workflow                       │
└─────────────────────────────────────────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────┐
│  1. Create Feature Branch                                        │
│     git checkout -b feature/my-feature                          │
└─────────────────────────────────────────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────┐
│  2. Make Changes & Commit                                        │
│     git commit -m "feat: Add new feature"                       │
└─────────────────────────────────────────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────┐
│  3. Push to GitHub                                               │
│     git push origin feature/my-feature                          │
└─────────────────────────────────────────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────┐
│  4. Create Pull Request                                          │
│     • PR template auto-fills                                    │
│     • CODEOWNERS auto-assigned                                  │
└─────────────────────────────────────────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────┐
│                    GitHub Actions Triggered                      │
└─────────────────────────────────────────────────────────────────┘
                                  │
                    ┌─────────────┼─────────────┐
                    ▼             ▼             ▼
         ┌──────────────┐  ┌──────────┐  ┌──────────────┐
         │   CI (5min)  │  │PR Checks │  │Code Quality  │
         │              │  │  (1min)  │  │   (2min)     │
         │ • Validate   │  │          │  │              │
         │ • Lint       │  │• Title   │  │• Analysis    │
         │ • Build      │  │• Desc    │  │• Deps        │
         │ • Test       │  │• Conflict│  │• TODOs       │
         │ • Security   │  │          │  │              │
         └──────┬───────┘  └────┬─────┘  └──────┬───────┘
                │               │                │
                └───────────────┼────────────────┘
                                ▼
                    ┌───────────────────────┐
                    │  Security (15min)     │
                    │                       │
                    │  • CodeQL             │
                    │  • Secret Scan        │
                    │  • NPM Audit          │
                    └───────────┬───────────┘
                                │
                                ▼
                ┌───────────────────────────────┐
                │   All Checks Pass? ✅          │
                │                                │
                │   Yes → Ready for Review       │
                │   No  → Fix Issues & Push      │
                └───────────────┬───────────────┘
                                │
                                ▼
                ┌───────────────────────────────┐
                │  Code Review                   │
                │                                │
                │  • Reviewer assigned           │
                │  • Feedback provided           │
                │  • Changes requested/approved  │
                └───────────────┬───────────────┘
                                │
                                ▼
                ┌───────────────────────────────┐
                │  Branch Protection Checks      │
                │                                │
                │  ✅ CI Success                 │
                │  ✅ 1+ Approval                │
                │  ✅ Conversations resolved     │
                │  ✅ Branch up to date          │
                └───────────────┬───────────────┘
                                │
                                ▼
                ┌───────────────────────────────┐
                │  Merge to Main                 │
                │                                │
                │  • Squash & Merge              │
                │  • Clean commit history        │
                │  • Delete feature branch       │
                └───────────────┬───────────────┘
                                │
                                ▼
                        ┌───────────────┐
                        │  CI Runs on   │
                        │  Main Branch  │
                        │               │
                        │  Final Check  │
                        └───────────────┘
```

## Workflow Files Structure

```
.github/
├── workflows/
│   ├── ci.yml              # Main CI pipeline
│   ├── pr-checks.yml       # PR validation
│   ├── code-quality.yml    # Code analysis
│   └── security.yml        # Security scans
├── BRANCH_PROTECTION.md    # Setup guide
├── CODEOWNERS              # Auto-assign reviewers
└── pull_request_template.md # PR template
```

## CI Pipeline Jobs (ci.yml)

```
┌────────────────────────────────────────────────┐
│              CI Workflow (Parallel)            │
└────────────────────────────────────────────────┘

    ┌─────────────┐
    │  Validate   │  (10 min timeout)
    │             │
    │ • Setup     │
    │ • Install   │
    │ • Format    │
    │ • TS Check  │
    └──────┬──────┘
           │
    ┌──────┴───────────────────┬──────────────┐
    ▼                          ▼              ▼
┌────────┐              ┌──────────┐    ┌──────────┐
│  Lint  │              │  Build   │    │   Test   │
│        │              │          │    │          │
│ 15 min │              │  20 min  │    │  20 min  │
└────────┘              └──────────┘    └──────────┘
    │                          │              │
    └──────────────┬───────────┴──────────────┘
                   ▼
            ┌─────────────┐
            │  Security   │
            │             │
            │  10 min     │
            └──────┬──────┘
                   ▼
            ┌─────────────┐
            │ CI Success  │  ← Required for merge
            │             │
            │ Final Check │
            └─────────────┘
```

## Branch Protection Rules

```
┌─────────────────────────────────────────────────────────┐
│                 Protected: main branch                  │
└─────────────────────────────────────────────────────────┘

Require Pull Request Reviews:
  ✅ Required approvals: 1
  ✅ Dismiss stale reviews
  ✅ Code owner review
  ✅ Include administrators

Require Status Checks:
  ✅ Branch must be up to date
  ✅ CI Success
  ✅ Validate
  ✅ Lint
  ✅ Build
  ✅ Test
  ✅ PR Validation
  ✅ Code Analysis

Additional Rules:
  ✅ Require conversation resolution
  ✅ Require linear history
  ❌ NO force pushes
  ❌ NO branch deletion
  ✅ Applies to administrators
```

## Security Layers

```
┌─────────────────────────────────────────────────┐
│            Security Scanning Layers             │
└─────────────────────────────────────────────────┘

Layer 1: Code Analysis
  • CodeQL static analysis
  • JavaScript/TypeScript scanning
  • Security vulnerability detection

Layer 2: Secret Detection
  • TruffleHog scanning
  • API key detection
  • Token/password detection

Layer 3: Dependency Audit
  • NPM vulnerability check
  • Known CVE detection
  • License compliance

Layer 4: Continuous Monitoring
  • Weekly scheduled scans
  • PR-triggered scans
  • Main branch scans
```

## Typical PR Timeline

```
┌─────────────────────────────────────────────────┐
│              PR Lifecycle                       │
└─────────────────────────────────────────────────┘

Time: 0m     │  Developer creates PR
             │  ✓ Template applied
             │  ✓ Reviewers assigned
             │
Time: +1m    │  PR Checks complete
             │  ✓ Title validated
             │  ✓ No conflicts
             │
Time: +2m    │  Code Quality complete
             │  ✓ Analysis done
             │  ✓ Dependencies reviewed
             │
Time: +5m    │  CI Pipeline complete
             │  ✓ Lint passed
             │  ✓ Build succeeded
             │  ✓ Tests passed
             │
Time: +15m   │  Security scans complete
             │  ⚠ Advisory only (non-blocking)
             │
Time: +Xm    │  Code review
             │  👤 Reviewer feedback
             │  🔄 Changes requested
             │
Time: +Ym    │  Final approval
             │  ✅ All checks passed
             │  ✅ Approved by reviewer
             │  ✅ Ready to merge
             │
Time: Final  │  Merged to main
             │  🎉 Feature deployed
             │  🗑️ Branch deleted
```

## Key Features

### ⚡ Performance
- Parallel job execution
- Affected-only builds/tests (Nx)
- Caching for dependencies
- Optimized checkout

### 🛡️ Security
- Multiple scanning layers
- Weekly automated checks
- Secret detection
- Vulnerability alerts

### 📊 Quality
- Automated linting
- Type checking
- Test coverage
- Code analysis

### 👥 Collaboration
- Auto-assigned reviewers
- PR templates
- Clear guidelines
- Conversation resolution

### 🚫 Prevention
- No direct pushes to main
- No force pushes
- No unreviewed code
- No failing tests

## Status Check Requirements

```
For a PR to be mergeable, ALL of these must pass:

✅ CI Success          (Aggregate of all CI jobs)
✅ Validate           (Basic validation)
✅ Lint               (Code style)
✅ Build              (Compilation)
✅ Test               (Unit tests)
✅ PR Validation      (PR metadata)
✅ Code Analysis      (Quality checks)
✅ 1+ Approval        (Code review)
✅ Conversations      (All resolved)
✅ Up to date         (No conflicts)

⚠️  Security checks run but are advisory only
```

## Common Scenarios

### Scenario 1: Hotfix

```
1. Create branch: git checkout -b hotfix/critical-bug
2. Fix the bug
3. Push and create PR with [HOTFIX] tag
4. Get expedited review
5. All checks must still pass
6. Merge ASAP
```

### Scenario 2: Breaking Change

```
1. Create branch: git checkout -b breaking/api-change
2. Make changes
3. Update documentation
4. Add migration guide
5. Get extra reviews
6. Merge with major version bump
```

### Scenario 3: Failed Check

```
1. PR created
2. Build fails ❌
3. View logs in Actions tab
4. Fix locally
5. Push new commit
6. Checks re-run automatically
7. Proceed with review
```

## Emergency Procedures

### If CI is Broken

```
1. Check Actions tab for errors
2. Review recent changes to workflows
3. Fix workflow files
4. Temporary: disable specific checks (not recommended)
5. Use [skip ci] in commit message (emergencies only)
```

### If Branch Protection is Too Strict

```
1. Go to Settings → Branches
2. Edit the rule
3. Temporarily disable specific checks
4. Merge emergency fix
5. Re-enable checks
6. Post-mortem on what happened
```

## Metrics to Monitor

```
📊 Track these metrics:

• PR merge time (target: < 24h)
• CI duration (target: < 10m)
• Test coverage (target: > 80%)
• Security vulnerabilities (target: 0)
• Failed PR ratio (target: < 10%)
• Code review time (target: < 4h)
```

## Next Evolution

```
Future enhancements to consider:

• Automated version bumping
• Changelog generation
• Deployment workflows
• Performance benchmarks
• Visual regression testing
• E2E test integration
• Release automation
• Slack/Discord notifications
```

