#!/usr/bin/env bash
# Format this checkout and push it, or fail `deno fmt --check`.
#
# The decision lives in scripts/ci-format.ts. This script is the part that
# touches git. Run it from a clean checkout. On the push path the remote is
# `origin` and the destination is refs/heads/$HEAD_REF.

set -euo pipefail

if [ -z "${GITHUB_OUTPUT:-}" ]; then
  echo "GITHUB_OUTPUT is required" >&2
  exit 1
fi

script_dir=$(CDPATH='' cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)

if ! git diff --quiet || ! git diff --cached --quiet; then
  echo "Refusing to format a dirty checkout." >&2
  exit 1
fi

author=$(git log -1 --format='%an')
subject=$(git log -1 --format='%s')
plan=$(
  HEAD_AUTHOR="$author" \
    HEAD_SUBJECT="$subject" \
    deno run --allow-env --quiet "$script_dir/ci-format.ts" --plan
)
sha=$(git rev-parse HEAD)

finish_unchanged() {
  {
    echo "pushed=false"
    echo "sha=$sha"
  } >> "$GITHUB_OUTPUT"
}

if [ "$plan" = "check" ]; then
  deno fmt --check
  finish_unchanged
  exit 0
fi

if [ "$plan" != "format-and-push" ]; then
  echo "Unexpected format plan: $plan" >&2
  exit 1
fi

# The plan already refuses the default branch. Repeat it here so a bug in the
# plan cannot push formatting onto the branch this repository releases from.
if [ -z "${HEAD_REF:-}" ] || [ -z "${DEFAULT_BRANCH:-}" ] ||
  [ "$HEAD_REF" = "$DEFAULT_BRANCH" ]; then
  echo "Refusing to push formatting to '${HEAD_REF:-}'." >&2
  deno fmt --check
  exit 1
fi

deno fmt
deno fmt --check

if git diff --quiet; then
  finish_unchanged
  exit 0
fi

bot=$(deno run --quiet "$script_dir/ci-format.ts" --bot)
email=$(deno run --quiet "$script_dir/ci-format.ts" --email)
message=$(deno run --quiet "$script_dir/ci-format.ts" --message)

git config user.name "$bot"
git config user.email "$email"
git add -u
git -c core.hooksPath=/dev/null -c commit.gpgsign=false commit -m "$message"

export GIT_TERMINAL_PROMPT=0
if git push origin "HEAD:refs/heads/${HEAD_REF}"; then
  {
    echo "pushed=true"
    echo "sha=$(git rev-parse HEAD)"
  } >> "$GITHUB_OUTPUT"
else
  echo "Could not push formatting to ${HEAD_REF}. Failing deno fmt --check." >&2
  git reset --hard HEAD~1
  deno fmt --check
fi
