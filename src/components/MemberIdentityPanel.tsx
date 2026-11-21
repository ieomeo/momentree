import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import styled from '@emotion/styled';
import IdentityModal from './IdentityModal';
import { Button, Card, Input, Muted } from './ui';
import { adminAPI } from '../services/api';
import { errorMessage, timeAgo } from '../services/format';
import { color } from '../styles/theme';
import type { IdentityView } from '../types';

const Row = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 0.6rem;
  padding: 0.5rem 0;
  border-bottom: 1px solid ${color.bg};
`;

// 총괄 운영자 전용: 모든 회원의 개인정보를 확인하고 열람 기록을 봅니다.
export default function MemberIdentityPanel() {
  const qc = useQueryClient();
  const members = useQuery({ queryKey: ['members'], queryFn: adminAPI.listMembers });
  const logs = useQuery({ queryKey: ['identity-logs'], queryFn: adminAPI.identityLogs });
  const [view, setView] = useState<IdentityView | null>(null);
  const [showLogs, setShowLogs] = useState(false);
  const [search, setSearch] = useState(''); // [추가] 닉네임 검색어

  const open = async (userId: string) => {
    try {
      setView(await adminAPI.viewIdentity(userId));
      await qc.invalidateQueries({ queryKey: ['identity-logs'] });
    } catch (e) {
      toast.error(errorMessage(e));
    }
  };

  // [추가] 닉네임에 검색어가 들어간 회원만 보여줍니다. (대소문자·공백 무시)
  const allMembers = members.data ?? [];
  const keyword = search.replace(/\s+/g, '').toLowerCase();
  const memberList = allMembers.filter((m) => m.nickname.replace(/\s+/g, '').toLowerCase().includes(keyword));
  const logList = logs.data ?? [];

  return (
    <Card style={{ marginTop: '1rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.6rem' }}>
        <h3>회원 개인정보</h3>
        <Button $variant="sand" style={{ padding: '0.25rem 0.8rem' }} onClick={() => setShowLogs((v) => !v)}>
          {showLogs ? '회원 목록 보기' : `열람 기록 (${logList.length})`}
        </Button>
      </div>
      <Muted style={{ margin: '0.3rem 0 0.6rem' }}>
        개인정보를 열 때마다 열람 기록이 남아요. 다른 운영자는 처리 중인 위기 알림의 작성자만 확인할 수 있어요.
      </Muted>

      {!showLogs && (
        <>
          <Input
            style={{ marginBottom: '0.6rem' }}
            placeholder="닉네임으로 회원 찾기"
            aria-label="닉네임으로 회원 검색"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <Muted style={{ marginBottom: '0.4rem' }}>
            {keyword ? `‘${search.trim()}’ 검색 결과 ${memberList.length}명` : `전체 회원 ${allMembers.length}명`}
          </Muted>
          {memberList.length === 0 && (
            <Muted>{keyword ? '해당 닉네임의 회원을 찾지 못했어요.' : '아직 회원이 없어요.'}</Muted>
          )}
        </>
      )}

      {!showLogs &&
        memberList.map((m) => (
          <Row key={m.id}>
            <span>
              <strong>{m.nickname}</strong> · {m.email}
              {m.role === 'admin' && <Muted as="span"> · 운영자</Muted>}
              {!m.hasIdentity && <Muted as="span"> · 개인정보 없음</Muted>}
            </span>
            <Button $variant="sand" style={{ padding: '0.25rem 0.8rem' }} onClick={() => open(m.id)}>
              개인정보 확인
            </Button>
          </Row>
        ))}

      {showLogs && (
        <>
          {logList.length === 0 && <Muted>아직 열람 기록이 없어요.</Muted>}
          {logList.map((l) => (
            <Row key={l.id}>
              <span>
                <strong>{l.adminNickname}</strong> → {l.targetNickname}
                <Muted as="span"> · {l.reason === 'crisis-alert' ? '위기 알림' : '총괄 운영자 열람'}</Muted>
              </span>
              <Muted as="span">{timeAgo(l.at)}</Muted>
            </Row>
          ))}
        </>
      )}

      {view && <IdentityModal view={view} onClose={() => setView(null)} />}
    </Card>
  );
}
