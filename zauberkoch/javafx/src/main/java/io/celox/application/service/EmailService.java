package io.celox.application.service;

/**
 * @author Martin Pfeffer
 * <a href="mailto:martin.pfeffer@celox.io">martin.pfeffer@celox.io</a>
 * @see <a href="https://celox.io">https://celox.io</a>
 */

import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;

@Service
public class EmailService {

    private final JavaMailSender mailSender;

    public EmailService(JavaMailSender mailSender) {
        this.mailSender = mailSender;
    }

    public void sendEmail(String to, boolean isRegistration, String link) {
        MimeMessage mimeMessage = mailSender.createMimeMessage();
        MimeMessageHelper helper;
        try {
            helper = new MimeMessageHelper(mimeMessage, true, "UTF-8");
            helper.setTo(to);
            helper.setBcc("admin@zauberkoch.com");
            helper.setFrom("admin@zauberkoch.com");

            if (isRegistration) {
                helper.setSubject("Zauberkoch - Deine Registrierung");
                helper.setText(getRegistrationEmailHtml(link), true);
            } else {
                helper.setSubject("Zauberkoch - Passwort zurücksetzen");
                helper.setText(getPasswordResetEmailHtml(link), true);
            }
        } catch (MessagingException e) {
            throw new RuntimeException(e);
        }
        mailSender.send(mimeMessage);
    }

    private String getRegistrationEmailHtml(String link) {
        return "<!DOCTYPE html>\n" +
               "<html>\n" +
               "<head>\n" +
               "    <meta charset=\"UTF-8\">\n" +
               "    <style>\n" +
               "        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; background-color: #f5f5f5; }\n" +
               "        .container { padding: 20px; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }\n" +
               "        .logo { text-align: center; margin-bottom: 20px; font-size: 28px; font-weight: bold; color: #333; }\n" +
               "        .content { padding: 20px; }\n" +
               "        .button { display: inline-block; width: 100%; padding: 12px 0; margin: 15px 0; background-color: #2d3748; color: white; text-decoration: none; border-radius: 4px; font-weight: normal; text-align: center; }\n" +
               "        .secondary-button { display: inline-block; width: 100%; padding: 12px 0; margin: 10px 0; background-color: #2d3748; color: white; text-decoration: none; border-radius: 4px; font-weight: normal; text-align: center; }\n" +
               "        .heading { text-align: center; font-size: 22px; margin-bottom: 20px; }\n" +
               "        .footer { text-align: center; font-size: 12px; color: #777; margin-top: 30px; }\n" +
               "    </style>\n" +
               "</head>\n" +
               "<body>\n" +
               "    <div class=\"container\">\n" +
               "        <div class=\"logo\">Zauberkoch</div>\n" +
               "        <div class=\"heading\">Registrierung</div>\n" +
               "        <div class=\"content\">\n" +
               "            <p>Hallo,</p>\n" +
               "            <p>vielen Dank für deine Anmeldung bei Zauberkoch. Um deine Registrierung abzuschließen, klicke bitte auf den folgenden Button:</p>\n" +
               "            <a href='" + link + "' class=\"button\">Anmelden</a>\n" +
               "            <p>Falls der Button nicht funktioniert, kopiere diesen Link in deinen Browser:</p>\n" +
               "            <p style=\"word-break: break-all;\"><a href='" + link + "' style=\"color: #2d3748;\">" + link + "</a></p>\n" +
               "        </div>\n" +
               "        <div class=\"footer\">\n" +
               "            <p>&copy; " + java.time.Year.now().getValue() + " Zauberkoch. Alle Rechte vorbehalten.</p>\n" +
               "        </div>\n" +
               "    </div>\n" +
               "</body>\n" +
               "</html>";
    }

    private String getPasswordResetEmailHtml(String link) {
        return "<!DOCTYPE html>\n" +
               "<html>\n" +
               "<head>\n" +
               "    <meta charset=\"UTF-8\">\n" +
               "    <style>\n" +
               "        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; background-color: #f5f5f5; }\n" +
               "        .container { padding: 20px; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }\n" +
               "        .logo { text-align: center; margin-bottom: 20px; font-size: 28px; font-weight: bold; color: #333; }\n" +
               "        .content { padding: 20px; }\n" +
               "        .button { display: inline-block; width: 100%; padding: 12px 0; margin: 15px 0; background-color: #2d3748; color: white; text-decoration: none; border-radius: 4px; font-weight: normal; text-align: center; }\n" +
               "        .heading { text-align: center; font-size: 22px; margin-bottom: 20px; }\n" +
               "        .footer { text-align: center; font-size: 12px; color: #777; margin-top: 30px; }\n" +
               "    </style>\n" +
               "</head>\n" +
               "<body>\n" +
               "    <div class=\"container\">\n" +
               "        <div class=\"logo\">Zauberkoch</div>\n" +
               "        <div class=\"heading\">Passwort vergessen</div>\n" +
               "        <div class=\"content\">\n" +
               "            <p>Hallo,</p>\n" +
               "            <p>wir haben eine Anfrage erhalten, dein Passwort zurückzusetzen. Klicke bitte auf den folgenden Button:</p>\n" +
               "            <a href='" + link + "' class=\"button\">Passwort zurücksetzen</a>\n" +
               "            <p>Falls der Button nicht funktioniert, kopiere diesen Link in deinen Browser:</p>\n" +
               "            <p style=\"word-break: break-all;\"><a href='" + link + "' style=\"color: #2d3748;\">" + link + "</a></p>\n" +
               "            <p>Wenn du keine Passwortänderung angefordert hast, kannst du diese E-Mail ignorieren.</p>\n" +
               "        </div>\n" +
               "        <div class=\"footer\">\n" +
               "            <p>&copy; " + java.time.Year.now().getValue() + " Zauberkoch. Alle Rechte vorbehalten.</p>\n" +
               "        </div>\n" +
               "    </div>\n" +
               "</body>\n" +
               "</html>";
    }
}