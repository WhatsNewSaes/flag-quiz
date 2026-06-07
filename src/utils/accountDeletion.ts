const SUPPORT_EMAIL = 'support@flagarcade.com';

export function buildAccountDeletionMailto(userId?: string, userEmail?: string | null) {
  const subject = 'Flag Arcade account deletion request';
  const body = [
    'Please delete my Flag Arcade account and associated cloud data.',
    '',
    userId ? `User ID: ${userId}` : 'User ID: ',
    userEmail ? `Email: ${userEmail}` : 'Email: ',
    '',
    'I understand local device data can be removed by uninstalling the app or clearing browser/app storage.',
  ].join('\n');

  return `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

export { SUPPORT_EMAIL };
