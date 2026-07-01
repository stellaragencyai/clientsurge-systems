# ClientSurge Release PR Checklist

## Scope

Describe exactly what changed and which workstream it belongs to.

## Required checks

- [ ] This PR is against the primary repo: `stellaragencyai/clientsurge-systems`.
- [ ] This PR is not using a copy/export repo as production source.
- [ ] Source files support the change.
- [ ] Test, smoke, QA, and internal records are not counted as production proof.
- [ ] Evidence is included below.

## Workstream checks

### Source of truth

- [ ] Build/install command is documented.
- [ ] Release path is documented.
- [ ] Rollback path is documented.

### Business proof

- [ ] Real production evidence is included.
- [ ] Dashboard status matches source records.

### Messaging proof

- [ ] Queued state alone is not counted as proof.
- [ ] Final provider status is reconciled.

### CRM proof

- [ ] Cleanup is non-destructive.
- [ ] Exclusion/quarantine reasons are stored.
- [ ] Duplicate candidates preserve review evidence.

### Public website proof

- [ ] Desktop and mobile routes were checked.
- [ ] Internal/admin routes are protected.
- [ ] CTA and conversion events were verified.

## Evidence

Paste evidence here. No evidence means not ready to merge.
