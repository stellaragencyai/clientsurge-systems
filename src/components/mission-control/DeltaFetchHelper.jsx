import { base44 } from '@/api/base44Client';

/**
 * Helper to fetch only new records since last timestamp.
 * Converts millisecond timestamp to ISO string for database query.
 */
export const deltaFetchHelpers = {
  /**
   * Fetch new conversation threads since lastTimestamp
   */
  async fetchNewConversationThreads(lastTimestamp) {
    const query = lastTimestamp > 0 ? { updated_date: { $gt: new Date(lastTimestamp).toISOString() } } : {};
    const threads = await base44.entities.ConversationThread.list('-updated_date', 50);
    return threads.filter(t => {
      const tDate = new Date(t.updated_date).getTime();
      return tDate > lastTimestamp;
    });
  },

  /**
   * Fetch new communication events since lastTimestamp
   */
  async fetchNewCommunicationEvents(lastTimestamp) {
    const threads = await base44.entities.CommunicationEvent.list('-updated_date', 100);
    return threads.filter(t => {
      const tDate = new Date(t.updated_date || t.created_date).getTime();
      return tDate > lastTimestamp;
    });
  },

  /**
   * Fetch new messages since lastTimestamp
   */
  async fetchNewMessages(lastTimestamp) {
    const messages = await base44.entities.Messages.list('-updated_date', 100);
    return messages.filter(m => {
      const mDate = new Date(m.updated_date || m.created_date).getTime();
      return mDate > lastTimestamp;
    });
  },

  /**
   * Generic delta fetch helper
   */
  async fetchDelta(entityName, lastTimestamp, limit = 100) {
    const EntityClass = base44.entities[entityName];
    if (!EntityClass) throw new Error(`Unknown entity: ${entityName}`);

    const records = await EntityClass.list('-updated_date', limit);
    return records.filter(r => {
      const rDate = new Date(r.updated_date || r.created_date).getTime();
      return rDate > lastTimestamp;
    });
  },
};