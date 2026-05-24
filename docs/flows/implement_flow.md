# Implement Flow

Overview
- Describes how the implement agent executes planned steps, runs verification commands, and iterates until completion or escalation.

Responsibilities
- Apply minimal, targeted edits.
- Use repository tools safely (grep/glob/read/edit/execute) with guardrails.
- Verify after each change (build/tests/lints) and rollback or iterate if needed.
- Surface diffs and rationale for reviewers.

Sequence

```mermaid
sequenceDiagram
    participant P as Planner/PSM
    participant I as Implement Agent
    participant FS as Filesystem Tools
    participant EX as Execute
    participant CI as Tests/Checkers

    P->>I: Provide plan (steps with acceptance criteria)
    I->>FS: Discover files (glob/grep)
    FS-->>I: Candidates
    I->>FS: Read target files
    FS-->>I: Contents
    I->>FS: Write minimal changes
    I->>EX: Run quick verification (build/unit tests)
    EX-->>I: Results
    alt verification passed
        I-->>P: Report step_completed with diff/summary
    else verification failed
        I->>I: Analyze failure, adjust approach
        I->>FS: Edit/rollback as needed
        I->>EX: Re-run focused checks
        EX-->>I: Results
        opt retries exceeded
            I-->>P: Report step_failed with diagnostics
        end
    end
```

Verification
- Prefer fast checks first: type check, lint, unit tests for touched modules.
- Run broader tests only when necessary; avoid full repo sweeps when a subset suffices.
- Capture stdout/stderr artifacts concisely; link to detailed logs only when needed.

Failure handling
- Use bounded retries with backoff from the PSM.
- On persistent failure, provide actionable diagnostics: failing command, key error excerpts, suspected root cause, next steps.
- Never leave the repo in a broken state mid-step; keep changes cohesive per commit/patch.
