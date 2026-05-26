"""Archive policy for issues relative to planning state machine states.

Rule: An issue can be archived only after the workflow reaches a terminal state.
Terminal states: Completed, Cancelled, Failed.
Working/non-terminal states: Idle, Analyzing, Planning, Executing, Waiting, Blocked.

This module centralizes the policy so it can be used by both API and UI layers.
"""
from __future__ import annotations

from typing import Iterable

# Explicitly enumerate states per docs/test_plan_planning_state_machine.md
TERMINAL_STATES = {
    "Completed",
    "Cancelled",
    "Failed",
}

# Keeping for clarity and potential future validation/diagnostics
WORKING_STATES = {
    "Idle",
    "Analyzing",
    "Planning",
    "Executing",
    "Waiting",
    "Blocked",
}


def can_archive(state: str) -> bool:
    """Return True only if the issue is in a terminal state.

    Archiving is disallowed while the agent is working or in any non-terminal state.

    Args:
        state: Current state name of the issue/workflow.

    Returns:
        bool: True if archiving is allowed (terminal), False otherwise.
    """
    return state in TERMINAL_STATES


def assert_cannot_archive(states: Iterable[str]) -> None:
    """Helper to assert none of the given states are archivable.

    Useful in tests; raises AssertionError if any state is unexpectedly archivable.
    """
    offending = [s for s in states if can_archive(s)]
    if offending:
        raise AssertionError(f"States unexpectedly archivable: {offending}")
