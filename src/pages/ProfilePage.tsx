import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import { ProfileAvatar } from '../components/AuthorProfile';
import { Button, Card } from '../components/ui';
import { useMe } from '../hooks/useMe';
import { profileAPI } from '../services/api';
import { errorMessage, timeAgo } from '../services/format';

export default function ProfilePage() {
  const { id = '' } = useParams();
  return <Profile key={id} id={id} />;
}
function Profile({id}: {id: string}) {
  const [page,setPage] = useState(0), [open,setOpen] = useState(false), [body,setBody] = useState(''), [busy,setBusy] = useState(false);
  const me = useMe().data;
  const qc = useQueryClient();
  const q = useQuery({queryKey: ['profile',id,page], queryFn: () => profileAPI.get(id,page*20)});
  const p = q.data;
  if (!p) return <p>{q.isError ? errorMessage(q.error) : '프로필을 불러오는 중이에요.'}</p>;
  return <Card>
    <Link to="/feed">← 피드로</Link>
    <h2 style={{display:'flex', alignItems:'center', gap:'.5rem', flexWrap:'wrap'}}><ProfileAvatar avatar={p.avatar} size={48} />{p.nickname}
      {!p.own && <Button onClick={() => setOpen(!open)}>쪽지</Button>}
    </h2>
    <p style={{whiteSpace:'pre-wrap', overflowWrap:'anywhere'}}>{p.bio || '아직 작성한 자기소개가 없어요.'}</p>
    {open && <form onSubmit={async e => {
      e.preventDefault(); if (busy) return; setBusy(true);
      try { await profileAPI.send(id,body); setBody(''); setOpen(false); toast.success('쪽지를 보냈어요.'); void qc.invalidateQueries({queryKey:['me']}); void qc.invalidateQueries({queryKey:['leaf-logs']}); }
      catch(e) { toast.error(errorMessage(e)); } finally { setBusy(false); }
    }}><label>쪽지 내용 <textarea style={{display:'block',width:'100%'}} value={body} onChange={e=>setBody(e.target.value)} maxLength={1000} required /></label>
    <p>{me?.isSuperAdmin ? '총괄 운영자는 나뭇잎이 차감되지 않아요.' : '한 번 보내면 나뭇잎 30개가 소모돼요.'} 쪽지함에서는 답장할 수 없어요.</p><Button type="submit" disabled={busy || !body.trim()}>보내기</Button></form>}
    <h3>공개 글</h3>
    {!p.posts.length && <p>볼 수 있는 공개 글이 없어요.</p>}
    <ul>{p.posts.map(post => <li key={post.id}><Link to={`/post/${post.id}`}>{post.title}</Link> · {post.category} · {timeAgo(post.created_at)}</li>)}</ul>
    <Button disabled={!page} onClick={()=>setPage(page-1)}>이전</Button> {page+1} <Button disabled={!p.more} onClick={()=>setPage(page+1)}>다음</Button>
  </Card>;
}
