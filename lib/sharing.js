import { database, transaction } from './db.js';
import { HttpError, requireValue, uuid, envelope } from './validation.js';
import { signTicket } from './collaboration-ticket.js';

function publicKey(value) {
  requireValue(value?.kty==='EC' && value.crv==='P-256' && typeof value.x==='string' && typeof value.y==='string'
    && /^[A-Za-z0-9_-]{43}$/.test(value.x) && /^[A-Za-z0-9_-]{43}$/.test(value.y) && !value.d,'Chave pública inválida.');
  return {kty:'EC',crv:'P-256',x:value.x,y:value.y,ext:true};
}
export async function sharedAccess(client,user,book) {
  const row=(await client.query(`SELECT s.*,n.owner_id,u.display_name AS owner_name,k.public_key AS owner_public_key,a.key_envelope,p.envelope AS personal_envelope,
    CASE WHEN n.owner_id=$1 THEN 'owner' WHEN a.role IN ('editor','reader') THEN a.role ELSE 'reader' END AS permission
    FROM shared_notebooks s JOIN notebooks n ON n.id=s.notebook_id JOIN users u ON u.id=n.owner_id
    LEFT JOIN sharing_keys k ON k.owner_id=n.owner_id
    LEFT JOIN notebook_access a ON a.notebook_id=s.notebook_id AND a.user_id=$1
    LEFT JOIN notebook_personal p ON p.notebook_id=s.notebook_id AND p.user_id=$1
    WHERE s.notebook_id=$2 AND (n.owner_id=$1 OR (
      COALESCE(a.role,'')<>'blocked' AND (a.role IN ('editor','reader') OR s.visibility='public')
      AND NOT EXISTS (SELECT 1 FROM social_blocks b WHERE (b.owner_id=$1 AND b.blocked_id=n.owner_id) OR (b.blocked_id=$1 AND b.owner_id=n.owner_id))))`,[user,uuid(book)])).rows[0];
  requireValue(row,'Caderno indisponível para esta conta.',404);
  return row;
}
async function owner(client,user,book) {
  const row=(await client.query('SELECT revision FROM notebooks WHERE id=$1 AND owner_id=$2 FOR UPDATE',[uuid(book),user])).rows[0];
  requireValue(row,'Somente o dono pode alterar o acesso ao caderno.',403);
  return row;
}
export async function sharedState(client,user,book) {
  await client.query('SET TRANSACTION ISOLATION LEVEL REPEATABLE READ READ ONLY');
  const room=await sharedAccess(client,user,book);
  const updates=(await client.query('SELECT id,seq,payload FROM collaboration_updates WHERE notebook_id=$1 AND seq>$2 ORDER BY seq',[book,room.snapshot_seq])).rows;
  const participants=(await client.query("SELECT a.user_id,u.display_name,a.role FROM notebook_access a JOIN users u ON u.id=a.user_id WHERE a.notebook_id=$1 AND a.role IN ('editor','reader')",[book])).rows;
  return {...room,updates,participants};
}
export async function collaborationIdentity(user,session,book) {
  const found=(await database().query('SELECT owner_id FROM sessions WHERE token_hash=$1 AND expires_at>now()',[session])).rows[0];
  requireValue(found?.owner_id===user,'Sessão de colaboração encerrada.',401);
  return sharedAccess(database(),user,book);
}
export async function appendSharedUpdate(user,book,body) {
  uuid(body.id); const payload=envelope(body.payload,1400000);
  return transaction(async client=>{
    await client.query('SELECT notebook_id FROM shared_notebooks WHERE notebook_id=$1 FOR UPDATE',[book]);
    const room=await sharedAccess(client,user,book);
    requireValue(room.permission!=='reader','Este caderno permite apenas leitura.',403);
    const previous=(await client.query('SELECT seq,payload,sender_id,notebook_id FROM collaboration_updates WHERE id=$1',[body.id])).rows[0];
    if(previous) {
      requireValue(previous.sender_id===user && previous.notebook_id===book && ['v','iv','data'].every(key=>previous.payload[key]===payload[key]),'Identificador de edição já utilizado.',409);
      return {id:body.id,seq:previous.seq,payload:previous.payload};
    }
    const count=(await client.query("SELECT count(*)::int AS count,COALESCE(sum(octet_length(payload::text)),0)::bigint AS bytes FROM collaboration_updates WHERE notebook_id=$1",[book])).rows[0];
    requireValue(Number(count.bytes)<8*1024*1024 && count.count<10000,'Sincronize e compacte o caderno antes de continuar.',413);
    const recent=(await client.query("SELECT count(*)::int AS count FROM collaboration_updates WHERE sender_id=$1 AND created_at>now()-interval '1 minute'",[user])).rows[0];
    requireValue(recent.count<240,'Muitas edições enviadas. Aguarde a sincronização.',429);
    return (await client.query('INSERT INTO collaboration_updates (id,notebook_id,sender_id,payload) VALUES ($1,$2,$3,$4) RETURNING id,seq,payload',[body.id,book,user,payload])).rows[0];
  });
}
export async function sharing(user,method,url,body,session,secret) {
  const path=url.pathname;
  if(path==='/api/sharing/keys') {
    if(method==='POST') {
      const key=publicKey(body.publicKey), wrapped=envelope(body.privateEnvelope);
      await database().query('INSERT INTO sharing_keys (owner_id,public_key,private_envelope) VALUES ($1,$2,$3) ON CONFLICT (owner_id) DO NOTHING',[user.id,key,wrapped]);
    }
    if(['POST','GET'].includes(method)) return {key:(await database().query('SELECT public_key,private_envelope FROM sharing_keys WHERE owner_id=$1',[user.id])).rows[0] || null};
  }
  if(path==='/api/sharing/public-key' && method==='GET') {
    const found=(await database().query('SELECT public_key FROM sharing_keys WHERE owner_id=$1',[uuid(url.searchParams.get('person'))])).rows[0];
    requireValue(found,'Esta pessoa precisa entrar novamente no Libr4ry para habilitar o compartilhamento.',409);
    return found;
  }
  if(path==='/api/sharing/books' && method==='GET') {
    const ids=(await database().query(`SELECT s.notebook_id FROM shared_notebooks s JOIN notebooks n ON n.id=s.notebook_id
      LEFT JOIN notebook_access a ON a.notebook_id=s.notebook_id AND a.user_id=$1
      WHERE n.owner_id=$1 OR a.role IN ('editor','reader')`,[user.id])).rows;
    const books=[];
    for(const {notebook_id:id} of ids) {
      try { books.push(await sharedAccess(database(),user.id,id)); }
      catch(error) { if(!(error instanceof HttpError && error.status===404)) throw error; }
    }
    return {books};
  }
  if(path==='/api/sharing/profile' && method==='GET') {
    const person=uuid(url.searchParams.get('person'));
    const account=(await database().query('SELECT id,display_name FROM users WHERE id=$1',[person])).rows[0];
    requireValue(account,'Perfil não encontrado.',404);
    const ids=(await database().query(`SELECT DISTINCT s.notebook_id FROM shared_notebooks s JOIN notebooks n ON n.id=s.notebook_id
      LEFT JOIN notebook_access a ON a.notebook_id=s.notebook_id AND a.user_id=$1 AND a.role IN ('editor','reader')
      WHERE n.owner_id=$1 OR (s.visibility='public' AND a.user_id=$1)`,[person])).rows;
    const books=[];
    for(const {notebook_id:id} of ids) {
      try { const book=await sharedAccess(database(),user.id,id); if(book.visibility==='public' || book.permission!=='reader' || book.key_envelope) books.push(book); }
      catch(error) { if(!(error instanceof HttpError && error.status===404)) throw error; }
    }
    return {person:account,books};
  }
  const match=/^\/api\/sharing\/books\/([^/]+)(?:\/(enable|access|visibility|ticket|snapshot|personal))?$/.exec(path);
  if(!match) throw new HttpError(404,'Operação de compartilhamento não encontrada.');
  const book=uuid(match[1]).toLowerCase(), action=match[2];
  if(method==='GET' && !action) return transaction(client=>sharedState(client,user.id,book));
  if(method==='POST' && action==='personal') {
    await sharedAccess(database(),user.id,book);
    await database().query('INSERT INTO notebook_personal (notebook_id,user_id,envelope) VALUES ($1,$2,$3) ON CONFLICT (notebook_id,user_id) DO UPDATE SET envelope=EXCLUDED.envelope',[book,user.id,envelope(body.envelope)]);
    return {ok:true};
  }
  if(method==='POST' && action==='ticket') {
    await sharedAccess(database(),user.id,book);
    return {token:signTicket(user.id,book,session,secret)};
  }
  if(method==='POST' && action==='enable') {
    const snapshot=envelope(body.snapshot,1400000);
    return transaction(async client=>{
      const source=await owner(client,user.id,book);
      const current=(await client.query('SELECT notebook_id FROM shared_notebooks WHERE notebook_id=$1',[book])).rows[0];
      if(current) return {ok:true};
      requireValue(Number(source.revision)===body.revision,'O caderno mudou. Confirme o salvamento antes de compartilhar.',409);
      await client.query('INSERT INTO shared_notebooks (notebook_id,snapshot) VALUES ($1,$2)',[book,snapshot]);
      return {ok:true};
    });
  }
  if(action==='access' && method==='GET') {
    await owner(database(),user.id,book);
    return {access:(await database().query('SELECT a.user_id,a.role,u.display_name FROM notebook_access a JOIN users u ON u.id=a.user_id WHERE a.notebook_id=$1',[book])).rows};
  }
  if(action==='access' && method==='POST') return transaction(async client=>{
    await owner(client,user.id,book);
    const active=await client.query('SELECT notebook_id FROM shared_notebooks WHERE notebook_id=$1 FOR UPDATE',[book]);
    requireValue(active.rowCount,'Ative o compartilhamento antes de alterar o acesso.',409);
    const person=uuid(body.person).toLowerCase();
    requireValue(person!==user.id,'O dono já possui acesso completo.');
    requireValue(['editor','reader','blocked','remove'].includes(body.role),'Permissão inválida.');
    if(body.role==='remove') { await client.query('DELETE FROM notebook_access WHERE notebook_id=$1 AND user_id=$2',[book,person]); return {ok:true}; }
    const exists=(await client.query('SELECT id FROM users WHERE id=$1',[person])).rowCount;
    requireValue(exists,'Pessoa não encontrada.',404);
    if(body.role!=='blocked') {
      const friend=(await client.query(`SELECT 1 FROM friendships WHERE first_id=LEAST($1::uuid,$2::uuid) AND second_id=GREATEST($1::uuid,$2::uuid) AND accepted
        AND NOT EXISTS (SELECT 1 FROM social_blocks WHERE (owner_id=$1 AND blocked_id=$2) OR (owner_id=$2 AND blocked_id=$1))`,[user.id,person])).rowCount;
      requireValue(friend,'Adicione apenas amizades aceitas à whitelist.',403);
    }
    const count=(await client.query('SELECT count(*)::int AS count FROM notebook_access WHERE notebook_id=$1 AND user_id<>$2',[book,person])).rows[0].count;
    requireValue(count<30,'Limite de 30 entradas de acesso por caderno.');
    await client.query(`INSERT INTO notebook_access (notebook_id,user_id,role,key_envelope) VALUES ($1,$2,$3,$4)
      ON CONFLICT (notebook_id,user_id) DO UPDATE SET role=EXCLUDED.role,key_envelope=EXCLUDED.key_envelope`,[book,person,body.role,body.role==='blocked'?null:envelope(body.keyEnvelope)]);
    return {ok:true};
  });
  if(action==='visibility' && method==='POST') return transaction(async client=>{
    await owner(client,user.id,book);
    await client.query('SELECT notebook_id FROM shared_notebooks WHERE notebook_id=$1 FOR UPDATE',[book]);
    requireValue(['public','private'].includes(body.visibility),'Visibilidade inválida.');
    const visible=body.visibility==='public';
    if(visible) {
      requireValue(typeof body.key==='string' && /^[A-Za-z0-9+/]{43}=$/.test(body.key) && Buffer.from(body.key,'base64').length===32,'Chave de leitura pública inválida.');
      requireValue(typeof body.title==='string' && body.title.trim() && body.title.length<=120,'Título público inválido.');
    }
    const result=await client.query('UPDATE shared_notebooks SET visibility=$2,public_key=$3,public_title=$4 WHERE notebook_id=$1',[book,body.visibility,visible?body.key:null,visible?body.title.trim():null]);
    requireValue(result.rowCount,'Ative o compartilhamento antes de alterar a visibilidade.',409);
    return {ok:true};
  });
  if(action==='snapshot' && method==='GET') {
    const room=await sharedAccess(database(),user.id,book);
    requireValue(room.permission!=='reader','Somente editores acessam versões anteriores.',403);
    return {versions:(await database().query('SELECT id,payload,created_at,through_seq FROM collaboration_snapshots WHERE notebook_id=$1 ORDER BY id DESC LIMIT 5',[book])).rows};
  }
  if(action==='snapshot' && method==='POST') return transaction(async client=>{
    await client.query('SELECT notebook_id FROM shared_notebooks WHERE notebook_id=$1 FOR UPDATE',[book]);
    const room=await sharedAccess(client,user.id,book);
    requireValue(room.permission!=='reader','Somente editores podem confirmar versões.',403);
    const through=body.through;
    requireValue(Number.isSafeInteger(through) && through>=Number(room.snapshot_seq),'Posição de sincronização inválida.');
    const latest=(await client.query('SELECT COALESCE(max(seq),$2::bigint) AS seq FROM collaboration_updates WHERE notebook_id=$1',[book,room.snapshot_seq])).rows[0].seq;
    requireValue(through<=Number(latest),'A versão inclui edições ainda não confirmadas.',409);
    const payload=envelope(body.snapshot,1400000);
    await client.query('INSERT INTO collaboration_snapshots (notebook_id,payload,through_seq) VALUES ($1,$2,$3)',[book,room.snapshot,room.snapshot_seq]);
    await client.query('UPDATE shared_notebooks SET snapshot=$2,snapshot_seq=$3,updated_at=now() WHERE notebook_id=$1',[book,payload,through]);
    await client.query('DELETE FROM collaboration_updates WHERE notebook_id=$1 AND seq<=$2',[book,through]);
    await client.query('DELETE FROM collaboration_snapshots WHERE notebook_id=$1 AND id NOT IN (SELECT id FROM collaboration_snapshots WHERE notebook_id=$1 ORDER BY id DESC LIMIT 5)',[book]);
    return {ok:true};
  });
  throw new HttpError(404,'Operação de compartilhamento não encontrada.');
}
