import { useState } from 'react';
import { toast } from 'react-toastify';
import styled from '@emotion/styled';
import { Button, Input, Modal } from './ui';
import { reportAPI } from '../services/api';
import { errorMessage } from '../services/format';
import { REPORT_REASONS } from '../types';
import type { Report, ReportReason } from '../types';

const Radio = styled.label`
  display: flex;
  align-items: center;
  gap: 0.6rem;
  padding: 0.45rem 0;
  cursor: pointer;
`;

const Actions = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 0.6rem;
  margin-top: 1rem;
`;

interface Props {
  targetType: Report['targetType'];
  targetId: string;
  targetPreview: string;
  onClose: () => void;
}

// 신고 모달 (화면 ⑦)
export default function ReportModal({ targetType, targetId, targetPreview, onClose }: Props) {
  const [reason, setReason] = useState<ReportReason>(REPORT_REASONS[0]);
  const [detail, setDetail] = useState('');

  const submit = async () => {
    try {
      await reportAPI.create({ targetType, targetId, targetPreview, reason, detail: detail.trim() || undefined });
      toast.success('신고가 접수됐어요. 운영팀이 확인할게요.');
      onClose();
    } catch (e) {
      toast.error(errorMessage(e));
    }
  };

  return (
    <Modal onClose={onClose}>
      <h3>신고하기</h3>
      <p style={{ margin: '0.3rem 0 0.8rem' }}>사유를 선택해 주세요</p>
      {REPORT_REASONS.map((r) => (
        <Radio key={r}>
          <input type="radio" name="reason" checked={reason === r} onChange={() => setReason(r)} />
          {r}
        </Radio>
      ))}
      <Input
        style={{ marginTop: '0.8rem' }}
        placeholder="상세 내용 (선택)"
        value={detail}
        onChange={(e) => setDetail(e.target.value)}
      />
      <Actions>
        <Button $variant="sand" onClick={onClose}>취소</Button>
        <Button onClick={submit}>신고하기</Button>
      </Actions>
    </Modal>
  );
}
