import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import { Button, Card, Textarea } from './ui';
import { profileAPI } from '../services/api';
import { errorMessage, timeAgo } from '../services/format';

const STAGES = [[0,'잠든 씨앗'],[3,'숨 트는 씨앗'],[20,'여린 새싹'],[50,'자라는 떡잎과 본잎'],[100,'어린 묘목'],[170,'뻗어가는 어린 가지'],[270,'단단해지는 줄기'],[400,'햇살 머금은 나무'],[580,'꽃과 빛의 고리 나무'],[800,'모먼트리'],[1100,'산들바람이 머무는 나무'],[1500,'풀꽃과 이슬의 정원'],[2100,'노을과 별빛을 품은 나무'],[3000,'이웃 나무가 자라는 작은 숲'],[4000,'온기 가득한 마음의 숲']] as const;
export function GardenProfile({ fixedGrowth }: { fixedGrowth: boolean }) {
  const q=useQuery({queryKey:['garden-profile'],queryFn:profileAPI.garden});
  const [draft,setDraft]=useState<string|null>(null), [busy,setBusy]=useState(false);
  const qc=useQueryClient();
  if (!q.data) return <p>{q.isError?errorMessage(q.error):'정원을 불러오는 중이에요.'}</p>;
  const {total,bio}=q.data;
  const index=fixedGrowth ? 14 : STAGES.reduce((current,[min],i)=>total>=min?i:current,0);
  const stage=STAGES[index], next=STAGES.at(index+1);
  return <Card><h3>나의 프로필</h3>
    <form onSubmit={async e=>{e.preventDefault(); if(busy)return; setBusy(true); try {await profileAPI.save(draft??bio); await qc.invalidateQueries({queryKey:['garden-profile']}); void qc.invalidateQueries({queryKey:['profile']}); setDraft(null); toast.success('자기소개를 저장했어요.');} catch(e){toast.error(errorMessage(e));} finally{setBusy(false);}}}>
      <label>자기소개 (최대 500자 · 다른 회원에게 공개)<Textarea style={{display:'block',minHeight:104}} maxLength={500} value={draft??bio} onChange={e=>setDraft(e.target.value)} /></label>
      <Button disabled={busy || draft===null} type="submit">저장</Button>
    </form>
    <h3 style={{marginBlockStart: '1.6rem'}}>정원 성장 · {index+1}단계 {stage[1]}</h3>
    <img src={`/growth/${index+1}.webp`} alt={stage[1]} style={{width:'100%',maxWidth:360,display:'block',margin:'auto'}} />
    {!fixedGrowth && <>
    <p>지금까지 모은 나뭇잎 {total.toLocaleString()}개</p>
    <div role="progressbar" aria-label={next ? `다음 성장 단계: ${next[1]}` : '현재 공개된 성장 단계 완료'}
      aria-valuemin={0} aria-valuemax={100}
      aria-valuenow={next ? Math.round(100 * (total-stage[0]) / (next[0]-stage[0])) : 100}
      aria-valuetext={next ? `다음 단계까지 나뭇잎 ${next[0]-total}개` : '현재 공개된 마지막 단계'}
      style={{height:14, borderRadius:99, background:'#e5e9e3', overflow:'hidden', margin:'.6rem 0'}}>
      <div style={{height:'100%', borderRadius:99, background:'#61816b', width: next ? `${100 * (total-stage[0]) / (next[0]-stage[0])}%` : '100%'}} />
    </div>
    <p>{next ? `나뭇잎 ${(next[0]-total).toLocaleString()}개가 더 모이면 ‘${next[1]}’을 만나요.` : '지금은 온기 가득한 마음의 숲이에요. 이곳에서 잠시 쉬어가도 좋아요.'}</p>
    </>}
  </Card>;
}
export function GardenInbox(){
  const [page,setPage]=useState(0), [target,setTarget]=useState(''), [reason,setReason]=useState(''), [busy,setBusy]=useState(false);
  const q=useQuery({queryKey:['direct-inbox',page],queryFn:()=>profileAPI.inbox(page*20)});
  return <Card><h3>받은 쪽지</h3>
    {!q.data && <p>{q.isError?errorMessage(q.error):'쪽지를 불러오는 중이에요.'}</p>}
    {q.data?.notes.length===0 && <p>받은 쪽지가 없어요.</p>}
    {q.data?.notes.map(n=><article key={n.id} style={{borderBottom:'1px solid #ddd',padding:'1rem 0'}}>
      <Link to={`/profile/${n.sender_id}`}>{n.nickname}</Link> · {timeAgo(n.created_at)}
      <p style={{whiteSpace:'pre-wrap',overflowWrap:'anywhere'}}>{n.body}</p>
      {n.reported ? <span>신고 접수됨</span> : <Button onClick={()=>{setTarget(target===n.id?'':n.id);setReason('');}}>신고</Button>}
      {!n.reported && target===n.id && <form onSubmit={async e=>{e.preventDefault();if(busy)return;setBusy(true);try{await profileAPI.report(n.id,reason);setTarget('');await q.refetch();toast.success('신고를 접수했어요.');}catch(e){toast.error(errorMessage(e));}finally{setBusy(false);}}}>
        <label>신고 이유 <input value={reason} onChange={e=>setReason(e.target.value)} maxLength={250} required /></label> <Button type="submit" disabled={busy || !reason.trim()}>신고 접수</Button></form>}
    </article>)}
    <Button disabled={!page} onClick={()=>setPage(page-1)}>이전</Button> {page+1} <Button disabled={!q.data?.more} onClick={()=>setPage(page+1)}>다음</Button>
  </Card>;
}
