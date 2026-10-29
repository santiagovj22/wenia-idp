# Provenance of public bases and tools

The case allows the standard Backstage distribution, its official components and public base projects, as long as their origin is stated. This file lists every one. Add a row whenever a new public base is used.

## Code and components used

| Component | Origin | License | Where it is used | Added in |
| --- | --- | --- | --- | --- |
| Backstage (standard distribution, created with `@backstage/create-app` 0.9.3, app version 1.56.0) | https://github.com/backstage/backstage | Apache-2.0 | `backstage/` | Story 1.1 |

Official Backstage packages used later (scaffolder, catalog, GitHub integration) are listed here when they are added.
| cytopia/ansible:2.15 | https://hub.docker.com/r/cytopia/ansible | MIT | `ansible/` — environment bootstrap (story 1.3) | Story 1.3 |

## Development method and tooling (not shipped in the product)

| Tool | Origin | Use | Notes |
| --- | --- | --- | --- |
| BMAD Method (installed in `_bmad/` and `.claude/skills/`) | https://github.com/bmad-code-org/BMAD-METHOD | Planning workflow: brief, PRD, architecture, epics and stories | License free |
| Claude Code (Claude Sonnet 5.5) | Anthropic | AI-assisted development |

## Not used

- No code or configuration from any current or former employer.
- No Wenia infrastructure, accounts or credentials.
