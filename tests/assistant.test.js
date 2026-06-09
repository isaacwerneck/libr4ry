const test = require('node:test');
const assert = require('node:assert/strict');
const { generateLocalReply } = require('../server');

test('summarize requests return a summary answer', () => {
  const result = generateLocalReply('summarize this note', '# Study note\nMain idea\nSupporting point');
  assert.equal(result.action, 'answer');
  assert.match(result.text, /summary/i);
  assert.match(result.markdown, /## Summary/);
});

test('edit requests return markdown ready to insert', () => {
  const result = generateLocalReply('edit this note and improve it', '# Study note\nMain idea');
  assert.equal(result.action, 'insert');
  assert.match(result.markdown, /## Suggested revision/);
});

test('question prompts return a direct answer', () => {
  const result = generateLocalReply('what is this note about?', '# Study note\nMain idea');
  assert.equal(result.action, 'answer');
  assert.match(result.text, /This note is mainly about/i);
});

test('natural language overview requests are treated as summaries', () => {
  const result = generateLocalReply('can you give me a short overview of the main ideas?', '# Study note\nMain idea\nSupporting detail');
  assert.equal(result.action, 'answer');
  assert.match(result.markdown || '', /## Summary/);
});

test('natural language clarity requests are treated as edits', () => {
  const result = generateLocalReply('please make this note clearer and better organized', '# Study note\nMain idea');
  assert.equal(result.action, 'insert');
  assert.match(result.markdown || '', /## Suggested revision/);
});
