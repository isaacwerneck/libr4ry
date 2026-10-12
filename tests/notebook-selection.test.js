import test from 'node:test';
import assert from 'node:assert/strict';
import { Schema } from '@tiptap/pm/model';
import { EditorState, TextSelection, NodeSelection, AllSelection } from '@tiptap/pm/state';
import { selectionHighlight } from '../public/notebook-visual.js';

test('seleção fora do foco mantém destaque visual sem modificar conteúdo e desaparece na leitura', () => {
  const schema = new Schema({ nodes: { doc: { content: 'paragraph+' }, paragraph: { content: 'text*' }, text: {} } });
  const doc = schema.node('doc', null, [schema.node('paragraph', null, schema.text('Primeira ideia')),
    schema.node('paragraph', null, schema.text('Outra ideia'))]);
  const state = EditorState.create({ doc, selection: TextSelection.create(doc, 2, 20) });
  const original = doc.toJSON();
  const marks = selectionHighlight(state, false, true).find();
  assert.equal(marks.length, 1); assert.equal(marks[0].from, 2); assert.equal(marks[0].to, 20);
  assert.equal(marks[0].type.attrs.class, 'study-selection');
  assert.deepEqual(doc.toJSON(), original);
  assert.equal(selectionHighlight(state, true, true).find().length, 0);
  assert.equal(selectionHighlight(state, false, false).find().length, 0);
  const cursor = state.apply(state.tr.setSelection(TextSelection.create(doc, 3)));
  assert.equal(selectionHighlight(cursor, false, true).find().length, 0);
  const node = state.apply(state.tr.setSelection(NodeSelection.create(doc, 0)));
  assert.equal(selectionHighlight(node, false, true).find().length, 0);
  const all = state.apply(state.tr.setSelection(new AllSelection(doc)));
  assert.equal(selectionHighlight(all, false, true).find().length, 1);
});
