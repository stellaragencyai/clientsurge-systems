import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // Try to authenticate as demo user
    // If this fails, it means the demo account doesn't exist yet
    // In production, you'd want a real test account set up in your auth system
    
    return Response.json({ 
      success: true,
      message: "Demo login credentials",
      email: "demo@clientsurge.com",
      note: "Please create a demo account in your auth system for testing"
    });
  } catch (error) {
    return Response.json({ 
      error: error.message,
      success: false 
    }, { status: 500 });
  }
});