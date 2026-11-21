import { useForm } from 'react-hook-form';
import { toast } from 'react-toastify';
import styled from '@emotion/styled';
import { Button, ErrorText, Field, Input, Modal, Muted } from './ui';
import { NICKNAME_MAX, adminAPI } from '../services/api';
import { errorMessage } from '../services/format';

interface AdminForm {
  email: string;
  password: string;
  nickname: string;
}

const Actions = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 0.6rem;
  margin-top: 0.4rem;
`;

// 운영자 계정 추가 (운영자 대시보드에서만 열 수 있음)
export default function CreateAdminModal({ onClose }: { onClose: () => void }) {
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<AdminForm>();

  const onSubmit = async (v: AdminForm) => {
    try {
      await adminAPI.createAdmin({ email: v.email, password: v.password, nickname: v.nickname });
      toast.success(`운영자 계정을 만들었어요 (${v.nickname.trim()})`);
      onClose();
    } catch (e) {
      toast.error(errorMessage(e));
    }
  };

  return (
    <Modal onClose={onClose}>
      <h3>운영자 계정 추가</h3>
      <Muted style={{ margin: '0.3rem 0 1rem' }}>
        새 운영자는 대시보드의 모든 기능을 쓸 수 있어요. 신중하게 만들어주세요.
      </Muted>
      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <Field>
          <Input
            type="email"
            placeholder="이메일"
            {...register('email', {
              required: '이메일을 입력해주세요',
              pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: '올바른 이메일 형식이 아니에요' },
            })}
          />
          {errors.email && <ErrorText>{errors.email.message}</ErrorText>}
        </Field>
        <Field>
          <Input
            type="password"
            placeholder="비밀번호 (6자 이상)"
            {...register('password', { required: '비밀번호를 입력해주세요', minLength: { value: 6, message: '6자 이상 입력해주세요' } })}
          />
          {errors.password && <ErrorText>{errors.password.message}</ErrorText>}
        </Field>
        <Field>
          <Input
            placeholder={`닉네임 (${NICKNAME_MAX}자 이하, 중복 불가)`}
            {...register('nickname', {
              required: '닉네임을 입력해주세요',
              maxLength: { value: NICKNAME_MAX, message: `${NICKNAME_MAX}자 이하로 입력해주세요` },
            })}
          />
          {errors.nickname && <ErrorText>{errors.nickname.message}</ErrorText>}
        </Field>
        <Actions>
          <Button type="button" $variant="sand" onClick={onClose}>취소</Button>
          <Button type="submit" disabled={isSubmitting}>운영자 만들기</Button>
        </Actions>
      </form>
    </Modal>
  );
}
