import ConfirmModal from '../components/ConfirmModal';
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
import type { IdentityView, ProcessStatus, ReportAction } from '../types';
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

const Stat = styled.button<{ $bg: string }>`
  text-align: left; cursor: pointer; font: inherit; color: inherit;
  border: 2px solid transparent;
  &[aria-pressed=true] { border-color: currentColor; }
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
  const [filter, setFilter] = useState<'all' | 'alerts' | 'reports' | 'reviewing' | 'done'>('all');
  const [historyId, setHistoryId] = useState<string | null>(null);
  const [decision, setDecision] = useState<{ id: string; action: ReportAction } | null>(null);
  const history = useQuery({ queryKey: ['moderation-history', historyId], queryFn: () => adminAPI.reportHistory(historyId!), enabled: !!historyId });
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

  const shownAlerts = alertList.filter((a) => filter === 'all' || (filter === 'alerts' ? a.status === 'pending' : a.status === filter));
  const shownReports = reportList.filter((r) => filter === 'all' || (filter === 'reports' ? r.status === 'pending' : r.status === filter));
  const period = (days: number) => days === 0 ? '영구' : days === 30 ? '1달 (30일)' : days === 90 ? '3달 (90일)' : `${days}일`;

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
        <Stat type="button" aria-pressed={filter === 'alerts'} onClick={() => setFilter(filter === 'alerts' ? 'all' : 'alerts')} $bg={color.pink}><Muted>위기 알림 (미확인)</Muted><div className="num">{count(alertList, 'pending')}</div></Stat>
        <Stat type="button" aria-pressed={filter === 'reports'} onClick={() => setFilter(filter === 'reports' ? 'all' : 'reports')} $bg={color.yellow}><Muted>신고 대기</Muted><div className="num">{count(reportList, 'pending')}</div></Stat>
        <Stat type="button" aria-pressed={filter === 'reviewing'} onClick={() => setFilter(filter === 'reviewing' ? 'all' : 'reviewing')} $bg={color.sand}><Muted>검토 중</Muted><div className="num">{count(reportList, 'reviewing') + count(alertList, 'reviewing')}</div></Stat>
        <Stat type="button" aria-pressed={filter === 'done'} onClick={() => setFilter(filter === 'done' ? 'all' : 'done')} $bg={color.greenSoft}><Muted>처리 완료</Muted><div className="num">{count(reportList, 'done') + count(alertList, 'done')}</div></Stat>
      </Stats>
      <Button type="button" $variant="sand" onClick={() => setFilter('all')}>전체 보기</Button>

      <Two>
        <Card>
          <h3>위기 알림</h3>
          {shownAlerts.length === 0 && <Muted style={{ marginTop: '0.6rem' }}>이 상태의 위기 알림이 없어요.</Muted>}
          {shownAlerts.map((a) => (
            <Item key={a.id}>
              <div className="top">
                <span>{timeAgo(a.createdAt)} · {a.postId ? <Link to={`/post/${a.postId}`} style={{ textDecoration: 'underline' }}>글 보기</Link> : '글 삭제됨'} · 키워드 {a.keywordCount}건</span>
                <Badge $bg={STATUS_COLOR[a.status]}>{STATUS_LABEL[a.status]}</Badge>
              </div>
              <div className="actions">
                {a.status === 'done' && <Button $variant="sand" onClick={() => run(() => adminAPI.setAlertStatus(a.id, 'reviewing'))}>다시 검토</Button>}
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
          {shownReports.length === 0 && <Muted style={{ marginTop: '0.6rem' }}>이 상태의 신고가 없어요.</Muted>}
          {shownReports.map((r) => (
            <Item key={r.id}>
              <div className="top">
                <span>{r.targetType === 'post' ? '글' : '댓글'} · {r.reason}<br /><Muted as="span">“{r.targetPreview}”{r.detail ? ` — ${r.detail}` : ''}</Muted></span>
                <Badge $bg={STATUS_COLOR[r.status]}>{r.action ?? STATUS_LABEL[r.status]}</Badge>
              </div>
              {r.targetType === 'post' && <Link to={`/post/${r.targetId}`}>신고 대상 글 보기</Link>}
              {r.action && <Muted as="div">최근 결정: {r.action}{r.days != null ? ` · ${period(r.days)}` : ''}{r.stopped ? ' · 게시 중단' : ''}</Muted>}
              <div className="actions">
                {r.status !== 'reviewing' && <Button $variant="sand" onClick={() => run(() => adminAPI.setReportStatus(r.id, 'reviewing'))}>{r.status === 'done' ? '다시 검토' : '검토 시작'}</Button>}
                {REPORT_ACTIONS.map((act) => (
                  <Button key={act} $variant="ghost" onClick={() => act === '이용 제한' ? setRestrictId(r.id) : setDecision({ id: r.id, action: act })}>{act}</Button>
                ))}
                <Button $variant="sand" onClick={() => setHistoryId(historyId === r.id ? null : r.id)}>조치 이력</Button>
              </div>
              {historyId === r.id && <div aria-live="polite">
                {history.isPending ? '불러오는 중…' : history.isError ? '이력을 불러오지 못했어요.' :
                  history.data.length === 0 ? '새 정책으로 기록된 이력이 없어요.' : history.data.map((h) => <div key={h.id}>
                    {timeAgo(h.createdAt)} · {h.action}{h.days != null ? ` · ${period(h.days)}` : ''}{h.stopped ? ' · 게시 중단' : ''}
                    {h.leafDelta !== 0 ? ` · 나뭇잎 ${h.leafDelta > 0 ? '+' : ''}${h.leafDelta}` : ''}
                  </div>)}
              </div>}
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
      {decision && <ConfirmModal title={decision.action} confirmLabel="결정 적용"
        message={decision.action === '문제 없음' ? '이 신고 건의 기존 조치를 해제합니다. 다른 신고의 조치는 유지됩니다.' : '작성자에게 경고하고 게시를 중단합니다. 해당 콘텐츠로 적립된 나뭇잎이 회수됩니다.'}
        onClose={() => setDecision(null)} onConfirm={() => {
          const { id, action } = decision;
          setDecision(null);
          void run(() => adminAPI.resolveReport(id, action));
        }} />}
      {restrictId && (
        <RestrictModal
          initialDays={reportList.find((r) => r.id === restrictId)?.days ?? undefined}
          initialStop={reportList.find((r) => r.id === restrictId)?.stopped}
          onClose={() => setRestrictId(null)}
          onConfirm={(days, stop) => {
            const id = restrictId;
            setRestrictId(null);
            void run(async () => {
              await adminAPI.resolveReport(id, '이용 제한', days, stop);
              toast.success('이용 제한을 적용했어요');
            });
          }}
        />
      )}
    </div>
  );
}
