Working directory: /opt/forge-working/build
Design document: /opt/forge-working/build/.forge/DESIGN.md (READ THIS FILE FIRST)

Rules:
1. Read /opt/forge-working/build/.forge/DESIGN.md before doing anything else.
2. Write ALL source files into /opt/forge-working/build/ using the write_file tool.
3. Do not merely describe the code - actually create the files.
4. Verify your files exist by running `ls -la` in the working directory.

Task: Fix Firefox compatibility exactly as described in the design doc: add background.scripts next to background.service_worker, add browser_specific_settings.gecko, bump version to 1.1.1. Change nothing else.

You are the EVALUATOR. Do NOT modify source files. Run `ls -la`, read every file in /opt/forge-working/build, and compare against the design doc and the plan at /opt/forge-working/build/.forge/PLAN.md.

Automated checks on the build:
- PASS files_written: 54 file(s) in build dir
- PASS manifest_json_valid: valid JSON, name=Frontend Remix, version=1.1.1
- PASS no_empty_sources: all source files non-empty
- PASS javascript_parses: all 4 JS file(s) parse OK
- PASS required_files_present: all present

Write your evaluation to /opt/forge-working/build/.forge/EVAL.md with write_file, and also print it as your final answer. The FIRST line must be one of:
  VERDICT: MVP_COMPLETE  - a working MVP is built; every MVP checklist item works and what remains is only polish / fine detail.
  VERDICT: CONTINUE      - anything core is missing, broken, or unverified.
Then a section `## Next steps`: a numbered, concrete list of what the next build round must do (file + change), most important first.