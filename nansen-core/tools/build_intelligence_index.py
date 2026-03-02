#!/usr/bin/env python3
"""
Intelligence Index Generator
Parses all .intelligence.md files and produces _index.json
Handles YAML frontmatter quirks (unescaped quotes, variant field names)
"""
import os
import re
import json
import hashlib
from datetime import datetime, date, timezone

DEFAULT_INTELLIGENCE_DIR = "/sessions/jolly-nice-clarke/mnt/nansen/nansen-working-folder/nansen/intelligence"


def extract_frontmatter_text(content: str) -> str | None:
    """Extract raw YAML frontmatter between --- delimiters."""
    if not content.startswith("---"):
        return None
    try:
        end = content.index("---", 3)
        return content[3:end].strip()
    except ValueError:
        return None


def parse_frontmatter_robust(fm_text: str) -> dict:
    """
    Parse YAML frontmatter using regex-based extraction.
    More robust than yaml.safe_load for files with unescaped quotes in values.
    """
    result = {}

    # Split into lines and parse key-value pairs
    lines = fm_text.split("\n")
    current_key = None
    current_value = None
    in_list = False
    list_items = []

    for line in lines:
        # Check if this is a new top-level key
        key_match = re.match(r'^(\w[\w_-]*)\s*:\s*(.*)', line)

        if key_match and not line.startswith("  ") and not line.startswith("\t"):
            # Save previous key if exists
            if current_key:
                if in_list:
                    result[current_key] = list_items
                else:
                    result[current_key] = clean_value(current_value)

            current_key = key_match.group(1)
            value_part = key_match.group(2).strip()

            # Check if value is empty (list or multiline follows)
            if not value_part:
                in_list = False
                list_items = []
                current_value = ""
            else:
                in_list = False
                list_items = []
                current_value = value_part

        elif line.strip().startswith("- ") and current_key:
            # List item
            in_list = True
            item = line.strip()[2:].strip()
            item = item.strip("'\"")
            list_items.append(item)

        elif current_key and not in_list and line.strip():
            # Continuation of multiline value
            if current_value:
                current_value += " " + line.strip()
            else:
                current_value = line.strip()

    # Save last key
    if current_key:
        if in_list:
            result[current_key] = list_items
        else:
            result[current_key] = clean_value(current_value)

    return result


def clean_value(val: str):
    """Clean a scalar YAML value. Also handles inline JSON arrays."""
    if val is None:
        return None
    val = val.strip()

    # Check for inline JSON array: ["item1", "item2"]
    if val.startswith("[") and val.endswith("]"):
        try:
            parsed = json.loads(val)
            if isinstance(parsed, list):
                return [str(p).strip() for p in parsed if p]
        except json.JSONDecodeError:
            pass

    # Remove surrounding quotes
    if (val.startswith("'") and val.endswith("'")) or \
       (val.startswith('"') and val.endswith('"')):
        val = val[1:-1]

    # Handle special values
    if val.lower() in ("null", "~", ""):
        return None
    if val.lower() == "true":
        return True
    if val.lower() == "false":
        return False

    # Try integer
    try:
        return int(val)
    except ValueError:
        pass

    return val


def normalize_date(val) -> str | None:
    """Convert date to ISO string."""
    if val is None:
        return None
    if isinstance(val, (date, datetime)):
        return val.isoformat()
    s = str(val).strip()
    # Try common formats
    for fmt in ("%Y-%m-%d", "%Y-%m-%dT%H:%M:%S", "%Y-%m-%d %H:%M:%S"):
        try:
            return datetime.strptime(s, fmt).date().isoformat()
        except ValueError:
            continue
    return s


def fix_stringified_json_list(val) -> list:
    """
    Some older files have domains/participants stored as stringified JSON arrays
    in YAML, e.g. the YAML list items are: '["competitive-intel"', '"market-research"]'
    Detect and fix these.
    """
    if not isinstance(val, list) or len(val) == 0:
        return val if isinstance(val, list) else []

    # Check if items look like fragments of a JSON array
    joined = ", ".join(str(v) for v in val)
    # Pattern: starts with [ or items contain leading/trailing brackets and quotes
    if joined.startswith("[") or any(str(v).startswith("[") or str(v).endswith("]") for v in val):
        # Try to reconstruct and parse as JSON
        cleaned = joined.strip()
        if not cleaned.startswith("["):
            cleaned = "[" + cleaned
        if not cleaned.endswith("]"):
            cleaned = cleaned + "]"
        try:
            parsed = json.loads(cleaned)
            if isinstance(parsed, list):
                return [str(p).strip() for p in parsed if p]
        except json.JSONDecodeError:
            pass

    return val


