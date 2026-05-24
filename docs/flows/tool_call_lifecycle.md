# Tool Call Lifecycle & Guardrails

Tool Types
- Discovery: glob, grep
- Access: read_file (with pagination), ls
- Mutation: write_file, edit_file, multi_edit
- Execution: execute (with absolute paths and timeouts)

Usage Rules
- Prefer discovery tools (glob/grep) over shell find/grep. Do not shell out for search.
- Use absolute paths for execute; do not cd. Combine commands with && or ; as appropriate.
- Paginate large reads; avoid reading entire files when not necessary.
- For edits, always read the file first; build anchors from exact bytes; use multi_edit for repeated patterns.
- For large outputs, expect offloaded results under /large_tool_results; read with read_file or grep there.

Examples
- Read-then-edit pattern:
  1) read_file(file_path="/workspace/README.md", limit=200)
  2) edit_file(file_path="/workspace/README.md", old_string="Exact line from read", new_string="Replacement")
- Execute with quoting and no cd:
  - execute(command="npm test", timeout=300)
- Grep across repo:
  - grep(pattern="TODO", path="/workspace", output_mode="files_with_matches")

Diagram

```mermaid
flowchart LR
    A[Need to locate content] --> B{Search?}
    B -->|Yes| C[glob/grep]
    B -->|No| D[Direct path known]
    C --> E[read_file with pagination]
    D --> E
    E --> F{Mutate?}
    F -->|Yes| G[edit_file/multi_edit]
    F -->|No| H[Proceed]
    G --> I[verify with execute/tests]
    I --> J{Large output?}
    J -->|Yes| K[/large_tool_results handling]
    J -->|No| L[Summarize]
```
