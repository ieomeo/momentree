import ConfirmModal from '../components/ConfirmModal';
import { useEffect, useRef, useState, type ReactNode } from 'react';
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

const DetailDialog = styled.dialog`
  position: fixed;
  inset: 0;
  margin: auto;
  width: min(calc(100vw - 2rem), 900px);
  max-height: calc(100dvh - 2rem);
  overflow: auto;
  border: 1px solid #d8decb;
  border-radius: 16px;
  padding: clamp(1rem, 4vw, 2rem);
  color: inherit;
  background: #fff;
  &::backdrop { background: rgba(49, 39, 29, .42); }
  .detail-grid { display: grid; grid-template-columns: minmax(0, 1.3fr) minmax(0, 1fr); gap: 1.25rem; }
  .detail-section { background: #f8f5ed; border: 1px solid #e4e0d3; padding: 1rem; border-radius: 12px; overflow-wrap: anywhere; }
  textarea { width: 100%; padding: .65rem; border-radius: 8px; border: 1px solid #d8decb; font: inherit; resize: vertical; }
  @media (max-width: 640px) { .detail-grid { grid-template-columns: minmax(0, 1fr); } }
`;

function DetailRow({ summary, status, children, id, kind, memo }: {summary: string; status: string; children: ReactNode; id: string; kind: 'alert' | 'report'; memo: string}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [draft, setDraft] = useState(memo);
  const [busy, setBusy] = useState(false);
  const qc = useQueryClient();
  useEffect(() => { setDraft(memo); }, [memo]);
  return <Item>
    <Button type="button" $variant="ghost" onClick={() => dialog.current?.showModal()} style={{width:'100%',display:'flex',alignItems:'center',gap:'.7rem',textAlign:'left'}}>
      <span style={{flex:1,minWidth:0,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{summary}</span><small style={{flexShrink:0}}>{status} ›</small>
    </Button>
    <DetailDialog ref={dialog} aria-label={summary}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'start',gap:'1rem',marginBottom:'1rem'}}><h3>{kind === 'alert' ? '위기 알림 상세' : '신고 상세 · 처리'}</h3><Button type="button" $variant="sand" onClick={() => dialog.current?.close()}>닫기</Button></div>
      <div className="detail-grid">
      <section className="detail-section">{children}</section>
      <form className="detail-section" onSubmit={async e => {
        e.preventDefault(); setBusy(true);
        try { await adminAPI.saveMemo(kind,id,draft); await qc.invalidateQueries(); toast.success('운영자 메모를 저장했어요'); }
        catch (error) { toast.error(errorMessage(error)); } finally { setBusy(false); }
      }}>
        <label style={{display:'grid',gap:'.5rem'}}>운영자 메모 <textarea rows={4} maxLength={2000} value={draft} onChange={e => setDraft(e.target.value)} placeholder="검토 내용이나 후속 조치를 기록하세요" /></label>
        <Button type="submit" disabled={busy || draft === memo} style={{marginTop:'.6rem'}}>메모 저장</Button>
      </form>
      </div>
    </DetailDialog>
  </Item>;
}

const REPORTS_PER_PAGE = 3;

const STATUS_LABEL: Record<ProcessStatus, string> = { pending: '미확인', reviewing: '검토 중', done: '처리 완료' };
const STATUS_COLOR: Record<ProcessStatus, string> = { pending: color.pink, reviewing: color.sand, done: color.greenSoft };

const TitleRow = styled.div`
  display: flex;
  align-items: center;
  gap: 0.85rem;
  flex-wrap: wrap;
  margin-bottom: 1.25rem;
`;

const Stats = styled.div`
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 1rem;
  margin-bottom: 1.2rem;
  @media (max-width: 760px) { grid-template-columns: repeat(2, minmax(0, 1fr)); }
`;

const Stat = styled.button<{ $bg: string }>`
  text-align: left; cursor: pointer; font: inherit; color: inherit;
  border: 2px solid transparent;
  &[aria-pressed=true] { border-color: currentColor; }
  background: ${({ $bg }) => $bg};
  border-radius: 12px;
  padding: clamp(0.75rem, 3vw, 1.2rem);
  overflow-wrap: anywhere;
  .num { font-size: 2.2rem; font-weight: 800; }
`;

