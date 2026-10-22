# Post-mortem: forge run "5 style bundles", 2026-10-22

**Summary:** An orchestrator run (01:31–03:15 ET, 1h44m, 3 build/eval rounds) was asked to add five page
styles to Frontend Remix. It produced a truncated `manifest.json`, an unparseable `content/style-engine.js`
and none of the 45 asset files, then pushed that to `main`. The extension stopped loading in Firefox.
The broken state was fixed by hand in `935b946`.

**Root cause in one line:** the planning and evaluation were good; the forge agent's chat I/O with
DeepSeek was not. Most replies were captured partially, repeated or echoed, so the builder could only
write in ~200-character fragments. It broke files mid-write, then gave up after three non-tool replies.
Meanwhile the orchestrator kept running rounds and published the broken result to `main` anyway.

Evidence: the orchestrator log, the 7 agent transcripts in `/opt/forge-telemetry/logs/`, and
`build/.forge/` (plan and task files). Numbers below were extracted from those transcripts.

## Timeline (ET)

| Time | Event |
|---|---|
| 01:31 | Launched twice 40 s apart. The first launch died; the second cleared the build folder. The build folder had the repo **cloned inside it** (`build/repo`), so phases committed a nested repo (`src/repo`, "50 artifacts") instead of code. |
| 01:53, 01:59 | Relaunched twice with `--keep-build`, `--max-rounds 3`, `--max-iterations 30`. |
| 01:59–02:09 | **Plan**: 31 steps, 10.5 min. Produced a solid plan (12 files in build order, message contract, checklist mapping). `write_file` failed on malformed arguments, so the agent wrote PLAN.md in `printf` chunks. |
| 02:09–02:27 | **Build r1**: 53 steps, 18 min. Wrote `manifest.json` once (168 bytes, cut mid-description). Built `style-engine.js` with 4 rewrites and 15 appends of 3–523 bytes. Steps 45 and 46 appended the **same 279-byte chunk twice**, giving the duplicate `applyStyle`. `node --check` failed and the agent saw it, then got 3 plain-text replies in a row and quit. |
| 02:27–02:39 | **Eval r1**: diagnosed every problem correctly (truncated manifest, the `\n` bug, the duplicate, missing functions, no assets, no popup UI). Verdict CONTINUE, with exactly the right next steps. |
| 02:39–02:47 | **Build r2**: 24 steps, **0 files written**. Spent everything re-reading the large existing files (`popup.js` 15 KB read 4×), then 3 plain-text replies, then quit. |
| 02:48–03:08 | **Eval r2**: hit the 20-min cutoff. Re-read `popup.css` 4×, then emitted a literal placeholder tool call `TOOL_NAME` 3× (rejected by the agent's security check). |
| 03:08–03:10 | **Build r3**: 5 steps, 2 min. Read its instructions and the design doc, then got **three identical 170-character replies** (a stale reply re-read), then quit. Nothing written. |
| 03:10–03:15 | **Eval r3**: no verdict produced (gave up after 3 plain-text replies). Round limit (3) reached. |
| 03:15 | Final checks failed (`manifest_json_valid`, `javascript_parses`), and the orchestrator **still pushed to `main`**. |

## Agent I/O health per step

| Step | Agent steps | Tool calls | Plain-text replies | Malformed args | Reply = our own msg length | Same as previous reply | Writes/appends | Median reply | Ended |
|---|---|---|---|---|---|---|---|---|---|
| plan | 31 | 23 | 7 | 1 | 6 | 2 | 2/0 | 186 ch | task_complete |
| build-r1 | 53 | 41 | 12 | 0 | 17 | 3 | 4/15 | 215 ch | gave up (no tool format) |
| eval-r1 | 36 | 32 | 3 | 7 | 5 | 0 | 2/0 | 207 ch | task_complete |
| build-r2 | 24 | 15 | 9 | 0 | 4 | 0 | 0/0 | 166 ch | gave up |
| eval-r2 | 53 | 40 | 13 | 2 | 18 | 3 | 3/7 | 201 ch | 20-min cutoff |
| build-r3 | 5 | 2 | 3 | 0 | 0 | 2 | 0/0 | 170 ch | gave up |
| eval-r3 | 16 | 11 | 5 | 0 | 6 | 1 | 0/0 | 263 ch | gave up |

Across all 287 replies: **25% were plain text** instead of a tool call. The median reply was **205
characters**, a size at which no real source file can be written in one call. In **286 of 287** cases the
completion check declared the reply "stable" after a single 1.5 s poll.

## Root causes

1. **forge-agent reads DeepSeek's replies unreliably (primary).** Three signatures in the transcripts:
   - *Partial capture.* Completion is declared after one stability poll, about 1.5–2.7 s after sending,
     so tool calls arrive cut off. `manifest.json` was written as 168 bytes, ending inside the
     description string. A `\n` inside a JS string literal arrived as a real line break, which is the
     syntax error in `style-engine.js`.
   - *Stale and duplicate replies.* After a "response may have been delayed" wait, the agent re-read the
     previous reply. That caused the same 279-byte append twice (the duplicate `applyStyle`) and three
     identical 170-character replies in build r3.
   - *Suspected echo.* 75 replies had exactly the length of the message just sent. That suggests it
     sometimes reads its own message bubble. This is unconfirmed; the transcript doesn't log reply text.

   Effect: the builder can't write a file in one go, so it grows files in tiny appends. Each append is
   another chance to truncate or duplicate. Three bad replies in a row end the step as "success".
2. **The task was too large for that channel.** "Edit four existing files (11–15 KB each) and create
   45 new ones" needed long, exact outputs. Last night's run worked because it created eight small
   files from scratch.
3. **The orchestrator published a failing build to `main`.** Every phase committed straight to `main`
   regardless of checks.
4. **The orchestrator's success signal is wrong.** Forge reports `success` when the agent gives up after
   three non-tool replies. Build r2 and r3 wrote nothing and were still logged as successful steps.
5. **The operator setup made it worse.** There was a clone inside the build folder, four launches in 30
   minutes, and only 3 rounds allowed.

Not causes: the plan, the eval prompts and the eval's diagnosis were all correct. The build-r3
instructions contained a precise, correct fix list; it never got executed.

## Why we were partly in the dark

GitHub only had per-phase summaries cut to 600 characters. The eval's verdict and next steps, the plan,
the full instructions and the agent transcripts were left out of commits. Eval r2 recorded `Trace: None`
because the timeout path dropped the trace ID. Answering "why" took an archive pulled by hand from the
droplet.

## Fixes

Done:
- `935b946`: working extension with the five styles, built and tested by hand.
- **Run telemetry** (`forge_telemetry.py`). Every run gets a record at `/opt/forge-telemetry/runs/<run-id>/`
  on the droplet, mirrored into its git branch under `.forge-runs/<run-id>/`. Each Forge step gets a
  folder with the full instructions (`task.md`), the full agent transcript (`agent.log`), parsed agent
  health (`stats.json`: tool calls, failures, plain-text and stale and echoed replies, write and append
  sizes, how it ended), the automated checks, a file inventory with hashes, a `diff.stat`, and the
  plan or eval it wrote. The run has `run.json` and `RUN.md`, with a table of every step. Timeout steps
  keep their trace ID.
- **New commit structure.** Each run commits to `forge/run-<run-id>`, never to `main`. Commit subjects
  carry the outcome, for example `forge(<id>): build-r2 success 8m00s, 24 steps, files +0 ~0 -0, checks 3/5`,
  and every commit has `Forge-*` trailers (run, phase, round, status, trace, checks, verdict, agent
  health, telemetry path). `main` gets a single squashed merge only when the eval says MVP_COMPLETE and
  every check passes (`--no-merge` disables even that). The old `outputs/` folder is removed from `main`.

Next, in priority order:
1. **Fix forge-agent's reply capture:** at least 3 stable polls, compare against the previous reply
   text (not just length), and ignore the user's own bubble. Without this, any large task will fail
   the same way. Have the transcript log reply text, or a hash of it, to confirm the echo theory.
2. ~~Treat "gave up: no tool format" as a failed step~~. **Done:** it's recorded as `gave_up` and retried once in a fresh chat.
3. **Gate builds on agent health:** if more than 30% of a step's replies are plain text or stale, stop
   the run early instead of burning rounds.
4. **Split big tasks:** one file, or one asset folder, per build step. Generate repetitive assets with
   a script (as `tools/gen_style_assets.py` does) instead of having the model type 45 files.
5. ~~Guard the launch~~. **Done:** the orchestrator refuses to start if the build folder contains a `.git`,
   or if another orchestrator holds the lock.
