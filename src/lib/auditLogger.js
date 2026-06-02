import firebase from '@/api/firebaseClient';

export async function logAction({ companyId, userEmail, userName, action, entityType, entityId, details }) {
  await firebase.entities.AuditLog.create({
    company_id: companyId || '',
    user_email: userEmail,
    user_name: userName || '',
    action,
    entity_type: entityType || '',
    entity_id: entityId || '',
    details: details || ''
  });
}