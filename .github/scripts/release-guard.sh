#!/usr/bin/env bash
# Decides whether a release may replace the live branch. It may when the branch has no admin
# changes since the last release, or when its head is the commit named by the newest
# live-reviewed/<date> tag and GitHub verifies that tag's signature for a reviewer.
# Writes live_sha to $GITHUB_OUTPUT. Otherwise it comments on the admin-changes issue and fails.
set -euo pipefail

live=${LIVE_BRANCH:?}
main_sha=${MAIN_SHA:?}
repo=${GITHUB_REPOSITORY:?}
reviewers=${REVIEWER_EMAILS:-}
title="Admin changes on $live"

stop() {
  echo "::error::$1"
  local number
  number=$(gh issue list --repo "$repo" --label live-edits --state open --limit 100 --json number,title \
    --jq "map(select(.title == \"$title\")) | first | .number // empty")
  if [ -n "$number" ]; then
    gh issue comment "$number" --repo "$repo" --body "$(printf 'The release of `%s` stopped and left `%s` unchanged: %s\n\n%s\n' \
      "$(git rev-parse --short "$main_sha")" "$live" "$1" "${2:-}")" >/dev/null
  fi
  exit 1
}

list() {
  git log --reverse --format='- `%h` %s' "$1"
}

if ! git fetch --quiet --tags origin "+refs/heads/$live:refs/remotes/origin/$live" 2>/dev/null; then
  echo "::error::There is no $live branch. It is created from main at the cutover."
  exit 1
fi
live_sha=$(git rev-parse "origin/$live")

git fetch --quiet origin "+refs/heads/main:refs/remotes/origin/main"
if [ "$(git rev-parse origin/main)" != "$main_sha" ]; then
  echo "::error::main has moved on since this run started; release the current main instead."
  exit 1
fi
base=$(git merge-base "$main_sha" "$live_sha")

if git merge-base --is-ancestor "$live_sha" "$main_sha"; then
  echo "$live has no admin changes since the last release."
  echo "live_sha=$live_sha" >>"${GITHUB_OUTPUT:-/dev/null}"
  exit 0
fi

tag=$(git for-each-ref --sort=-creatordate --count=1 --format='%(refname:short)' 'refs/tags/live-reviewed/*')
if [ -z "$tag" ]; then
  stop "$live has admin changes and no live-reviewed tag." "$(list "$base..$live_sha")"
fi

target=$(git rev-parse "$tag^{commit}")
if [ "$target" != "$live_sha" ]; then
  if git merge-base --is-ancestor "$target" "$live_sha"; then
    stop "$live has admin changes made after the review tagged $tag." "$(list "$target..$live_sha")"
  fi
  stop "The newest review tag, $tag, isn't on $live." "$(list "$base..$live_sha")"
fi

ref=$(gh api "repos/$repo/git/ref/tags/$tag" --jq '.object.type + " " + .object.sha') || stop "GitHub's API didn't return $tag."
read -r type object <<<"$ref"
if [ "$type" != tag ]; then
  stop "$tag isn't a signed annotated tag."
fi
# GitHub verifies a signature only when the tagger's address is a verified address of the key's owner.
signed=$(gh api "repos/$repo/git/tags/$object" --jq '"\(.verification.verified) \(.tagger.email | ascii_downcase)"') \
  || stop "GitHub's API didn't return the tag object of $tag."
read -r verified email <<<"$signed"
if [ "$verified" != true ]; then
  stop "GitHub doesn't verify the signature of $tag."
fi
reviewers=$(tr '[:upper:]' '[:lower:]' <<<"${reviewers// /}")
if ! [[ ",$reviewers," == *",$email,"* ]]; then
  stop "$tag wasn't signed by a reviewer listed in LIVE_REVIEWER_EMAILS."
fi

echo "$live was reviewed up to $tag."
echo "live_sha=$live_sha" >>"${GITHUB_OUTPUT:-/dev/null}"
