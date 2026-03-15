---
description: "Triage and fix a Habi bug with root-cause analysis, minimal patch plan, security impact check, and verification checklist."
---

# Triage Bug

Task:
1. Reproduce or infer likely repro path from the code.
2. Identify root cause and affected files.
3. Provide a minimal fix strategy.
4. Call out regressions and security implications.
5. Implement fix if scope is small; otherwise ask approval with 2 options.
6. Verify via lint and manual scenarios.

Inputs:
- Bug description: ${input:bug_description}
- Expected behavior: ${input:expected_behavior}
- Observed behavior: ${input:observed_behavior}

Output format:
- Repro notes
- Root cause
- Fix plan
- Security impact
- Verification checklist
- Follow-up hardening ideas
