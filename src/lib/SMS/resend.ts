import { Resend } from 'resend';
import { insertSystemLog } from '../../pages/api/queries/system-logs';
import { logger } from '../utils/logger';

const resendApiKey = process.env.RESEND_API_KEY;

if (!resendApiKey) {
  logger.warn(
    'RESEND_API_KEY is not set in environment variables. Email sending will be mocked.',
    'ResendLib'
  );
}

// Fallback mock to prevent top-level crashes and API route failures
export const resend = resendApiKey
  ? new Resend(resendApiKey)
  : ({
      emails: {
        send: async (payload: any) => {
          logger.warn('[MOCK] Email sending disabled', 'ResendLib', {
            subject: payload.subject,
            to: payload.to,
          });
          return { id: 'mock_email_id' };
        },
      },
    } as unknown as Resend);

export async function sendRentalInvoice({
  to,
  customerName,
  vehicleName,
  platNumber,
  amount,
  refundableDeposit,
  serviceFee,
  platformFee,
}: {
  to: string;
  customerName: string;
  vehicleName: string;
  platNumber: string;
  amount: string;
  refundableDeposit: string;
  serviceFee: string;
  platformFee: string;
}) {
  try {
    const subject = `Invoice for your rental: ${vehicleName} (${platNumber})`;
    const html = `
      <div style="font-family: 'Inter', sans-serif; max-width: 600px; margin: 0 auto; padding: 40px; background-color: #ffffff; border: 1px solid #f0f0f0; border-radius: 24px;">
        <div style="margin-bottom: 40px;">
          <h1 style="font-size: 24px; font-weight: 800; color: #111827; margin: 0;">Rental Invoice</h1>
          <p style="color: #6b7280; font-size: 14px;">Thank you for booking with us, ${customerName}!</p>
        </div>

        <div style="margin-bottom: 32px; padding-bottom: 24px; border-bottom: 1px solid #f3f4f6;">
          <h2 style="font-size: 14px; font-weight: 700; color: #374151; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 12px;">Vehicle Details</h2>
          <p style="font-size: 18px; font-weight: 700; color: #111827; margin: 0;">${vehicleName}</p>
          <p style="font-size: 14px; font-weight: 600; color: #10b981; margin: 4px 0 0 0;">Plate Number: ${platNumber}</p>
        </div>

        <div style="margin-bottom: 32px;">
          <h2 style="font-size: 14px; font-weight: 700; color: #374151; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 16px;">Billing Breakdown</h2>
          <div style="margin-top: 16px;">
            <div style="display: flex; justify-content: space-between; margin-bottom: 12px;">
              <span style="color: #6b7280; font-size: 14px;">Rental Rate</span>
              <span style="color: #111827; font-size: 14px; font-weight: 600;">RWF ${amount}</span>
            </div>
            <div style="display: flex; justify-content: space-between; margin-bottom: 12px;">
              <span style="color: #6b7280; font-size: 14px;">Service Fee</span>
              <span style="color: #111827; font-size: 14px; font-weight: 600;">RWF ${serviceFee}</span>
            </div>
            <div style="display: flex; justify-content: space-between; margin-bottom: 12px;">
              <span style="color: #6b7280; font-size: 14px;">Platform Fee</span>
              <span style="color: #111827; font-size: 14px; font-weight: 600;">RWF ${platformFee}</span>
            </div>
            <div style="display: flex; justify-content: space-between; margin-bottom: 12px; padding-top: 12px; border-top: 1px dashed #e5e7eb;">
              <span style="color: #6b7280; font-size: 14px;">Refundable Deposit</span>
              <span style="color: #f59e0b; font-size: 14px; font-weight: 700;">RWF ${refundableDeposit}</span>
            </div>
          </div>
        </div>

        <div style="padding: 24px; background-color: #f9fafb; border-radius: 16px;">
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <span style="font-size: 16px; font-weight: 800; color: #111827;">Total Paid</span>
            <span style="font-size: 24px; font-weight: 900; color: #10b981;">RWF ${
              parseInt(amount) +
              parseInt(serviceFee) +
              parseInt(platformFee) +
              parseInt(refundableDeposit)
            }</span>
          </div>
        </div>

        <div style="margin-top: 40px; text-align: center;">
          <p style="font-size: 12px; color: #9ca3af; line-height: 1.5;">
            This is an automated invoice for your rental booking.<br/>
            The refundable deposit will be returned after the vehicle is inspected and returned.
          </p>
        </div>
      </div>
    `;

    const result = await resend.emails.send({
      from: 'Plas <onboarding@resend.dev>',
      to,
      subject,
      html,
    });

    return result;
  } catch (error) {
    logger.error('Failed to send rental invoice email', 'ResendLib:sendRentalInvoice', {
      error,
      to,
    });
    await insertSystemLog('error', 'Failed to send rental invoice email', 'ResendLib', {
      error,
      to,
    });
    return null;
  }
}

