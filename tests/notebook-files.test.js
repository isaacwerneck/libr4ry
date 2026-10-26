import test from 'node:test';
import assert from 'node:assert/strict';
import { setupNotebookFiles } from '../public/notebook-files.js';

test('importação confirma destino, espera cópia completa e repete salvamento sem reaplicar', async t => {
  const previous = { document:globalThis.document, Option:globalThis.Option };
  const nodes = new Map();
  const element = id => {
    if (!nodes.has(id)) nodes.set(id,{ id, value:'', hidden:false, disabled:false, inert:false, open:false, files:[], listeners:new Map(),
      addEventListener(name,fn) { this.listeners.set(name,fn); }, setAttribute() {}, contains() { return false; }, focus() {},
      reset() { element('markdown-file').files=[]; element('markdown-target').value=''; },
      querySelector() { return element('markdown-submit'); }, closest() { return element('markdown-dialog'); }, replaceChildren() { this.value=''; }, showModal() { this.open=true; }, close() { this.open=false; },
    });
    return nodes.get(id);
  };
  globalThis.document = { getElementById:element, activeElement:null };
  globalThis.Option = class { constructor(label,value) { this.text=label; this.value=value; } };
  const emit = (id,name) => element('markdown-'+id).listeners.get(name)({preventDefault(){}});
  const book = { id:crypto.randomUUID(),revision:2,generation:0,confirmed:0,title:'Original',subject:'Matéria',tags:[],tasks:[],
    pages:[{id:crypto.randomUUID(),title:'',content:'Original',size:'medium',font:16}] };
  let failed = true, copies=0, changes=0, shown, saved = false, attempt;
  try {
    setupNotebookFiles({books:()=>[book],current:()=>book,split:text=>[text],preview:false,
      async settle() { if (changes && !saved) throw new Error('Envio pendente'); },
      async store(copy) { copies++; if (!attempt) attempt=copy; assert.equal(copy,attempt); if(failed) throw new Error('Cópia pendente'); },
      changed() { changes++; },show(value) {shown=value;},notify() {},
    });
    emit('open','click');
    const file={name:'revisado.md',size:20,text:async()=>'# Revisado\nTexto novo'};
    element('markdown-file').files=[file]; await emit('file','change');
    element('markdown-target').value=book.id; emit('target','change');
    assert.match(element('markdown-summary').textContent,/associadas pela ordem/);
    await emit('form','submit');
    assert.equal(book.pages[0].content,'Original'); assert.equal(changes,0);
    assert.match(element('markdown-error').textContent,/Cópia pendente/);
    assert.equal(element('workspace').inert,false);
    failed=false; await emit('form','submit');
    assert.equal(copies,2); assert.equal(changes,1); assert.equal(attempt.pages[0].content,'Original');
    assert.equal(book.pages[0].content,'# Revisado\nTexto novo'); assert.equal(book.subject,'Matéria');
    assert.match(element('markdown-error').textContent,/preservada/);
    saved=true; await emit('form','submit');
    assert.equal(changes,1); assert.equal(copies,2); assert.equal(shown,book);
    assert.equal(element('markdown-dialog').open,false);
  } finally {
    for (const [name,value] of Object.entries(previous)) { if(value===undefined) delete globalThis[name]; else globalThis[name]=value; }
  }
});
