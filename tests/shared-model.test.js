import test from 'node:test';
import assert from 'node:assert/strict';
import * as Y from 'yjs';
import {createSharedDocument,commitSharedModel,readSharedModel} from '../public/shared-model.js';
const initial=()=>({title:'Mesmo caderno',subject:'Estudo',tags:[],tasks:[],preferences:{zoom:1,reading:false},
  pages:[{id:crypto.randomUUID(),title:'',content:'Original',size:'medium',font:16}]});
function seed(page,fragment) {const p=new Y.XmlElement('paragraph'),text=new Y.XmlText();text.insert(0,page.content);p.insert(0,[text]);fragment.insert(0,[p]);}
const serialize=fragment=>fragment.toArray().map(p=>p.toArray().map(t=>t.toString()).join('')).join('\n');
test('CRDT conserva escritas simultâneas, metadados e páginas novas sem transmitir câmera pessoal',()=>{
  const book=initial(),a=createSharedDocument(book,seed),b=new Y.Doc();
  Y.applyUpdate(b,Y.encodeStateAsUpdate(a));
  const pa=a.getXmlFragment('text:'+book.pages[0].id).get(0).get(0),pb=b.getXmlFragment('text:'+book.pages[0].id).get(0).get(0);
  pa.insert(0,'A ');pb.insert(0,'B ');
  Y.applyUpdate(a,Y.encodeStateAsUpdate(b));Y.applyUpdate(b,Y.encodeStateAsUpdate(a));
  assert.equal(serialize(a.getXmlFragment('text:'+book.pages[0].id)),serialize(b.getXmlFragment('text:'+book.pages[0].id)));
  assert.match(serialize(a.getXmlFragment('text:'+book.pages[0].id)),/A /);assert.match(serialize(a.getXmlFragment('text:'+book.pages[0].id)),/B /);
  const model=readSharedModel(a,{pages:[],preferences:{zoom:2,reading:true}},serialize);
  assert.equal(model.preferences.zoom,2);assert.equal(model.preferences.reading,true);
  model.pages.push({id:crypto.randomUUID(),title:'',content:'Nova',size:'medium',font:16});
  commitSharedModel(a,model,seed);Y.applyUpdate(b,Y.encodeStateAsUpdate(a));
  assert.equal(readSharedModel(b,{pages:[]},serialize).pages.length,2);
  a.destroy();b.destroy();
});
test('modelo compartilhado rejeita conteúdo estrutural inválido sem mutar a cópia anterior',()=>{
  const book=initial(),doc=createSharedDocument(book,seed),copy=structuredClone(book);
  doc.getMap('metadata').set('title','x'.repeat(121));
  assert.throws(()=>readSharedModel(doc,book,serialize),/inválida/);
  assert.deepEqual(book,copy);doc.destroy();
});
