# ClientSurge Command Center — Foundation Contract

## Product role

The Command Center is the flagship authenticated workspace for ClientSurge OS. It is not a generic dashboard. It must answer four questions immediately:

1. What is happening across the business now?
2. What are the AI systems doing?
3. Where are revenue opportunities forming?
4. What requires a person’s attention next?

## Locked visual direction

- White and neutral operating workspace.
- Navy application navigation and framing.
- Controlled semantic blue for priority actions, progress, and selected states.
- Fine borders and restrained shadows.
- Dense enough for operational clarity, but never visually cramped.
- No decorative dark-dashboard treatment.
- No fabricated data or misleading zero values.

## Core modules

1. Business Pulse
2. Growth Snapshot
3. AI Workforce
4. Website Intelligence
5. Opportunities
6. Alerts
7. Activity Timeline
8. System Health
9. Daily Action Center

## Truthfulness contract

The Command Center must distinguish between:

- verified value,
- loading value,
- unavailable value,
- not connected,
- not configured,
- error,
- genuinely zero.

Unknown data must never be represented as zero. Placeholder production metrics are prohibited.

The shell defaults to an unverified operational state. A container must pass explicit verified readiness before the header may communicate an operational view, clear action queue, or trustworthy metric band.

## AI Workforce contract

Every AI service should be represented as an accountable worker with:

- name,
- business role,
- current status,
- latest meaningful activity,
- measurable outcome or workload,
- health state,
- clear path to details or intervention.

The system must not imply that an AI worker is active when the backing service is not connected or verified.

## Daily Action Center contract

This module contains only actions that require a person. Each item must include:

- clear title,
- consequence or reason,
- priority,
- direct action,
- no vague “review this” language when a specific action is known.

An empty action list is not the same as an all-clear. The shell may communicate “no action required” only when the action queue is explicitly verified.

## Accessibility contract

- Every module is a labeled section.
- Heading hierarchy remains logical.
- Status is not communicated by color alone.
- Interactive controls meet keyboard and focus requirements.
- Mobile layouts retain all essential actions and meanings.
- Live data updates must use appropriate announcement behavior without excessive interruption.

## Responsive contract

Desktop:

- Four-column metric band where space permits.
- Two-column module grid.
- Wide modules may span both columns.

Tablet:

- Two-column metric band.
- Flexible module grid.
- Workforce rows collapse without horizontal scrolling.

Mobile:

- Single-column layout.
- No horizontal overflow.
- Action controls move beneath content when necessary.
- Status and metric meaning remain visible.

## Scope boundary for this branch

This branch provides the visual and semantic foundation only. It does not:

- add a production route,
- connect live APIs,
- invent backend entities,
- change Base44 contracts,
- migrate the existing dashboard,
- create chart data,
- replace existing reporting logic.

After Design System 2.1 validation completes, this branch must be rebased onto the validated head before integration.
