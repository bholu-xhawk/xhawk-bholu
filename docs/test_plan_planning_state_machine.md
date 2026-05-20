# Test Plan: New Planning State Machine

This document specifies the test strategy and concrete scenarios for validating the New Planning State Machine (PSM). It is oriented around Python and pytest. It is intentionally technology-agnostic with respect to the PSM implementation details and uses placeholders for concrete state/event names where not yet finalized.

## 1. Objectives & Scope
- Validate correctness of the Planning State Machine behavior at the unit and component level.
- Ensure all legal states and transitions are covered and illegal transitions are rejected safely.
- Verify liveness properties (eventual completion/cancellation under defined conditions), idempotence, retry semantics, and persistence/restore behavior.
- Provide a pytest-oriented structure, fixtures, and patterns to achieve deterministic, reproducible tests with mocks/fakes for external dependencies.

Out of scope (initially):
- End-to-end system tests across network/process boundaries (covered by separate integration/system suites).
- UI/CLI layers and non-functional performance benchmarking beyond conceptual stress tests.
- Security/authorization aspects unless they directly affect state transitions.

## 2. Assumptions
- Tests are written using pytest (>=7.x) with optional plugins: pytest-mock, pytest-asyncio (if async), Hypothesis for property-based testing.
- The PSM is implemented as a pure domain component with sharply defined state and transition functions. External integrations (planner, executor, timers, storage) are injected.
- External dependencies are mocked/faked. No network/filesystem access unless via a storage abstraction with fakes.
- Persistence is snapshot-based (e.g., serializable state record) and can be restored to resume execution. Clock/timer abstractions can be stubbed.
- If concurrency exists, the PSM exposes a serialized event application API or clearly documented threading model. Tests can inject events deterministically.

## 3. Glossary
- State: Discrete mode of the PSM (e.g., Idle, Planning, Executing, Waiting, Blocked, Failed, Completed, Cancelled).
- Event: Input the PSM consumes (e.g., goal_received, plan_generated, step_completed, timeout, cancel, etc.).
- Transition: Mapping of (state, event) -> (new_state, actions, side effects).
- Action: Side effects triggered by a transition (e.g., call planner, schedule timer, persist snapshot, emit metrics/logs).
- Invariant: Property that must always hold (safety) or must eventually hold (liveness) across transitions (e.g., no illegal transitions, monotonic attempt counters).

## 4. High-level Overview
Represent the state machine as a table or diagram for clarity. Template:

- States: {Idle, Analyzing, Planning, Executing, Waiting, Blocked, Failed, Completed, Cancelled}
- Core events: {goal_received, analysis_done, plan_generated, execution_started, step_completed, step_failed, retry, timeout, cancel, pause, resume, external_signal}

Example transition table template (to be instantiated):
- (Idle, goal_received) -> Planning; actions: persist(goal), start_planning, schedule(planning_timeout)
- (Planning, plan_generated) -> Executing; actions: persist(plan), start_execution
- (Executing, step_completed[last]) -> Completed; actions: persist(result), emit(metric: completed)
- (Executing, step_failed[retryable]) -> Waiting/Blocked; actions: schedule(retry_backoff)
- (Any, cancel) -> Cancelled; actions: cleanup, emit(metric: cancelled)

Note: The exact states/events must be finalized against the implementation; this plan provides placeholders and structure.

## 5. States (placeholders; fill with concrete names)
For each state define entry criteria, exit criteria, allowed events, and side effects. Initial draft:

- Idle
  - Entry: PSM created or reset; no active goal.
  - Exit: on goal_received -> Planning/Analyzing.
  - Allowed events: goal_received, unknown events must be rejected.

- Analyzing (optional)
  - Entry: goal accepted; analysis started.
  - Exit: analysis_done -> Planning; cancel -> Cancelled; timeout -> Failed/Blocked.
  - Allowed: analysis_done, timeout, cancel, pause.

- Planning
  - Entry: planning started; timer scheduled.
  - Exit: plan_generated -> Executing; timeout -> Failed/Blocked; cancel -> Cancelled.
  - Allowed: plan_generated, timeout, retry (planner), cancel, pause.

- Executing
  - Entry: execution started for plan[step_i].
  - Exit: on last step_completed -> Completed; step_failed -> Waiting/Blocked/Failed; cancel -> Cancelled; timeout -> Failed/Blocked.
  - Allowed: execution_started, step_completed, step_failed, timeout, retry, cancel, pause, external_signal (for human-in-the-loop).

- Waiting
  - Entry: waiting for external_signal, backoff timer, or resource availability.
  - Exit: external_signal or timer -> Executing/Planning; cancel -> Cancelled; timeout -> Failed/Blocked.
  - Allowed: external_signal, timeout, cancel, resume.

- Blocked
  - Entry: non-retryable error or dependency unavailable.
  - Exit: external_signal/recovery -> Executing/Planning; cancel -> Cancelled; timeout may escalate -> Failed.
  - Allowed: external_signal, cancel, timeout.

