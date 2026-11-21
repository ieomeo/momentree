import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import styled from '@emotion/styled';
import CreateAdminModal from '../components/CreateAdminModal';
import IdentityModal from '../components/IdentityModal';
import MemberIdentityPanel from '../components/MemberIdentityPanel';
import RestrictModal from '../components/RestrictModal';
import { Button, Card, Muted } from '../components/ui';
import { useMe } from '../hooks/useMe';
import { adminAPI, isSuperAdmin } from '../services/api';
import { errorMessage, timeAgo } from '../services/format';
import { REPORT_ACTIONS } from '../types';
import type { IdentityView, ProcessStatus } from '../types';
import { color } from '../styles/theme';

const STATUS_LABEL: Record<ProcessStatus, string> = { pending: '미확인', reviewing: '검토 중', done: '처리 완료' };
const STATUS_COLOR: Record<ProcessStatus, string> = { pending: color.pink, reviewing: color.sand, done: color.greenSoft };

const TitleRow = styled.div`
  display: flex;
  align-items: center;
  gap: 0.7rem;
  margin-bottom: 1rem;
`;

const Stats = styled.div`
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 1rem;
  margin-bottom: 1.2rem;
  @media (max-width: 760px) { grid-template-columns: repeat(2, 1fr); }
`;

const Stat = styled.div<{ $bg: string }>`
  background: ${({ $bg }) => $bg};
  border-radius: 12px;
  padding: 1rem 1.2rem;
  .num { font-size: 2.2rem; font-weight: 800; }
`;

const Two = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
  @media (max-width: 960px) { grid-template-columns: 1fr; }
`;

const Item = styled.div`
  background: ${color.bg};
  border-radius: 10px;
  padding: 0.7rem 0.9rem;
  margin-top: 0.6rem;
  .top { display: flex; justify-content: space-between; gap: 0.6rem; align-items: center; }
  .actions { display: flex; gap: 0.4rem; flex-wrap: wrap; margin-top: 0.5rem; }
`;

const Badge = styled.span<{ $bg: string }>`
  background: ${({ $bg }) => $bg};
  border-radius: 999px;
  padding: 0.1rem 0.7rem;
  font-size: 0.8rem;
  font-weight: 700;
  white-space: nowrap;
