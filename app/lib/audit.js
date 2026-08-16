import { writeData } from './jsonDB';

export async function logAudit(
  action,
  performedBy,
  recordId = '',
  oldValue = '',
  newValue = ''
) {
  try {
    await writeData('audit.json', {
      action,
      performedBy,
      recordId,
      oldValue,
      newValue,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Audit Log Error:', error);
  }
}