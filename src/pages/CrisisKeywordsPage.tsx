import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Card, Muted } from '../components/ui';
import { adminAPI } from '../services/api';

export default function CrisisKeywordsPage() {
  const q = useQuery({ queryKey: ['admin-crisis-keywords'], queryFn: adminAPI.crisisKeywords });
  return <section>
    <Link to="/admin">← 운영자 대시보드</Link>
    <h2 style={{marginBlock: '1rem'}}>위기 알림 키워드</h2>
    <Muted>글 제목과 본문에서 검토가 필요한 표현을 찾습니다. 키워드가 감지되어도 자동으로 제재하지 않으며, 운영자가 문맥을 확인합니다.</Muted>
    {q.isPending && <p>목록을 불러오는 중이에요.</p>}
    {q.isError && <p role="alert">키워드 목록을 불러오지 못했어요.</p>}
    <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(min(100%, 300px),1fr))',gap:'1rem',marginTop:'1rem'}}>
      {Object.entries(q.data ?? {}).map(([group, terms]) => <Card key={group}>
        <h3>{group} <Muted as="span">{terms.length}개</Muted></h3>
        <ul style={{display:'flex',flexWrap:'wrap',gap:'.4rem',listStyle:'none',padding:0}}>
          {terms.map(term => <li key={term} style={{background:'#f1e7da',borderRadius:'1rem',padding:'.25rem .65rem'}}>{term}</li>)}
        </ul>
      </Card>)}
    </div>
  </section>;
}
