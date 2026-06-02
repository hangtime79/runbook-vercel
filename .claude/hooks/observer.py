#!/usr/bin/env python3
"""Fail-safe Claude Code hook observer.

Reads hook JSON from stdin, appends one JSONL record to
.claude/observability/events.jsonl. Never writes stdout (stdout is parsed
by the harness as hook decision JSON). Swallows all exceptions and always
exits 0 — this hook must never block a tool call.
"""
import json
import os
import pathlib
import re
import sys
from datetime import datetime, timezone

PHASE_RE = re.compile(r"phase[_-]?(\d{1,2})[_-]")


def _phase_tag(value):
    if isinstance(value, str):
        m = PHASE_RE.search(value)
        return m.group(1) if m else None
    if isinstance(value, dict):
        for v in value.values():
            tag = _phase_tag(v)
            if tag:
                return tag
        return None
    if isinstance(value, list):
        for item in value:
            tag = _phase_tag(item)
            if tag:
                return tag
    return None


def _subagent_id(payload):
    transcript_path = payload.get("transcript_path") or ""
    if not transcript_path:
        return None
    basename = transcript_path.rsplit("/", 1)[-1]
    return basename.rsplit(".", 1)[0] or None


def _exit_status(tool_response):
    if not isinstance(tool_response, dict):
        return None
    if "exit_code" in tool_response:
        return tool_response.get("exit_code")
    if "success" in tool_response:
        return tool_response.get("success")
    return None


def _project_dir():
    env_dir = os.environ.get("CLAUDE_PROJECT_DIR")
    if env_dir:
        return pathlib.Path(env_dir)
    return pathlib.Path(__file__).resolve().parents[2]


def _main():
    try:
        payload = json.load(sys.stdin)
    except Exception:
        return

    tool_input = payload.get("tool_input") or {}
    tool_response = payload.get("tool_response") or {}

    record = {
        "ts": datetime.now(timezone.utc).isoformat(timespec="milliseconds"),
        "session_id": payload.get("session_id"),
        "event_type": payload.get("hook_event_name"),
        "tool_name": payload.get("tool_name"),
        "args_summary": json.dumps(tool_input, ensure_ascii=False)[:200].replace("\n", " "),
        "subagent_id": _subagent_id(payload),
        "phase_tag": _phase_tag(tool_input),
        "exit_status": _exit_status(tool_response),
    }

    line = json.dumps(record, separators=(",", ":"), ensure_ascii=False) + "\n"

    log_path = _project_dir() / ".claude" / "observability" / "events.jsonl"
    log_path.parent.mkdir(parents=True, exist_ok=True)

    fd = os.open(str(log_path), os.O_WRONLY | os.O_APPEND | os.O_CREAT, 0o644)
    try:
        os.write(fd, line.encode("utf-8"))
    finally:
        os.close(fd)


if __name__ == "__main__":
    try:
        _main()
    except Exception:
        pass
    finally:
        sys.exit(0)