def normalize_confidence(fm: dict) -> str | None:
    """Normalize confidence from various field names and formats to high/medium/low."""
    raw = fm.get("confidence") or fm.get("confidence_level") or fm.get("signal_classification")
    if raw is None:
        return None
    s = str(raw).lower().strip()
    # Map numeric confidence to categories
    try:
        num = float(s)
        if num >= 0.85:
            return "high"
        elif num >= 0.6:
            return "medium"
        else:
            return "low"
    except ValueError:
        pass
    # Normalize string variants
    if s in ("very-high", "very_high", "veryhigh"):
        return "high"
    return s


def build_entry(filename: str, fm: dict) -> dict:
    """Build an index entry from parsed frontmatter."""
    entry = {
        "file": filename,
        "title": fm.get("title", filename),
        "date": normalize_date(fm.get("date")),
        "client": (fm.get("client") or "unknown").lower().strip(),
        "source_type": (fm.get("source_type") or "unknown").lower().strip(),
        "domains": fm.get("domains", []),
        "confidence": normalize_confidence(fm),
        "participants": fm.get("participants", []),
        "summary": fm.get("summary"),
    }

    # Fix stringified JSON lists (older files)
    entry["domains"] = fix_stringified_json_list(entry["domains"])
    entry["participants"] = fix_stringified_json_list(entry["participants"])

    # Normalize domains to list of strings
    if isinstance(entry["domains"], str):
        entry["domains"] = [d.strip() for d in entry["domains"].split(",")]
    entry["domains"] = [str(d).lower().strip() for d in entry["domains"] if d]

    # Normalize participants to list of strings
    if isinstance(entry["participants"], str):
        entry["participants"] = [p.strip() for p in entry["participants"].split(",")]
    entry["participants"] = [str(p).strip() for p in entry["participants"] if p]

    # Strip leading pipe chars from summary (table formatting artifact)
    if entry["summary"] and isinstance(entry["summary"], str):
        entry["summary"] = entry["summary"].lstrip("| ").strip()

    # Truncate summary to 200 chars for index compactness
    if entry["summary"] and len(str(entry["summary"])) > 200:
        entry["summary"] = str(entry["summary"])[:200] + "..."

    return entry


def generate_index(intelligence_dir: str = None):
    """Scan all intelligence files and generate _index.json."""
    intelligence_dir = intelligence_dir or DEFAULT_INTELLIGENCE_DIR
    output_file = os.path.join(intelligence_dir, "_index.json")

    files = sorted([
        f for f in os.listdir(intelligence_dir)
        if f.endswith(".intelligence.md")
    ])

    entries = []
    errors = []

    for filename in files:
        filepath = os.path.join(intelligence_dir, filename)
        try:
            with open(filepath, "r", encoding="utf-8") as fh:
                content = fh.read()

            fm_text = extract_frontmatter_text(content)
            if fm_text is None:
                errors.append({"file": filename, "error": "No frontmatter found"})
                continue

            fm = parse_frontmatter_robust(fm_text)
            entry = build_entry(filename, fm)
            entries.append(entry)

        except Exception as e:
            errors.append({"file": filename, "error": str(e)})

    # Build the full index
    index = {
        "version": 1,
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "total_files": len(entries),
        "entries": entries,
    }

    # Add summary stats
    clients = set(e["client"] for e in entries if e["client"] != "unknown")
    source_types = set(e["source_type"] for e in entries)
    index["stats"] = {
        "clients": sorted(clients),
        "source_types": sorted(source_types),
        "date_range": {
            "earliest": min((e["date"] for e in entries if e["date"]), default=None),
            "latest": max((e["date"] for e in entries if e["date"]), default=None),
        },
        "confidence_breakdown": {},
    }

    # Confidence breakdown
    for e in entries:
        c = e["confidence"] or "unspecified"
        index["stats"]["confidence_breakdown"][c] = \
            index["stats"]["confidence_breakdown"].get(c, 0) + 1

    # Write the index
    with open(output_file, "w", encoding="utf-8") as fh:
        json.dump(index, fh, indent=2, ensure_ascii=False, default=str)

    # Report
    print(f"Index generated: {output_file}")
    print(f"  Files indexed: {len(entries)}")
    print(f"  Clients: {len(clients)}")
    print(f"  Source types: {len(source_types)}")
    print(f"  Date range: {index['stats']['date_range']['earliest']} to {index['stats']['date_range']['latest']}")
    print(f"  Parse errors: {len(errors)}")
    if errors:
        print("\n  Errors:")
        for err in errors:
            print(f"    - {err['file']}: {err['error']}")

    return index, errors


if __name__ == "__main__":
    import argparse
    parser = argparse.ArgumentParser(description="Generate _index.json for intelligence files")
    parser.add_argument("--intelligence-dir", default=DEFAULT_INTELLIGENCE_DIR,
                        help="Path to the intelligence/ folder")
    args = parser.parse_args()
    index, errors = generate_index(args.intelligence_dir)
