# Nansen Plugins Marketplace

Private Cowork plugin marketplace for the Nansen team. Contains domain-specific plugins built on the nansen-core intelligence infrastructure.

## Plugins

| Plugin | Description | Version |
|--------|-------------|---------|
| **nansen-core** | Shared intelligence foundation. Extract, structure, and sync domain knowledge. Includes /setup, /onboarding, and Market Research skill. | 0.1.0 |
| **nansen-growth** | Growth domain plugin. Proactive industry research and solutions positioning for business development. | 0.1.0 |

## Setup for Team Members

1. Open Cowork settings
2. Add this repository as a marketplace source
3. Install the plugins you need (start with nansen-core)
4. Run `/setup` to configure your local environment
5. Run `/onboarding` for a guided walkthrough

## For Developers

### Validate plugins

```bash
./scripts/build.sh
```

### Release a new version

```bash
# Bump patch version (0.1.0 -> 0.1.1), add release notes
./scripts/build.sh patch "Fixed intelligence file naming"

# Bump minor version (0.1.0 -> 0.2.0)
./scripts/build.sh minor "Added competitive analysis skill"

# Then commit and push
git add -A
git commit -m "Release $(date +%Y-%m-%d)"
git push
```

The build script validates all plugins, bumps versions across all plugin.json files, creates archived zips in `dist/`, and updates `CHANGELOG.md`.

### Plugin Structure

Each plugin follows the Cowork plugin pattern:

```
plugin-name/
  .claude-plugin/
    plugin.json          # name, version, description, keywords
  skills/
    skill-name/
      SKILL.md           # skill instructions (YAML frontmatter + body)
      references/        # supporting docs
      templates/         # output templates
  commands/              # slash commands (optional)
    command-name.md
```

## Architecture

This marketplace is Tier 1 (nansen-core) and Tier 2 (domain plugins) of Nansen's three-tier plugin architecture. See the Architecture document for the full picture.

```
Tier 1: nansen-core        - shared schema, extraction, /setup, /onboarding
Tier 2: nansen-growth      - industry research, solutions positioning
        nansen-[domain]    - future domain plugins
Tier 3: nansen-arnold      - personal workflows (separate repo)
```
