/**
 * List open issues from a GitHub repository using the GitHub API
 * Requires GITHUB_TOKEN secret to be set
 */

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { owner, repo, state = 'open', per_page = 30 } = await req.json();

    if (!owner || !repo) {
      return Response.json(
        { error: 'Missing required fields: owner, repo' },
        { status: 400 }
      );
    }

    const token = Deno.env.get('GITHUB_TOKEN');
    if (!token) {
      return Response.json(
        { error: 'GitHub token not configured' },
        { status: 500 }
      );
    }

    const url = `https://api.github.com/repos/${owner}/${repo}/issues?state=${state}&per_page=${per_page}`;
    const response = await fetch(url, {
      headers: {
        'Authorization': `token ${token}`,
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'ClientSurge-API',
      },
    });

    if (!response.ok) {
      console.error(`GitHub API error: ${response.status}`, await response.text());
      return Response.json(
        { error: `GitHub API returned ${response.status}` },
        { status: response.status }
      );
    }

    const issues = await response.json();
    const formatted = issues.map(issue => ({
      number: issue.number,
      title: issue.title,
      state: issue.state,
      url: issue.html_url,
      created_at: issue.created_at,
      updated_at: issue.updated_at,
      labels: issue.labels.map(l => l.name),
      assignee: issue.assignee?.login || null,
    }));

    return Response.json({
      repository: `${owner}/${repo}`,
      count: formatted.length,
      issues: formatted,
    });
  } catch (error) {
    console.error('listGitHubIssues error:', error);
    return Response.json(
      { error: error.message },
      { status: 500 }
    );
  }
});