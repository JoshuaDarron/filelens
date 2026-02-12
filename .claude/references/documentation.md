# Documentation Standards

This document defines the standards for maintaining documentation in the FileLens project.

## Core Rule

**Documentation is updated when applicable with every change made.** Any code change that affects behavior, configuration, architecture, or public interfaces must include corresponding documentation updates in the same commit.

## What Counts as Documentation

- `README.md` — Project overview, setup instructions, usage
- `.claude/CLAUDE.md` — Developer guidance, file structure, architecture notes
- `.claude/PRD.md` — Product requirements and feature specifications
- `references/` — Standards and reference material
- Inline code comments — Only where logic is non-obvious

## When to Update Documentation

Update documentation when a change:

- Adds, removes, or renames a file or directory referenced in the file structure
- Introduces a new component, hook, context, or service
- Changes the CSS architecture or theme system
- Modifies the build process, manifest, or extension configuration
- Adds or removes a dependency
- Changes user-facing behavior or UI
- Alters the AI features architecture or provider setup
- Fixes a bug that reveals a previously undocumented constraint

## When Documentation Is Not Required

- Pure formatting or whitespace changes
- Internal refactors that do not change file structure, public APIs, or behavior
- Dependency version bumps with no API changes

## Standards

### Keep It Accurate

- Never leave stale documentation. If a referenced file no longer exists, remove or update the reference.
- Verify documentation against the actual codebase before committing.

### Keep It Concise

- Use short, direct sentences.
- Prefer bullet points and tables over paragraphs.
- Only document what someone needs to know to work in the codebase — not every implementation detail.

### Keep It Organized

- Place documentation close to what it describes (co-located component docs, inline comments near tricky logic).
- Use consistent heading levels and formatting across all documentation files.
- Group related information under clear section headings.

### File Structure References

When documenting file structure, use tree format:

```
directory/
├── file.ext        # Brief description
├── subdirectory/
│   └── file.ext    # Brief description
└── file.ext        # Brief description
```

## Review Checklist

Before committing, verify:

- [ ] New files or directories are reflected in file structure documentation
- [ ] Changed behavior is described accurately in relevant docs
- [ ] Removed features or files have their documentation references cleaned up
- [ ] CLAUDE.md file structure section is current
