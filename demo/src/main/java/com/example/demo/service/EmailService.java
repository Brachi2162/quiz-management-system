package com.example.demo.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
public class EmailService {
    @Autowired(required = false) // זה ימנע מהשרת לקרוס אם אין הגדרות מייל
    private JavaMailSender mailSender;

    public void sendWinnerEmail(String adminEmail, String winnerName, int score) {
        SimpleMailMessage message = new SimpleMailMessage();
        message.setTo(adminEmail);
        message.setSubject("החידון שלך הסתיים!");
        message.setText("המנצח בחידון הוא: " + winnerName + " עם ניקוד של: " + score);
        mailSender.send(message);
    }
}