- Failed
  - Entry: unrecoverable error or max retries exceeded.
  - Exit: none (terminal) except possible administrative reset not in scope.
  - Allowed: read-only events only (no-ops), or explicit reset (if supported) -> Idle.

- Completed
  - Entry: all steps succeeded.
  - Exit: none (terminal) except archival.
  - Allowed: read-only events only.

- Cancelled
  - Entry: cancel received and acknowledged; cleanup executed.
  - Exit: none (terminal) except archival.
  - Allowed: read-only events only.

## 6. Events & Transitions
Enumerate expected events and generic expectations. Provide target states and side effects placeholders:
- goal_received(payload)
  - Idle -> Planning/Analyzing; persist goal; start planner; schedule planning_timeout.
- analysis_done(result)
  - Analyzing -> Planning; persist analysis; start planner.
- plan_generated(plan)
  - Planning -> Executing; persist plan; start execution; cancel planning_timeout.
- execution_started(step)
  - Executing (idempotent): mark step active; schedule execution_timeout.
- step_completed(step)
  - Executing -> Executing (next step) or Completed (last step); update progress; emit metric.
- step_failed(step, error)
  - Executing -> Waiting/Blocked/Failed based on retry policy; increment attempt; schedule backoff.
- retry
  - Waiting -> Executing/Planning; clear backoff; emit metric.
- timeout(kind)
  - In Planning/Executing/Waiting -> Failed or Blocked per policy; record timeout reason.
- cancel
  - Any non-terminal -> Cancelled; perform cleanup; emit metric.
- pause
  - Planning/Executing -> Waiting; persist paused=true; stop timers.
- resume
  - Waiting (paused) -> Planning/Executing; restart timers.
- external_signal(data)
  - Waiting/Blocked -> Executing/Planning; attach data to context; possibly unblocks dependency.

Each transition must specify:
- Preconditions (state, context); Postconditions (new state, context updates);
- Side effects (planner/executor calls, timers, persistence, metrics/logs);
- Error handling and idempotence behavior for duplicate events.

## 7. Invariants & Properties
Safety:
- No illegal transitions: for every (state, event) not in the transition relation, PSM responds with a defined error or no-op and preserves state.
- Idempotence: Reprocessing the same event (same event_id) does not change outcome after it has been applied once.
- Monotonic progression: step_index never decreases; attempt counters are non-decreasing.
- Timer/accounting invariants: at most one active timer per timer type; timers canceled on exit from owning state.

Liveness:
- With bounded retry count and no external blocks, PSM eventually reaches Completed, Failed, or Cancelled.
- If cancel is requested in any non-terminal state, PSM reaches Cancelled within bounded steps.

Persistence/restore invariants:
- Snapshot is sufficient to deterministically reconstruct state and pending timers.
- After restore, invariants hold; duplicate event detection continues to work.

Retry/backoff rules:
- Retryable failures transition to Waiting with computed backoff; backoff must grow per policy (e.g., exponential with jitter) at logic level.

## 8. Test Categories & Scenarios
8.1 Happy paths
- Minimal plan: Idle -> Planning -> Executing -> Completed.
- Multi-step plan: multiple step_completed transitions culminating in Completed.
- With waiting/external signals: Executing -> Waiting (blocked) -> external_signal -> Executing -> Completed.

8.2 Failure & retry
- Transient step failure with successful retry before max_retries.
- Max-retries reached -> Failed.
- Backoff timing logic verified via controlled clock (no wall time sleeps).

8.3 Cancellation & pause/resume
- Cancel in each non-terminal state results in Cancelled and cleanup side effects.
- Pause in Planning/Executing transitions to Waiting (paused), Resume returns to prior activity.

8.4 Timeouts
- Planning timeout -> Failed/Blocked depending on policy.
- Execution timeout for a step -> retry or Failed; timers canceled when leaving Executing.

8.5 Concurrency/interleaving
- Duplicate events are ignored or idempotently applied.
- Out-of-order events are rejected or queued per policy; verify deterministic resolution.
- Race between cancel and completion: define precedence; verify consistent outcome and no resource leaks.

8.6 Persistence & recovery
- Snapshot mid-Planning/Executing; restore and continue to reach terminal state; invariants hold.
- Restore with in-flight timers; ensure they are rescheduled or processed deterministically.

8.7 Invalid inputs
- Unknown events produce explicit error with no state change.
- Illegal transitions (state, event) pairs are rejected safely.
- Null/empty payloads validated; schema errors surfaced.

8.8 Resource errors
- Dependency unavailable (planner/executor/storage) -> Blocked/Waiting with backpressure behavior.
- Backpressure: queue growth bounded, events dropped per policy with metrics.

8.9 Long-running/stress (conceptual)
- Many steps with intermittent retries; ensure stability and no unbounded memory growth (logic-level assertions, not perf benchmarks).

8.10 Metrics/observability
- Verify emitted traces/logs/events per transition: include state_from, state_to, event_type, correlation ids, attempt, latency buckets (logic-level assertions via fake sink).

