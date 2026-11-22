---
name: integrate
description: Merge a finished branch into dev the way this repository does it - checks, signed commits, plain commit messages, a no-ff merge commit, the development plan update, then a push only with Chris's approval. Use when Chris asks to integrate, merge or land a branch.
---

# Integrate a branch into `dev`

Only when Chris asks, and for the branch he names. AGENTS.md ("Branches and commits") holds the rules;
this is the sequence. Stop and report at the first step that fails.

## 1. Ready to merge

```sh
git fetch origin
git status --short                      # clean
git switch <branch>
git merge-base --is-ancestor dev HEAD   # the branch contains current dev
```

- If `dev` has moved on and the branch was never pushed, rebase it onto `dev`
  (`git rebase dev`, then re-run its checks). If it was pushed, ask Chris how to bring it up to date.
- Stop any `shopify theme dev` you started before switching branches; a running preview uploads whatever
  the checkout holds.

## 2. Checks on the branch tip

- `npm run check:all` passes, with only the known Horizon warnings listed in `README.md`.
- Storefront changes have rendered evidence (the `rendered-check` skill), and shared, user-facing or
  hard-to-reverse changes have had an independent review. Report anything not run.

## 3. Commits and text

```sh
git log --format='%G? %h %s' dev..<branch>    # every line starts with G
git diff dev...<branch> -- . ':!docs/development-plan.md' ':!AGENTS.md' ':!CLAUDE.md' ':!.github' ':!.agents' ':!.claude' \
  | grep -nE '^\+.*\b([GTQ][0-9]{1,2}|S[1-6])\b|^\+.*\b(approved|Gamma-Dev|fixture)\b'   # no output
```

- Subjects are short and plain, with no body, plan ID, "Record …" or jargon. Fix problems on the branch
  (reword or amend unpushed commits) before merging.
- A commit that isn't `G` was made without the repository's signing settings; re-sign it with
  `git commit --amend --no-edit` (or `git rebase --exec 'git commit --amend --no-edit' dev`) while the
  branch is unpushed.

## 4. Merge

```sh
git switch dev
git merge --no-ff <branch> --no-edit     # "Merge branch '<branch>' into dev"
git log --format='%G? %h %s' -1          # G
```

Never fast-forward, squash or rebase `dev` itself.

## 5. Development plan

If the branch is a row in `docs/development-plan.md`, update that row's state and the "State on …"
paragraph (what was integrated, the branch's last commit and the merge), and commit it on `dev` as
"Update development plan". Another branch is recorded there only when it changes a feature's status or a
decision. Cite commits by their short hashes in backticks.

## 6. Push

Run `npm run check:all` on `dev`, then ask Chris to approve the push, naming both refs. During
development a push to `dev` updates Primary's password-protected published theme; after release it no
longer reaches the live store (AGENTS.md, "Project"). With approval:

```sh
git push origin dev <branch>
```

Never force-push here. Report the merge commit, the checks and anything still untested.
