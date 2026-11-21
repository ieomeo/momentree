import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import styled from '@emotion/styled';
import { FaLock } from 'react-icons/fa';
import { Button, Card, Muted, Textarea } from './ui';
import { NOTE_MAX, noteAPI } from '../services/api';
import { errorMessage } from '../services/format';
import { color } from '../styles/theme';

const Placeholder = styled.button`
  display: block;
  width: 100%;
  padding: 0;
  border: none;
  background: none;
  text-align: left;
  cursor: pointer;
  font: inherit;
  line-height: 1.6;
  color: rgba(107, 79, 69, 0.42); /* 연한 안내 문구 */
  &:hover { color: rgba(107, 79, 69, 0.7); }
`;

const Saved = styled.p`
  white-space: pre-wrap;
  line-height: 1.7;
`;

const Row = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 0.5rem;
  margin-top: 0.6rem;
`;

// 오늘의 쉼표: 나에게 전하는 한마디. 나만 볼 수 있어요.
export default function TodayNote() {
  const qc = useQueryClient();
  const { data: note = '' } = useQuery({ queryKey: ['note-today'], queryFn: noteAPI.today });
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState('');

  const start = () => {
    setDraft(note);
    setEditing(true);
  };

  const save = async () => {
    try {
      await noteAPI.saveToday(draft);
      await qc.invalidateQueries({ queryKey: ['note-today'] });
      setEditing(false);
      toast.success(draft.trim() ? '오늘의 쉼표를 저장했어요 🌿' : '오늘의 쉼표를 비웠어요');
    } catch (e) {
      toast.error(errorMessage(e));
    }
  };

  return (
    <Card style={{ background: color.greenSoft }}>
      <h4>오늘의 쉼표</h4>

      {editing ? (
        <>
          <Textarea
            autoFocus
            style={{ minHeight: 110, marginTop: '0.4rem' }}
            placeholder="자신에게 전하는 오늘의 말을 적어보세요."
            maxLength={NOTE_MAX}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) void save();
            }}
          />
          <Row>
            <Muted as="span">{draft.length}/{NOTE_MAX}</Muted>
            <span style={{ display: 'flex', gap: '0.4rem' }}>
              <Button $variant="sand" style={{ padding: '0.3rem 0.8rem' }} onClick={() => setEditing(false)}>취소</Button>
              <Button style={{ padding: '0.3rem 0.8rem' }} onClick={save}>저장</Button>
            </span>
          </Row>
        </>
      ) : note ? (
        <>
          <Saved>{note}</Saved>
          <Row>
            <Muted as="span"><FaLock size={10} /> 나만 볼 수 있어요</Muted>
            <Button $variant="sand" style={{ padding: '0.2rem 0.7rem', fontSize: '0.8rem' }} onClick={start}>수정</Button>
          </Row>
        </>
      ) : (
        <Placeholder type="button" onClick={start}>
          자신에게 전하는 오늘의 말을 적어보세요.
        </Placeholder>
      )}
    </Card>
  );
}