`;

export default function AdminPage() {
  const qc = useQueryClient();
  const [adminModal, setAdminModal] = useState(false);
  const { data: me } = useMe();
  const [restrictId, setRestrictId] = useState<string | null>(null); // [추가] 이용 제한 기간을 고르는 신고
  const [identityView, setIdentityView] = useState<IdentityView | null>(null); // [추가] 위기 알림 작성자 개인정보
  const reports = useQuery({ queryKey: ['admin-reports'], queryFn: adminAPI.reports });
  const alerts = useQuery({ queryKey: ['admin-alerts'], queryFn: adminAPI.alerts });

  const run = async (fn: () => Promise<unknown>) => {
    try {
      await fn();
      await qc.invalidateQueries();
    } catch (e) {
      toast.error(errorMessage(e));
    }
  };

  // [추가] 처리 중인 위기 알림의 작성자 개인정보 확인 (열람 기록이 남아요)
  const openIdentity = async (alertId: string) => {
    try {
      setIdentityView(await adminAPI.identityForAlert(alertId));
      await qc.invalidateQueries({ queryKey: ['identity-logs'] });
    } catch (e) {
      toast.error(errorMessage(e));
    }
  };

  const reportList = reports.data ?? [];
  const alertList = alerts.data ?? [];
  const count = (list: { status: ProcessStatus }[], s: ProcessStatus) => list.filter((x) => x.status === s).length;

  return (
    <div>
      <TitleRow>
        <h2>운영자 대시보드</h2>
        <Button
          $variant="sand"
          style={{ padding: '0.25rem 0.7rem', fontSize: '0.8rem' }}
          onClick={() => setAdminModal(true)}
        >
          + 운영자 추가
        </Button>
      </TitleRow>

      <Stats>
        <Stat $bg={color.pink}><Muted>위기 알림 (미확인)</Muted><div className="num">{count(alertList, 'pending')}</div></Stat>
        <Stat $bg={color.yellow}><Muted>신고 대기</Muted><div className="num">{count(reportList, 'pending')}</div></Stat>
        <Stat $bg={color.sand}><Muted>검토 중</Muted><div className="num">{count(reportList, 'reviewing') + count(alertList, 'reviewing')}</div></Stat>
        <Stat $bg={color.greenSoft}><Muted>처리 완료</Muted><div className="num">{count(reportList, 'done') + count(alertList, 'done')}</div></Stat>
      </Stats>

      <Two>
        <Card>
          <h3>위기 알림</h3>
          {alertList.length === 0 && <Muted style={{ marginTop: '0.6rem' }}>감지된 위기 알림이 없어요.</Muted>}
          {alertList.map((a) => (
            <Item key={a.id}>
              <div className="top">
                <span>{timeAgo(a.createdAt)} · <Link to={`/post/${a.postId}`} style={{ textDecoration: 'underline' }}>글 보기</Link> · 키워드 {a.keywordCount}건</span>
                <Badge $bg={STATUS_COLOR[a.status]}>{STATUS_LABEL[a.status]}</Badge>
              </div>
              <div className="actions">
                {a.status === 'pending' && <Button $variant="sand" onClick={() => run(() => adminAPI.setAlertStatus(a.id, 'reviewing'))}>검토 시작</Button>}
                {a.status !== 'done' && <Button onClick={() => run(() => adminAPI.setAlertStatus(a.id, 'done'))}>조치 완료</Button>}
                {a.status !== 'done' && (
                  <Button $variant="ghost" onClick={() => openIdentity(a.id)}>작성자 개인정보 확인</Button>
                )}
                {/* [추가] 작성자에게 도움 안내 알림 보내기 */}
                {a.careSent ? (
                  <Muted as="span">도움 안내를 보냈어요</Muted>
                ) : (
                  <Button
                    $variant="pink"
                    onClick={() =>
                      run(async () => {
                        await adminAPI.sendCareNotice(a.id);
                        toast.success('작성자에게 도움 안내를 보냈어요');
                      })
                    }
                  >
                    작성자에게 도움 안내 보내기
                  </Button>
                )}
              </div>
            </Item>
          ))}
        </Card>

        <Card>
          <h3>신고 목록</h3>
          {reportList.length === 0 && <Muted style={{ marginTop: '0.6rem' }}>접수된 신고가 없어요.</Muted>}
          {reportList.map((r) => (
            <Item key={r.id}>
              <div className="top">
                <span>{r.targetType === 'post' ? '글' : '댓글'} · {r.reason}<br /><Muted as="span">“{r.targetPreview}”{r.detail ? ` — ${r.detail}` : ''}</Muted></span>
                <Badge $bg={STATUS_COLOR[r.status]}>{r.action ?? STATUS_LABEL[r.status]}</Badge>
              </div>
              {r.status !== 'done' && (
                <div className="actions">
                  {r.status === 'pending' && <Button $variant="sand" onClick={() => run(() => adminAPI.setReportStatus(r.id, 'reviewing'))}>검토 시작</Button>}
                  {REPORT_ACTIONS.map((act) => (
                    <Button
                      key={act}
                      $variant="ghost"
                      onClick={() => (act === '이용 제한' ? setRestrictId(r.id) : run(() => adminAPI.resolveReport(r.id, act)))}
                    >
                      {act}
                    </Button>
                  ))}
                </div>
              )}
              {/* [추가] 이용 제한을 풀어줄 수 있어요 (이의 제기가 받아들여졌을 때 등) */}
              {r.status === 'done' && r.action === '이용 제한' && (
                <div className="actions">
                  <Button
                    $variant="sand"
                    onClick={() =>
                      run(async () => {
                        await adminAPI.liftRestriction(r.id);
                        toast.success('이용 제한을 해제했어요');
                      })
                    }
                  >
                    제한 해제
                  </Button>
                </div>
              )}
            </Item>
          ))}
        </Card>
      </Two>

      <Card style={{ background: color.greenSoft, marginTop: '1rem' }}>
        신원 확인 · 외부 기관 공유는 가입 시 동의한 범위에서, 법률 검토된 절차에 따라서만 사용해요.
      </Card>

      {/* [추가] 총괄 운영자만: 모든 회원의 개인정보와 열람 기록 */}
      {me && isSuperAdmin(me) && <MemberIdentityPanel />}

      {adminModal && <CreateAdminModal onClose={() => setAdminModal(false)} />}
      {identityView && <IdentityModal view={identityView} onClose={() => setIdentityView(null)} />}
      {restrictId && (
        <RestrictModal
          onClose={() => setRestrictId(null)}
          onConfirm={(days) => {
            const id = restrictId;
            setRestrictId(null);
            void run(async () => {
              await adminAPI.resolveReport(id, '이용 제한', days);
              toast.success('이용 제한을 적용했어요');
            });
          }}
        />
      )}
    </div>
  );
}
