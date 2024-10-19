import { sendMail } from '../../../utils/mailService';
import { NextResponse } from 'next/server';

export async function POST(req) {
  const { users, chatId } = await req.json();

  try {
    for (const user of users) {
      await sendMail({
        to: user.email,
        subject: 'Order Completed!',
        html: `
          <div style="font-family: Arial, sans-serif; color: #333333;">
            <h1 style="color: #FF6600;">Order Completed!</h1>
            <p>Hello ${user.name},</p>
            <p>Great news! The order for your group chat (ID: ${chatId}) has been completed and received by all participants.</p>
            <p>We hope you enjoy your meal!</p>
            <p>Thank you for using our service.</p>
            <p style="color: #FF6600;">Bon appétit!</p>
          </div>
        `,
      });
    }
    return NextResponse.json({ message: 'Emails sent successfully' }, { status: 200 });
  } catch (error) {
    console.error('Error sending emails:', error);
    return NextResponse.json({ message: 'Error sending emails' }, { status: 500 });
  }
}
