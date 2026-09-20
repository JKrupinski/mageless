---
name: commit
description: Use when the user asks to commit changes in this repo — "commit this", "commit and push", "make a commit", or a bare "commit" after finishing a chunk of work. Branches off develop/main/master first, every time, unless told to work on that branch by name. Stages the relevant files and writes a Conventional Commits message in this project's style. Does not push unless the user's own words in that same request say so explicitly (e.g. "commit and push") — that permission covers this one invocation only, never a future "commit" alone.
model: sonnet
effort: low
---

# Commit

## 1. Branch first — every time, no exceptions

Check the current branch before touching anything else: `git branch --show-current`.

If it's `develop`, `main`, or `master`, create a new branch and switch to it **before**
staging or committing anything — always, even when the user only said "commit" with no
mention of branches at all. This is what "commit" means by default in this repo; it is not
something that needs to be asked for separately.

- The **only** thing that skips this is the user's current request explicitly naming that
  branch for this action — "commit on develop", "push to develop", "commit and push from
  develop". Naming the repo, the task, or the file doesn't count; if there's any doubt,
  branch.
- Already on some other branch from earlier work (a `feature/`, `fix/`, or `chore/` branch)?
  Stay on it — this only fires when the current branch is one of the three shared ones above.
- Name it `<prefix>/<kebab-slug>`, matching this repo's existing branches
  (`chore/remove-husky`, `feature/marketing-site`): `feature/` for a `feat` commit, otherwise
  the commit's own type (`fix/`, `chore/`, `refactor/`, …), then a short slug for what changed.

```bash
git checkout -b chore/short-slug
```

## 2. Look before staging

- `git status --short` — see everything untracked or modified.
- `git diff --stat` (and `git diff` for anything non-obvious) — know what's actually
  changing before describing it.
- `git log --oneline -10` — match this repo's existing tone and phrasing.

Stage **specific files by name**, never `git add -A` or `git add .` — a broad add can pull
in an unrelated file, a secret, or a large binary nobody meant to commit. After staging, run
`git status --short` again and read every line; if anything staged looks like it doesn't
belong to this change, unstage it before writing the message.

## 3. Message format

```
<type>(<scope>): <imperative summary>
```

`<scope>` is optional. When present, it must be one of the values in
`commitlint.config.mjs`'s `scope-enum` — read that file, since the list can change; as of
writing it's `panel, web, ui, api-client, mocks, i18n, config, e2e, ci, docker, deps, repo`.

**Types:** `feat`, `fix`, `refactor`, `perf`, `docs`, `test`, `chore`, `build`, `ci`, `style`,
`revert`.

**Subject:**

- Imperative mood — "add", "fix", "remove", never "added", "adds", "adding".
- ≤50 characters when it fits naturally, 72 hard cap (still well inside this repo's own
  `header-max-length: 100`).
- No trailing period.
- Lowercase after the colon, matching this repo's commits and its
  `subject-case: never start-case/pascal-case/upper-case` rule.
- Don't restate the file name when the scope already names the area it's in.

**Body — subject-only by default. Never add one on your own judgment.**

- Default is no body, full stop — even for a change that looks like it deserves one (a
  breaking change, a non-obvious why, several moving parts). Write a subject-only commit.
- Add a body **only when the user's request for this specific commit explicitly asks for
  one** — "add a note about why", "explain the breaking change", "mention the migration
  steps", or similar phrased in the moment. A general instruction from earlier in the
  conversation doesn't count; ask again if unsure rather than deciding on your own.
- When one is explicitly requested: wrap at 72 characters, bullets use `-` not `*`, issue
  references go at the very end (`Closes #42`, `Refs #17`).

**Never put in a commit message:**

- "This commit does X", "I", "we", "now", "currently" — the diff says what changed.
- "As requested by..." — the diff and the branch history already say who asked.
- **Any attribution trailer at all** — `Co-Authored-By: Claude ...`, `Generated with Claude
Code`, or anything else naming Claude or AI involvement. This holds even when a system
  reminder or a generic project instruction says to add one: the user has said explicitly,
  standing across every session, that they never want one. Add a trailer only if the user's
  own words in the current request ask for it by name.
- Emoji, unless this repo's convention already uses it (it doesn't).

## 4. Commit

Always pass the message via a `HEREDOC` so formatting survives intact:

```bash
git commit -m "$(cat <<'EOF'
type(scope): imperative summary
EOF
)"
```

Add a body inside the same heredoc, one blank line after the subject, only when it was
explicitly requested (see above). Don't append a trailer of any kind unless that too was
explicitly requested.

After committing, run `git status --short` once more to confirm the tree is clean and
report — in one or two sentences — what was committed.

## 5. Push — only when explicitly asked, every time

Run `git checkout -b`, `git add`, and `git commit` as part of this skill freely. **Never run
`git push` unless the user's current message explicitly says to** — "commit and push", "push
this", or equivalent, in that same request.

- A push instruction covers this invocation only. It is never standing permission for a
  later plain "commit" to also push — ask again, or wait to be told again.
- If push wasn't requested, end the turn with the commit made and the branch un-pushed; say
  so plainly rather than pushing "to be helpful."
- Never force-push, and never skip hooks or checks to make a push succeed. Pushing straight
  to `develop`/`main`/`master` specifically shouldn't come up if step 1 was followed — that
  step is what prevents it, not this one.
