import { readData } from './jsonDB';
import { sendMail } from './mailer';

async function getAdminEmails() {
  const users = await readData('users.json');
  return users
    .filter((u) => u.role === 'Admin' && (u.isActive ?? true))
    .map((u) => u.email)
    .filter(Boolean);
}

export async function notifyNdcCreated(ndc) {
  const emails = await getAdminEmails();
  if (emails.length === 0) return;

  await sendMail({
    to: emails.join(','),
    subject: `New NDC Created — ${ndc.ndc_code}`,
    html: `
      <p>A new NDC has been generated in the NDC Management System.</p>
      <ul>
        <li><strong>NDC Code:</strong> ${ndc.ndc_code}</li>
        <li><strong>Product:</strong> ${ndc.product_name}</li>
        <li><strong>Created By:</strong> ${ndc.created_by}</li>
      </ul>
    `,
  });
}

export async function notifyStatusChanged({ type, recordLabel, oldStatus, newStatus, changedBy }) {
  const emails = await getAdminEmails();
  if (emails.length === 0) return;

  await sendMail({
    to: emails.join(','),
    subject: `${type} Status Changed — ${recordLabel}`,
    html: `
      <p>${type} <strong>${recordLabel}</strong> status was changed.</p>
      <ul>
        <li><strong>From:</strong> ${oldStatus || '—'}</li>
        <li><strong>To:</strong> ${newStatus}</li>
        <li><strong>Changed By:</strong> ${changedBy}</li>
      </ul>
    `,
  });
}

export async function notifyUserCreated({ name, email, role, createdBy }) {
  const emails = await getAdminEmails();
  if (emails.length === 0) return;

  await sendMail({
    to: emails.join(','),
    subject: `New User Created — ${name}`,
    html: `
      <p>A new user account has been created.</p>
      <ul>
        <li><strong>Name:</strong> ${name}</li>
        <li><strong>Email:</strong> ${email}</li>
        <li><strong>Role:</strong> ${role}</li>
        <li><strong>Created By:</strong> ${createdBy}</li>
      </ul>
    `,
  });
}