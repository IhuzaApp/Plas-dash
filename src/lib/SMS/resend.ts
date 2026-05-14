import { Resend } from 'resend';

const resendApiKey = process.env.RESEND_API_KEY;

if (!resendApiKey) {
  console.log(
    'DEBUG: RESEND_API_KEY is MISSING in process.env. Email sending will be mocked.',
    'ResendLib'
  );
} else {
  console.log('DEBUG: RESEND_API_KEY is present (starts with:', resendApiKey.substring(0, 5), ')');
}

// Fallback logger if the system logger is not available
const logger = {
  warn: (msg: string, context?: string, data?: any) =>
    console.warn(`[${context || 'ResendLib'}] ${msg}`, data || ''),
  error: (msg: string, context?: string, data?: any) =>
    console.error(`[${context || 'ResendLib'}] ${msg}`, data || ''),
  info: (msg: string, context?: string, data?: any) =>
    console.info(`[${context || 'ResendLib'}] ${msg}`, data || ''),
};

// Fallback mock to prevent top-level crashes and API route failures
export const resend = resendApiKey
  ? new Resend(resendApiKey)
  : ({
    emails: {
      send: async (payload: any) => {
        console.log('[MOCK] Email sending disabled', 'ResendLib', {
          subject: payload.subject,
          to: payload.to,
        });
        return { data: { id: 'mock_email_id' }, error: null };
      },
    },
  } as unknown as Resend);



export async function sendTwoFactorEnabledEmail({
  to,
  customerName,
}: {
  to: string;
  customerName: string;
}) {
  try {
    const subject = 'Security Update: Two-Factor Authentication Required';
    const html = `
      <div style="font-family: 'Inter', sans-serif; max-width: 600px; margin: 0 auto; padding: 40px; background-color: #ffffff; border: 1px solid #f0f0f0; border-radius: 24px;">
        <div style="margin-bottom: 40px;">
          <div style="width: 48px; h-48px; background-color: #ecfdf5; border-radius: 12px; display: flex; align-items: center; justify-content: center; margin-bottom: 24px;">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
          </div>
          <h1 style="font-size: 24px; font-weight: 800; color: #111827; margin: 0;">Secure Your Account</h1>
          <p style="color: #6b7280; font-size: 14px; margin-top: 8px;">Hello ${customerName}, an administrator has enabled Two-Factor Authentication (2FA) for your account.</p>
        </div>

        <div style="padding: 24px; background-color: #f9fafb; border-radius: 16px; margin-bottom: 32px; border: 1px solid #f3f4f6;">
          <h2 style="font-size: 14px; font-weight: 700; color: #374151; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 12px;">What this means</h2>
          <p style="font-size: 14px; color: #4b5563; line-height: 1.6; margin: 0;">
            To maintain access to your account, you must now use an authenticator app (like Google Authenticator, Authy, or Microsoft Authenticator) to scan a QR code and generate secure login codes.
          </p>
        </div>

        <div style="text-align: center; margin-bottom: 32px;">
          <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://dash.plas.rw'}/profile" style="display: inline-block; padding: 16px 32px; background-color: #111827; color: #ffffff; text-decoration: none; border-radius: 12px; font-weight: 700; font-size: 16px; transition: background-color 0.2s;">
            Set Up 2FA Now
          </a>
        </div>

        <div style="margin-top: 40px; padding-top: 24px; border-top: 1px solid #f3f4f6; text-align: center;">
          <p style="font-size: 12px; color: #9ca3af; line-height: 1.5;">
            Once you click the button above, you will be taken to your profile where you can scan your unique QR code.<br/>
            If you did not expect this change, please contact your system administrator immediately.
          </p>
        </div>
      </div>
    `;

    console.log('DEBUG: Attempting to send 2FA enabled email to:', to);
    const result = await resend.emails.send({
      from: 'Plas Security <security@plas.rw>',
      to,
      subject,
      html,
    });
    console.log('DEBUG: Resend response:', result);

    return result;
  } catch (error) {
    logger.error('Failed to send 2FA enabled email', 'ResendLib:sendTwoFactorEnabledEmail', { error, to });
    return null;
  }
}

export async function sendTwoFactorCodeEmail({
  to,
  customerName,
  code,
}: {
  to: string;
  customerName: string;
  code: string;
}) {
  try {
    const subject = `${code} is your Plas verification code`;
    const html = `
      <div style="font-family: 'Inter', sans-serif; max-width: 600px; margin: 0 auto; padding: 40px; background-color: #ffffff; border: 1px solid #f0f0f0; border-radius: 24px;">
        <div style="margin-bottom: 40px;">
          <h1 style="font-size: 24px; font-weight: 800; color: #111827; margin: 0;">Verification Code</h1>
          <p style="color: #6b7280; font-size: 14px; margin-top: 8px;">Hello ${customerName}, use the code below to complete your login.</p>
        </div>

        <div style="padding: 32px; background-color: #f9fafb; border-radius: 20px; text-align: center; margin-bottom: 32px; border: 1px solid #f3f4f6;">
          <div style="font-family: 'JetBrains Mono', monospace; font-size: 48px; font-weight: 800; color: #111827; letter-spacing: 0.2em; margin-bottom: 8px;">
            ${code}
          </div>
          <p style="font-size: 12px; color: #9ca3af; margin: 0;">This code expires in 10 minutes</p>
        </div>

        <div style="margin-top: 40px; padding-top: 24px; border-top: 1px solid #f3f4f6; text-align: center;">
          <p style="font-size: 12px; color: #9ca3af; line-height: 1.5;">
            If you did not request this code, someone may be trying to access your account.<br/>
            Please change your password and contact support if this was not you.
          </p>
        </div>
      </div>
    `;

    console.log('DEBUG: Attempting to send 2FA verification code to:', to);
    const result = await resend.emails.send({
      from: 'Plas Security <security@plas.rw>',
      to,
      subject,
      html,
    });
    console.log('DEBUG: Resend response:', result);

    return result;
  } catch (error) {
    logger.error('Failed to send 2FA code email', 'ResendLib:sendTwoFactorCodeEmail', { error, to });
    return null;
  }
}
