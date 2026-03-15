---
description: "Evaluate a Habi feature slice for release readiness with lint/test status, manual QA checklist, security notes, and go-no-go recommendation."
---

# Release Readiness

Task:
1. Summarize delivered scope and non-goals.
2. Confirm lint status and any unresolved issues.
3. Provide manual QA checklist by user flow.
4. Confirm security checks completed.
5. List deployment risks and mitigations.
6. Give go or no-go recommendation.

Inputs:
- Feature slice: ${input:feature_slice}
- What changed: ${input:change_summary}
- Known issues: ${input:known_issues}

Output format:
- Scope summary
- Quality gates
- QA checklist
- Security status
- Risk matrix
- Go or no-go
