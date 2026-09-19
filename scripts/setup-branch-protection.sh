#!/usr/bin/env bash
#
# One-time branch protection setup for `main`, using the GitHub REST API via
# `gh api`. Written for a human to run once repo admin access and a signed-in
# `gh` CLI exist — see docs/SETUP_CHECKLIST.md. This script is NOT run by any
# agent; running it changes who can merge to `main`.
#
# What it sets on `main`:
#   - pull requests required before merging
#   - at least 1 approving review
#   - a Code Owners review required (see .github/CODEOWNERS)
#   - the CI job from .github/workflows/ci.yml required and up to date
#   - signed commits required
#   - linear history required (no merge commits)
#   - force pushes blocked
#
# See docs/adr/0008-repository-guardrails-and-ci.md for why each of these.

set -euo pipefail

REPO="wwhitakerV/sundaybest"
BRANCH="main"
# Must match the job `name:` in .github/workflows/ci.yml exactly — GitHub
# matches required status checks by the check run's name, not the job id.
REQUIRED_CHECK="Validate"

if ! command -v gh >/dev/null 2>&1; then
  echo "error: gh CLI is required. See https://cli.github.com/" >&2
  exit 1
fi

if ! gh auth status >/dev/null 2>&1; then
  echo "error: not authenticated. Run 'gh auth login' as an account with admin on ${REPO}." >&2
  exit 1
fi

echo "Setting branch protection on ${REPO}@${BRANCH}..."

gh api \
  --method PUT \
  "repos/${REPO}/branches/${BRANCH}/protection" \
  --input - <<EOF
{
  "required_status_checks": {
    "strict": true,
    "checks": [{ "context": "${REQUIRED_CHECK}" }]
  },
  "enforce_admins": true,
  "required_pull_request_reviews": {
    "required_approving_review_count": 1,
    "require_code_owner_reviews": true,
    "dismiss_stale_reviews": true
  },
  "restrictions": null,
  "required_linear_history": true,
  "allow_force_pushes": false,
  "allow_deletions": false
}
EOF

echo "Enabling required signed commits..."

gh api \
  --method POST \
  "repos/${REPO}/branches/${BRANCH}/protection/required_signatures" \
  >/dev/null

echo "Done. Verify at: https://github.com/${REPO}/settings/branches"
