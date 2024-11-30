import { Resend } from 'resend';
import { getWelcomeEmailHtml } from '../emails/WelcomeEmail';

const resend = new Resend(process.env.RESEND_API_KEY);

export const sendWelcomeEmail = async (userEmail, userName) => {
  try {
    // Input validation
    if (!userEmail || !userName) {
      console.error('Missing required parameters for welcome email:', { userEmail, userName });
      return false;
    }

    const { data, error } = await resend.emails.send({
      from: process.env.EMAIL_FROM || 'ShaFood <onboarding@resend.dev>',
      to: userEmail,
      subject: 'Welcome to ShaFood! 🎉',
      html: getWelcomeEmailHtml(userName),
      tags: [{ name: 'email_type', value: 'welcome' }],
      headers: {
        'X-Entity-Ref-ID': new Date().getTime().toString(),
      }
    });

    if (error) {
      console.error('Error sending welcome email:', error);
      return false;
    }

    console.log('Welcome email sent successfully:', {
      emailId: data.id,
      recipient: userEmail,
      userName
    });
    
    return true;
  } catch (error) {
    console.error('Exception while sending welcome email:', error);
    return false;
  }
}; 