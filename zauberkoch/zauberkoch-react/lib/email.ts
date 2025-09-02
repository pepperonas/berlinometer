import nodemailer from 'nodemailer';
import { EMAIL_CONFIG } from './constants';

// Email transporter configuration
const transporter = nodemailer.createTransport({
  host: EMAIL_CONFIG.smtp.host,
  port: EMAIL_CONFIG.smtp.port,
  secure: false, // Use STARTTLS
  auth: {
    user: EMAIL_CONFIG.smtp.auth.user,
    pass: EMAIL_CONFIG.smtp.auth.pass,
  },
  tls: {
    rejectUnauthorized: false, // For development
  },
});

// Verify transporter configuration
transporter.verify((error, success) => {
  if (error) {
    console.error('Email configuration error:', error);
  } else {
    console.log('Email server is ready to send messages');
  }
});

interface EmailTemplate {
  subject: string;
  html: string;
  text: string;
}

// Email templates
const templates = {
  verification: {
    de: (verificationLink: string, username: string): EmailTemplate => ({
      subject: 'ZauberKoch - E-Mail bestätigen',
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>E-Mail bestätigen</title>
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: #E91E63; color: white; padding: 20px; text-align: center; }
              .content { background: #f9f9f9; padding: 30px; }
              .button { 
                display: inline-block; 
                background: #E91E63; 
                color: white !important; 
                padding: 12px 30px; 
                text-decoration: none; 
                border-radius: 5px; 
                margin: 20px 0;
              }
              .footer { background: #333; color: white; padding: 20px; text-align: center; font-size: 12px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>🍳 ZauberKoch</h1>
                <p>Willkommen bei der AI-gestützten Rezept-App!</p>
              </div>
              <div class="content">
                <h2>Hallo ${username}!</h2>
                <p>Vielen Dank für deine Registrierung bei ZauberKoch! Um dein Konto zu aktivieren, bestätige bitte deine E-Mail-Adresse.</p>
                
                <p>Klicke auf den folgenden Button, um deine E-Mail zu bestätigen:</p>
                
                <a href="${verificationLink}" class="button">E-Mail bestätigen</a>
                
                <p>Oder kopiere diesen Link in deinen Browser:</p>
                <p style="word-break: break-all; background: #eee; padding: 10px;">${verificationLink}</p>
                
                <p>Dieser Link ist 24 Stunden gültig.</p>
                
                <h3>Was dich bei ZauberKoch erwartet:</h3>
                <ul>
                  <li>🤖 KI-generierte Rezepte basierend auf deinen Vorlieben</li>
                  <li>🍹 Cocktail-Rezepte für jeden Anlass</li>
                  <li>❤️ Lieblings-Rezepte speichern</li>
                  <li>📱 Progressive Web App für alle Geräte</li>
                  <li>🌟 Premium-Features für noch mehr Vielfalt</li>
                </ul>
                
                <p>Falls du diese E-Mail nicht angefordert hast, kannst du sie einfach ignorieren.</p>
                
                <p>Viel Spaß beim Kochen!<br>Dein ZauberKoch Team</p>
              </div>
              <div class="footer">
                <p>© ${new Date().getFullYear()} ZauberKoch - AI Recipe Generator</p>
                <p>Diese E-Mail wurde automatisch generiert. Bitte nicht antworten.</p>
              </div>
            </div>
          </body>
        </html>
      `,
      text: `
        ZauberKoch - E-Mail bestätigen
        
        Hallo ${username}!
        
        Vielen Dank für deine Registrierung bei ZauberKoch! Um dein Konto zu aktivieren, bestätige bitte deine E-Mail-Adresse.
        
        Öffne diesen Link in deinem Browser:
        ${verificationLink}
        
        Dieser Link ist 24 Stunden gültig.
        
        Falls du diese E-Mail nicht angefordert hast, kannst du sie einfach ignorieren.
        
        Viel Spaß beim Kochen!
        Dein ZauberKoch Team
        
        © ${new Date().getFullYear()} ZauberKoch - AI Recipe Generator
      `,
    }),
    en: (verificationLink: string, username: string): EmailTemplate => ({
      subject: 'ZauberKoch - Verify your email',
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Verify your email</title>
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: #E91E63; color: white; padding: 20px; text-align: center; }
              .content { background: #f9f9f9; padding: 30px; }
              .button { 
                display: inline-block; 
                background: #E91E63; 
                color: white !important; 
                padding: 12px 30px; 
                text-decoration: none; 
                border-radius: 5px; 
                margin: 20px 0;
              }
              .footer { background: #333; color: white; padding: 20px; text-align: center; font-size: 12px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>🍳 ZauberKoch</h1>
                <p>Welcome to the AI-powered Recipe App!</p>
              </div>
              <div class="content">
                <h2>Hello ${username}!</h2>
                <p>Thank you for registering with ZauberKoch! To activate your account, please verify your email address.</p>
                
                <p>Click the following button to verify your email:</p>
                
                <a href="${verificationLink}" class="button">Verify Email</a>
                
                <p>Or copy this link into your browser:</p>
                <p style="word-break: break-all; background: #eee; padding: 10px;">${verificationLink}</p>
                
                <p>This link is valid for 24 hours.</p>
                
                <h3>What awaits you at ZauberKoch:</h3>
                <ul>
                  <li>🤖 AI-generated recipes based on your preferences</li>
                  <li>🍹 Cocktail recipes for every occasion</li>
                  <li>❤️ Save favorite recipes</li>
                  <li>📱 Progressive Web App for all devices</li>
                  <li>🌟 Premium features for even more variety</li>
                </ul>
                
                <p>If you didn't request this email, you can simply ignore it.</p>
                
                <p>Happy cooking!<br>Your ZauberKoch Team</p>
              </div>
              <div class="footer">
                <p>© ${new Date().getFullYear()} ZauberKoch - AI Recipe Generator</p>
                <p>This email was generated automatically. Please do not reply.</p>
              </div>
            </div>
          </body>
        </html>
      `,
      text: `
        ZauberKoch - Verify your email
        
        Hello ${username}!
        
        Thank you for registering with ZauberKoch! To activate your account, please verify your email address.
        
        Open this link in your browser:
        ${verificationLink}
        
        This link is valid for 24 hours.
        
        If you didn't request this email, you can simply ignore it.
        
        Happy cooking!
        Your ZauberKoch Team
        
        © ${new Date().getFullYear()} ZauberKoch - AI Recipe Generator
      `,
    }),
  },

  passwordReset: {
    de: (resetLink: string, username: string): EmailTemplate => ({
      subject: 'ZauberKoch - Passwort zurücksetzen',
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Passwort zurücksetzen</title>
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: #E91E63; color: white; padding: 20px; text-align: center; }
              .content { background: #f9f9f9; padding: 30px; }
              .button { 
                display: inline-block; 
                background: #E91E63; 
                color: white !important; 
                padding: 12px 30px; 
                text-decoration: none; 
                border-radius: 5px; 
                margin: 20px 0;
              }
              .footer { background: #333; color: white; padding: 20px; text-align: center; font-size: 12px; }
              .security-note { background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; margin: 20px 0; border-radius: 5px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>🍳 ZauberKoch</h1>
                <p>Passwort zurücksetzen</p>
              </div>
              <div class="content">
                <h2>Hallo ${username}!</h2>
                <p>Du hast eine Anfrage zum Zurücksetzen deines Passworts gestellt.</p>
                
                <p>Klicke auf den folgenden Button, um ein neues Passwort zu setzen:</p>
                
                <a href="${resetLink}" class="button">Neues Passwort setzen</a>
                
                <p>Oder kopiere diesen Link in deinen Browser:</p>
                <p style="word-break: break-all; background: #eee; padding: 10px;">${resetLink}</p>
                
                <div class="security-note">
                  <strong>⚠️ Sicherheitshinweis:</strong>
                  <ul>
                    <li>Dieser Link ist nur 1 Stunde gültig</li>
                    <li>Der Link kann nur einmal verwendet werden</li>
                    <li>Falls du diese Anfrage nicht gestellt hast, ignoriere diese E-Mail</li>
                    <li>Teile diesen Link niemals mit anderen</li>
                  </ul>
                </div>
                
                <p>Nach dem Setzen eines neuen Passworts wirst du automatisch ausgeloggt und musst dich mit dem neuen Passwort anmelden.</p>
                
                <p>Bei Fragen wende dich an unseren Support.</p>
                
                <p>Dein ZauberKoch Team</p>
              </div>
              <div class="footer">
                <p>© ${new Date().getFullYear()} ZauberKoch - AI Recipe Generator</p>
                <p>Diese E-Mail wurde automatisch generiert. Bitte nicht antworten.</p>
              </div>
            </div>
          </body>
        </html>
      `,
      text: `
        ZauberKoch - Passwort zurücksetzen
        
        Hallo ${username}!
        
        Du hast eine Anfrage zum Zurücksetzen deines Passworts gestellt.
        
        Öffne diesen Link in deinem Browser:
        ${resetLink}
        
        SICHERHEITSHINWEIS:
        - Dieser Link ist nur 1 Stunde gültig
        - Der Link kann nur einmal verwendet werden
        - Falls du diese Anfrage nicht gestellt hast, ignoriere diese E-Mail
        
        Dein ZauberKoch Team
        
        © ${new Date().getFullYear()} ZauberKoch - AI Recipe Generator
      `,
    }),
    en: (resetLink: string, username: string): EmailTemplate => ({
      subject: 'ZauberKoch - Reset your password',
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Reset your password</title>
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: #E91E63; color: white; padding: 20px; text-align: center; }
              .content { background: #f9f9f9; padding: 30px; }
              .button { 
                display: inline-block; 
                background: #E91E63; 
                color: white !important; 
                padding: 12px 30px; 
                text-decoration: none; 
                border-radius: 5px; 
                margin: 20px 0;
              }
              .footer { background: #333; color: white; padding: 20px; text-align: center; font-size: 12px; }
              .security-note { background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; margin: 20px 0; border-radius: 5px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>🍳 ZauberKoch</h1>
                <p>Reset your password</p>
              </div>
              <div class="content">
                <h2>Hello ${username}!</h2>
                <p>You have requested to reset your password.</p>
                
                <p>Click the following button to set a new password:</p>
                
                <a href="${resetLink}" class="button">Set New Password</a>
                
                <p>Or copy this link into your browser:</p>
                <p style="word-break: break-all; background: #eee; padding: 10px;">${resetLink}</p>
                
                <div class="security-note">
                  <strong>⚠️ Security Notice:</strong>
                  <ul>
                    <li>This link is only valid for 1 hour</li>
                    <li>The link can only be used once</li>
                    <li>If you didn't make this request, ignore this email</li>
                    <li>Never share this link with others</li>
                  </ul>
                </div>
                
                <p>After setting a new password, you will be automatically logged out and need to sign in with your new password.</p>
                
                <p>If you have questions, please contact our support.</p>
                
                <p>Your ZauberKoch Team</p>
              </div>
              <div class="footer">
                <p>© ${new Date().getFullYear()} ZauberKoch - AI Recipe Generator</p>
                <p>This email was generated automatically. Please do not reply.</p>
              </div>
            </div>
          </body>
        </html>
      `,
      text: `
        ZauberKoch - Reset your password
        
        Hello ${username}!
        
        You have requested to reset your password.
        
        Open this link in your browser:
        ${resetLink}
        
        SECURITY NOTICE:
        - This link is only valid for 1 hour
        - The link can only be used once
        - If you didn't make this request, ignore this email
        
        Your ZauberKoch Team
        
        © ${new Date().getFullYear()} ZauberKoch - AI Recipe Generator
      `,
    }),
  },

  welcome: {
    de: (username: string): EmailTemplate => ({
      subject: 'Willkommen bei ZauberKoch! 🍳',
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Willkommen bei ZauberKoch</title>
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: #E91E63; color: white; padding: 20px; text-align: center; }
              .content { background: #f9f9f9; padding: 30px; }
              .button { 
                display: inline-block; 
                background: #E91E63; 
                color: white !important; 
                padding: 12px 30px; 
                text-decoration: none; 
                border-radius: 5px; 
                margin: 20px 0;
              }
              .footer { background: #333; color: white; padding: 20px; text-align: center; font-size: 12px; }
              .feature { background: white; padding: 15px; margin: 10px 0; border-left: 4px solid #E91E63; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>🍳 Willkommen bei ZauberKoch!</h1>
                <p>Deine kulinarische Reise beginnt jetzt</p>
              </div>
              <div class="content">
                <h2>Hallo ${username}!</h2>
                <p>Herzlich willkommen bei ZauberKoch! Dein Konto wurde erfolgreich verifiziert und du kannst jetzt loslegen.</p>
                
                <h3>🚀 Erste Schritte:</h3>
                <div class="feature">
                  <strong>1. Rezept generieren</strong><br>
                  Klicke auf "Rezept generieren" und lass die KI ein perfektes Rezept für dich erstellen.
                </div>
                <div class="feature">
                  <strong>2. Einstellungen anpassen</strong><br>
                  Passe deine Ernährungsvorlieben und Ziele in den Einstellungen an.
                </div>
                <div class="feature">
                  <strong>3. Favoriten sammeln</strong><br>
                  Speichere deine Lieblingsrezepte für später.
                </div>
                
                <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/recipes/generate" class="button">Erstes Rezept generieren</a>
                
                <h3>💡 Tipps für bessere Rezepte:</h3>
                <ul>
                  <li>Gib spezifische Zutaten oder Gerichte in den "Zusätzlichen Wünschen" an</li>
                  <li>Nutze die Schieberegler für deine perfekte Balance</li>
                  <li>Probiere verschiedene KI-Provider aus</li>
                  <li>Teile deine besten Rezepte mit Freunden</li>
                </ul>
                
                <p>Bei Fragen stehen wir dir gerne zur Verfügung. Viel Spaß beim Kochen!</p>
                
                <p>Dein ZauberKoch Team</p>
              </div>
              <div class="footer">
                <p>© ${new Date().getFullYear()} ZauberKoch - AI Recipe Generator</p>
              </div>
            </div>
          </body>
        </html>
      `,
      text: `
        Willkommen bei ZauberKoch! 🍳
        
        Hallo ${username}!
        
        Herzlich willkommen bei ZauberKoch! Dein Konto wurde erfolgreich verifiziert.
        
        Erste Schritte:
        1. Rezept generieren - Lass die KI ein perfektes Rezept für dich erstellen
        2. Einstellungen anpassen - Passe deine Vorlieben an
        3. Favoriten sammeln - Speichere deine Lieblingsrezepte
        
        Besuche: ${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}
        
        Viel Spaß beim Kochen!
        Dein ZauberKoch Team
      `,
    }),
    en: (username: string): EmailTemplate => ({
      subject: 'Welcome to ZauberKoch! 🍳',
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Welcome to ZauberKoch</title>
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: #E91E63; color: white; padding: 20px; text-align: center; }
              .content { background: #f9f9f9; padding: 30px; }
              .button { 
                display: inline-block; 
                background: #E91E63; 
                color: white !important; 
                padding: 12px 30px; 
                text-decoration: none; 
                border-radius: 5px; 
                margin: 20px 0;
              }
              .footer { background: #333; color: white; padding: 20px; text-align: center; font-size: 12px; }
              .feature { background: white; padding: 15px; margin: 10px 0; border-left: 4px solid #E91E63; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>🍳 Welcome to ZauberKoch!</h1>
                <p>Your culinary journey starts now</p>
              </div>
              <div class="content">
                <h2>Hello ${username}!</h2>
                <p>Welcome to ZauberKoch! Your account has been successfully verified and you can now get started.</p>
                
                <h3>🚀 First Steps:</h3>
                <div class="feature">
                  <strong>1. Generate Recipe</strong><br>
                  Click "Generate Recipe" and let AI create a perfect recipe for you.
                </div>
                <div class="feature">
                  <strong>2. Adjust Settings</strong><br>
                  Customize your dietary preferences and goals in settings.
                </div>
                <div class="feature">
                  <strong>3. Collect Favorites</strong><br>
                  Save your favorite recipes for later.
                </div>
                
                <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/recipes/generate" class="button">Generate First Recipe</a>
                
                <h3>💡 Tips for Better Recipes:</h3>
                <ul>
                  <li>Specify ingredients or dishes in "Additional Wishes"</li>
                  <li>Use sliders for your perfect balance</li>
                  <li>Try different AI providers</li>
                  <li>Share your best recipes with friends</li>
                </ul>
                
                <p>If you have questions, we're here to help. Happy cooking!</p>
                
                <p>Your ZauberKoch Team</p>
              </div>
              <div class="footer">
                <p>© ${new Date().getFullYear()} ZauberKoch - AI Recipe Generator</p>
              </div>
            </div>
          </body>
        </html>
      `,
      text: `
        Welcome to ZauberKoch! 🍳
        
        Hello ${username}!
        
        Welcome to ZauberKoch! Your account has been successfully verified.
        
        First Steps:
        1. Generate Recipe - Let AI create a perfect recipe for you
        2. Adjust Settings - Customize your preferences
        3. Collect Favorites - Save your favorite recipes
        
        Visit: ${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}
        
        Happy cooking!
        Your ZauberKoch Team
      `,
    }),
  },
};

// Email sending functions
export async function sendVerificationEmail(
  email: string, 
  token: string, 
  language: 'de' | 'en' = 'de',
  username?: string
): Promise<void> {
  const verificationLink = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/auth/verify-email?token=${token}`;
  const template = templates.verification[language](verificationLink, username || 'User');
  
  await transporter.sendMail({
    from: EMAIL_CONFIG.from,
    to: email,
    subject: template.subject,
    text: template.text,
    html: template.html,
  });
}

export async function sendPasswordResetEmail(
  email: string,
  token: string,
  language: 'de' | 'en' = 'de',
  username?: string
): Promise<void> {
  const resetLink = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/auth/reset-password?token=${token}`;
  const template = templates.passwordReset[language](resetLink, username || 'User');
  
  await transporter.sendMail({
    from: EMAIL_CONFIG.from,
    to: email,
    subject: template.subject,
    text: template.text,
    html: template.html,
  });
}

export async function sendWelcomeEmail(
  email: string,
  language: 'de' | 'en' = 'de',
  username?: string
): Promise<void> {
  const template = templates.welcome[language](username || 'User');
  
  await transporter.sendMail({
    from: EMAIL_CONFIG.from,
    to: email,
    subject: template.subject,
    text: template.text,
    html: template.html,
  });
}

// Generic email sending function
export async function sendEmail({
  to,
  subject,
  text,
  html,
}: {
  to: string;
  subject: string;
  text: string;
  html?: string;
}): Promise<void> {
  await transporter.sendMail({
    from: EMAIL_CONFIG.from,
    to,
    subject,
    text,
    html: html || text,
  });
}

export default {
  sendVerificationEmail,
  sendPasswordResetEmail,
  sendWelcomeEmail,
  sendEmail,
};