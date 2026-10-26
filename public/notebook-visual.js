import { Editor, Mark } from '@tiptap/core';
import Collaboration, { isChangeOrigin } from '@tiptap/extension-collaboration';
import CollaborationCaret from '@tiptap/extension-collaboration-caret';
import { prosemirrorJSONToYXmlFragment, yXmlFragmentToProseMirrorRootNode } from '@tiptap/y-tiptap';
export { CollaborationClient } from './collaboration-client.js';
export { createSharedDocument, commitSharedModel, readSharedModel } from './shared-model.js';
export * as SharedY from 'yjs';
import { Selection, TextSelection, AllSelection } from '@tiptap/pm/state';
import { Decoration, DecorationSet } from '@tiptap/pm/view';
import { DOMParser, DOMSerializer } from '@tiptap/pm/model';
import StarterKit from '@tiptap/starter-kit';
import { Markdown } from '@tiptap/markdown';
import { TableKit } from '@tiptap/extension-table';
import { TaskList, TaskItem } from '@tiptap/extension-list';
import { validInk, applyStudyColors } from './notebook-writing.js';
export { createAmbientLight } from './notebook-ambient.js';

export function selectionHighlight(state, focused, editable) {
  const selection = state.selection;
  if (focused || !editable || selection.empty || !(selection instanceof TextSelection || selection instanceof AllSelection)) return DecorationSet.empty;
  return DecorationSet.create(state.doc, [Decoration.inline(selection.from, selection.to, { class: 'study-selection' })]);
}

const choices = { font: ['sans', 'serif', 'mono', 'hand', 'book', 'humanist', 'typewriter'], ink: ['ink', 'rust', 'blue', 'plum'], size: ['14', '16', '18', '20', '24'] };
const StudyStyle = Mark.create({
  name: 'studyStyle',
  priority: 1000,
  addAttributes() {
    return Object.fromEntries(Object.entries(choices).map(([name, values]) => [name, {
      default: values[0],
      parseHTML: element => {
        if (name === 'ink' && element.classList.contains('study-ink-custom')) {
          const ink = element.getAttribute('data-study-ink');
          if (validInk(ink)) return ink;
        }
        return values.find(value => element.classList.contains(`study-${name}-${value}`)) || values[0];
      },
      renderHTML: () => ({}),
    }]));
  },
  parseHTML() { return [{ tag: 'span[class*="study-font-"]' }]; },
  renderHTML({ mark }) {
    const ink = mark.attrs.ink;
    return ['span', { class: `study-font-${mark.attrs.font} study-ink-${ink.startsWith('#') ? 'custom' : ink} study-size-${mark.attrs.size}`,
      ...(ink.startsWith('#') && validInk(ink) ? { 'data-study-ink': ink } : {}) }, 0];
  },
  renderMarkdown(node, helpers) {
    return `{{l4;${node.attrs.font};${node.attrs.ink};${node.attrs.size}}}${helpers.renderChildren(node.content || [])}{{/l4}}`;
  },
});

