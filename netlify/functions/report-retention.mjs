import { purgeResolvedReports } from '../../lib/moderation.js';
import { purgeExpiredSessions } from '../../lib/auth.js';

export default async () => {
  const reports = await purgeResolvedReports();
  console.log('Denúncias resolvidas expiradas removidas: ' + reports);
  const sessions = await purgeExpiredSessions();
  console.log('Sessões expiradas removidas: ' + sessions);
  return new Response(null, { status: 204 });
};

export const config = { schedule: '0 3 * * *' };
