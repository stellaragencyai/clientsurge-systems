/**
 * Load admin settings from database
 */
export async function loadAdminSettings(base44) {
  try {
    const records = await base44.asServiceRole.entities.AdminSettings.list(null, 1);
    const settings = records?.[0] || {};
    return { settings, error: null };
  } catch (error) {
    return { settings: {}, error: error.message };
  }
}