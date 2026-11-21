import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import styled from '@emotion/styled';
import LegalModal from '../components/LegalModal';
import Logo from '../components/Logo';
import { Button, ErrorText, Field, Input, Muted } from '../components/ui';
import { CONSENT_MD, PRIVACY_POLICY_MD, TERMS_MD } from '../content/legal';
import { CODE_RESEND_SECONDS, CODE_TTL_MINUTES, authAPI } from '../services/api';
import { errorMessage, yearsAgoKey } from '../services/format';
import { color } from '../styles/theme';

interface SignupForm {
  email: string;
  password: string;
  nickname: string;
  realName: string; // [추가] 실명 (운영자만 확인)
  birthDate: string; // [추가] 생년월일 (운영자만 확인)
  phone: string; // [추가] 연락처 (운영자만 확인)
  terms: boolean;
  consent: boolean;
  privacy: boolean; // 개인정보 수집·이용 동의 및 처리방침 확인
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const Page = styled.div`
  max-width: 960px;
  margin: 0 auto;
  padding: 1.5rem;
`;

const Split = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 2.5rem;
  margin-top: 2rem;
  @media (max-width: 760px) { grid-template-columns: 1fr; }
`;

const Side = styled.div`
  background: ${color.greenSoft};
  border-radius: 14px;
  padding: 2rem;
  align-self: start;
  img { display: block; width: 100%; max-width: 340px; height: auto; }
  p { margin-top: 1rem; font-size: 1.1rem; }
`;

const Agree = styled.div`
  background: ${color.yellow};
  border-radius: 12px;
  padding: 1rem;
  margin-bottom: 1rem;
  label { display: flex; gap: 0.5rem; align-items: center; }
  .line { display: flex; justify-content: space-between; align-items: center; gap: 0.6rem; margin-bottom: 0.4rem; }
`;

const LinkButton = styled.button`
  padding: 0;
  border: none;
  background: none;
  color: ${color.brown};
  font-size: 0.85rem;
  font-weight: 700;
  text-decoration: underline;
  white-space: nowrap;
  cursor: pointer;
`;

const InlineRow = styled.div`
  display: flex;
  gap: 0.5rem;
  align-items: stretch;
`;

const CodeBox = styled.div`
  margin-top: 0.6rem;
  padding: 0.8rem;
  border: 1.5px dashed ${color.border};
  border-radius: 10px;
  background: ${color.paper};
`;

const DevBox = styled.p`
  margin-top: 0.6rem;
  padding: 0.6rem 0.8rem;
  border-radius: 8px;
  background: ${color.yellow};
  font-size: 0.88rem;
  strong { font-size: 1.15rem; letter-spacing: 0.15em; }
`;

const OkText = styled.p`
  margin-top: 0.4rem;
  color: #2f7d4f;
  font-size: 0.88rem;
  font-weight: 700;
`;

const PrivacyBox = styled.div`
  margin: 1.2rem 0 1rem;
  padding: 1rem;
  border: 1.5px solid ${color.border};
  border-radius: 12px;
  h4 { margin-bottom: 0.2rem; }
`;

const MiniLabel = styled.label`
  display: block;
  margin-bottom: 0.25rem;
  color: ${color.brownSoft};
  font-size: 0.85rem;
`;

export default function SignupPage() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { register, handleSubmit, getValues, watch, formState: { errors, isSubmitting } } = useForm<SignupForm>();
  const [legal, setLegal] = useState<'terms' | 'consent' | 'privacy' | null>(null);

  // [추가] 이메일 인증 상태
  const emailValue = (watch('email') ?? '').trim().toLowerCase();
  const [codeEmail, setCodeEmail] = useState<string | null>(null); // 인증번호를 보낸 이메일
  const [codeInput, setCodeInput] = useState('');
  const [demoCode, setDemoCode] = useState<string | null>(null); // 메일 서비스가 없을 때 화면에 보여줄 번호
  const [verifiedEmail, setVerifiedEmail] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(0);
  const [busy, setBusy] = useState(false);
  const verified = verifiedEmail !== null && verifiedEmail === emailValue;

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  const sendCode = async () => {
    const value = getValues('email').trim();
    if (!EMAIL_RE.test(value)) {
      toast.error('올바른 이메일 형식이 아니에요');
      return;
    }
    setBusy(true);
    try {
      const result = await authAPI.requestEmailCode(value);
      setCodeEmail(value.toLowerCase());
      setCodeInput('');
      setDemoCode(result.demoCode ?? null);
      setCooldown(CODE_RESEND_SECONDS);
      toast.success(result.delivered ? '인증번호를 이메일로 보냈어요. 메일함을 확인해주세요.' : '인증번호를 만들었어요 (개발 모드)');
    } catch (e) {
      toast.error(errorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  const verifyCode = async () => {
    setBusy(true);
    try {
      await authAPI.verifyEmailCode(getValues('email'), codeInput);
      setVerifiedEmail(emailValue);
      setDemoCode(null);
      toast.success('이메일 인증이 완료됐어요');
    } catch (e) {
      toast.error(errorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  const changeEmail = () => {
    setVerifiedEmail(null);
    setCodeEmail(null);
    setCodeInput('');
    setCooldown(0);
  };

  const onSubmit = async (v: SignupForm) => {
    if (!verified) {
      toast.error('이메일 인증을 먼저 완료해주세요.');
      return;
    }
    try {
      const user = await authAPI.signup({
        email: v.email.trim(),
        password: v.password,
        nickname: v.nickname.trim(),
        identity: { name: v.realName, birthDate: v.birthDate, phone: v.phone },
        consents: { terms: v.terms, consent: v.consent, privacy: v.privacy },
      });
      qc.setQueryData(['me'], user);
      toast.success('모먼트리에 오신 걸 환영해요 🌿');
      navigate('/feed');
    } catch (e) {
      toast.error(errorMessage(e));
    }
  };

  return (
    <Page>
      <Logo height={44} />
      <Split>
        <Side>
          <img src="/logo-horizontal.png" alt="모먼트리" />
          <p>마음의 조각들이 모여<br />따뜻한 숲이 되는 공간</p>
          <Muted style={{ marginTop: '2rem' }}>Pause. Write. Be Heard.</Muted>
        </Side>

        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <h2 style={{ marginBottom: '1rem' }}>가입하기</h2>

          <Field>
            <InlineRow>
              <Input
                type="email"
                placeholder="이메일"
                readOnly={verified}
                {...register('email', {
                  required: '이메일을 입력해주세요',
                  pattern: { value: EMAIL_RE, message: '올바른 이메일 형식이 아니에요' },
                })}
              />
              {verified ? (
                <Button type="button" $variant="sand" style={{ whiteSpace: 'nowrap' }} onClick={changeEmail}>
                  이메일 변경
                </Button>
              ) : (
                <Button
                  type="button"
                  $variant="sand"
                  style={{ whiteSpace: 'nowrap' }}
                  disabled={busy || cooldown > 0}
                  onClick={sendCode}
                >
                  {cooldown > 0 ? `재전송 ${cooldown}초` : codeEmail === emailValue ? '인증번호 다시 받기' : '인증번호 받기'}
                </Button>
              )}
            </InlineRow>
            {errors.email && <ErrorText>{errors.email.message}</ErrorText>}
            {verified && <OkText>✔ 이메일 인증이 완료됐어요</OkText>}

            {!verified && codeEmail !== null && codeEmail === emailValue && (
              <CodeBox>
                <InlineRow>
                  <Input
                    inputMode="numeric"
                    maxLength={6}
                    placeholder="인증번호 6자리"
                    value={codeInput}
                    onChange={(e) => setCodeInput(e.target.value.replace(/\D/g, ''))}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        if (codeInput.length === 6) void verifyCode();
                      }
                    }}
                  />
                  <Button type="button" style={{ whiteSpace: 'nowrap' }} disabled={busy || codeInput.length !== 6} onClick={verifyCode}>
                    인증 확인
                  </Button>
                </InlineRow>
                <Muted style={{ marginTop: '0.4rem' }}>인증번호는 {CODE_TTL_MINUTES}분 동안 유효해요.</Muted>
                {demoCode && (
                  <DevBox>
                    개발 모드: 메일 서비스가 연결되지 않아 인증번호를 화면에 보여줘요. → <strong>{demoCode}</strong>
                  </DevBox>
                )}
              </CodeBox>
            )}
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
              placeholder="닉네임 (익명으로 표시돼요)"
              {...register('nickname', { required: '닉네임을 입력해주세요', maxLength: { value: 12, message: '12자 이하로 입력해주세요' } })}
            />
            {errors.nickname && <ErrorText>{errors.nickname.message}</ErrorText>}
          </Field>

          {/* [추가] 개인정보: 운영자만 확인할 수 있는 비공개 정보 */}
          <PrivacyBox>
            <h4>개인정보 (비공개)</h4>
            <Muted style={{ marginBottom: '0.8rem' }}>
              실명·생년월일·연락처는 다른 이용자에게 절대 보이지 않아요. 위기 알림이 접수됐을 때 운영자만 확인할 수 있어요.
            </Muted>
            <Field>
              <Input
                placeholder="실명 (예: 홍길동)"
                autoComplete="name"
                {...register('realName', {
                  required: '실명을 입력해주세요',
                  pattern: { value: /^[가-힣a-zA-Z ]{2,20}$/, message: '2~20자의 한글 또는 영문으로 입력해주세요' },
                })}
              />
              {errors.realName && <ErrorText>{errors.realName.message}</ErrorText>}
            </Field>
            <Field>
              <MiniLabel htmlFor="birthDate">생년월일</MiniLabel>
              <Input
                id="birthDate"
                type="date"
                min="1900-01-01"
                max={yearsAgoKey(14)}
                {...register('birthDate', { required: '생년월일을 입력해주세요' })}
              />
              <Muted style={{ marginTop: '0.25rem' }}>만 14세 이상만 가입할 수 있어요.</Muted>
              {errors.birthDate && <ErrorText>{errors.birthDate.message}</ErrorText>}
            </Field>
            <Field>
              <Input
                type="tel"
                inputMode="tel"
                placeholder="연락처 (예: 010-1234-5678)"
                autoComplete="tel"
                {...register('phone', {
                  required: '연락처를 입력해주세요',
                  pattern: { value: /^01[016789]-?\d{3,4}-?\d{4}$/, message: '휴대폰 번호를 올바르게 입력해주세요' },
                })}
              />
              {errors.phone && <ErrorText>{errors.phone.message}</ErrorText>}
            </Field>
          </PrivacyBox>

          <Agree>
            <div className="line">
              <label>
                <input type="checkbox" {...register('terms', { required: '이용약관에 동의해주세요' })} />
                이용약관 · 커뮤니티 가이드 (필수)
              </label>
              <LinkButton type="button" onClick={() => setLegal('terms')}>전문 보기</LinkButton>
            </div>
            {errors.terms && <ErrorText>{errors.terms.message}</ErrorText>}
            <div className="line">
              <label>
                <input type="checkbox" {...register('consent', { required: '신원정보 활용 동의가 필요해요' })} />
                위급 시 신원정보 활용 · 제공 동의 (필수)
              </label>
              <LinkButton type="button" onClick={() => setLegal('consent')}>전문 보기</LinkButton>
            </div>
            {errors.consent && <ErrorText>{errors.consent.message}</ErrorText>}
            <div className="line">
              <label>
                <input type="checkbox" {...register('privacy', { required: '개인정보 수집·이용에 동의해주세요' })} />
                개인정보 수집·이용 동의 및 처리방침 확인 (필수)
              </label>
              <LinkButton type="button" onClick={() => setLegal('privacy')}>전문 보기</LinkButton>
            </div>
            {errors.privacy && <ErrorText>{errors.privacy.message}</ErrorText>}
            <Muted>평소에는 닉네임만 보이며, 위급한 경우에만 운영자가 신원을 확인할 수 있어요.</Muted>
          </Agree>

          <Button type="submit" disabled={isSubmitting} style={{ width: '100%', padding: '0.9rem' }}>
            가입하기
          </Button>
          <Muted style={{ marginTop: '1rem', textAlign: 'center' }}>
            이미 계정이 있나요? <Link to="/login" style={{ fontWeight: 700 }}>로그인</Link>
          </Muted>
        </form>
      </Split>

      {legal && (
        <LegalModal
          content={legal === 'terms' ? TERMS_MD : legal === 'consent' ? CONSENT_MD : PRIVACY_POLICY_MD}
          onClose={() => setLegal(null)}
        />
      )}
    </Page>
  );
}
