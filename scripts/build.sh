#!/bin/bash
# ============================================================================
# Nansen Plugins - Build & Release Script
# ============================================================================
# Validates plugin structure, bumps versions, creates archived zips in dist/,
# and updates CHANGELOG.md.
#
# Usage:
#   ./scripts/build.sh              # validate only (no version bump)
#   ./scripts/build.sh patch        # bump patch version (0.1.0 -> 0.1.1)
#   ./scripts/build.sh minor        # bump minor version (0.1.0 -> 0.2.0)
#   ./scripts/build.sh major        # bump major version (0.1.0 -> 1.0.0)
#   ./scripts/build.sh patch "Release notes here"  # bump + custom message
# ============================================================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
DIST_DIR="$ROOT_DIR/dist"
CHANGELOG="$ROOT_DIR/CHANGELOG.md"
BUMP_TYPE="${1:-}"
RELEASE_MSG="${2:-}"
ERRORS=0
WARNINGS=0

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log_ok()   { echo -e "  ${GREEN}[OK]${NC} $1"; }
log_warn() { echo -e "  ${YELLOW}[WARN]${NC} $1"; ((WARNINGS++)); }
log_err()  { echo -e "  ${RED}[ERROR]${NC} $1"; ((ERRORS++)); }
log_info() { echo -e "  ${BLUE}[INFO]${NC} $1"; }

echo ""
echo "============================================"
echo "  Nansen Plugins - Build & Release"
echo "============================================"
echo ""

