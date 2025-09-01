#!/usr/bin/env python3
"""
Organize files in a workspace into a cleaner structure with a focus on testing assets.

Key features:
- Classify and move test scripts, test pages, test data, and test results into tests/ subfolders.
- Group documentation (.md) files into docs/ categories (reports, guides, misc).
- Safe by default: dry-run shows planned moves; use --apply to execute.
- Generates a move log for audit and supports --undo to restore to original locations.

Usage examples (PowerShell):
  python organize_files.py --dry-run
  python organize_files.py --apply
  python organize_files.py --undo .\\organize_moves_2025-08-31T12-00-00.json
"""

from __future__ import annotations

import argparse
import datetime as _dt
import json
import os
import re
import shutil
from dataclasses import dataclass
from pathlib import Path
from typing import Dict, Iterable, List, Optional, Tuple


# ----------------------------- Configuration ----------------------------- #

# Directories to ignore during traversal
IGNORE_DIRS = {
    ".git",
    "node_modules",
    "venv",
    ".venv",
    "__pycache__",
    ".vscode",
    ".idea",
    "dist",
    "build",
    "out",
    # destinations (so we don't re-classify already organized content)
    "tests",
    "docs",
}


SCRIPT_EXTS = {".js", ".ts", ".py", ".ps1", ".sh", ".bat"}
PAGE_EXTS = {".html", ".htm"}
STYLE_EXTS = {".css", ".scss", ".sass"}
DATA_EXTS = {".json", ".csv", ".tsv", ".ndjson", ".txt", ".yml", ".yaml"}
LOG_EXTS = {".log"}
DOC_EXTS = {".md", ".rst"}


TEST_TOKEN_RE = re.compile(r"(?:^|[\W_])(test|spec|demo|example|fixture|sample|mock|stub)(?:$|[\W_])", re.IGNORECASE)
REPORT_TOKEN_RE = re.compile(r"report|summary|diagnostic|analysis|compliance|results?", re.IGNORECASE)
GUIDE_TOKEN_RE = re.compile(r"guide|readme|documentation|how[-_ ]?to|manual|tutorial", re.IGNORECASE)


DEST = {
    "test_script": Path("tests/scripts"),
    "test_page": Path("tests/pages"),
    "test_style": Path("tests/styles"),
    "test_data": Path("tests/data"),
    "test_results_logs": Path("tests/results/logs"),
    "doc_reports": Path("docs/reports"),
    "doc_guides": Path("docs/guides"),
    "doc_misc": Path("docs/misc"),
}


# ------------------------------ Data models ------------------------------ #


@dataclass
class Move:
    src: str
    dst: str


# ----------------------------- Helper functions ----------------------------- #


def is_hidden(path: Path) -> bool:
    name = path.name
    return name.startswith(".") and name not in {".gitignore", ".gitattributes"}


def should_skip_dir(path: Path) -> bool:
    return path.name in IGNORE_DIRS or is_hidden(path)


def classify(path: Path) -> Optional[Tuple[str, Path]]:
    """Return (category, destination_dir) for a given path, or None if no move."""
    if not path.is_file():
        return None

    name = path.name
    stem = path.stem
    lower = name.lower()
    ext = path.suffix.lower()

    # Do not move project entry points that are likely referenced directly
    if name in {"index.html"}:
        return None

    # Test pages (HTML)
    if ext in PAGE_EXTS and TEST_TOKEN_RE.search(lower):
        return ("test_page", DEST["test_page"])  # tests/pages

    # Test scripts
    if ext in SCRIPT_EXTS and TEST_TOKEN_RE.search(lower):
        return ("test_script", DEST["test_script"])  # tests/scripts

    # Test styles (only if obviously test-related)
    if ext in STYLE_EXTS and TEST_TOKEN_RE.search(lower):
        return ("test_style", DEST["test_style"])  # tests/styles

    # Test data (look for tokens or known data-ish extensions mixed with tokens)
    if ext in DATA_EXTS and (TEST_TOKEN_RE.search(lower) or re.search(r"data|config|dataset|fixtures?", lower)):
        return ("test_data", DEST["test_data"])  # tests/data

    # Logs / test results
    if ext in LOG_EXTS or (ext in {".json", ".xml", ".junit"} and re.search(r"result|report|junit|coverage", lower)):
        return ("test_results_logs", DEST["test_results_logs"])  # tests/results/logs

    # Documentation
    if ext in DOC_EXTS:
        if REPORT_TOKEN_RE.search(name):
            return ("doc_reports", DEST["doc_reports"])  # docs/reports
        if GUIDE_TOKEN_RE.search(name):
            return ("doc_guides", DEST["doc_guides"])   # docs/guides
        return ("doc_misc", DEST["doc_misc"])           # docs/misc

    # Specific repo heuristics (safe picks observed in this codebase)
    if lower == "particlesjs-config.json":
        return ("test_data", DEST["test_data"])  # used by test/demo pages

    # Default: no move
    return None


def next_available_path(target: Path) -> Path:
    """Ensure we don't overwrite existing files by appending a numeric suffix."""
    if not target.exists():
        return target
    parent = target.parent
    stem = target.stem
    ext = target.suffix
    i = 1
    while True:
        candidate = parent / f"{stem} ({i}){ext}"
        if not candidate.exists():
            return candidate
        i += 1


