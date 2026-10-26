import { Readable } from 'node:stream';
import { isIP } from 'node:net';
import { createRequestHandler, headers } from '../../server.js';

export function createNetlifyHandler(options = {}) {
  // A cota local complementa a regra de borda configurada na Function auth.
  const handle = createRequestHandler({ ...options, production: true, trustedProxy: '' });
  return async (request, context) => {
    const url = new URL(request.url);
    const responseHeaders = new Headers();
    const response = {
      headersSent: false, status: 200, body: null,
      setHeader(name, value) { responseHeaders.set(name, value); },
      writeHead(status, values) {
        this.status = status;
        for (const [name, value] of Object.entries(values)) this.setHeader(name, value);
        this.headersSent = true;
      },
      end(body) { this.body = body; },
    };
    headers(response, true);
    if (!url.pathname.startsWith('/api/')) return new Response(null, { status: 404, headers: responseHeaders });
    if (!isIP(context?.ip || '') || typeof context?.waitUntil !== 'function') {
      return Response.json({ error: 'Não foi possível verificar a requisição. Tente novamente.' }, { status: 503, headers: responseHeaders });
    }
    const input = request.body ? Readable.fromWeb(request.body) : Readable.from([]);
    Object.assign(input, {
      method: request.method, url: url.pathname + url.search, headers: Object.fromEntries(request.headers),
      socket: { remoteAddress: context.ip, encrypted: true }, waitUntil: promise => context.waitUntil(promise),
    });
    try { await handle(input, response); }
    finally { input.destroy(); }
    return new Response(request.method === 'HEAD' ? null : response.body, { status: response.status, headers: responseHeaders });
  };
}

let handle;
export default (request, context) => (handle ??= createNetlifyHandler())(request, context);
export const config = {
  path: '/api/*',
  excludedPath: ['/api/login', '/api/register', '/api/password-reset/request', '/api/password-reset/complete'],
};
