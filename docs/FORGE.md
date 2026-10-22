# Forge runs: branches, commits, telemetry

## Branches
- `main`: only working code. A forge run lands here as **one squashed commit**, and only when its last
  eval says `MVP_COMPLETE` and every automated check passes.
- `forge/run-<run-id>`: everything a run does: one commit per Forge step, work-in-progress
  snapshots every 2 min, and the run's telemetry under `.forge-runs/<run-id>/`.
  A failed run stays here for review; nothing reaches `main`.

`<run-id>` = `YYYYMMDD-HHMM-<task-slug>` (UTC), e.g. `20261022-0609-style-bundles`.

## Commit messages
```
forge(<run-id>): <phase> <status> <m>m<ss>s, <n> steps, files +A ~M -D, checks P/T[, VERDICT]

Agent: <health>; ended: <task_complete|gave_up_no_tool_format|cut_off_or_crashed>
Failing checks: <names>

 src/... | diff stat

Forge-Run: <run-id>
Forge-Phase: build-r2
Forge-Round: 2
Forge-Status: success | gave_up | timeout | failed
Forge-Trace: <forge trace id>
Forge-Checks: 3/5
Forge-Verdict: CONTINUE | MVP_COMPLETE | UNREADABLE | -
Forge-Agent-Health: ok | degraded: <what>
Forge-Telemetry: .forge-runs/<run-id>/04-build-r2/
```
WIP snapshots use `forge(<run-id>): wip <phase> <seconds>s`. The merge to `main` is
`forge(<run-id>): merge to main - MVP_COMPLETE, ...`.

Search with trailers, e.g. `git log --all --grep "Forge-Status: gave_up"`.

## Telemetry
The same record lives on the droplet (`/opt/forge-telemetry/runs/<run-id>/`) and on the run branch
(`.forge-runs/<run-id>/`):

| File | What |
|---|---|
| `RUN.md` / `run.json` | task, args, timing, outcome, merged-to-main, a table of every step |
| `DESIGN.md` | the design doc the run was given |
| `NN-<phase>/task.md` | full instructions the agent received |
| `NN-<phase>/agent.log` | the agent's whole transcript |
| `NN-<phase>/stats.json` | agent health: tool calls and failures, plain-text / stale / echoed replies, write and append sizes, how it ended |
| `NN-<phase>/checks.json`, `files.json`, `diff.stat` | automated checks, build inventory (sizes + hashes), what changed |
| `NN-<phase>/plan.md`, `eval.md` | the plan or evaluation the agent wrote |

Raw Forge transcripts also stay at `/opt/forge-telemetry/logs/<trace>.log`, and the orchestrator log at
`/opt/forge-telemetry/orchestrator.log`.

See `docs/postmortems/` for why this exists.
