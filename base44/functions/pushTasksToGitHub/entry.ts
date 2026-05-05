/**
 * pushTasksToGitHub
 * Exports all ProjectTask records as GitHub Issues.
 * Pass: { owner: "your-github-username", repo: "your-repo-name" }
 * Optional: { dry_run: true } to preview without creating issues
 */
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const GITHUB_TOKEN = Deno.env.get('GITHUB_TOKEN');

const PRIORITY_LABELS = {
  critical: 'priority: critical',
  high: 'priority: high',
  medium: 'priority: medium',
  low: 'priority: low',
};

const STATUS_LABELS = {
  pending: 'status: pending',
  in_progress: 'status: in-progress',
  done: 'status: done',
  blocked: 'status: blocked',
};

async function githubRequest(path, method = 'GET', body = null) {
  const res = await fetch(`https://api.github.com${path}`, {
    method,
    headers: {
      'Authorization': `Bearer ${GITHUB_TOKEN}`,
      'Accept': 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      'Content-Type': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(`GitHub API error ${res.status}: ${JSON.stringify(data)}`);
  return data;
}

async function ensureLabels(owner, repo, tasks) {
  // Collect all needed labels
  const needed = new Set();
  tasks.forEach(t => {
    if (t.priority && PRIORITY_LABELS[t.priority]) needed.add(PRIORITY_LABELS[t.priority]);
    if (t.status && STATUS_LABELS[t.status]) needed.add(STATUS_LABELS[t.status]);
    if (t.domain) needed.add(`domain: ${t.domain}`);
    if (t.assigned_agent) needed.add(`agent: ${t.assigned_agent}`);
  });

  // Get existing labels
  let existing = [];
  try {
    existing = await githubRequest(`/repos/${owner}/${repo}/labels?per_page=100`);
  } catch {}
  const existingNames = new Set(existing.map(l => l.name));

  const labelColors = {
    'priority: critical': 'B60205',
    'priority: high': 'E4E669',
    'priority: medium': '0075CA',
    'priority: low': 'CFE2FF',
    'status: pending': 'EEEEEE',
    'status: in-progress': 'FEF2C0',
    'status: done': '0E8A16',
    'status: blocked': 'D93F0B',
  };

  for (const label of needed) {
    if (!existingNames.has(label)) {
      const color = labelColors[label] || 'EDEDED';
      try {
        await githubRequest(`/repos/${owner}/${repo}/labels`, 'POST', { name: label, color });
      } catch (e) {
        console.warn(`Could not create label "${label}":`, e.message);
      }
    }
  }
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Admin access required' }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    const { owner, repo, dry_run = false } = body;

    if (!owner || !repo) {
      return Response.json({ error: 'Missing required fields: owner, repo' }, { status: 400 });
    }

    if (!GITHUB_TOKEN) {
      return Response.json({ error: 'GITHUB_TOKEN secret not set' }, { status: 500 });
    }

    // Fetch all tasks
    console.log(`[pushTasksToGitHub] Fetching all ProjectTask records...`);
    const tasks = await base44.asServiceRole.entities.ProjectTask.list('task_number', 600);
    console.log(`[pushTasksToGitHub] Found ${tasks.length} tasks`);

    if (dry_run) {
      return Response.json({
        success: true,
        dry_run: true,
        total_tasks: tasks.length,
        sample: tasks.slice(0, 3).map(t => ({
          title: `[Task #${t.task_number}] ${t.title}`,
          labels: [
            t.priority ? PRIORITY_LABELS[t.priority] : null,
            t.status ? STATUS_LABELS[t.status] : null,
            t.domain ? `domain: ${t.domain}` : null,
            t.assigned_agent ? `agent: ${t.assigned_agent}` : null,
          ].filter(Boolean),
        })),
      });
    }

    // Ensure labels exist
    console.log(`[pushTasksToGitHub] Creating labels...`);
    await ensureLabels(owner, repo, tasks);

    // Get existing issues to avoid duplicates (check by title prefix)
    console.log(`[pushTasksToGitHub] Fetching existing issues...`);
    let existingIssues = [];
    let page = 1;
    while (true) {
      const batch = await githubRequest(`/repos/${owner}/${repo}/issues?state=all&per_page=100&page=${page}`);
      if (!batch.length) break;
      existingIssues = existingIssues.concat(batch);
      if (batch.length < 100) break;
      page++;
    }
    const existingTitles = new Set(existingIssues.map(i => i.title));
    console.log(`[pushTasksToGitHub] Found ${existingIssues.length} existing issues`);

    let created = 0;
    let skipped = 0;
    let errors = 0;

    for (const task of tasks) {
      const issueTitle = `[Task #${task.task_number}] ${task.title}`;

      if (existingTitles.has(issueTitle)) {
        skipped++;
        continue;
      }

      const labels = [
        task.priority ? PRIORITY_LABELS[task.priority] : null,
        task.status ? STATUS_LABELS[task.status] : null,
        task.domain ? `domain: ${task.domain}` : null,
        task.assigned_agent ? `agent: ${task.assigned_agent}` : null,
      ].filter(Boolean);

      const body_parts = [
        `**Domain:** ${task.domain || '—'}`,
        `**Priority:** ${task.priority || '—'}`,
        `**Status:** ${task.status || '—'}`,
        `**Assigned Agent:** ${task.assigned_agent || '—'}`,
        task.dependencies ? `**Dependencies:** ${task.dependencies}` : null,
        task.est_time ? `**Estimated Time:** ${task.est_time}` : null,
        task.notes ? `\n---\n**Notes:**\n${task.notes}` : null,
      ].filter(Boolean).join('\n');

      try {
        await githubRequest(`/repos/${owner}/${repo}/issues`, 'POST', {
          title: issueTitle,
          body: body_parts,
          labels,
          state: task.status === 'done' ? 'closed' : 'open',
        });
        created++;
        console.log(`[pushTasksToGitHub] Created issue: ${issueTitle}`);

        // GitHub rate limit — secondary rate limits on issue creation
        await new Promise(r => setTimeout(r, 800));
      } catch (err) {
        console.error(`[pushTasksToGitHub] Failed to create issue for task #${task.task_number}:`, err.message);
        errors++;
      }
    }

    return Response.json({
      success: true,
      total_tasks: tasks.length,
      created,
      skipped_duplicates: skipped,
      errors,
      message: `Done! ${created} issues created, ${skipped} skipped (already exist), ${errors} errors.`,
    });

  } catch (error) {
    console.error('[pushTasksToGitHub] Fatal error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});