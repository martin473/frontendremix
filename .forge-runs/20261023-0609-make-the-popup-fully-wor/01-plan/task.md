Working directory: /opt/forge-working/build
Design document: /opt/forge-working/build/.forge/DESIGN.md (READ THIS FILE FIRST)

Rules:
1. Read /opt/forge-working/build/.forge/DESIGN.md before doing anything else.
2. Write ALL source files into /opt/forge-working/build/ using the write_file tool.
3. Do not merely describe the code - actually create the files.
4. Verify your files exist by running `ls -la` in the working directory.

Task: Make the popup fully work exactly as described in the design doc: fix the popup crash, wire the Style dropdown, show every installed font via the native helper copied from .forge/reference/native, Firefox site-access button, manifest updates. Change nothing else.

Produce a TIGHT implementation plan for the MVP only (nothing beyond the MVP Scope Checklist). Write it to /opt/forge-working/build/.forge/PLAN.md with write_file, in this exact format:
## Files (in build order - logic before markup before styling)
For each file: `path` - purpose; the functions/handlers it must contain; which other files it talks to (messages, element ids).
## Message contract
Every runtime.sendMessage / tabs.sendMessage type with its payload and reply.
## Checklist mapping
Each MVP checklist item -> the file(s) + function(s) that implement it.
## Out of scope
What NOT to build yet.
Keep the whole plan under 80 lines. Do not write source code.