const Two = styled.div<{ $single: boolean }>`
  display: grid;
  grid-template-columns: ${({ $single }) => $single ? 'minmax(0, 1fr)' : 'repeat(2, minmax(0, 1fr))'};
  align-items: start;
  gap: 1rem;
  @media (max-width: 680px) { grid-template-columns: 1fr; }
`;

const Item = styled.div`
  background: ${color.bg};
  border-radius: 10px;
  padding: 0.2rem 0.3rem;
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
  const [filter, setStatusFilter] = useState<'all' | 'alerts' | 'reports' | 'reviewing' | 'done'>('all');
  const [reportPage, setReportPage] = useState(1);
  const setFilter = (next: typeof filter) => {
    setStatusFilter(next);
    setReportPage(1);
  };
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

  const chooseDecision = (id: string, action: ReportAction, hasDecision: boolean) => {
    if (action === '이용 제한') { setRestrictId(id); return; }
    if (action === '문제 없음' && !hasDecision) {
      void run(async () => {
        await adminAPI.resolveReport(id, action);
        toast.success('문제 없음으로 처리했어요');
      });
      return;
    }
    setDecision({ id, action });
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

  const shownAlerts = alertList.filter((a) => filter !== 'reports' && (filter === 'all' || (filter === 'alerts' ? a.status === 'pending' : a.status === filter)));
  const shownReports = reportList.filter((r) => filter !== 'alerts' && (filter === 'all' || (filter === 'reports' ? r.status === 'pending' : r.status === filter)));
  const reportPageCount = Math.max(1, Math.ceil(shownReports.length / REPORTS_PER_PAGE));
  const activeReportPage = Math.min(reportPage, reportPageCount);
  const pageReports = shownReports.slice((activeReportPage - 1) * REPORTS_PER_PAGE, activeReportPage * REPORTS_PER_PAGE);
  const pageNumbers = Array.from(new Set([1, activeReportPage - 1, activeReportPage, activeReportPage + 1, reportPageCount]))
    .filter((n) => n >= 1 && n <= reportPageCount).sort((a, b) => a - b);
  const period = (days: number) => days === 0 ? '영구' : days === 30 ? '1달 (30일)' : days === 90 ? '3달 (90일)' : `${days}일`;

  return (
    <div>
      <TitleRow>
        <h2>운영자 대시보드</h2>
        <Link to="/admin/keywords">위기 알림 키워드 →</Link>
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

      <Two $single={filter === 'alerts' || filter === 'reports'} style={{marginTop: '1rem'}}>
        {filter !== 'reports' && (
        <Card>
          <h3>위기 알림</h3>
          {shownAlerts.length === 0 && <Muted style={{ marginTop: '0.6rem' }}>이 상태의 위기 알림이 없어요.</Muted>}
          {shownAlerts.map((a) => (
            <DetailRow key={a.id} id={a.id} kind="alert" memo={a.memo ?? ''} summary={`${timeAgo(a.createdAt)} · 감지 ${a.keywordCount}건`} status={STATUS_LABEL[a.status]}>
              <div className="top">
                <span>{timeAgo(a.createdAt)} · {a.postId ? <Link to={`/post/${a.postId}`} style={{ textDecoration: 'underline' }}>글 보기</Link> : '글 삭제됨'} · 키워드 {a.keywordCount}건</span>
                <Badge $bg={STATUS_COLOR[a.status]}>{STATUS_LABEL[a.status]}</Badge>
              </div>
              <div className="actions">
                {a.status === 'done' && <Button $variant="sand" onClick={() => run(() => adminAPI.setAlertStatus(a.id, 'reviewing'))}>다시 검토</Button>}
                {a.status === 'pending' && <Button $variant="sand" onClick={() => run(() => adminAPI.setAlertStatus(a.id, 'reviewing'))}>검토 시작</Button>}
                {a.status !== 'done' && <Button onClick={() => run(() => adminAPI.setAlertStatus(a.id, 'done'))}>조치 완료</Button>}
                {a.status !== 'done' && (
                  <Button $variant="ghost" onClick={e => { e.currentTarget.closest('dialog')?.close(); void openIdentity(a.id); }}>작성자 개인정보 확인</Button>
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
            </DetailRow>
          ))}
        </Card>
        )}
        {filter !== 'alerts' && (

        <Card>
          <h3>신고 목록</h3>
          {shownReports.length === 0 && <Muted style={{ marginTop: '0.6rem' }}>이 상태의 신고가 없어요.</Muted>}
          {pageReports.map((r) => (
            <DetailRow key={r.id} id={r.id} kind="report" memo={r.memo ?? ''} summary={`${r.targetType === 'post' ? '글' : r.targetType === 'note' ? '쪽지' : '댓글'} · ${r.reason} · ${r.targetPreview}`} status={STATUS_LABEL[r.status]}>
              <div className="top">
                <span>{r.targetType === 'post' ? '글' : r.targetType === 'note' ? '쪽지' : '댓글'} · {r.reason}<br /><Muted as="span">“{r.targetPreview}”{r.detail ? ` — ${r.detail}` : ''}</Muted></span>
                <Badge $bg={STATUS_COLOR[r.status]}>{r.action ?? STATUS_LABEL[r.status]}</Badge>
              </div>
              {r.targetDeleted ? <Muted as="div">신고 대상 삭제됨 · 복구 불가</Muted> : r.targetType === 'post' && <Link to={`/post/${r.targetId}`}>신고 대상 글 보기</Link>}
              {r.action && <Muted as="div">최근 결정: {r.action}{r.days != null ? ` · ${period(r.days)}` : ''}{r.stopped ? ' · 게시 중단' : ''}</Muted>}
              <div className="actions">
                <Button $variant="sand" disabled={r.status === 'reviewing'} onClick={() => run(async () => {
                  await adminAPI.setReportStatus(r.id, 'reviewing');
                  if (filter !== 'all') setFilter('reviewing');
                })}>{r.status === 'reviewing' ? '검토 중' : r.status === 'done' ? '다시 검토' : '검토 시작'}</Button>
                {REPORT_ACTIONS.map((act) => (
                  <Button key={act} $variant="ghost"
                    onClick={e => { e.currentTarget.closest('dialog')?.close(); chooseDecision(r.id, act, !!r.action); }}>{act}</Button>
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
            </DetailRow>
          ))}
          {reportPageCount > 1 && <nav aria-label="신고 목록 페이지" style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap', marginTop: '0.75rem' }}>
            <Button type="button" $variant="sand" disabled={activeReportPage === 1} onClick={() => setReportPage(activeReportPage - 1)}>이전</Button>
            {pageNumbers.map((n, index) => <span key={n}>
              {index > 0 && n - pageNumbers[index - 1] > 1 && <span aria-hidden="true">… </span>}
              <Button type="button" aria-current={n === activeReportPage ? 'page' : undefined}
                aria-label={`${n}페이지`} $variant={n === activeReportPage ? 'primary' : 'sand'} onClick={() => setReportPage(n)}>{n}</Button>
            </span>)}
            <Button type="button" $variant="sand" disabled={activeReportPage === reportPageCount} onClick={() => setReportPage(activeReportPage + 1)}>다음</Button>
          </nav>}
        </Card>
        )}
      </Two>

      <Card style={{ background: color.greenSoft, marginTop: '1rem' }}>
        신원 확인 · 외부 기관 공유는 가입 시 동의한 범위에서, 법률 검토된 절차에 따라서만 사용해요.
      </Card>

      {/* [추가] 총괄 운영자만: 모든 회원의 개인정보와 열람 기록 */}
      {me && isSuperAdmin(me) && <MemberIdentityPanel />}

      {adminModal && <CreateAdminModal onClose={() => setAdminModal(false)} />}
      {identityView && <IdentityModal view={identityView} onClose={() => setIdentityView(null)} />}
      {decision && <ConfirmModal title={decision.action} confirmLabel="결정 적용"
        message={decision.action === '문제 없음' ? '이 신고의 되돌릴 수 있는 조치를 해제합니다. 삭제된 글이나 댓글은 복구되지 않으며, 다른 신고의 조치는 유지됩니다.' : '신고 대상을 숨기고 연결된 나뭇잎을 회수합니다. 이미 숨겨지거나 삭제된 대상은 추가 경고나 회수 없이 이 신고만 처리합니다.'}
        onClose={() => setDecision(null)} onConfirm={() => {
          const { id, action } = decision;
          setDecision(null);
          void run(async () => { await adminAPI.resolveReport(id, action); toast.success(action === '문제 없음' ? '문제 없음으로 처리했어요' : '신고를 처리 완료했어요'); });
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
