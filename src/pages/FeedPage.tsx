import { useState } from 'react';
import type { FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import styled from '@emotion/styled';
import { FaSearch } from 'react-icons/fa';
import LegalModal from '../components/LegalModal';
import PostCard from '../components/PostCard';
import TodayNote from '../components/TodayNote';
import { Button, Card, Input, Muted } from '../components/ui';
import { ADMIN_POLICY_MD, COMMUNITY_PROMISE_MD } from '../content/legal';
import { useMe } from '../hooks/useMe';
import { LIKES_WINDOW_HOURS, postAPI } from '../services/api';
import { ALL_CATEGORIES } from '../types';
import type { Category } from '../types';
import { color } from '../styles/theme';

const Layout = styled.div`
  display: grid;
  grid-template-columns: 200px 1fr 260px;
  gap: 1.5rem;
  align-items: start;
  @media (max-width: 960px) { grid-template-columns: 1fr; }
`;

const Side = styled.aside`
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
  @media (max-width: 960px) { flex-direction: row; flex-wrap: wrap; }
`;

const Chip = styled.button<{ $active: boolean }>`
  text-align: left;
  padding: 0.55rem 0.9rem;
  border: none;
  border-radius: 10px;
  cursor: pointer;
  background: ${({ $active }) => ($active ? color.green : 'transparent')};
  font-weight: ${({ $active }) => ($active ? 800 : 500)};
  &:hover { background: ${color.greenSoft}; }
`;

// [추가] 검색창
const SearchForm = styled.form`
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1rem;
`;

const Tabs = styled.div`
  display: flex;
  gap: 0.4rem;
  margin-bottom: 0.6rem;
`;

const ResultHead = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 0.6rem;
  margin-bottom: 0.9rem;
`;

const List = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.9rem;
`;

const Right = styled.aside`
  display: flex;
  flex-direction: column;
  gap: 1rem;
  h4 { margin-bottom: 0.4rem; }
`;

const PromiseHead = styled.div`
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.4rem;
  margin-bottom: 0.4rem;
  h4 { margin: 0 0.2rem 0 0; }
`;

const BelowRight = styled.div`
  display: flex;
  justify-content: flex-end;
  margin-top: -0.4rem;
`;

// [추가] 커뮤니티 약속 옆의 작은 버튼
const PillButton = styled.button`
  padding: 0.15rem 0.65rem;
  border: 1px solid rgba(107, 79, 69, 0.28);
  border-radius: 999px;
  background: rgba(107, 79, 69, 0.08); /* 배경색에 스며드는 연한 갈색 */
  color: ${color.brown};
  font-size: 0.75rem;
  font-weight: 700;
  cursor: pointer;
  &:hover { background: rgba(107, 79, 69, 0.16); }
`;

export default function FeedPage() {
  const { data: me } = useMe();
  const [category, setCategory] = useState<Category | '전체'>('전체');
  const [sort, setSort] = useState<'latest' | 'likes' | 'newcomers'>('latest');
  const [searchText, setSearchText] = useState(''); // [추가] 입력 중인 검색어
  const [query, setQuery] = useState(''); // [추가] 실제로 검색한 키워드
  const [legal, setLegal] = useState<'promise' | 'policy' | null>(null); // [추가] 약속·운영자 조치 기준 전문
  const searching = query !== '';

  const { data: posts = [], isLoading, error } = useQuery({
    queryKey: searching ? ['posts', 'search', query] : ['posts', category, sort],
    queryFn: () => (searching ? postAPI.search(query) : postAPI.list(category, sort)),
  });

  const submitSearch = (e: FormEvent) => {
    e.preventDefault();
    setQuery(searchText.trim());
  };

  const clearSearch = () => {
    setSearchText('');
    setQuery('');
  };

  const emptyMessage = searching
    ? `‘${query}’와(과) 관련된 글을 찾지 못했어요.`
    : sort === 'likes'
      ? `최근 ${LIKES_WINDOW_HOURS}시간 안에 올라온 글이 없어요.`
      : sort === 'newcomers'
        ? '이 카테고리에 공개된 첫 글이 아직 없어요.'
        : '아직 글이 없어요. 첫 글을 남겨보세요.';

  return (
    <Layout>
      <Side>
        {(['전체', ...ALL_CATEGORIES] as const).map((c) => (
          <Chip
            key={c}
            $active={!searching && category === c}
            onClick={() => {
              setCategory(c);
              clearSearch();
            }}
          >
            {c}
          </Chip>
        ))}
      </Side>

      <section>
        <SearchForm onSubmit={submitSearch} role="search">
          <Input
            style={{ marginBottom: 0 }}
            placeholder="제목이나 내용으로 글 검색"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            aria-label="글 검색"
          />
          <Button type="submit" style={{ whiteSpace: 'nowrap' }}><FaSearch /> 검색</Button>
        </SearchForm>

        {searching ? (
          <ResultHead>
            <strong>‘{query}’ 검색 결과 {posts.length}개</strong>
            <Button $variant="sand" style={{ padding: '0.25rem 0.8rem' }} onClick={clearSearch}>검색 지우기</Button>
          </ResultHead>
        ) : (
          <>
            <Tabs>
              <Chip $active={sort === 'latest'} onClick={() => setSort('latest')}>최신순</Chip>
              <Chip $active={sort === 'likes'} onClick={() => setSort('likes')}>공감순</Chip>
              <Chip $active={sort === 'newcomers'} onClick={() => setSort('newcomers')}>신규</Chip>
            </Tabs>
            {sort === 'newcomers' && (
              <Muted style={{ marginBottom: '0.8rem' }}>회원마다 가입 후 처음 쓴 글 한 편만 보여요.</Muted>
            )}
            {sort === 'likes' && (
              <Muted style={{ marginBottom: '0.8rem' }}>
                공감순은 최근 {LIKES_WINDOW_HOURS}시간 안에 올라온 글만 보여요. (공지·고정글은 항상 맨 위)
              </Muted>
            )}
          </>
        )}

        {isLoading && <Muted>불러오는 중...</Muted>}
        {error && <Muted>{error.message}</Muted>}
        {!isLoading && posts.length === 0 && <Muted>{emptyMessage}</Muted>}
        <List>
          {posts.map((p) => (
            <PostCard key={p.id} post={p} menu={me?.role === 'admin' ? 'admin' : undefined} />
          ))}
        </List>
      </section>

      <Right>
        <Link to="/write"><Button style={{ width: '100%' }}>+ 글쓰기</Button></Link>

        {/* [추가] 오늘의 쉼표: 클릭해서 나에게 한마디 쓰기 (나만 볼 수 있음) */}
        <TodayNote />

        <Card style={{ background: color.yellow }}>
          <PromiseHead>
            <h4>커뮤니티 약속</h4>
            {/* [추가] 전문 보기 버튼 두 개 */}
            <PillButton type="button" onClick={() => setLegal('promise')}>전문 보기</PillButton>
          </PromiseHead>
          <p>서로의 마음을 존중해요. 자극적인 묘사는 금지예요.</p>
        </Card>
        {/* [변경] 운영자 조치 기준: 커뮤니티 약속 상자 아래 오른쪽 */}
        <BelowRight>
          <PillButton type="button" onClick={() => setLegal('policy')}>운영자 조치 기준</PillButton>
        </BelowRight>
      </Right>

      {legal && (
        <LegalModal
          content={legal === 'promise' ? COMMUNITY_PROMISE_MD : ADMIN_POLICY_MD}
          onClose={() => setLegal(null)}
        />
      )}
    </Layout>
  );
}