# ---- Discover plugins ----
PLUGINS=()
for dir in "$ROOT_DIR"/*/; do
    if [ -f "$dir/.claude-plugin/plugin.json" ]; then
        PLUGINS+=("$(basename "$dir")")
    fi
done

if [ ${#PLUGINS[@]} -eq 0 ]; then
    log_err "No plugins found (no directories with .claude-plugin/plugin.json)"
    exit 1
fi

echo "Found ${#PLUGINS[@]} plugin(s): ${PLUGINS[*]}"
echo ""

# ---- Validate each plugin ----
echo "--- Validation ---"
echo ""

for plugin in "${PLUGINS[@]}"; do
    PLUGIN_DIR="$ROOT_DIR/$plugin"
    PLUGIN_JSON="$PLUGIN_DIR/.claude-plugin/plugin.json"

    echo "Plugin: $plugin"

    # Check plugin.json is valid JSON
    if python3 -c "import json; json.load(open('$PLUGIN_JSON'))" 2>/dev/null; then
        log_ok "plugin.json is valid JSON"
    else
        log_err "plugin.json is not valid JSON"
        continue
    fi

    # Check required fields
    NAME=$(python3 -c "import json; d=json.load(open('$PLUGIN_JSON')); print(d.get('name',''))")
    VERSION=$(python3 -c "import json; d=json.load(open('$PLUGIN_JSON')); print(d.get('version',''))")
    DESC=$(python3 -c "import json; d=json.load(open('$PLUGIN_JSON')); print(d.get('description',''))")

    if [ -n "$NAME" ]; then
        log_ok "name: $NAME"
    else
        log_err "missing 'name' in plugin.json"
    fi

    if [ -n "$VERSION" ]; then
        # Validate semver format
        if [[ "$VERSION" =~ ^[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
            log_ok "version: $VERSION"
        else
            log_err "version '$VERSION' is not valid semver (expected X.Y.Z)"
        fi
    else
        log_err "missing 'version' in plugin.json"
    fi

    if [ -n "$DESC" ]; then
        log_ok "description present (${#DESC} chars)"
    else
        log_warn "missing 'description' in plugin.json"
    fi

    # Check for skills or commands (at least one required)
    HAS_SKILLS=false
    HAS_COMMANDS=false

    if [ -d "$PLUGIN_DIR/skills" ]; then
        SKILL_COUNT=$(find "$PLUGIN_DIR/skills" -name "SKILL.md" | wc -l | tr -d ' ')
        if [ "$SKILL_COUNT" -gt 0 ]; then
            HAS_SKILLS=true
            log_ok "skills: $SKILL_COUNT found"
        else
            log_warn "skills/ directory exists but no SKILL.md files found"
        fi
    fi

    if [ -d "$PLUGIN_DIR/commands" ]; then
        CMD_COUNT=$(find "$PLUGIN_DIR/commands" -name "*.md" | wc -l | tr -d ' ')
        if [ "$CMD_COUNT" -gt 0 ]; then
            HAS_COMMANDS=true
            log_ok "commands: $CMD_COUNT found"
        else
            log_warn "commands/ directory exists but no .md files found"
        fi
    fi

    if ! $HAS_SKILLS && ! $HAS_COMMANDS; then
        log_err "plugin has no skills or commands"
    fi

    # Check for SKILL.md frontmatter (name + description)
    if $HAS_SKILLS; then
        while IFS= read -r skill_file; do
            skill_name=$(basename "$(dirname "$skill_file")")
            if head -1 "$skill_file" | grep -q "^---"; then
                log_ok "skill '$skill_name' has YAML frontmatter"
            else
                log_warn "skill '$skill_name' missing YAML frontmatter"
            fi
        done < <(find "$PLUGIN_DIR/skills" -name "SKILL.md")
    fi

    echo ""
done

# ---- Stop if validation errors ----
if [ $ERRORS -gt 0 ]; then
    echo -e "${RED}Validation failed with $ERRORS error(s) and $WARNINGS warning(s).${NC}"
    echo "Fix errors before building."
    exit 1
fi

echo -e "${GREEN}Validation passed${NC} ($WARNINGS warning(s))"
echo ""

# ---- Version bump (if requested) ----
if [ -n "$BUMP_TYPE" ]; then
    if [[ "$BUMP_TYPE" != "patch" && "$BUMP_TYPE" != "minor" && "$BUMP_TYPE" != "major" ]]; then
        echo -e "${RED}Invalid bump type: $BUMP_TYPE (use patch, minor, or major)${NC}"
        exit 1
    fi

    echo "--- Version Bump ($BUMP_TYPE) ---"
    echo ""

    for plugin in "${PLUGINS[@]}"; do
        PLUGIN_JSON="$ROOT_DIR/$plugin/.claude-plugin/plugin.json"
        OLD_VERSION=$(python3 -c "import json; print(json.load(open('$PLUGIN_JSON'))['version'])")

        IFS='.' read -r MAJOR MINOR PATCH <<< "$OLD_VERSION"

        case "$BUMP_TYPE" in
            major) MAJOR=$((MAJOR + 1)); MINOR=0; PATCH=0 ;;
            minor) MINOR=$((MINOR + 1)); PATCH=0 ;;
            patch) PATCH=$((PATCH + 1)) ;;
        esac

        NEW_VERSION="$MAJOR.$MINOR.$PATCH"

        # Update plugin.json
        python3 -c "
import json
with open('$PLUGIN_JSON', 'r') as f:
    data = json.load(f)
data['version'] = '$NEW_VERSION'
with open('$PLUGIN_JSON', 'w') as f:
    json.dump(data, f, indent=2)
    f.write('\n')
"
        log_ok "$plugin: $OLD_VERSION -> $NEW_VERSION"
    done

    echo ""
fi

# ---- Create archives ----
echo "--- Archiving to dist/ ---"
echo ""

mkdir -p "$DIST_DIR"

for plugin in "${PLUGINS[@]}"; do
    PLUGIN_DIR="$ROOT_DIR/$plugin"
    VERSION=$(python3 -c "import json; print(json.load(open('$PLUGIN_DIR/.claude-plugin/plugin.json'))['version'])")
    ZIP_NAME="${plugin}-${VERSION}.zip"
    ZIP_PATH="$DIST_DIR/$ZIP_NAME"

    # Remove old zip of same version if exists
    [ -f "$ZIP_PATH" ] && rm -f "$ZIP_PATH"

    # Create zip from the marketplace root (so paths are plugin-name/...)
    (cd "$ROOT_DIR" && find "$plugin" -type f \
        ! -name ".DS_Store" \
        ! -path "*/__pycache__/*" \
        | zip "$ZIP_PATH" -@ \
    ) > /dev/null 2>&1

    SIZE=$(du -h "$ZIP_PATH" | cut -f1 | tr -d ' ')
    log_ok "$ZIP_NAME ($SIZE)"
done

echo ""

# ---- Update CHANGELOG ----
if [ -n "$BUMP_TYPE" ]; then
    echo "--- Updating CHANGELOG ---"
    echo ""

    DATE=$(date +%Y-%m-%d)
    ENTRY="## $(date +%Y-%m-%d)"
    ENTRY+="\n"

    for plugin in "${PLUGINS[@]}"; do
        VERSION=$(python3 -c "import json; print(json.load(open('$ROOT_DIR/$plugin/.claude-plugin/plugin.json'))['version'])")
        ENTRY+="\n**$plugin** v$VERSION"
    done

    if [ -n "$RELEASE_MSG" ]; then
        ENTRY+="\n\n$RELEASE_MSG"
    fi

    ENTRY+="\n"

    if [ -f "$CHANGELOG" ]; then
        # Insert after the first line (the header)
        EXISTING=$(cat "$CHANGELOG")
        HEADER=$(head -1 "$CHANGELOG")
        REST=$(tail -n +2 "$CHANGELOG")
        echo -e "$HEADER\n\n$ENTRY\n$REST" > "$CHANGELOG"
    else
        echo -e "# Nansen Plugins - Changelog\n\n$ENTRY" > "$CHANGELOG"
    fi

    log_ok "CHANGELOG.md updated"
    echo ""
fi

# ---- Summary ----
echo "============================================"
echo -e "  ${GREEN}Build complete${NC}"
echo "============================================"
echo ""
echo "  Plugins: ${#PLUGINS[@]}"
echo "  Archives: $(ls "$DIST_DIR"/*.zip 2>/dev/null | wc -l | tr -d ' ') zip(s) in dist/"

if [ -n "$BUMP_TYPE" ]; then
    echo ""
    echo "  Next steps:"
    echo "    1. Review changes:  git diff"
    echo "    2. Stage:           git add -A"
    echo "    3. Commit:          git commit -m 'Release $(date +%Y-%m-%d)'"
    echo "    4. Push:            git push"
fi

echo ""