def plan_moves(root: Path) -> List[Move]:
    moves: List[Move] = []
    for dirpath, dirnames, filenames in os.walk(root):
        # Prune ignored directories
        # Modify dirnames in-place to control os.walk recursion
        pruned = []
        for d in list(dirnames):
            if should_skip_dir(Path(dirpath) / d):
                pruned.append(d)
        for d in pruned:
            dirnames.remove(d)

        for fname in filenames:
            src = Path(dirpath) / fname
            # Skip hidden files except common git files handled earlier
            if is_hidden(src):
                continue
            result = classify(src)
            if result is None:
                continue
            _, dest_dir = result
            dst = dest_dir / fname
            moves.append(Move(str(src), str(dst)))
    return moves


def ensure_dirs(moves: Iterable[Move]) -> None:
    created = set()
    for m in moves:
        d = Path(m.dst).parent
        if d not in created:
            d.mkdir(parents=True, exist_ok=True)
            created.add(d)


def apply_moves(moves: List[Move]) -> List[Move]:
    executed: List[Move] = []
    ensure_dirs(moves)
    for m in moves:
        src = Path(m.src)
        dst = Path(m.dst)
        if not src.exists():
            continue
        final_dst = next_available_path(dst)
        final_dst.parent.mkdir(parents=True, exist_ok=True)
        shutil.move(str(src), str(final_dst))
        executed.append(Move(str(src), str(final_dst)))
    return executed


def write_log(moves: List[Move], root: Path) -> Path:
    ts = _dt.datetime.now().strftime("%Y-%m-%dT%H-%M-%S")
    log_path = root / f"organize_moves_{ts}.json"
    with log_path.open("w", encoding="utf-8") as f:
        json.dump([m.__dict__ for m in moves], f, indent=2)
    return log_path


def undo_from_log(log_file: Path) -> List[Move]:
    with log_file.open("r", encoding="utf-8") as f:
        entries = json.load(f)
    # Reverse order to avoid conflicts when moving back
    executed: List[Move] = []
    for entry in reversed(entries):
        src_now = Path(entry["dst"])  # current location
        dst_orig = Path(entry["src"])  # original location
        if not src_now.exists():
            continue
        dst_final = next_available_path(dst_orig)
        dst_final.parent.mkdir(parents=True, exist_ok=True)
        shutil.move(str(src_now), str(dst_final))
        executed.append(Move(str(src_now), str(dst_final)))
    return executed


def summarize(moves: List[Move]) -> Dict[str, int]:
    counts: Dict[str, int] = {}
    for m in moves:
        # infer bucket from destination prefix
        dst = Path(m.dst)
        dst_posix = dst.as_posix()
        if "tests/scripts" in dst_posix:
            key = "test_scripts"
        elif "tests/pages" in dst_posix:
            key = "test_pages"
        elif "tests/styles" in dst_posix:
            key = "test_styles"
        elif "tests/data" in dst_posix:
            key = "test_data"
        elif "tests/results/logs" in dst_posix:
            key = "test_results_logs"
        elif "docs/reports" in dst_posix:
            key = "doc_reports"
        elif "docs/guides" in dst_posix:
            key = "doc_guides"
        elif "docs/misc" in dst_posix:
            key = "doc_misc"
        else:
            key = "other"
        counts[key] = counts.get(key, 0) + 1
    return counts


def main(argv: Optional[List[str]] = None) -> int:
    parser = argparse.ArgumentParser(description="Organize workspace files with test-focused classification.")
    parser.add_argument("--root", default=str(Path.cwd()), help="Root directory to organize (default: current working directory)")
    parser.add_argument("--apply", action="store_true", help="Apply moves (default is dry-run)")
    parser.add_argument("--undo", type=str, default=None, help="Undo moves from a prior log file (path to organize_moves_*.json)")
    parser.add_argument("--include-docs", action="store_true", help="Include moving documentation files (.md) into docs/*")
    parser.add_argument("--include-demos", action="store_true", help="Alias for including demo/test pages/scripts (enabled by default)")
    parser.add_argument("--only-tests", action="store_true", help="Only organize test-related items; skip docs")

    args = parser.parse_args(argv)
    root = Path(args.root).resolve()
    if not root.exists():
        print(f"Root not found: {root}")
        return 2

    if args.undo:
        log_file = Path(args.undo)
        if not log_file.exists():
            print(f"Undo log not found: {log_file}")
            return 2
        executed = undo_from_log(log_file)
        print(f"Undo completed. {len(executed)} files moved back.")
        return 0

    # By default, we include demos/test assets and docs. --only-tests allows skipping docs.
    include_docs = args.include_docs or not args.only_tests

    # Build plan
    planned = plan_moves(root)

    if not include_docs:
        planned = [m for m in planned if not Path(m.dst).as_posix().startswith("docs/")]

    if not planned:
        print("No files to move. Your workspace already looks organized!")
        return 0

    # Print plan summary
    print("Planned moves (dry-run by default):")
    for m in planned:
        print(f" - {os.path.relpath(m.src, root)} -> {m.dst}")

    counts = summarize(planned)
    print("\nSummary:")
    for k in sorted(counts.keys()):
        print(f"  {k}: {counts[k]}")
    print(f"  total: {len(planned)}")

    if not args.apply:
        print("\nDry-run complete. Re-run with --apply to perform these moves.")
        return 0

    executed = apply_moves(planned)
    log_path = write_log(executed, root)
    print(f"\nApplied {len(executed)} moves. Log written to: {log_path}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
