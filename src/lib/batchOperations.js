/**
 * Batch database operations helper
 * Reduces round-trip latency by using bulkCreate instead of loops
 * Example: bulkInsertLeads(leadArray) instead of for-loop with .create()
 */

import { base44 } from "@/api/base44Client";

export async function bulkInsertWithChunking(
  entity,
  records,
  chunkSize = 100,
  options = {}
) {
  // Process records in chunks to avoid API limits
  const chunks = [];
  for (let i = 0; i < records.length; i += chunkSize) {
    chunks.push(records.slice(i, i + chunkSize));
  }

  const results = [];
  for (const chunk of chunks) {
    try {
      const inserted = await base44.entities[entity].bulkCreate(chunk);
      results.push(...inserted);
    } catch (error) {
      console.error(`Batch insert failed for ${entity}:`, error);
      if (options.stopOnError) throw error;
      // Continue with next chunk if stopOnError is false
    }
  }

  return results;
}

export async function bulkUpdateWithChunking(
  entity,
  updates,
  chunkSize = 50,
  idField = "id"
) {
  // Batch update records (note: SDK may require individual updates, handle gracefully)
  const results = [];
  const chunks = Math.ceil(updates.length / chunkSize);

  for (let i = 0; i < updates.length; i += chunkSize) {
    const chunk = updates.slice(i, i + chunkSize);

    try {
      for (const record of chunk) {
        const id = record[idField];
        const data = { ...record };
        delete data[idField];
        
        const updated = await base44.entities[entity].update(id, data);
        results.push(updated);
      }
    } catch (error) {
      console.error(`Batch update failed at chunk ${i / chunkSize}:`, error);
    }
  }

  return results;
}

export async function bulkDeleteWithChunking(
  entity,
  ids,
  chunkSize = 50
) {
  const results = [];

  for (let i = 0; i < ids.length; i += chunkSize) {
    const chunk = ids.slice(i, i + chunkSize);

    try {
      for (const id of chunk) {
        await base44.entities[entity].delete(id);
        results.push(id);
      }
    } catch (error) {
      console.error(`Batch delete failed:`, error);
    }
  }

  return results;
}

export function validateBatchData(records, requiredFields = []) {
  const errors = [];
  
  records.forEach((record, index) => {
    requiredFields.forEach(field => {
      if (!record[field]) {
        errors.push({
          index,
          field,
          message: `Missing required field: ${field}`,
        });
      }
    });
  });

  return errors;
}