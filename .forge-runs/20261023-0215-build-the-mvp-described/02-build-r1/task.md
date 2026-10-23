Working directory: /opt/forge-working/build
Design document: /opt/forge-working/build/.forge/DESIGN.md (READ THIS FILE FIRST)

Rules:
1. Read /opt/forge-working/build/.forge/DESIGN.md before doing anything else.
2. Write ALL source files into /opt/forge-working/build/ using the write_file tool.
3. Do not merely describe the code - actually create the files.
4. Verify your files exist by running `ls -la` in the working directory.

Task: Build the MVP described in the design doc

Implementation plan: /opt/forge-working/build/.forge/PLAN.md

WRITE THE CODE with write_file and verify with `ls -la`. Priorities:
1. FUNCTIONALITY FIRST: create every file the plan/manifest references (all .js and .html) with working logic before any styling.
2. Write each file COMPLETE in a single write_file call. Do not grow a file with many small append_to_file calls, and do not rewrite a file you already finished unless fixing a bug.
3. CSS/visual polish is lowest priority - one pass at most, only after all logic works.
Do not finish until the files exist on disk.