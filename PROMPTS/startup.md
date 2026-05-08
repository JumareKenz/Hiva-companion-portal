# AGENT RULES — READ BEFORE WRITING A SINGLE LINE OF CODE

1. READ `AGENTS.md` fully. These rules are non-negotiable.
2. READ `BLUEPRINT.md` fully. Every design decision is already made.
3. READ `PROGRESS.md`. Find the first `[~]` task. If none, find the first `[ ]` task.
4. Work on ONE task at a time. Complete it fully before moving on.

## CODE QUALITY RULES

- Before writing any function, check `BLUEPRINT.md` for its exact spec (props, behavior, data model).
- Before creating any file, check `AGENTS.md` for naming and structure rules.
- Before using any library, confirm it is in `AGENTS.md`. If not — DO NOT use it. Note it in `PROGRESS.md` under "Decisions needed" instead.
- Match the style of existing files exactly. Read 2-3 existing files first.
- Never introduce a pattern not already in `AGENTS.md`.

## EXPLORE BEFORE YOU WRITE

- Before implementing anything, write out your approach in a comment block.
- Consider: Is there a simpler way? Is this secure? Could this fail?
- If you see a better approach than what's in `BLUEPRINT.md`, note it in `PROGRESS.md` under "Decisions needed" — do NOT deviate silently.

## SECURITY RULES

- Validate all inputs before processing.
- Never expose secrets, never log sensitive data.
- Apply auth checks exactly as described in `AGENTS.md`.
- If a security concern isn't covered, stop and note it in `PROGRESS.md`.

## TEST AS YOU CODE

- Every function you write gets a test immediately after.
- Test: the happy path, at least one edge case, at least one failure case.
- Tests live next to the file they test (see `AGENTS.md` for convention).
- Do not move to the next task if the current task's tests are failing.

## WHEN YOU FINISH A TASK

- Mark it `[x]` in `PROGRESS.md`.
- Write one line under it: what you built and any edge case you handled.
- Confirm tests are passing before marking done.
- Identify the next `[ ]` task and note it as `[~]`.

## IF ANYTHING IS UNCLEAR

- Check `BLUEPRINT.md` first.
- Check `AGENTS.md` second.
- If still unclear, note it in `PROGRESS.md` under "Blocked — needs clarification". Do NOT guess. Do NOT invent.
