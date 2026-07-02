import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { action, lead_ids, dry_run } = await req.json();
    const svc = base44.asServiceRole;

    // STEP 1: Identify fake/test leads
    if (action === 'identify') {
      const allLeads = await svc.entities.Leads.list('-created_date', 5000);

      const fakeLeads = allLeads.filter((l) => {
        const codes = l.quality_reason_codes || [];
        const email = (l.email || '').toLowerCase();
        const phone = (l.phone || '').replace(/\D/g, '');
        const name = (l.full_name || '').toLowerCase();
        const biz = (l.business_name || '').toLowerCase().trim();

        return (
          l.quality_review_status === 'quarantine_candidate' ||
          codes.includes('internal_test_full_name') ||
          codes.includes('example_email') ||
          codes.includes('test_phone_555') ||
          email.includes('@clientsurge.test') ||
          email.includes('@example.com') ||
          email.includes('@example.org') ||
          email.includes('crm-smoke+') ||
          phone.includes('5550') ||
          name.includes('test') ||
          ['fdsfdsf', 'dsfdsf', 'sadfsdaf', 'test', 'test business'].includes(biz) ||
          (biz.startsWith('clientsurge crm smoke'))
        );
      });

      return Response.json({
        total_leads: allLeads.length,
        fake_identified: fakeLeads.length,
        fake_lead_ids: dry_run ? undefined : fakeLeads.map((l) => l.id),
        sample: fakeLeads.slice(0, 20).map((l) => ({
          id: l.id,
          name: l.full_name,
          business: l.business_name,
          email: l.email,
          phone: l.phone,
          quality: l.quality_review_status,
          reason_codes: l.quality_reason_codes,
        })),
      });
    }

    // STEP 2: Quarantine fake leads (soft-delete approach)
    if (action === 'quarantine') {
      const ids = lead_ids || [];
      if (ids.length === 0) {
        return Response.json({ error: 'No lead_ids provided' }, { status: 400 });
      }

      const batchSize = 500;
      let updated = 0;

      for (let i = 0; i < ids.length; i += batchSize) {
        const batch = ids.slice(i, i + batchSize).map((id) => ({
          id,
          do_not_contact: true,
          quality_review_status: 'quarantined',
          onboarding_blocked_reason: 'Fake/test data quarantined by admin cleanup',
        }));
        try {
          await svc.entities.Leads.bulkUpdate(batch);
          updated += batch.length;
        } catch (err) {
          console.error('[quarantineFakeLeads] batch error:', err.message);
        }
      }

      return Response.json({
        success: true,
        quarantined: updated,
        message: `${updated} fake leads quarantined successfully`,
      });
    }

    // STEP 3: Permanently delete quarantined leads
    if (action === 'purge') {
      const quarantined = await svc.entities.Leads.filter(
        { quality_review_status: 'quarantined' },
        '-created_date',
        5000
      );

      if (dry_run) {
        return Response.json({
          would_delete: quarantined.length,
          ids: quarantined.map((l) => l.id),
        });
      }

      let deleted = 0;
      for (const lead of quarantined) {
        try {
          await svc.entities.Leads.delete(lead.id);
          deleted++;
        } catch (err) {
          console.error('[quarantineFakeLeads] delete error:', err.message);
        }
      }

      return Response.json({ success: true, deleted });
    }

    return Response.json({ error: 'Unknown action' }, { status: 400 });
  } catch (error) {
    console.error('[quarantineFakeLeads] error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});