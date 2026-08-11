---
description: Create or update the project constitution from interactive or provided principle inputs, ensuring all dependent templates stay in sync.
handoffs: 
  - label: Build Specification
    prompt: Implement the feature specification based on the updated constitution. I want to build...
---

## User Input

```text
$ARGUMENTS
```

You **MUST** consider the user input before proceeding (if not empty).

## Outline

You are updating the project constitution at `.specify/memory/constitution.md`. This file contains the foundational principles for the YM Soccer League Application. Your job is to (a) collect/derive concrete values, (b) maintain consistency with the established principles, and (c) propagate any amendments across dependent artifacts.

Follow this execution flow:

1. Load the existing constitution at `.specify/memory/constitution.md`.
   - Review all core principles and governance sections.

2. Process user-requested changes:
   - If user input supplies updates to principles, incorporate them thoughtfully.
   - Otherwise infer from existing repo context (README, docs, code patterns).
   - For governance dates: `RATIFICATION_DATE` is the original adoption date, `LAST_AMENDED_DATE` is today if changes are made.
   - `CONSTITUTION_VERSION` must increment according to semantic versioning rules:
     - MAJOR: Backward incompatible governance/principle removals or redefinitions.
     - MINOR: New principle/section added or materially expanded guidance.
     - PATCH: Clarifications, wording, typo fixes, non-semantic refinements.

3. Draft the updated constitution content:
   - Ensure each Principle section remains clear and actionable.
   - Preserve the six core principles (Code Simplicity, Accessibility First, Documentation Excellence, User-Centric Navigation, Visual Clarity, Performance & Responsiveness).
   - Ensure Governance section remains complete with amendment procedure, versioning policy, and compliance review.

4. Consistency propagation checklist:
   - Read `.specify/templates/plan-template.md` and ensure constitutional alignment checklist matches current principles.
   - Read `.specify/templates/spec-template.md` and verify all principles are represented in the compliance section.
   - Read `.specify/templates/tasks-template.md` and ensure task categories align with all principles.
   - Update any other project documentation (README.md, docs/) if principles affect user-facing guidance.

5. Produce a Sync Impact Report (update the HTML comment at top of constitution):
   - Version change: old → new
   - List of modified principles
   - Added/removed sections
   - Templates status (✅ updated / ⚠ pending)
   - Follow-up TODOs

6. Validation before final output:
   - All six core principles remain intact (unless explicitly revised).
   - Version line matches report.
   - Dates in ISO format YYYY-MM-DD.
   - Principles are declarative and testable.

7. Write the completed constitution back to `.specify/memory/constitution.md`.

8. Output a final summary to the user with:
   - New version and bump rationale.
   - Any files flagged for manual follow-up.
   - Suggested commit message (e.g., `docs: amend constitution to vX.Y.Z (principle updates)`).

Formatting & Style Requirements:

- Use Markdown headings as established in the template.
- Keep readability with reasonable line lengths (<100 chars).
- Maintain single blank line between sections.
- Avoid trailing whitespace.

If the user supplies partial updates (e.g., only one principle revision), still perform validation and version decision steps.

Do not create a new template; always operate on the existing `.specify/memory/constitution.md` file.

