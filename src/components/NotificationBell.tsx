import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import styled from '@emotion/styled';
import type { IconType } from 'react-icons';
import {
  FaBan, FaBell, FaBullhorn, FaCommentDots, FaExclamationTriangle,
  FaHandHoldingHeart, FaHeart, FaLifeRing, FaPen, FaSeedling, FaTrash,
} from 'react-icons/fa';
import { Button, Muted } from './ui';
import { notificationAPI } from '../services/api';
import { timeAgo } from '../services/format';
import { color } from '../styles/theme';
import type { AppNotification, NotificationType } from '../types';

const ICONS: Record<NotificationType, IconType> = {
  like: FaHeart,
  comment: FaCommentDots,
  subscribe: FaSeedling,
  'new-post': FaPen,
  notice: FaBullhorn,
  warning: FaExclamationTriangle,
  removed: FaTrash,
  restricted: FaBan,
  crisis: FaLifeRing,
  care: FaHandHoldingHeart,
};

const DANGER: NotificationType[] = ['warning', 'removed', 'restricted', 'crisis'];

const Wrap = styled.div`
  position: relative;
`;

const BellButton = styled.button`
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 38px;
  height: 38px;
  border: none;
  border-radius: 50%;
  background: ${color.greenSoft};
  color: ${color.brown};
  font-size: 1.05rem;
  cursor: pointer;
  &:hover { filter: brightness(0.96); }
`;

// 읽지 않은 알림이 있을 때 종 위에 뜨는 빨간 점
const Dot = styled.span`
  position: absolute;
  top: 3px;
  right: 4px;
  width: 11px;
  height: 11px;
  border-radius: 50%;
  background: #e5322d;
  border: 2px solid white;
`;

const Backdrop = styled.div`
  position: fixed;
  inset: 0;
  z-index: 40;
`;

const Panel = styled.div`
  position: absolute;
  top: calc(100% + 8px);
  right: 0;
  z-index: 41;
  width: min(360px, 90vw);
  max-height: 440px;
  overflow-y: auto;
  background: white;
  border: 1.5px solid ${color.border};
  border-radius: 12px;
  box-shadow: 0 8px 24px rgba(60, 45, 40, 0.18);
`;

const PanelHead = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.7rem 0.9rem;
  border-bottom: 1px solid ${color.border};
  position: sticky;
  top: 0;
  background: white;
`;

const Item = styled.button<{ $fresh: boolean; $clickable: boolean }>`
  display: flex;
  gap: 0.7rem;
  width: 100%;
  padding: 0.75rem 0.9rem;
  border: none;
  border-bottom: 1px solid ${color.bg};
  background: ${({ $fresh }) => ($fresh ? color.noticeSoft : 'white')};
  text-align: left;
  cursor: ${({ $clickable }) => ($clickable ? 'pointer' : 'default')};
  font: inherit;
  &:hover { background: ${color.bg}; }
  .icon { margin-top: 0.2rem; flex-shrink: 0; }
  .text { flex: 1; font-size: 0.9rem; line-height: 1.5; word-break: break-word; }
  .time { display: block; margin-top: 0.15rem; font-size: 0.78rem; color: ${color.brownSoft}; }
`;

// 헤더의 알림 종: 읽지 않은 알림이 있으면 빨간 점, 클릭하면 알림 목록이 펼쳐집니다.
export default function NotificationBell() {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [freshIds, setFreshIds] = useState<string[]>([]);

  const { data: items = [] } = useQuery({
    queryKey: ['notifications'],
    queryFn: notificationAPI.list,
    refetchInterval: 15000, // 15초마다 새 알림 확인 (서버 요청을 아끼기 위해)
    refetchOnWindowFocus: true,
  });
  const unread = items.filter((n) => !n.read).length;

  // 다른 탭에서 저장소가 바뀌면 바로 새로고침
  useEffect(() => {
    const onStorage = () => {
      void qc.invalidateQueries({ queryKey: ['notifications'] });
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, [qc]);

  const toggle = async () => {
    if (open) {
      setOpen(false);
      return;
    }
    setFreshIds(items.filter((n) => !n.read).map((n) => n.id)); // 이번에 새로 온 알림 표시용
    setOpen(true);
    if (unread > 0) {
      await notificationAPI.markAllRead(); // 열면 읽음 처리 → 빨간 점 사라짐
      await qc.invalidateQueries({ queryKey: ['notifications'] });
    }
  };

  const clearAll = async () => {
    await notificationAPI.clearAll();
    setFreshIds([]);
    await qc.invalidateQueries({ queryKey: ['notifications'] });
  };

  const openItem = (n: AppNotification) => {
    if (!n.link) return;
    setOpen(false);
    navigate(n.link);
  };

  return (
    <Wrap>
      <BellButton type="button" aria-label={unread > 0 ? `알림 ${unread}개` : '알림'} title="알림" onClick={toggle}>
        <FaBell />
        {unread > 0 && <Dot />}
      </BellButton>

      {open && (
        <>
          <Backdrop onClick={() => setOpen(false)} />
          <Panel role="dialog" aria-label="알림 목록">
            <PanelHead>
              <strong>알림</strong>
              {items.length > 0 && (
                <Button $variant="ghost" style={{ padding: '0.15rem 0.5rem', fontSize: '0.8rem' }} onClick={clearAll}>
                  모두 지우기
                </Button>
              )}
            </PanelHead>
            {items.length === 0 && <Muted style={{ padding: '1.2rem', textAlign: 'center' }}>새 알림이 없어요.</Muted>}
            {items.map((n) => {
              const Icon = ICONS[n.type];
              return (
                <Item key={n.id} type="button" $fresh={freshIds.includes(n.id)} $clickable={Boolean(n.link)} onClick={() => openItem(n)}>
                  <span className="icon" style={{ color: DANGER.includes(n.type) ? color.danger : color.brown }}>
                    <Icon />
                  </span>
                  <span className="text">
                    {n.text}
                    <span className="time">{timeAgo(n.createdAt)}</span>
                  </span>
                </Item>
              );
            })}
          </Panel>
        </>
      )}
    </Wrap>
  );
}
