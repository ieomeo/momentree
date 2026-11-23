import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import styled from '@emotion/styled';
import { FaHeart, FaLock, FaThumbtack } from 'react-icons/fa';
import AuthorProfile from './AuthorProfile';
import ConfirmModal from './ConfirmModal';
import LeafIcon from './LeafIcon';
import PostMenu from './PostMenu';
import type { MenuItem } from './PostMenu';
import { NoticeBadge, Tag } from './ui';
import { postAPI } from '../services/api';
import { errorMessage, timeAgo } from '../services/format';
import { categoryColor, color } from '../styles/theme';
import type { PostView } from '../types';

const Wrap = styled.div`
  position: relative;
`;

const Card = styled.article`
  display: block;
  background: white;
  border: 1.5px solid ${color.border};
  border-radius: 12px;
  padding: 1rem 1.3rem;
  &:hover { border-color: ${color.brownSoft}; }

  /* 고정된 글 */
  &[data-pinned='true'] { background: #fffdf3; }

  /* 공지글: 진한 파란 테두리 */
  &[data-notice='true'] {
    border: 3px solid ${color.notice};
    padding: calc(1rem - 1.5px) calc(1.3rem - 1.5px);
    background: ${color.noticeSoft};
  }
  &[data-notice='true']:hover { border-color: ${color.notice}; }

  /* 오른쪽 위 점세개 버튼 자리 */
  &[data-menu='true'] { padding-right: 3.4rem; }

  .head { display: flex; align-items: center; gap: 0.5rem; flex-wrap: wrap; }
  h3 { font-size: 1.1rem; }
  p.preview {
    margin: 0.6rem 0;
    color: ${color.brownSoft};
    white-space: pre-line;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
  .meta { font-size: 0.85rem; display: flex; gap: 1rem; flex-wrap: wrap; align-items: center; }
  .name { display: inline-flex; align-items: center; gap: 0.3rem; }
  .private { display: inline-flex; align-items: center; gap: 0.3rem; color: ${color.brownSoft}; font-weight: 700; }
`;

const MenuSlot = styled.div`
  position: absolute;
  top: 0.55rem;
  right: 0.6rem;
`;

const Pin = styled(FaThumbtack)`
  color: ${color.danger};
  transform: rotate(-30deg);
`;

interface Props {
  post: PostView;
  // owner: 내 글 탭(비공개·삭제) / admin: 서재에서 운영자(삭제) / 없으면 메뉴 없음
  menu?: 'owner' | 'admin';
}

export default function PostCard({ post, menu }: Props) {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const isNotice = post.category === '공지글';

  const run = async (fn: () => Promise<unknown>, message: string) => {
    try {
      await fn();
      toast.success(message);
      await qc.invalidateQueries();
    } catch (e) {
      toast.error(errorMessage(e));
    }
  };

  const deleteItem: MenuItem = { label: '삭제', danger: true, onClick: () => setConfirmDelete(true) };
  const items: MenuItem[] =
    menu === 'owner'
      ? [
          { label: '수정', onClick: () => navigate(`/post/${post.id}/edit`) },
          {
            label: post.isPrivate ? '공개로 전환' : '비공개',
            onClick: () =>
              run(
                () => postAPI.setPrivate(post.id, !post.isPrivate),
                post.isPrivate ? '글을 공개로 전환했어요' : '글을 비공개로 바꿨어요. 나만 볼 수 있어요',
              ),
          },
          deleteItem,
        ]
      : menu === 'admin'
        ? [deleteItem]
        : [];

  return (
    <Wrap>
      <Card
        data-notice={isNotice ? 'true' : undefined}
        data-pinned={post.pinned ? 'true' : undefined}
        data-menu={menu ? 'true' : undefined}
      >
        <Link to={`/post/${post.id}`}>
        <div className="head">
          {post.pinned && <Pin title="고정된 글" aria-label="고정된 글" />}
          {isNotice ? <NoticeBadge>공지글</NoticeBadge> : <Tag $bg={categoryColor(post.category)}>{post.category}</Tag>}
          <h3>{post.title}</h3>
        </div>
        <p className="preview">{post.content}</p>
        </Link>
        <div className="meta">
          <span className="name">
            <AuthorProfile id={post.authorId} nickname={post.nickname} avatar={post.authorAvatar} />
            {post.authorIsAdmin && (
              <span title="운영자" style={{ display: 'inline-flex' }}><LeafIcon size={14} /></span>
            )}
            <span>· {timeAgo(post.createdAt)}</span>
          </span>
          <span><FaHeart size={11} /> 공감 {post.likedBy.length}</span>
          <span>댓글 {post.commentCount}</span>
          {post.isPrivate && <span className="private"><FaLock size={11} /> 비공개</span>}
        </div>
      </Card>

      {menu && (
        <MenuSlot>
          <PostMenu items={items} />
        </MenuSlot>
      )}

      {confirmDelete && (
        <ConfirmModal
          title="이 글을 삭제할까요?"
          message="삭제하면 댓글도 함께 사라지고 되돌릴 수 없어요."
          confirmLabel="삭제하기"
          onClose={() => setConfirmDelete(false)}
          onConfirm={async () => {
            setConfirmDelete(false);
            await run(() => postAPI.remove(post.id), '글을 삭제했어요');
          }}
        />
      )}
    </Wrap>
  );
}
