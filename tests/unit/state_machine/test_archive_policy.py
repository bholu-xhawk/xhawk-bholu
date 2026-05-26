import pytest

from domain.policy.archive import can_archive, TERMINAL_STATES, WORKING_STATES


@pytest.mark.parametrize("state", [
    "Analyzing",
    "Planning",
    "Executing",
    "Waiting",
    "Blocked",
    "Idle",
])
def test_cannot_archive_when_working(state):
    assert can_archive(state) is False, f"Archive wrongly allowed for non-terminal state: {state}"


@pytest.mark.parametrize("state", [
    "Completed",
    "Cancelled",
    "Failed",
])
def test_can_archive_when_terminal(state):
    assert can_archive(state) is True, f"Archive not allowed for terminal state: {state}"


def test_policy_sets_align_with_tests():
    # Ensure our test parametrization stays in sync with the policy constants
    assert {
        "Idle", "Analyzing", "Planning", "Executing", "Waiting", "Blocked"
    } == WORKING_STATES
    assert {"Completed", "Cancelled", "Failed"} == TERMINAL_STATES
