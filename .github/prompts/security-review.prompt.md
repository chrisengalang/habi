---
description: "Review a Habi change or feature for authorization, data exposure, and Firestore access risks, then propose prioritized fixes."
---

# Security Review

Task:
1. Review data access paths in UI and src/services/api.js.
2. Check ownership validation for read and write operations.
3. Evaluate sharing-related access boundaries.
4. Identify risks by severity.
5. Propose concrete remediations with file-level impact.

Inputs:
- Scope to review: ${input:scope}
- Related files or PR summary: ${input:related_changes}

Output format:
- Findings ordered by severity
- Evidence and impacted paths
- Recommended fixes
- Validation checklist
- Residual risk
