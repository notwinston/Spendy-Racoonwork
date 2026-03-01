---
task_type: bugfix
workflow: bug-fix
current_phase: B6
completed_phases: [B1, B2, B3, B4, B5]
uat_fast_forward: false
session_name: fix-supabase-missing-tables
decomposed: false
context_pressure: moderate
context_budget:
  peak_iteration_tokens: 61500
  context_window: 200000
  pressure_pct: 30.8
  estimated_cost_range: "$0.50-$2.00"
  file_count: 5
  file_categories:
    small: 5
    medium: 0
    large: 0
---

## Prompt Draft (final, validated)

See below for the full prompt to be written to ralph-plans/fix-supabase-missing-tables.md

## Promise Draft

ALL of the following conditions are met:
1. /workspace/supabase/combined_migration.sql exists and grep -c 'CREATE TABLE' returns >= 20
2. grep -c '&& !isDemoMode()' /workspace/app/src/services/plaidService.ts returns exactly 2
3. grep -c '&& !isDemoMode()' /workspace/app/src/stores/transactionStore.ts returns exactly 1
4. cd /workspace/app && npx tsc --noEmit exits with code 0
5. git log shows at least 2 new commits (one per completed phase)

## Validation Results (Round 2)
- clarity-checker: PASS
- completion-validator: NEEDS_REWORK (grep pattern refinement — addressed in final prompt)
- scope-safety-reviewer: PASS (LOW_RISK)
- phase-structure-analyzer: NEEDS_REWORK (absolute paths, literal edit text — addressed in final prompt)
- failure-mode-auditor: NEEDS_REWORK (budgetStore false positive — not in scope; Edit recovery — added)

All actionable issues incorporated into final prompt.

## Git Config
- Commit after each phase
- Do NOT push to remote

## Subagent Config
- No phases eligible — skipped
