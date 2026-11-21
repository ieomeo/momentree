import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import styled from '@emotion/styled';
import Logo from '../components/Logo';
import { Button, Card, ErrorText, Field, Input, Muted } from '../components/ui';
import { supabase } from '../services/supabase';
import { authAPI, ProfilePendingError } from '../services/api';
import { errorMessage } from '../services/format';

interface LoginForm {
  email: string;
  password: string;
}

const Page = styled.div`
  max-width: 420px;
  margin: 0 auto;
  padding: 2rem 1.5rem;
  h2 { margin: 1.5rem 0 1rem; }
`;

export default function LoginPage() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [starting, setStarting] = useState(false);
  const providers = useQuery({ queryKey: ['auth-providers'], queryFn: authAPI.providers, enabled: !!supabase });
  const startNaver = async () => {
    setStarting(true);
    try { await authAPI.startNaver(); }
    catch (error) { toast.error(errorMessage(error)); setStarting(false); }
  };
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<LoginForm>();

  const onSubmit = async (v: LoginForm) => {
    try {
      const user = await authAPI.login(v.email.trim(), v.password);
      qc.clear();
      qc.setQueryData(['me'], user);
      navigate(user.role === 'admin' ? '/admin' : '/feed');
    } catch (e) {
      if (e instanceof ProfilePendingError) navigate('/signup?complete=1', { replace: true });
      else toast.error(errorMessage(e));
    }
  };

  return (
    <Page>
      <Logo height={52} />
      <h2>로그인</h2>
      <Card>
        {!supabase && <ErrorText>Supabase 환경변수를 설정해주세요.</ErrorText>}
        {providers.isError && <Muted>네이버 로그인 설정을 확인할 수 없어요.</Muted>}
        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <Field>
            <Input type="email" placeholder="이메일" {...register('email', { required: '이메일을 입력해주세요' })} />
            {errors.email && <ErrorText>{errors.email.message}</ErrorText>}
          </Field>
          <Field>
            <Input type="password" placeholder="비밀번호" {...register('password', { required: '비밀번호를 입력해주세요' })} />
            {errors.password && <ErrorText>{errors.password.message}</ErrorText>}
          </Field>
          <Button type="submit" disabled={!supabase || isSubmitting || starting || providers.data?.email.enabled === false} style={{ width: '100%' }}>로그인</Button>
        </form>
        {providers.data?.naver.enabled && <Button type="button" disabled={isSubmitting || starting} onClick={() => void startNaver()} style={{ width: '100%', marginTop: '0.75rem' }}>네이버 로그인</Button>}
      </Card>
      <Muted style={{ marginTop: '1rem', textAlign: 'center' }}>
        처음이신가요? <Link to="/signup" style={{ fontWeight: 700 }}>가입하기</Link>
      </Muted>
    </Page>
  );
}
