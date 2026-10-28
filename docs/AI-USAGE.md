# How GenAI was used, and how the results were verified

The case allows GenAI and AI-assisted tools and asks for a brief record of how they were used and verified. This is a running log: add an entry whenever AI materially shaped an artifact.

## Approach

- Tool: Claude Code with the BMAD Method skills, driven by the candidate.
- Working rule: the AI proposes, the candidate reviews every artifact before the next phase starts, and the candidate makes all commits. The AI does not commit.
- Verification rule: nothing is called working, passing, deployed or verified unless it was actually executed (see the evidence harness, `verify/`).

## Log

| Date | Phase | What the AI did | How it was verified |
| --- | --- | --- | --- |
| 2026-10-27 | Brief | Drafted the product brief from the case text | Candidate reviewed and corrected scope and goals |
| 2026-10-27 | PRD | Drafted the PRD with traceability to every line of the case | Two independent AI reviewers (feasibility, adversarial); candidate reviewed and made the scope decisions (vertical slice, fixed baseline endpoints, Docker, language) |
| 2026-10-27 | Architecture | Drafted the architecture spine with 18 decisions | Three independent AI reviewers (rubric, web verification of versions and APIs, adversarial); version claims checked against the npm registry and official docs; candidate reviewed and simplified it for PoC scope |
| 2026-10-27 | Epics and stories | Broke the PRD and architecture into 6 epics and 29 stories | Checked that every requirement maps to a story and that no story depends on a later one; candidate approved the structure |
| 2026-10-28 | Story 1.1 | Created the repository skeleton files (.gitattributes, .gitignore, .env.example, docs/PROVENANCE.md, docs/AI-USAGE.md, empty layout folders) | Checked against the story acceptance criteria: all folders present, .gitattributes has eol=lf, .env.example has all four keys, .env does not exist, Backstage 1.56.0 confirmed |

Entries for implementation stories are added as they are completed, including what was generated, the tests that verify it, and any AI output that was rejected or corrected.
