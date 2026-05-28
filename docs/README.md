# Internal Agent/System Flows

This folder documents the internal engineering flows that power the repository. The focus is on how the agent plans, implements changes, reviews/tests them, interacts with tools, spawns subagents, and handles errors/retries.

These are implementation-facing notes intended for contributors. They prefer plain Markdown and Mermaid diagrams that render on GitHub.

## Overview

The core lifecycle from a high level:

```mermaid
flowchart LR
    A[User/Issue] --> B[Planning State Machine]
    B --> C[Implement Flow]
    C --> D[Review & Test Flow]
    D --> E{Terminal}
    E -->|Success| F[Completed]
    E -->|Failure| G[Failed]
    E -->|Cancelled| H[Cancelled]

    B <---> I[Task Subagent(s)]
    C <---> I
    B -.-> J[Tool Call Lifecycle]
    C -.-> J
    D -.-> J

    B -. error .-> K[Error & Retry Flow]
    C -. error .-> K
    D -. error .-> K
```

## Flow Index

- Planning State Machine: flows/planning_state_machine.md
- Implement Flow: flows/implement_flow.md
- Review and Test Flow: flows/review_and_test_flow.md
- Task Subagent Flow: flows/task_subagent_flow.md
- Tool Call Lifecycle & Guardrails: flows/tool_call_lifecycle.md
- Error and Retry Flow: flows/error_and_retry_flow.md

## Setup Guides

- Setup PostgreSQL and React Native: guides/setup_postgres_and_react_native.md - local Postgres via Docker/native and RN environment for Android & iOS

## Related / Legacy

- Test Plan for the New Planning State Machine: test_plan_planning_state_machine.md

## Notes

- Mermaid diagrams render on GitHub. Some third-party renderers may not display them.
- Keep examples technology-agnostic where possible, but align terminology with this codebase (e.g., grep/glob vs execute, absolute paths, pagination of file reads).
