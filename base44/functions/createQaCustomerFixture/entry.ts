import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    if (req.method !== 'POST') {
      return Response.json({ error: 'Method not allowed' }, { status: 405 });
    }

    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Admin access required' }, { status: 403 });
    }

    const payload = await req.json().catch(() => ({}));
    const { full_name, business_name, email, phone, website, package_key } = payload;

    if (!full_name || !business_name || !email || !phone) {
      return Response.json({ error: 'full_name, business_name, email, and phone are required' }, { status: 400 });
    }

    // Determine plan from package_key
    const planMap = {
      starter_system: 'Starter System',
      growth_system: 'Growth System',
      pro_system: 'Pro System',
    };
    const plan = planMap[package_key] || 'Growth System';

    // Determine monthly rate
    const rateMap = {
      starter_system: 197,
      growth_system: 349,
      pro_system: 469,
    };
    const monthly_rate = rateMap[package_key] || 349;

    // Create or update ClientProject
    const existingProjects = await base44.asServiceRole.entities.ClientProject.filter({ client_email: email });
    let project;
    if (existingProjects && existingProjects.length > 0) {
      project = await base44.asServiceRole.entities.ClientProject.update(existingProjects[0].id, {
        client_name: full_name,
        business_name,
        plan,
        client_email: email,
        step_onboarding: 'complete',
        step_payment: 'complete',
      });
    } else {
      project = await base44.asServiceRole.entities.ClientProject.create({
        client_name: full_name,
        business_name,
        plan,
        client_email: email,
        step_onboarding: 'complete',
        step_payment: 'complete',
      });
    }

    // Create Order
    const order = await base44.asServiceRole.entities.Order.create({
      customer_email: email,
      customer_name: full_name,
      customer_phone: phone,
      business_name,
      plan_type: plan,
      total_monthly: monthly_rate,
      payment_status: 'paid',
      pipeline_status: 'Live',
      order_status: 'fully_live',
      client_project_id: project.id,
      notes: 'QA fixture — created by admin',
    });

    // Create Subscription
    const now = new Date();
    const nextMonth = new Date(now);
    nextMonth.setMonth(nextMonth.getMonth() + 1);

    const subscription = await base44.asServiceRole.entities.Subscription.create({
      order_id: order.id,
      plan_type: plan,
      status: 'active',
      current_period_start: now.toISOString(),
      current_period_end: nextMonth.toISOString(),
    });

    // Invite the user
    let invite_sent = false;
    let invite_status = 'not_sent';
    try {
      await base44.users.inviteUser(email, 'user');
      invite_sent = true;
      invite_status = 'invite_sent';
    } catch (inviteErr) {
      invite_status = inviteErr?.message?.includes('already') ? 'already_exists' : 'failed';
      console.warn('Invite warning:', inviteErr?.message);
    }

    const origin = req.headers.get('origin') || 'https://apexflow.base44.app';
    const portal_url = `${origin.replace(/\/$/, '')}/client-portal`;

    return Response.json({
      success: true,
      order_id: order.id,
      project_id: project.id,
      subscription_id: subscription.id,
      plan_type: plan,
      portal_url,
      invite_sent,
      invite_status,
      login_steps: [
        `Check ${email} for a Base44 invite email and activate your account.`,
        `Navigate to: ${portal_url}`,
        'Log in with your email and the password you set during activation.',
        'Explore the full client portal experience as this QA customer.',
      ],
    });

  } catch (error) {
    console.error('createQaCustomerFixture error:', error);
    return Response.json({ error: error.message || 'Failed to create QA customer fixture' }, { status: 500 });
  }
});