export function createVisualEditor(element, render, onUpdate, onSelection, onError) {
  let loading = false;
  let source = '';
  let formatting = false;
  let writing = true;
  let collaborative = null;
  function makeEditor() { return new Editor({
    element, injectCSS: false,
    extensions: [StarterKit.configure({ underline: false, undoRedo: false, link: { openOnClick: false, autolink: false } }),
      Markdown, TableKit.configure({ table: { resizable: false } }), TaskList, TaskItem.configure({ nested: true }), StudyStyle,
      ...(collaborative ? [Collaboration.configure({fragment:collaborative.fragment}), CollaborationCaret.configure({
        provider:{awareness:collaborative.awareness},user:{name:collaborative.user.display_name},
        render(user) {
          const cursor=element.ownerDocument.createElement('span'),label=element.ownerDocument.createElement('span');
          cursor.className='shared-caret';label.className='shared-caret-label';label.textContent=String(user.name || 'Participante').slice(0,60);
          cursor.append(label);return cursor;
        },
        selectionRender:()=>({class:'shared-selection'}),
      })] : [])],
    editorProps: {
      attributes: () => ({ class: 'visual-content markdown', role: 'textbox', 'aria-multiline': 'true', 'aria-readonly': String(!writing),
        'aria-label': element.getAttribute('data-page-label') || 'Anotações da página' }),
      decorations: state => selectionHighlight(state, element.contains(element.ownerDocument.activeElement), writing),
      handlePaste(view, event) {
        // Colagem externa entra como texto; impede estilos/HTML inesperados de documentos de terceiros.
        const text = event.clipboardData?.getData('text/plain');
        if (text === undefined) return false;
        event.preventDefault(); editor.commands.insertContent(render(text)); return true;
      },
    },
    onUpdate({ transaction }) {
      if (loading || (collaborative && isChangeOrigin(transaction))) return;
      try {
        applyStudyColors(element);
        source = editor.getMarkdown();
        const prefix = editor.markdown.serialize(editor.state.doc.cut(0, editor.state.selection.from).toJSON());
        onUpdate(source, Math.min(source.length, prefix.length), !formatting);
        onSelection(false);
      } catch (error) { onError('Não foi possível sincronizar a edição visual: ' + error.message); }
    },
    onSelectionUpdate() { if (!loading) onSelection(); },
    onFocus() { onSelection(); },
  }); }
  let editor = makeEditor();
  return {
    get editor() { return editor; },
    connect(fragment,awareness,user) {
      if ((collaborative?.fragment || null) === fragment) return;
      loading=true;
      try { editor.destroy();collaborative=fragment ? {fragment,awareness,user} : null;editor=makeEditor();source=null; }
      finally {loading=false;}
    },
    writeFragment(value,fragment) {
      const container=element.ownerDocument.createElement('div');container.innerHTML=render(value);
      const node=DOMParser.fromSchema(editor.schema).parse(container);
      prosemirrorJSONToYXmlFragment(editor.schema,node.toJSON(),fragment);
    },
    serializeFragment(fragment) {return editor.markdown.serialize(yXmlFragmentToProseMirrorRootNode(fragment,editor.schema).toJSON());},
    surface(value) {
      const container = element.ownerDocument.createElement('div');
      container.innerHTML = render(value);
      const document = DOMParser.fromSchema(editor.schema).parse(container);
      container.replaceChildren(DOMSerializer.fromSchema(editor.schema).serializeFragment(document.content, { document: element.ownerDocument }));
      container.className = 'visual-content markdown';
      applyStudyColors(container);
      return container;
    },
    reload() { source = null; },
    focus(caret) {
      if (caret === undefined) { editor.commands.focus(); return; }
      let from = 0; let to = editor.state.doc.content.size;
      while (from < to) {
        const middle = Math.ceil((from + to) / 2);
        const prefix = editor.markdown.serialize(editor.state.doc.cut(0, middle).toJSON());
        if (prefix.length <= caret) from = middle;
        else to = middle - 1;
      }
      const position = Math.max(1, Math.min(from, editor.state.doc.content.size - 1));
      editor.view.dispatch(editor.state.tr.setSelection(Selection.near(editor.state.doc.resolve(position))));
      editor.commands.focus();
    },
    load(value, editable) {
      writing = editable;
      editor.setEditable(editable, false);
      if (collaborative) { source=editor.getMarkdown(); return; }
      if (source === value) return;
      loading = true;
      try {
        const html = render(value);
        editor.commands.setContent(html, { emitUpdate: false, errorOnInvalidContent: true });
        source = value;
        applyStudyColors(element);
      } finally { loading = false; }
    },
    format(name) {
      formatting = true;
      try {
        const chain = editor.chain().focus();
        if (name === 'bold') chain.toggleBold().run();
        else if (name === 'italic') chain.toggleItalic().run();
        else if (/^h[123]$/.test(name)) chain.toggleHeading({ level: Number(name[1]) }).run();
        else if (name === 'list') chain.toggleBulletList().run();
        else if (name === 'code') chain.toggleCode().run();
      } finally { formatting = false; }
    },
    style(font, ink, size, remove = false) {
      for (const [name, value] of Object.entries({ font, ink, size: String(size) })) {
        if (!(name === 'ink' ? validInk(value) : choices[name].includes(value))) throw new Error('Estilo de escrita inválido.');
      }
      formatting = true;
      try {
        if (remove) editor.chain().focus().unsetMark('studyStyle').run();
        else editor.chain().focus().setMark('studyStyle', { font, ink, size: String(size) }).run();
      } finally { formatting = false; }
    },
  };
}