export async function sendWithdrawalInvoice({
  to,
  customerName,
  amount,
  fee,
  newBalance,
  referenceId,
}: {
  to: string;
  customerName: string;
  amount: string;
  fee: string;
  newBalance: string;
  referenceId: string;
}) {
  try {
    const subject = `Withdrawal Receipt: RWF ${amount}`;
    const html = `
      <div style="font-family: 'Inter', sans-serif; max-width: 600px; margin: 0 auto; padding: 40px; background-color: #ffffff; border: 1px solid #f0f0f0; border-radius: 24px;">
        <div style="margin-bottom: 40px;">
          <h1 style="font-size: 24px; font-weight: 800; color: #111827; margin: 0;">Withdrawal Receipt</h1>
          <p style="color: #6b7280; font-size: 14px;">Hello ${customerName}, your withdrawal request was processed successfully.</p>
        </div>

        <div style="margin-bottom: 32px; padding-bottom: 24px; border-bottom: 1px solid #f3f4f6;">
          <h2 style="font-size: 14px; font-weight: 700; color: #374151; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 12px;">Transaction Details</h2>
          <p style="font-size: 14px; font-weight: 600; color: #10b981; margin: 0;">Ref ID: ${referenceId}</p>
        </div>

        <div style="margin-bottom: 32px;">
          <h2 style="font-size: 14px; font-weight: 700; color: #374151; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 16px;">Summary</h2>
          <div style="margin-top: 16px;">
            <div style="display: flex; justify-content: space-between; margin-bottom: 12px;">
              <span style="color: #6b7280; font-size: 14px;">Withdrawal Amount</span>
              <span style="color: #111827; font-size: 14px; font-weight: 600;">RWF ${amount}</span>
            </div>
            <div style="display: flex; justify-content: space-between; margin-bottom: 12px;">
              <span style="color: #6b7280; font-size: 14px;">Service Fee</span>
              <span style="color: #111827; font-size: 14px; font-weight: 600;">RWF ${fee}</span>
            </div>
            <div style="display: flex; justify-content: space-between; margin-bottom: 12px; padding-top: 12px; border-top: 1px dashed #e5e7eb;">
              <span style="color: #6b7280; font-size: 14px;">Total Deducted</span>
              <span style="color: #ef4444; font-size: 14px; font-weight: 700;">RWF ${
                parseFloat(amount) + parseFloat(fee)
              }</span>
            </div>
          </div>
        </div>

        <div style="padding: 24px; background-color: #f9fafb; border-radius: 16px;">
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <span style="font-size: 16px; font-weight: 800; color: #111827;">New Balance</span>
            <span style="font-size: 24px; font-weight: 900; color: #10b981;">RWF ${newBalance}</span>
          </div>
        </div>

        <div style="margin-top: 40px; text-align: center;">
          <p style="font-size: 12px; color: #9ca3af; line-height: 1.5;">
            Thank you for using Plas Wallet.<br/>
            If you did not authorize this transaction, please contact support immediately.
          </p>
        </div>
      </div>
    `;

    const result = await resend.emails.send({
      from: 'Plas <onboarding@resend.dev>',
      to,
      subject,
      html,
    });

    return result;
  } catch (error) {
    logger.error('Failed to send withdrawal invoice email', 'ResendLib:sendWithdrawalInvoice', {
      error,
      to,
    });
    await insertSystemLog('error', 'Failed to send withdrawal invoice email', 'ResendLib', {
      error,
      to,
    });
    return null;
  }
}
