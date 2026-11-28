#!/usr/bin/env bash
# Keeps one open issue listing the admin changes Shopify has committed to a live branch since the
# last release. Run by the admin-changes workflow; needs gh with issues: write.
set -euo pipefail

live=${LIVE_BRANCH:?}
repo=${GITHUB_REPOSITORY:?}
server=${GITHUB_SERVER_URL:-https://github.com}
before=${BEFORE_SHA:-}
label=live-edits
title="Admin changes on $live"

git fetch --quiet origin "+refs/heads/main:refs/remotes/origin/main" "+refs/heads/$live:refs/remotes/origin/$live"
base=$(git merge-base origin/main "origin/$live")
head=$(git rev-parse "origin/$live")

if [ "$base" = "$head" ]; then
  echo "$live has no commits since the last release."
  exit 0
fi

commits() {
  local c subject from
  for c in $(git rev-list --reverse "$1"); do
    subject=$(git log -1 --format=%s "$c")
    from=$(git log -1 --format=%b "$c" | grep -m1 -i 'committed from' || true)
    printf -- '- `%s` %s%s\n' "$(git rev-parse --short "$c")" "$subject" "${from:+ ($from)}"
  done
}

files() {
  local editor="" content="" code="" f
  while IFS= read -r f; do
    case $f in
      templates/* | config/settings_data.json | sections/*.json) editor+="- \`$f\`"$'\n' ;;
      locales/*) content+="- \`$f\`"$'\n' ;;
      *) code+="- \`$f\`"$'\n' ;;
    esac
  done < <(git diff --name-only "$base" "$head")
  [ -n "$editor" ] && printf '### Theme editor\n\n%s\n' "$editor"
  [ -n "$content" ] && printf '### Theme content\n\n%s\n' "$content"
  [ -n "$code" ] && printf '### Code\n\nCode edits in Admin should be rare; check each one.\n\n%s\n' "$code"
  return 0
}

body=$(
  printf 'Shopify has committed these admin changes to `%s` since the last release. A release won'\''t replace `%s` until they are reviewed and tagged `live-reviewed/<date>` (README, "Reviewing admin changes").\n\n' "$live" "$live"
  printf 'Compare: %s/%s/compare/main...%s\n\n### Commits\n\n%s\n\n' "$server" "$repo" "$live" "$(commits "$base..$head")"
  files
)

number=$(gh issue list --repo "$repo" --label "$label" --state open --limit 100 --json number,title \
  --jq "map(select(.title == \"$title\")) | first | .number // empty")

if [ -z "$number" ]; then
  gh label create "$label" --repo "$repo" --color d93f0b --description "Admin changes on a live branch" --force >/dev/null
  gh issue create --repo "$repo" --title "$title" --label "$label" --body "$body"
  exit 0
fi

gh issue edit "$number" --repo "$repo" --body "$body" >/dev/null

# Add the commits of this push as a comment, so each batch is notified.
if [ -n "$before" ] && git cat-file -e "$before^{commit}" 2>/dev/null && git merge-base --is-ancestor "$before" "$head" \
  && ! git merge-base --is-ancestor "$before" "$base"; then
  range="$before..$head"
else
  range="$base..$head"
fi
gh issue comment "$number" --repo "$repo" --body "$(printf 'New admin changes:\n\n%s\n' "$(commits "$range")")" >/dev/null
echo "Updated issue #$number."
