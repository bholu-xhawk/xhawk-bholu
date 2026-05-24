# Task Subagent Flow

When to use
- Spawn a subagent to handle an isolated, complex, or parallelizable task (e.g., deep search, large refactor chunk) where siloing context helps.
- Avoid for trivial actions or when you need interactive, step-by-step visibility.

Lifecycle
- Spawn: provide clear role, constraints, and expected output (structured result).
- Run: subagent executes autonomously; may use repo tools as needed.
- Return: one-shot result; orchestrator integrates and decides next step.

Inputs/Outputs
- Inputs: role, detailed task description, acceptance criteria.
- Outputs: concise structured result, artifacts/links if any, confidence and caveats.

Diagram

```mermaid
sequenceDiagram
    participant O as Orchestrator (PSM)
    participant S as Subagent
    participant T as Tools

    O->>S: Spawn with role + task + criteria
    S->>T: Use tools (grep/glob/read/execute)
    T-->>S: Results/artifacts
    S->>O: Return structured result
    O->>O: Synthesize and decide next action (continue/fix/escalate)
```

Isolation notes
- Subagent is ephemeral; no persistent state beyond its return payload.
- Keep payload sizes bounded; summarize large findings.
- Avoid leaking credentials or environment-specific details into prompts/results.
