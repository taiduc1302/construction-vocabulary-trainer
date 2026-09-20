import fs from 'node:fs';
import assert from 'node:assert/strict';

const deploy=fs.readFileSync(new URL('../.github/workflows/deploy-pages.yml',import.meta.url),'utf8');
const ai=fs.readFileSync(new URL('../AI_INSTRUCTIONS.md',import.meta.url),'utf8');

assert.match(deploy,/workflow_run:/,'Pages deploy must be triggered by the validation workflow, not by raw pushes');
assert.match(deploy,/permissions:[\s\S]*actions:\s*read/,'Pages deploy should have read-only Actions metadata access');
assert.match(deploy,/workflows:\s*\[["']Validate vocabulary["']\]/,'Pages deploy must wait for Validate vocabulary');
assert.match(deploy,/types:\s*\[completed\]/,'Pages deploy must run only after validation completes');
assert.match(deploy,/branches:\s*\[main\]/,'Pages deploy workflow_run must be scoped to main');
assert.doesNotMatch(deploy,/\n\s*push:/,'Pages deploy must not publish directly from push events');
assert.match(deploy,/workflow_run\.conclusion\s*==\s*['"]success['"]/,'Pages deploy job must require a successful validation result');
assert.match(deploy,/workflow_run\.head_sha\s*\|\|\s*github\.sha/,'Pages deploy must checkout the exact validated commit SHA');
assert.match(deploy,/github\.event_name\s*==\s*['"]workflow_dispatch['"][\s\S]*npm run validate/,'Manual Pages deploy must run the full validation gate');

assert.match(ai,/atomic/i,'AI maintenance rules must explicitly require atomic vocabulary changes');
assert.match(ai,/partial/i,'AI maintenance rules must explicitly forbid partial main-branch states');

console.log('Delivery contract OK: only validated main commits deploy, manual deploys revalidate, and AI vocabulary changes are atomic.');
