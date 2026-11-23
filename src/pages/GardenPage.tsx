import { useRef, useState } from 'react';
import type { ChangeEvent } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import styled from '@emotion/styled';
import { FaCamera } from 'react-icons/fa';
import { GardenInbox, GardenProfile } from '../components/GardenExtras';
import AdminManageModal from '../components/AdminManageModal';
import PostCard from '../components/PostCard';
import WithdrawModal from '../components/WithdrawModal';
import { Button, Card, Input, Modal, Muted } from '../components/ui';
import { useMe } from '../hooks/useMe';
import {
  DAILY_CAP, NICKNAME_MAX, WITHDRAW_BLOCK_DAYS,
  authAPI, isSuperAdmin, leafAPI, postAPI, socialAPI,
} from '../services/api';
import { errorMessage, timeAgo, todayKey } from '../services/format';
import { fileToAvatar } from '../services/image';
import { color } from '../styles/theme';

type Tab = 'profile' | 'inbox' | 'posts' | 'subs' | 'leaves' | 'blocks' | 'settings';
const TABS: { key: Tab; label: string }[] = [
  { key: 'profile', label: '프로필' },
  { key: 'inbox', label: '쪽지' },
  { key: 'posts', label: '내 글' },
  { key: 'subs', label: '구독 중' },
  { key: 'leaves', label: '나뭇잎' },
  { key: 'blocks', label: '차단 관리' },
  { key: 'settings', label: '설정' },
];

const Layout = styled.div`
  display: grid;
  grid-template-columns: 220px 1fr;
  gap: 1.5rem;
  align-items: start;
  @media (max-width: 760px) { grid-template-columns: 1fr; }
`;

const Profile = styled.aside`
  background: ${color.bg};
  border: 1.5px solid ${color.border};
  border-radius: 12px;
  padding: 1.2rem;
  text-align: center;
`;

const AvatarButton = styled.button`
  position: relative;
  width: 96px;
  height: 96px;
  margin: 0 auto 0.5rem;
  display: block;
  padding: 0;
  border: 2px solid ${color.border};
  border-radius: 50%;
  background: ${color.green};
  overflow: hidden;
  cursor: pointer;
  img { width: 100%; height: 100%; object-fit: cover; display: block; }
  .empty { display: flex; align-items: center; justify-content: center; width: 100%; height: 100%; font-size: 1.6rem; color: ${color.brown}; }
  &:hover { filter: brightness(0.95); }
`;

const AvatarActions = styled.div`
  display: flex;
  justify-content: center;
  gap: 0.4rem;
  margin-bottom: 0.8rem;
`;

const TabButton = styled.button<{ $active: boolean }>`
  display: block;
  width: 100%;
  text-align: left;
  margin-top: 0.4rem;
  padding: 0.55rem 0.9rem;
  border: none;
  border-radius: 10px;
  cursor: pointer;
  background: ${({ $active }) => ($active ? color.greenSoft : 'transparent')};
  font-weight: ${({ $active }) => ($active ? 800 : 500)};
`;

const Summary = styled.div`
  background: ${color.greenSoft};
  border-radius: 12px;
  padding: 1.2rem 1.5rem;
  margin-bottom: 1rem;
  display: flex;
  align-items: center;
  gap: 1.5rem;
  flex-wrap: wrap;
  img { height: 84px; width: auto; }
  .big { font-size: 2.6rem; font-weight: 800; line-height: 1.1; }
  .cap { flex: 1; min-width: 220px; }
`;

const Track = styled.div`
  height: 12px;
  border-radius: 999px;
  background: white;
  overflow: hidden;
  margin-top: 0.4rem;
`;

const Fill = styled.div<{ $pct: number }>`
  height: 100%;
  width: ${({ $pct }) => $pct}%;
  background: ${color.green};
`;

const Two = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
  @media (max-width: 760px) { grid-template-columns: 1fr; }
`;

const Row = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.4rem 0;
`;

const Inline = styled.div`
  display: flex;
  gap: 0.6rem;
  align-items: center;
  margin-top: 0.7rem;
`;

const Warn = styled.div`
  background: #fbe9e4;
  border: 1.5px solid ${color.danger};
  border-radius: 10px;
  padding: 0.8rem 1rem;
  margin: 0.7rem 0 1rem;
`;

