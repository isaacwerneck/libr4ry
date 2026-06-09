const http = require('http');
const fs = require('fs');
const path = require('path');

const rootDir = __dirname;
const port = Number(process.env.PORT || 8000);

const MIME_TYPES = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.md': 'text/markdown; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.txt': 'text/plain; charset=utf-8',
};

function sendJson(res, statusCode, payload) {
  res.writeHead(statusCode, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(payload));
}

function extractTitle(noteText) {
  const lines = (noteText || '')
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
  const heading = lines.find((line) => /^#{1,6}\s+/.test(line));
  return heading ? heading.replace(/^#{1,6}\s*/, '') : 'Your note';
}

function getNoteLines(noteText) {
  return (noteText || '')
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .slice(0, 12)
    .filter((line) => !/^#{1,6}\s+/.test(line));
}

function buildSummary(noteText) {
  const title = extractTitle(noteText);
  const bullets = getNoteLines(noteText).slice(0, 4);
  return `## Summary\n\n### ${title}\n\n${bullets.map((line) => `- ${line}`).join('\n') || '- Add the main ideas here.'}`;
}

function buildBulletList(noteText) {
  const bullets = getNoteLines(noteText).slice(0, 6);
  return `## Bullet points\n\n${bullets.map((line) => `- ${line}`).join('\n') || '- Add the main ideas here.'}`;
}

function buildExpandedOutline(noteText) {
  const title = extractTitle(noteText);
  return `## Expanded outline\n\n### ${title}\n\n- Main idea\n- Supporting detail\n- Example\n- Conclusion\n\n${noteText.slice(0, 700) || 'Add more detail to your note.'}`;
}

function buildEditDraft(prompt, noteText) {
  const title = extractTitle(noteText);
  const bullets = getNoteLines(noteText).slice(0, 5);
  return `## Suggested revision\n\n### ${title}\n\n${bullets.map((line) => `- ${line}`).join('\n') || '- Add the key points here.'}\n\n### Next step\n- Add examples or definitions\n- Keep the strongest points near the top`;
}

function buildQuestionAnswer(prompt, noteText) {
  const normalizedPrompt = (prompt || '').toLowerCase();
  const keywords = (normalizedPrompt.match(/[a-z0-9çãõáéíóú]+/g) || [])
    .filter((word) => word.length > 2 && !['this', 'that', 'what', 'when', 'where', 'why', 'how', 'help', 'note', 'your', 'about', 'with', 'from', 'into', 'summar', 'resume', 'question', 'answer'].includes(word));
  const lines = (noteText || '')
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (keywords.length) {
    const match = lines.find((line) => keywords.some((word) => line.toLowerCase().includes(word)));
    if (match) {
      return `Based on your note: ${match.replace(/^#{1,6}\s*/, '')}`;
    }
  }

  const title = extractTitle(noteText);
  return `This note is mainly about ${title}. I can answer questions from it, expand it, or turn it into a cleaner outline.`;
}

function generateLocalReply(prompt, context) {
  const cleanedPrompt = (prompt || '').toLowerCase();
  const noteText = (context || '').trim();

  if (cleanedPrompt.includes('summar') || cleanedPrompt.includes('resumo') || cleanedPrompt.includes('resume')) {
    return {
      text: 'I prepared a concise summary for the current note.',
      action: 'answer',
      markdown: buildSummary(noteText),
    };
  }

  if (cleanedPrompt.includes('bullet') || cleanedPrompt.includes('lista') || cleanedPrompt.includes('topics')) {
    return {
      text: 'I turned the note into a cleaner bullet list.',
      action: 'answer',
      markdown: buildBulletList(noteText),
    };
  }

  if (cleanedPrompt.includes('expand') || cleanedPrompt.includes('expandir') || cleanedPrompt.includes('develop')) {
    return {
      text: 'I drafted an expanded outline for this note.',
      action: 'insert',
      markdown: buildExpandedOutline(noteText),
    };
  }

  if (/\b(edit|rewrite|improve|organize|structure|revise|clean|update|make this better)\b/.test(cleanedPrompt)) {
    return {
      text: 'I prepared a markdown revision and inserted it into the current note.',
      action: 'insert',
      markdown: buildEditDraft(prompt, noteText),
    };
  }

  if (/\b(what|why|how|who|when|where|explain|doubt|question|answer)\b/.test(cleanedPrompt)) {
    return {
      text: buildQuestionAnswer(prompt, noteText),
      action: 'answer',
    };
  }

  return {
    text: 'Local mode is fully active. I can answer questions, summarize the note, and edit or expand the current markdown for you.',
    action: 'answer',
  };
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk.toString();
    });
    req.on('end', () => resolve(body));
    req.on('error', reject);
  });
}

async function handleChat(req, res) {
  try {
    const body = await readBody(req);
    const { prompt = '', context = '' } = JSON.parse(body || '{}');
    const localReply = generateLocalReply(prompt, context);
    sendJson(res, 200, localReply);
  } catch (error) {
    sendJson(res, 500, { error: error.message || 'Unexpected server error.' });
  }
}

function serveFile(res, filePath) {
  const ext = path.extname(filePath).toLowerCase();
  const contentType = MIME_TYPES[ext] || 'application/octet-stream';
  fs.readFile(filePath, (error, data) => {
    if (error) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('Not found');
      return;
    }

    res.writeHead(200, { 'Content-Type': contentType });
    res.end(data);
  });
}

const server = http.createServer((req, res) => {
  const requestUrl = new URL(req.url, 'http://127.0.0.1');

  if (req.method === 'POST' && requestUrl.pathname === '/api/chat') {
    handleChat(req, res);
    return;
  }

  if (req.method === 'GET' && requestUrl.pathname === '/api/health') {
    sendJson(res, 200, { status: 'ok' });
    return;
  }

  const safePath = decodeURIComponent(requestUrl.pathname === '/' ? '/index.html' : requestUrl.pathname);
  const filePath = path.join(rootDir, safePath.replace(/^\//, ''));

  if (!filePath.startsWith(rootDir)) {
    res.writeHead(403, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Forbidden');
    return;
  }

  fs.stat(filePath, (error, stat) => {
    if (!error && stat.isDirectory()) {
      serveFile(res, path.join(filePath, 'index.html'));
      return;
    }
    serveFile(res, filePath);
  });
});

if (require.main === module) {
  server.listen(port, () => {
    console.log(`libr4ry is running at http://127.0.0.1:${port}`);
  });
}

module.exports = {
  generateLocalReply,
  buildSummary,
  buildBulletList,
  buildExpandedOutline,
  buildEditDraft,
  buildQuestionAnswer,
};
