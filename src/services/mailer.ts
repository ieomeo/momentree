// 인증번호 메일 발송.
// EmailJS(무료 플랜 있음)의 REST API를 쓰며, 환경변수가 없으면 "개발 모드"로 동작합니다.
//   VITE_EMAILJS_SERVICE_ID, VITE_EMAILJS_TEMPLATE_ID, VITE_EMAILJS_PUBLIC_KEY
// 템플릿에서 쓸 수 있는 변수: {{to_email}}, {{code}}, {{app_name}}, {{valid_minutes}}
export interface MailResult {
  configured: boolean; // 메일 서비스가 연결돼 있는지
  ok: boolean; // 실제로 발송에 성공했는지
}

export async function sendVerificationEmail(to: string, code: string, validMinutes: number): Promise<MailResult> {
  const serviceId = import.meta.env?.VITE_EMAILJS_SERVICE_ID as string | undefined;
  const templateId = import.meta.env?.VITE_EMAILJS_TEMPLATE_ID as string | undefined;
  const publicKey = import.meta.env?.VITE_EMAILJS_PUBLIC_KEY as string | undefined;
  if (!serviceId || !templateId || !publicKey) return { configured: false, ok: false };

  try {
    const res = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        service_id: serviceId,
        template_id: templateId,
        user_id: publicKey,
        template_params: { to_email: to, code, app_name: '모먼트리', valid_minutes: validMinutes },
      }),
    });
    return { configured: true, ok: res.ok };
  } catch {
    return { configured: true, ok: false };
  }
}
