## Agent skills

### Issue tracker

Issues live in GitHub Issues (JKrupinski/mageless), via the `gh` CLI. See `docs/agents/issue-tracker.md`.

### Triage labels

Default label vocabulary: `needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`. See `docs/agents/triage-labels.md`.

### Domain docs

Single-context layout (`CONTEXT.md` + `docs/adr/` at the repo root). See `docs/agents/domain.md`.

## Git

A pushed commit is history: fix it with a new commit on top, never with `git commit --amend` or a rebase that rewrites it. Amend only a commit that exists nowhere but locally, which is when `git branch -r --contains <commit>` prints nothing.
