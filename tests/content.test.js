import test from 'node:test';
import assert from 'node:assert/strict';
import { splitPages, pageCapacity, countLines, countWords } from '../public/pagination.js';
import { makeSecret, importKey, seal, open, createRoot, unlockRoot } from '../public/crypto.js';

test('paginação preserva todos os caracteres em vários tamanhos e fontes', () => {
  const content = 'Ideias, ação e revisão 📝. '.repeat(300) + '\n\n' + 'linha\n'.repeat(70);
  for (const size of ['small', 'medium', 'large']) {
    for (const font of [14, 16, 18, 20, 24]) {
      const pages = splitPages(content, size, font);
      assert.equal(pages.join(''), content);
      assert.ok(pages.length > 1);
      for (const page of pages) {
        assert.ok(countLines(page.replace(/\n$/, ''), size, font) <= pageCapacity(size, font).lines);
      }
    }
  }
  assert.deepEqual(splitPages(''), ['']);
  assert.throws(() => splitPages('texto', 'invalid'));
  assert.equal(countWords('Olá, mundo! versão 2 — bem-vindo'), 5);
});

test('conteúdo cifrado exige a chave e o contexto corretos', async () => {
  const key = await importKey(makeSecret());
  const otherKey = await importKey(makeSecret());
  const content = { title: 'Meu conteúdo privado', text: '# Ideias\nUma anotação.' };
  const envelope = await seal(key, content, 'page:account:notebook:page:1');
  assert.equal(JSON.stringify(envelope).includes(content.title), false);
  assert.deepEqual(await open(key, envelope, 'page:account:notebook:page:1'), content);
  await assert.rejects(open(otherKey, envelope, 'page:account:notebook:page:1'));
  await assert.rejects(open(key, envelope, 'page:other-account:notebook:page:1'));
  const tampered = { ...envelope, data: envelope.data.slice(4) + 'AAAA' };
  await assert.rejects(open(key, tampered, 'page:account:notebook:page:1'));
  assert.notEqual((await seal(key, content, 'page:account:notebook:page:1')).iv, envelope.iv);
});

test('senha de conteúdo desbloqueia a raiz somente para a conta correta', async () => {
  const password = 'uma frase secreta independente';
  const root = await createRoot(password, 'owner', 'keyset');
  const protectedNote = await seal(root.key, { text: 'conteúdo privado' }, 'note');
  const reopened = await unlockRoot(password, root.envelope, 'owner', 'keyset');
  assert.deepEqual(await open(reopened, protectedNote, 'note'), { text: 'conteúdo privado' });
  assert.equal(JSON.stringify(root.envelope).includes(password), false);
  await assert.rejects(unlockRoot('outra senha de conteúdo', root.envelope, 'owner', 'keyset'));
  await assert.rejects(unlockRoot(password, root.envelope, 'other', 'keyset'));
  await assert.rejects(unlockRoot(password, { ...root.envelope, kdf: { ...root.envelope.kdf, iterations: 1 } }, 'owner', 'keyset'));
});
