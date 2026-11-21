import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import styled from '@emotion/styled';
import { FaHeart, FaLock, FaThumbtack } from 'react-icons/fa';
import BlockModal from '../components/BlockModal';
import LeafIcon from '../components/LeafIcon';
import ReportModal from '../components/ReportModal';
import { Button, Card, Input, Muted, NoticeBadge, Tag } from '../components/ui';
import { useMe } from '../hooks/useMe';
import { commentAPI, postAPI, socialAPI, SUBSCRIBE_COST } from '../services/api';
import { errorMessage, timeAgo } from '../services/format';
import { categoryColor, color } from '../styles/theme';
import { NOTICE_CATEGORY } from '../types';

type ModalState =
  | { kind: 'report'; targetType: 'post' | 'comment'; targetId: string; preview: string }
  | { kind: 'block' }
  | null;

const Wrap = styled.div`
  max-width: 760px;
  margin: 0 auto;
`;

const PostBox = styled(Card)`
  &[data-notice='true'] { border: 3px solid ${color.notice}; background: ${color.noticeSoft}; }
`;

const TopRow = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: wrap;
`;

const PinnedMark = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  color: ${color.danger};
  font-size: 0.85rem;
  font-weight: 700;
  svg { transform: rotate(-30deg); }
`;

const PrivateMark = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  color: ${color.brownSoft};
  font-size: 0.85rem;
  font-weight: 700;
`;

const Head = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  gap: 1rem;
  margin: 0.6rem 0 1rem;
  h2 { font-size: 1.5rem; }
  .name { display: inline-flex; align-items: center; gap: 0.3rem; }
`;

const Body = styled.p`
  white-space: pre-wrap;
  line-height: 1.9;
  margin-bottom: 1.5rem;
`;

const Bar = styled.div`
  display: flex;
  align-items: center;
  gap: 0.6rem;
  flex-wrap: wrap;
  margin-bottom: 1.5rem;
`;

const CommentRow = styled.div`
  display: flex;
  gap: 0.8rem;
  align-items: baseline;
  background: ${color.bg};
  border-radius: 10px;
  padding: 0.6rem 0.9rem;
  margin-bottom: 0.5rem;
  .text { flex: 1; }
  button { border: none; background: none; cursor: pointer; color: ${color.brownSoft}; }
`;

const smallButton = { padding: '0.2rem 0.65rem', fontSize: '0.8rem' } as const;

export default function PostDetailPage() {
  const { id = '' } = useParams();
  const qc = useQueryClient();
  const { data: me } = useMe();
  const [modal, setModal] = useState<ModalState>(null);
  const [text, setText] = useState('');

  const post = useQuery({ queryKey: ['post', id], queryFn: () => postAPI.get(id) });
  const comments = useQuery({ queryKey: ['comments', id], queryFn: () => commentAPI.list(id) });

  const run = async (fn: () => Promise<unknown>, successMessage?: string) => {
    try {
      await fn();
      if (successMessage) toast.success(successMessage);
      await qc.invalidateQueries();
    } catch (e) {
      toast.error(errorMessage(e));
    }
  };

  if (post.isLoading) return <Muted>불러오는 중...</Muted>;
  if (post.error || !post.data || !me) return <Muted>{post.error?.message ?? '글을 찾을 수 없어요.'}</Muted>;

  const p = post.data;
  const isMine = p.authorId === me.id;
  const isAdmin = me.role === 'admin';
  const isNotice = p.category === NOTICE_CATEGORY;
  const liked = p.likedBy.includes(me.id);
  const subscribed = me.subscribed.includes(p.authorId);

  const submitComment = async () => {
    const content = text.trim();
    if (!content) return;
    await run(() => commentAPI.add(id, content));
    setText('');
  };

  return (
    <Wrap>
      <PostBox data-notice={isNotice ? 'true' : undefined}>
        <TopRow>
          {isNotice ? <NoticeBadge>공지글</NoticeBadge> : <Tag $bg={categoryColor(p.category)}>{p.category}</Tag>}
          {p.pinned && <PinnedMark><FaThumbtack /> 고정됨</PinnedMark>}
          {p.isPrivate && <PrivateMark><FaLock /> 비공개</PrivateMark>}
          {isAdmin && (
            <Button
              $variant="sand"
              style={smallButton}
              onClick={() => run(() => postAPI.setPinned(id, !p.pinned), p.pinned ? '고정을 해제했어요' : '글을 맨 위에 고정했어요')}
            >
              <FaThumbtack /> {p.pinned ? '고정 해제' : '고정'}
            </Button>
          )}
        </TopRow>

        <Head>
          <h2>{p.title}</h2>
          <Muted as="span" className="name">
            {p.nickname}
            {p.authorIsAdmin && <span title="운영자" style={{ display: 'inline-flex' }}><LeafIcon size={16} /></span>}
            · {timeAgo(p.createdAt)}
          </Muted>
        </Head>
        <Body>{p.content}</Body>

        <Bar>
          <Button $variant={liked ? 'primary' : 'pink'} onClick={() => run(() => postAPI.toggleLike(id))}>
            <FaHeart /> 공감 {p.likedBy.length}
          </Button>
          {!isMine && (
            <Button
              $variant="sand"
              disabled={subscribed}
              title={`나뭇잎 ${SUBSCRIBE_COST}개로 구독`}
              onClick={() => run(() => socialAPI.subscribe(p.authorId), '구독했어요')}
            >
              {subscribed ? '구독 중' : '구독'}
            </Button>
          )}
          <Muted style={{ flex: 1 }}>공감하면 작성자에게 나뭇잎이 쌓여요</Muted>
          {!isMine && (
            <>
              <Button
                $variant="ghost"
                onClick={() => setModal({ kind: 'report', targetType: 'post', targetId: p.id, preview: p.title })}
              >
                신고
              </Button>
              <Button $variant="ghost" onClick={() => setModal({ kind: 'block' })}>차단</Button>
            </>
          )}
        </Bar>

        <h4 style={{ marginBottom: '0.6rem' }}>댓글 {comments.data?.length ?? 0}</h4>
        {(comments.data ?? []).map((c) => (
          <CommentRow key={c.id}>
            <strong>{c.nickname}</strong>
            <span className="text">{c.content}</span>
            {c.authorId !== me.id && (
              <button
                onClick={() =>
                  setModal({ kind: 'report', targetType: 'comment', targetId: c.id, preview: c.content.slice(0, 40) })
                }
              >
                신고
              </button>
            )}
          </CommentRow>
        ))}
        <Bar style={{ marginTop: '0.8rem', marginBottom: 0 }}>
          <Input
            style={{ flex: 1, width: 'auto' }}
            placeholder="따뜻한 한마디를 남겨보세요"
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') void submitComment();
            }}
          />
          <Button onClick={submitComment}>등록</Button>
        </Bar>
      </PostBox>

      {modal?.kind === 'report' && (
        <ReportModal
          targetType={modal.targetType}
          targetId={modal.targetId}
          targetPreview={modal.preview}
          onClose={() => setModal(null)}
        />
      )}
      {modal?.kind === 'block' && (
        <BlockModal
          onClose={() => setModal(null)}
          onConfirm={async () => {
            setModal(null);
            await run(() => socialAPI.block(p.authorId), '차단했어요');
          }}
        />
      )}
    </Wrap>
  );
}
