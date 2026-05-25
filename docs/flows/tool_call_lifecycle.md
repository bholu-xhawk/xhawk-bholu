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

## Do and don't
- Do: read before edit; copy exact bytes for anchors; paginate large files.
- Do: use multi_edit for repeated changes; set expected_count when known.
- Do: use absolute paths in execute; quote paths with spaces; set timeouts.
- Don't: shell out to grep/find; don't cd between directories.
- Don't: re-run failing commands endlessly; apply retry policy.

## Pagination examples
- Read first 200 lines of a file:
  - read_file(file_path="/workspace/README.md", limit=200)
- Read next 200 lines:
  - read_file(file_path="/workspace/README.md", offset=200, limit=200)
- Search large tool results:
  - grep(pattern="error", path="/large_tool_results/<id>", output_mode="content")

## Handling large outputs
- Tool results may be offloaded to /large_tool_results/<tool_call_id>.
- Store only necessary snippets in docs/PR; link to the offloaded path for details.
- Summarize stderr/stdout; avoid dumping thousands of lines into comments.

## Execute command patterns
- Single command with timeout:
  - execute(command="npm test", timeout=300)
- Multiple commands without cd:
  - execute(command="npm install && npm run build && npm test", timeout=600)
- Absolute paths and quoting:
  - execute(command="python \"/workspace/scripts/run job.py\" --flag", timeout=120)

## Related flows
- Implement Flow: ../flows/implement_flow.md
- Review & Test Flow: ../flows/review_and_test_flow.md
- Error & Retry Flow: ../flows/error_and_retry_flow.md
