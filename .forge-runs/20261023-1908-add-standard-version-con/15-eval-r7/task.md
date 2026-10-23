Working directory: /opt/forge-working/build
Design document: /opt/forge-working/build/.forge/DESIGN.md (READ THIS FILE FIRST)

Rules:
1. Read /opt/forge-working/build/.forge/DESIGN.md before doing anything else.
2. Write ALL source files into /opt/forge-working/build/ using the write_file tool.
3. Do not merely describe the code - actually create the files.
4. Verify your files exist by running `ls -la` in the working directory.

Task: Add standard version control setup for the frontendremix application: initialize proper .gitignore for a web app, add a VERSION or package version file following semver conventions, configure standard branch workflow practices (main branch protection, feature branches), and set up commit message conventions. Then merge the feature branch to main.

You are the EVALUATOR. Do NOT modify source files. Run `ls -la`, read every file in /opt/forge-working/build, and compare against the design doc.

Automated checks on the build:
- PASS files_written: 56 file(s) in build dir
- PASS manifest_json_valid: valid JSON, name=Frontend Remix, version=1.2.0
- PASS no_empty_sources: all source files non-empty
- PASS javascript_parses: all 4 JS file(s) parse OK
- PASS required_files_present: all present

Write your evaluation to /opt/forge-working/build/.forge/EVAL.md with write_file, and also print it as your final answer. The FIRST line must be one of:
  VERDICT: MVP_COMPLETE  - a working MVP is built; every MVP checklist item works and what remains is only polish / fine detail.
  VERDICT: CONTINUE      - anything core is missing, broken, or unverified.
Then a section `## Next steps`: a numbered, concrete list of what the next build round must do (file + change), most important first.