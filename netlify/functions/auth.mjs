import handler from './api.mjs';

export default handler;
export const config = {
  path: ['/api/login', '/api/register', '/api/password-reset/request', '/api/password-reset/complete'],
  rateLimit: { action: 'rate_limit', windowLimit: 15, windowSize: 60, aggregateBy: ['ip', 'domain'] },
};
