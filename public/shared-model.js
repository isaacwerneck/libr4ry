import * as Y from 'yjs';
import { metadata,pageDate } from './storage.js';
import { preferences } from './notebook-preferences.js';
import { pageCapacity } from './pagination.js';
import { coverDesigns } from './cover-design.js';

const physical=['paper','cover','coverColor','finish','font','binding','ruling'];
const validId=value=>typeof value==='string' && /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
function check(ok) {if(!ok) throw new Error('Estrutura compartilhada inválida. A edição local foi preservada.');}
function assign(map,key,value) {if(JSON.stringify(map.get(key))!==JSON.stringify(value)) map.set(key,value);}
export function commitSharedModel(doc,book,initialize) {
  doc.transact(()=>{
    const meta=doc.getMap('metadata'), value=metadata(book);
    for(const key of ['title','subject','tags','covers']) assign(meta,key,value[key]);
    const prefs=doc.getMap('preferences');
    for(const key of physical) assign(prefs,key,value.preferences[key]);
    const order=doc.getArray('pages');
    for(const page of book.pages) {
      const known=order.toArray().includes(page.id);
      if(!known) order.push([page.id]);
      const fields=doc.getMap('page:'+page.id);
      for(const key of ['title','size','font']) assign(fields,key,page[key]);
      assign(fields,'date',page.date || '');
      if(!known) initialize(page,doc.getXmlFragment('text:'+page.id));
    }
    const taskOrder=doc.getArray('tasks');
    for(const task of book.tasks) {
      if(!taskOrder.toArray().includes(task.id)) taskOrder.push([task.id]);
      const fields=doc.getMap('task:'+task.id);
      assign(fields,'title',task.title);assign(fields,'done',task.done);
    }
  });
}
export function createSharedDocument(book,initialize) {
  const doc=new Y.Doc();
  commitSharedModel(doc,book,initialize);
  return doc;
}
export function readSharedModel(doc,book,serialize,changed) {
  const value=doc.getMap('metadata').toJSON(), prefs=doc.getMap('preferences').toJSON();
  check(typeof value.title==='string' && value.title.trim().length>0 && value.title.length<=120 && typeof value.subject==='string' && value.subject.length<=120
    && Array.isArray(value.tags) && value.tags.length<=30 && value.tags.every(tag=>typeof tag==='string' && tag.length<=60));
  const ids=doc.getArray('pages').toArray();
  check(ids.length>0 && ids.length<=500 && new Set(ids).size===ids.length && ids.every(validId));
  const existing=new Map((book.pages || []).map(page=>[page.id,page]));
  const pages=ids.map(id=>{
    const fields=doc.getMap('page:'+id).toJSON(), fragment=doc.getXmlFragment('text:'+id);
    check(typeof fields.title==='string' && fields.title.length<=120);
    pageCapacity(fields.size,fields.font);pageDate(fields.date || '');
    const previous=existing.get(id);
    const content=!previous || !changed || changed.has(fragment) ? serialize(fragment) : previous.content;
    check(typeof content==='string' && new TextEncoder().encode(content).length<=600000);
    return {...previous,id,...fields,content};
  });
  const tasks=doc.getArray('tasks').toArray();
  check(tasks.length<=100 && new Set(tasks).size===tasks.length && tasks.every(validId));
  const result=tasks.map(id=>{
    const task=doc.getMap('task:'+id).toJSON();
    check(typeof task.title==='string' && task.title.length<=200 && typeof task.done==='boolean');
    return {id,...task};
  });
  Object.assign(book,{title:value.title,subject:value.subject,tags:[...value.tags],covers:coverDesigns(value.covers),pages,tasks:result,
    preferences:preferences({...book.preferences,...prefs})});
  return book;
}
