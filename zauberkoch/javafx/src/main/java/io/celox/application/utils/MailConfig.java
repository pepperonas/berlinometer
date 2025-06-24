package io.celox.application.utils;

/**
 * @author Martin Pfeffer
 * <a href="mailto:martin.pfeffer@celox.io">martin.pfeffer@celox.io</a>
 * @see <a href="https://celox.io">https://celox.io</a>
 */

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.JavaMailSenderImpl;

import java.util.Properties;

@Configuration
public class MailConfig {

    @Bean
    public JavaMailSender getJavaMailSender() {
        JavaMailSenderImpl mailSender = new JavaMailSenderImpl();

        // Setze SMTP-Server von Hostinger
        mailSender.setHost("premium269.web-hosting.com");
        mailSender.setPort(465); // oder 587 für TLS

        // Setze deine E-Mail-Adresse und Passwort
        mailSender.setUsername("admin@zauberkoch.com");
        mailSender.setPassword("^SDg!U@sEbW9");

        // Zusätzliche SMTP-Properties
        Properties props = mailSender.getJavaMailProperties();
        props.put("mail.transport.protocol", "smtp");
        props.put("mail.smtp.auth", "true");
        props.put("mail.smtp.starttls.enable", "true"); // Falls du Port 587 nutzt
        props.put("mail.smtp.socketFactory.port", "465"); // Falls du SSL nutzt
        props.put("mail.smtp.socketFactory.class", "javax.net.ssl.SSLSocketFactory");
        props.put("mail.debug", "false");

        return mailSender;
    }
}

