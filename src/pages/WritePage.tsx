import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import styled from '@emotion/styled';
import CrisisModal from '../components/CrisisModal';
import { Button, ErrorText, Field, Input, Select, Textarea } from '../components/ui';
import { useMe } from '../hooks/useMe';
import { postAPI } from '../services/api';
import { countCrisisKeywords } from '../services/crisis';
import { errorMessage } from '../services/format';
import { load, save } from '../services/storage';
import { ALL_CATEGORIES, CATEGORIES, NOTICE_CATEGORY } from '../types';
import type { Category, PostView } from '../types';
import { color } from '../styles/theme';

interface WriteForm {
  category: Category | '';
  title: string;
  content: string;
}

const DRAFT_KEY = 'momentree-draft';
const EMPTY_FORM: WriteForm = { category: '', title: '', content: '' };

const Wrap = styled.form`
  max-width: 720px;
  margin: 0 auto;
`;

const Guide = styled.p`
  background: ${color.greenSoft};
  border-radius: 10px;
  padding: 0.8rem 1rem;
  margin-bottom: 1rem;
`;

const Actions = styled.div`
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: 0.6rem;
  flex-wrap: wrap;
`;

export default function WritePage() {
  const { id } = useParams();
  const { data: me } = useMe();
  const post = useQuery({ queryKey: ['post', id], queryFn: () => postAPI.get(id!), enabled: !!id });
  if (!me) return <p>계정을 확인하는 중이에요.</p>;
  if (!id) return <PostForm key={`${me.id}:new`} userId={me.id} />;
  if (post.isPending) return <p>글을 불러오는 중이에요.</p>;
  if (post.isError) return <p>{errorMessage(post.error)}</p>;
  if (post.data.authorId !== me?.id) return <p>자신이 쓴 글만 수정할 수 있어요.</p>;
  return <PostForm key={`${me.id}:${id}`} userId={me.id} existing={post.data} />;
}

function PostForm({ existing, userId }: { existing?: PostView; userId: string }) {
  const key = `${DRAFT_KEY}:${userId}:${existing?.id ?? "new"}`;
  const [restored, setRestored] = useState(() => load<WriteForm | null>(key, null));
  const base: WriteForm = existing ? { category: existing.category, title: existing.title, content: existing.content } : EMPTY_FORM;
  const [draftStatus, setDraftStatus] = useState("");
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { data: me } = useMe();
  const isAdmin = me?.role === 'admin';
  const { register, handleSubmit, reset, watch, formState: { errors, isSubmitting } } = useForm<WriteForm>({
    defaultValues: restored ?? base,
  });
  useEffect(() => {
    const sub = watch((values, { name }) => {
      if (!name) return; // 초기화·임시글 지우기는 입력 변경이 아니에요.
      try {
        if (values.category || values.title || values.content) save(key, values);
        else localStorage.removeItem(key);
        setDraftStatus('이 브라우저에 자동 저장했어요.');
      } catch {
        setDraftStatus('이 브라우저에 저장할 수 없어요. 창을 닫기 전에 글을 복사해 주세요.');
      }
    });
    return () => sub.unsubscribe();
  }, [key, watch]);
  // 공지글 카테고리는 운영자에게만 보입니다.
  const categories: readonly Category[] = existing ? (existing.category === NOTICE_CATEGORY ? [NOTICE_CATEGORY] : CATEGORIES)
    : isAdmin ? ALL_CATEGORIES : CATEGORIES;
  const [crisis, setCrisis] = useState<{ values: WriteForm; count: number } | null>(null);

  const [saving, setSaving] = useState(false);
  const publish = async (values: WriteForm, keywordCount: number) => {
    if (values.category === '' || saving) return;
    setSaving(true);
    try {
      const input = { category: values.category, title: values.title.trim(), content: values.content.trim() };
      const post = existing ? await postAPI.update(existing.id, input) : await postAPI.create(input, keywordCount);
      try { localStorage.removeItem(key); } catch { /* 게시 성공은 저장소 오류와 별개예요. */ }
      await qc.invalidateQueries();
      toast.success(existing ? '글을 수정했어요 🌿' : values.category === NOTICE_CATEGORY ? '공지글이 등록됐어요 📌' : '글이 등록됐어요 🌿');
      navigate(`/post/${post.id}`);
    } catch (e) {
      toast.error(errorMessage(e));
    } finally {
      setSaving(false);
    }
  };

  const onSubmit = async (values: WriteForm) => {
    const count = countCrisisKeywords(`${values.title} ${values.content}`);
    if (count > 0) {
      setCrisis({ values, count }); // 위기 안내를 먼저 보여줍니다.
      return;
    }
    await publish(values, 0);
  };

  const discardDraft = () => {
    if (!window.confirm('이 브라우저에 저장된 초안을 지울까요?')) return;
    try { localStorage.removeItem(key); } catch { setDraftStatus('초안을 지울 수 없어요.'); return; }
    reset(base);
    setRestored(null);
    setDraftStatus('초안을 지웠어요.');
  };

  return (
    <Wrap onSubmit={handleSubmit(onSubmit)} noValidate>
      <fieldset disabled={saving || !!crisis} style={{border: 0, padding: 0, minInlineSize: 0}}>
      {existing && <h2>글 수정</h2>}
      <Field>
        <Select {...register('category', { required: '카테고리를 선택해주세요' })}>
          <option value="">카테고리 선택</option>
          {categories.map((c) => <option key={c} value={c}>{c}</option>)}
        </Select>
        {errors.category && <ErrorText>{errors.category.message}</ErrorText>}
        {isAdmin && watch('category') === NOTICE_CATEGORY && (
          <p style={{ color: color.notice, fontSize: '0.85rem', marginTop: '0.3rem' }}>
            공지글은 서재 맨 위에 파란 테두리로 고정돼요.
          </p>
        )}
      </Field>
      <Field>
        <Input placeholder="제목" {...register('title', { required: '제목을 입력해주세요', maxLength: { value: 60, message: '60자 이하로 입력해주세요' } })} />
        {errors.title && <ErrorText>{errors.title.message}</ErrorText>}
      </Field>
      <Field>
        <Textarea
          placeholder="마음을 짧게 적어보세요. 시, 가사, 일기 모두 좋아요."
          {...register('content', { required: '내용을 입력해주세요', maxLength: { value: 1000, message: '1000자 이하로 입력해주세요' } })}
        />
        {errors.content && <ErrorText>{errors.content.message}</ErrorText>}
      </Field>
      <Guide>서로의 마음을 읽어주는 공간이에요. 구체적인 방법·수단 묘사는 올릴 수 없어요.</Guide>
      <p role="status" style={{marginBottom: '0.85rem'}}>{draftStatus || (restored ? '이 브라우저에서 마지막으로 쓰던 글을 불러왔어요.' : '작성 중인 글은 이 브라우저에만 자동 저장돼요.')}</p>
      <Actions>
        {existing && <Button type="button" $variant="sand" disabled={saving} onClick={() => navigate(`/post/${existing.id}`)}>나가기</Button>}
        <Button type="button" $variant="sand" disabled={saving} onClick={discardDraft}>초안 지우기</Button>
        <Button type="submit" disabled={isSubmitting || saving}>{existing ? '수정 저장' : '등록하기'}</Button>
      </Actions>

      </fieldset>
      {crisis && (
        <CrisisModal
          onEdit={() => setCrisis(null)}
          onPublish={async () => {
            const pending = crisis;
            setCrisis(null);
            await publish(pending.values, pending.count);
          }}
        />
      )}
    </Wrap>
  );
}