## 9. Pytest Structure
Recommended layout:
- tests/
  - unit/
    - state_machine/
      - test_transitions_table.py
      - test_invariants.py
      - test_retries_timeouts.py
      - test_cancel_pause_resume.py
      - test_concurrency_events.py
      - test_persistence_recovery.py
      - conftest.py (fixtures: psm, fake_planner, fake_executor, fake_clock, fake_storage, metrics_sink)

Patterns:
- Use Given-When-Then naming: test_given_planning_when_timeout_then_failed()
- Parametrize transition table: each (state, event) case mapping to expected outcome.
- Use factories/builders for initial state context; keep deterministic clocks.
- Prefer dependency injection with stubbed interfaces.

## 10. Example Pytest Skeletons
Illustrative only; adapt to concrete APIs.

Parametric transition test:
```python
def transition_case():
    # Example tuple: (start_state, event, payload, expected_state, side_effects)
    return [
        ("Idle", "goal_received", {"goal": "G"}, "Planning", {"start_planner": True}),
        ("Planning", "plan_generated", {"plan": [1, 2]}, "Executing", {"start_executor": True}),
    ]

import pytest

@pytest.mark.parametrize("start,event,payload,expected,effects", transition_case())
def test_transition_table(psm_factory, start, event, payload, expected, effects):
    psm = psm_factory(initial_state=start)
    result = psm.apply(event, payload)
    assert result.state == expected
    # Example side-effect assertions via fakes
    if effects.get("start_planner"):
        psm.deps.planner.start.assert_called_once()
```

Invariant assertions:
```python
def test_idempotence_duplicate_event(psm_factory, event_factory):
    psm = psm_factory(initial_state="Executing")
    ev = event_factory("step_completed", id="E1", payload={"step": 1})
    psm.apply(ev.type, ev.payload, id=ev.id)
    state1 = psm.snapshot()
    psm.apply(ev.type, ev.payload, id=ev.id)  # duplicate
    state2 = psm.snapshot()
    assert state2 == state1  # no change
```

Hypothesis property-based example:
```python
from hypothesis import given, strategies as st

@given(
    start=st.sampled_from(["Idle", "Planning", "Executing", "Waiting"]),
    event=st.sampled_from(["cancel", "timeout", "retry"]),
)
def test_no_illegal_transitions(psm_factory, start, event):
    psm = psm_factory(initial_state=start)
    try:
        result = psm.apply(event, payload={})
    except IllegalTransition:
        # acceptable
        return
    # If accepted, result must be in allowed next states
    assert result.state in psm.allowed_next_states(start, event)
```

## 11. Mocks & Fakes
- Planner: fake start/generate methods; controllable outcomes (success/failure/timeout); record calls.
- Executor: fake run_step with deterministic success/failure; step-level timeouts; retryable vs non-retryable errors.
- Timers/Clock: fake clock with manual advance; scheduler that records scheduled tasks without sleeping.
- Storage: in-memory snapshot store with serialize/deserialize; simulate failures.
- Metrics/Logs: fake sink capturing emitted events for assertion; include correlation ids and state transitions.
- Failure injection: controllable via fixtures/parameters (e.g., next_call_fails, sequence of outcomes, injected exceptions).

## 12. Coverage Goals
- Transition coverage: 100% of legal (state, event) transitions validated.
- State coverage: all states exercised including terminal states.
- Negative cases: representative illegal transitions and invalid inputs across states.
- Property checks: idempotence, monotonic counters, liveness under bounded retries, persistence invariants after restore.

## 13. Traceability Matrix (Template)
Map requirement IDs to test scenarios/cases.

| Requirement ID | Description | Test(s) |
|----------------|-------------|---------|
| PSM-REQ-001 | Idle -> Planning on goal_received | test_transition_table[param: Idle, goal_received] |
| PSM-REQ-002 | Planning timeout -> Failed | test_retries_timeouts::test_planning_timeout |
| PSM-REQ-003 | Duplicate events are idempotent | test_invariants::test_idempotence_duplicate_event |
| PSM-REQ-004 | Cancel leads to Cancelled from any non-terminal | test_cancel_pause_resume::test_cancel_from_all_states |
| PSM-REQ-005 | Snapshot/restore preserves invariants | test_persistence_recovery::* |
| ... | ... | ... |

## 14. Acceptance Criteria
- All states and documented legal transitions tested with positive assertions.
- Illegal transitions and invalid inputs produce bounded, defined behavior with no state corruption.
- Retry/backoff logic verified at logic level using a fake clock; no sleeps.
- Persistence/restore tests demonstrate deterministic continuation and invariant preservation.
- Metrics/logs/traces are emitted per transition as specified and include required context fields.
- Coverage goals in Section 12 met; CI passes reliably and deterministically.

## 15. Open Items & Placeholders
- Replace placeholder state and event names with final enums/constants once available.
- Confirm exact retry/backoff policy and timer semantics (per-step vs global) and update tests accordingly.
- Define precedence in cancel vs completion race; encode as tests.
- Finalize persistence schema and snapshot structure for restore tests.
- Clarify whether Analyzing is distinct from Planning or a sub-phase; adjust transitions.
