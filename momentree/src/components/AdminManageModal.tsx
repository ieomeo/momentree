import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import styled from '@emotion/styled';
import { Button, Modal, Muted } from './ui';
import { adminAPI } from '../services/api';
import { errorMessage } from '../services/format';
import { color } from '../styles/theme';

const Section = styled.div`
  margin-top: 1.1rem;
  h4 { margin-bottom: 0.4rem; }
`;

const Row = styled.div`
  background: ${color.bg};
  border-radius: 10px;
  padding: 0.6rem 0.9rem;
  margin-bottom: 0.5rem;
  .line { display: flex; justify-content: space-between; align-items: center; gap: 0.6rem; flex-wrap: wrap; }
  .warn { margin-top: 0.5rem; color: ${color.danger}; font-size: 0.9rem; }
  .actions { display: flex; gap: 0.5rem; margin-top: 0.5rem; justify-content: flex-end; }
`;

const dangerStyle = { background: color.danger, color: 'white' } as const;

// 총괄 운영자 전용: 다른 운영자 계정 삭제 + 이메일 접근 차단
export default function AdminManageModal({ onClose }: { onClose: () => void }) {
  const qc = useQueryClient();
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const admins = useQuery({ queryKey: ['admins'], queryFn: adminAPI.listAdmins });
  const blocked = useQuery({ queryKey: ['blocked-emails'], queryFn: adminAPI.blockedEmails });

  const run = async (fn: () => Promise<unknown>, message: string) => {
    try {
      await fn();
      toast.success(message);
      setConfirmId(null);
      await qc.invalidateQueries();
    } catch (e) {
      toast.error(errorMessage(e));
    }
  };

  const adminList = admins.data ?? [];
  const blockedList = blocked.data ?? [];

  return (
    <Modal onClose={onClose}>
      <h3>운영자 계정 관리</h3>
      <Muted style={{ marginTop: '0.3rem' }}>
        삭제한 운영자의 이메일은 로그인과 가입이 모두 막혀요. 총괄 운영자 계정은 삭제할 수 없어요.
      </Muted>

      <Section>
        <h4>운영자 계정 ({adminList.length})</h4>
        {adminList.length === 0 && <Muted>추가로 만든 운영자 계정이 없어요.</Muted>}
        {adminList.map((a) => (
          <Row key={a.id}>
            <div className="line">
              <span><strong>{a.nickname}</strong> · {a.email}</span>
              {confirmId !== a.id && (
                <Button style={dangerStyle} onClick={() => setConfirmId(a.id)}>삭제 · 접근 차단</Button>
              )}
            </div>
            {confirmId === a.id && (
              <>
                <p className="warn">
                  이 계정을 삭제하고 <strong>{a.email}</strong>의 웹서비스 접근을 차단할까요? 작성한 글은 “탈퇴한 사용자”로 남고, 고정은 해제되며 공지글은 숨김 처리돼요.
                </p>
                <div className="actions">
                  <Button $variant="sand" onClick={() => setConfirmId(null)}>취소</Button>
                  <Button
                    style={dangerStyle}
                    onClick={() => run(() => adminAPI.removeAdmin(a.id), '운영자 계정을 삭제하고 접근을 차단했어요')}
                  >
                    삭제하고 차단하기
                  </Button>
                </div>
              </>
            )}
          </Row>
        ))}
      </Section>

      <Section>
        <h4>접근 차단된 이메일 ({blockedList.length})</h4>
        {blockedList.length === 0 && <Muted>차단된 이메일이 없어요.</Muted>}
        {blockedList.map((b) => (
          <Row key={b.email}>
            <div className="line">
              <span>{b.email}</span>
              <Button $variant="sand" onClick={() => run(() => adminAPI.unblockEmail(b.email), '차단을 해제했어요')}>
                차단 해제
              </Button>
            </div>
          </Row>
        ))}
      </Section>

      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1rem' }}>
        <Button $variant="sand" onClick={onClose}>닫기</Button>
      </div>
    </Modal>
  );
}