const List = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.9rem;
`;

const dangerStyle = { background: color.danger, color: 'white' } as const;

export default function GardenPage() {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const { data: me } = useMe();
  // [추가] 탭은 주소(?tab=...)로 정해요. 없으면 '내 글'이 먼저 열려요.
  const [params, setParams] = useSearchParams();
  const tab: Tab = TABS.find((t) => t.key === params.get('tab'))?.key ?? 'profile';
  const setTab = (next: Tab) => setParams({ tab: next }, { replace: true });
  const [nick, setNick] = useState('');
  const [withdrawOpen, setWithdrawOpen] = useState(false);
  const [adminManageOpen, setAdminManageOpen] = useState(false);
  const [viewAvatar, setViewAvatar] = useState(false); // [추가] 프로필 사진 크게 보기
  const fileRef = useRef<HTMLInputElement>(null);

  const myPosts = useQuery({ queryKey: ['posts', 'mine'], queryFn: postAPI.mine });
  const subs = useQuery({ queryKey: ['posts', 'subscribed'], queryFn: postAPI.subscribedFeed });
  const logs = useQuery({ queryKey: ['leaf-logs'], queryFn: leafAPI.logs });
  const blocked = useQuery({ queryKey: ['blocked'], queryFn: socialAPI.blockedUsers });

  if (!me) return null;

  const superAdmin = isSuperAdmin(me);
  const earnedToday = me.earnedDate === todayKey() ? me.earnedToday : 0;
  const earnLogs = (logs.data ?? []).filter((l) => l.type === 'earn');
  const spendLogs = (logs.data ?? []).filter((l) => l.type === 'spend');

  const unblock = async (id: string) => {
    try {
      await socialAPI.unblock(id);
      await qc.invalidateQueries();
      toast.success('차단을 해제했어요');
    } catch (e) {
      toast.error(errorMessage(e));
    }
  };

  const onPickAvatar = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = ''; // 같은 파일을 다시 골라도 동작하도록 초기화
    if (!file) return;
    try {
      const dataUrl = await fileToAvatar(file);
      await authAPI.updateAvatar(dataUrl);
      await qc.invalidateQueries();
      toast.success('프로필 사진을 바꿨어요');
    } catch (err) {
      toast.error(errorMessage(err));
    }
  };

  const removeAvatar = async () => {
    try {
      await authAPI.updateAvatar(null);
      await qc.invalidateQueries();
      toast.info('프로필 사진을 삭제했어요');
    } catch (err) {
      toast.error(errorMessage(err));
    }
  };

  const changeNickname = async () => {
    try {
      const user = await authAPI.changeNickname(nick);
      setNick('');
      await qc.invalidateQueries();
      toast.success(`닉네임을 “${user.nickname}”(으)로 바꿨어요`);
    } catch (e) {
      toast.error(errorMessage(e));
    }
  };

  const withdraw = async (password: string) => {
    try {
      await authAPI.withdraw(password);
      qc.clear();
      qc.setQueryData(['me'], null);
      toast.info('탈퇴가 완료됐어요. 그동안 함께해 주셔서 고마워요.');
      navigate('/');
    } catch (e) {
      toast.error(errorMessage(e));
    }
  };

  return (
    <Layout>
      <Profile>
        <AvatarButton
          type="button"
          onClick={() => (me.avatar ? setViewAvatar(true) : fileRef.current?.click())}
          aria-label={me.avatar ? '프로필 사진 크게 보기' : '프로필 사진 올리기'}
          title={me.avatar ? '크게 보기' : '프로필 사진 올리기'}
        >
          {me.avatar ? <img src={me.avatar} alt="내 프로필 사진" /> : <span className="empty"><FaCamera /></span>}
        </AvatarButton>
        <input ref={fileRef} type="file" accept="image/*" hidden onChange={onPickAvatar} />
        <AvatarActions>
          <Button $variant="sand" style={{ padding: '0.2rem 0.65rem', fontSize: '0.8rem' }} onClick={() => fileRef.current?.click()}>
            사진 변경
          </Button>
          {me.avatar && (
            <Button $variant="ghost" style={{ padding: '0.2rem 0.65rem', fontSize: '0.8rem' }} onClick={removeAvatar}>
              삭제
            </Button>
          )}
        </AvatarActions>
        <h3>{me.nickname}</h3>
        <Muted>함께한 지 {Math.max(1, Math.ceil((Date.now() - new Date(me.createdAt).getTime()) / 86400000))}일</Muted>
        <div style={{ marginTop: '1rem' }}>
          {TABS.map((t) => (
            <TabButton key={t.key} $active={tab === t.key} onClick={() => setTab(t.key)}>{t.label}</TabButton>
          ))}
        </div>
      </Profile>

      <section>
        {tab === 'profile' && <GardenProfile fixedGrowth={superAdmin} />}
        {tab === 'inbox' && <GardenInbox />}
        {tab === 'leaves' && (
          <>
            <Summary>
              <img src="/logo-symbol.png" alt="" aria-hidden="true" />
              <div>
                <Muted>보유 나뭇잎</Muted>
                <div className="big">{me.isSuperAdmin ? '∞' : me.leaves}</div>
              </div>
              <div className="cap">
                <Muted>오늘 글·댓글 작성 적립 {earnedToday} / {DAILY_CAP}</Muted>
                <Track><Fill $pct={Math.min(100, (earnedToday / DAILY_CAP) * 100)} /></Track>
                <Muted>공감으로 받은 나뭇잎은 일일 상한에 포함되지 않아요.</Muted>
              </div>
            </Summary>
            <Two>
              <Card>
                <h4>적립 내역</h4>
                {earnLogs.length === 0 && <Muted>아직 적립 내역이 없어요.</Muted>}
                {earnLogs.map((l) => (
                  <Row key={l.id}><span>{l.label} <Muted as="span">{timeAgo(l.createdAt)}</Muted></span><strong>+{l.amount}</strong></Row>
                ))}
              </Card>
              <Card>
                <h4>사용 내역</h4>
                {spendLogs.length === 0 && <Muted>아직 사용 내역이 없어요.</Muted>}
                {spendLogs.map((l) => (
                  <Row key={l.id}><span>{l.label}</span><strong>-{l.amount}</strong></Row>
                ))}
              </Card>
            </Two>
            <Card style={{ background: color.yellow, marginTop: '1rem' }}>
              나뭇잎 랭킹은 없어요. 나만 볼 수 있고, 구독에 쓸 수 있어요.
            </Card>
          </>
        )}

        {tab === 'posts' && (
          <List>
            {(myPosts.data ?? []).length === 0 && <Muted>아직 쓴 글이 없어요.</Muted>}
            {(myPosts.data ?? []).map((p) => <PostCard key={p.id} post={p} menu="owner" />)}
          </List>
        )}

        {tab === 'subs' && (
          <List>
            {(subs.data ?? []).length === 0 && <Muted>구독한 작성자가 없어요. 글 상세에서 구독해보세요.</Muted>}
            {(subs.data ?? []).map((p) => <PostCard key={p.id} post={p} />)}
          </List>
        )}

        {tab === 'blocks' && (
          <Card>
            <h4>차단 관리</h4>
            {(blocked.data ?? []).length === 0 && <Muted>차단한 사용자가 없어요.</Muted>}
            {(blocked.data ?? []).map((u) => (
              <Row key={u.id}>
                <span>{u.nickname}</span>
                <Button $variant="sand" onClick={() => unblock(u.id)}>차단 해제</Button>
              </Row>
            ))}
          </Card>
        )}

        {tab === 'settings' && (
          <>
            <Card>
              <h4>닉네임 설정</h4>
              <Muted style={{ marginTop: '0.3rem' }}>
                현재 닉네임: <strong>{me.nickname}</strong> · 다른 사람이 쓰는 닉네임은 사용할 수 없어요.
              </Muted>
              <Inline>
                <Input
                  placeholder={`새 닉네임 (${NICKNAME_MAX}자 이하)`}
                  maxLength={NICKNAME_MAX}
                  value={nick}
                  onChange={(e) => setNick(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') void changeNickname(); }}
                  disabled={superAdmin}
                />
                <Button style={{ whiteSpace: 'nowrap' }} disabled={superAdmin || nick.trim() === ''} onClick={changeNickname}>
                  닉네임 변경
                </Button>
              </Inline>
              {/* [추가] 총괄 운영자 닉네임은 고정 */}
              {superAdmin && (
                <Muted style={{ marginTop: '0.6rem' }}>총괄 운영자의 닉네임은 “{me.nickname}”로 고정되어 있어요.</Muted>
              )}
            </Card>

            {superAdmin ? (
              <Card style={{ marginTop: '1rem' }}>
                <h4>운영자 계정 관리</h4>
                <Muted style={{ margin: '0.3rem 0 0.8rem' }}>
                  추가로 만든 운영자 계정을 삭제하고, 그 이메일로 웹서비스에 접근하지 못하게 막을 수 있어요.
                </Muted>
                <Button onClick={() => setAdminManageOpen(true)}>운영자 계정 관리</Button>
              </Card>
            ) : (
              <Card style={{ marginTop: '1rem' }}>
                <h4>탈퇴하기</h4>
                <Warn>
                  탈퇴하면 계정과 나뭇잎이 삭제되고 되돌릴 수 없어요.{' '}
                  <strong>같은 이메일로는 탈퇴 후 {WITHDRAW_BLOCK_DAYS}일 동안 다시 가입할 수 없어요.</strong>
                </Warn>
                <Button disabled={me.role === 'admin'} style={dangerStyle} onClick={() => setWithdrawOpen(true)}>
                  탈퇴하기
                </Button>
                {me.role === 'admin' && (
                  <Muted style={{ marginTop: '0.6rem' }}>
                    운영자 계정은 직접 탈퇴할 수 없어요. 정리가 필요하면 총괄 운영자에게 요청해주세요.
                  </Muted>
                )}
              </Card>
            )}
          </>
        )}
      </section>

      {withdrawOpen && <WithdrawModal onClose={() => setWithdrawOpen(false)} onConfirm={withdraw} />}
      {adminManageOpen && <AdminManageModal onClose={() => setAdminManageOpen(false)} />}

      {/* [추가] 프로필 사진 크게 보기 */}
      {viewAvatar && me.avatar && (
        <Modal onClose={() => setViewAvatar(false)}>
          <img
            src={me.avatar}
            alt="프로필 사진 크게 보기"
            style={{ display: 'block', width: '100%', maxWidth: 440, margin: '0 auto', borderRadius: 12 }}
          />
          <div style={{ display: 'flex', justifyContent: 'center', gap: '0.6rem', marginTop: '1rem' }}>
            <Button
              $variant="sand"
              onClick={() => {
                setViewAvatar(false);
                fileRef.current?.click();
              }}
            >
              사진 변경
            </Button>
            <Button onClick={() => setViewAvatar(false)}>닫기</Button>
          </div>
        </Modal>
      )}
    </Layout>
  );
}
