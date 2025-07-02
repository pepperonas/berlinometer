import nodemailer from 'nodemailer';

export class EmailService {
  private transporter: nodemailer.Transporter;

  constructor() {
    this.transporter = nodemailer.createTransporter({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }

  async sendWelcomeEmail(email: string, firstName: string): Promise<void> {
    const mailOptions = {
      from: process.env.EMAIL_FROM,
      to: email,
      subject: 'Willkommen bei Datenfestung',
      html: `
        <h1>Willkommen bei Datenfestung, ${firstName}!</h1>
        <p>Ihr Account wurde erfolgreich erstellt.</p>
        <p>Sie können sich jetzt in Ihr Datenschutz-Dashboard einloggen.</p>
        <p>Bei Fragen wenden Sie sich gerne an unser Support-Team.</p>
        <br>
        <p>Ihr Datenfestung Team</p>
      `,
    };

    await this.transporter.sendMail(mailOptions);
  }

  async sendPasswordResetEmail(email: string, resetToken: string): Promise<void> {
    const resetUrl = `${process.env.APP_URL}/reset-password?token=${resetToken}`;
    
    const mailOptions = {
      from: process.env.EMAIL_FROM,
      to: email,
      subject: 'Passwort zurücksetzen - Datenfestung',
      html: `
        <h1>Passwort zurücksetzen</h1>
        <p>Sie haben eine Anfrage zum Zurücksetzen Ihres Passworts gestellt.</p>
        <p>Klicken Sie auf den folgenden Link, um Ihr Passwort zurückzusetzen:</p>
        <a href="${resetUrl}" style="background-color: #1976d2; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Passwort zurücksetzen</a>
        <p>Dieser Link ist 1 Stunde gültig.</p>
        <p>Falls Sie diese Anfrage nicht gestellt haben, ignorieren Sie diese E-Mail.</p>
        <br>
        <p>Ihr Datenfestung Team</p>
      `,
    };

    await this.transporter.sendMail(mailOptions);
  }

  async sendNotificationEmail(email: string, subject: string, message: string): Promise<void> {
    const mailOptions = {
      from: process.env.EMAIL_FROM,
      to: email,
      subject: `Datenfestung: ${subject}`,
      html: `
        <h1>${subject}</h1>
        <p>${message}</p>
        <br>
        <p>Ihr Datenfestung Team</p>
      `,
    };

    await this.transporter.sendMail(mailOptions);
  }
}