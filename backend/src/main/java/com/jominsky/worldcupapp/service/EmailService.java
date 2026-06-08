package com.jominsky.worldcupapp.service;

import com.jominsky.worldcupapp.model.User;
import jakarta.mail.internet.MimeMessage;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

@Service
public class EmailService {

    private static final Logger log = LoggerFactory.getLogger(EmailService.class);

    private final JavaMailSender mailSender;

    @Value("${app.mail.from-address}")
    private String fromAddress;

    @Value("${app.frontend-url}")
    private String frontendUrl;

    public EmailService(JavaMailSender mailSender) {
        this.mailSender = mailSender;
    }

    public void sendBracketReminder(User user, String formattedDeadline) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            helper.setFrom(fromAddress);
            helper.setTo(user.getEmail());
            helper.setSubject("⚽ Complete your World Cup bracket — knockout stage starts soon!");
            helper.setText(buildBracketReminderHtml(user.getDisplayName(), formattedDeadline), true);
            mailSender.send(message);
        } catch (Exception e) {
            log.error("Failed to send bracket reminder to {}: {}", user.getEmail(), e.getMessage());
        }
    }

    private String buildBracketReminderHtml(String displayName, String deadline) {
        return """
            <!DOCTYPE html>
            <html>
            <head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1.0"/></head>
            <body style="margin:0;padding:0;background:#f4f6fa;font-family:'Segoe UI',Arial,sans-serif;">
              <div style="max-width:600px;margin:24px auto;background:#ffffff;border-radius:12px;overflow:hidden;">

                <div style="background:#0A1628;padding:32px 40px;text-align:center;">
                  <div style="font-size:48px;">⚽</div>
                  <h1 style="color:#C9A84C;margin:12px 0 4px;font-size:24px;font-weight:700;letter-spacing:0.5px;">
                    World Cup Fantasy 2026
                  </h1>
                  <p style="color:#8899bb;margin:0;font-size:14px;">The group stage is complete</p>
                </div>

                <div style="padding:36px 40px;">
                  <p style="color:#0A1628;font-size:18px;font-weight:600;margin-top:0;">
                    Hi %s,
                  </p>
                  <p style="color:#444;font-size:15px;line-height:1.6;">
                    All 12 groups have finished and the knockout bracket is set.
                    <strong>You need to submit your bracket before the first Round of 32 match kicks off.</strong>
                  </p>

                  <div style="background:#fff8e1;border:1px solid #ffe082;border-radius:8px;padding:16px 20px;margin:24px 0;">
                    <p style="margin:0;font-size:12px;color:#b08800;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;">Bracket deadline</p>
                    <p style="margin:6px 0 0;font-size:17px;color:#7a5c00;font-weight:600;">%s</p>
                  </div>

                  <p style="color:#444;font-size:14px;font-weight:600;margin-bottom:8px;">Bracket scoring</p>
                  <table style="width:100%%;border-collapse:collapse;font-size:13px;color:#555;margin-bottom:28px;">
                    <tr style="border-bottom:1px solid #eee;"><td style="padding:7px 0;">Round of 32</td>   <td style="text-align:right;color:#2e7d32;font-weight:600;">+4 pts per correct pick</td></tr>
                    <tr style="border-bottom:1px solid #eee;"><td style="padding:7px 0;">Round of 16</td>   <td style="text-align:right;color:#2e7d32;font-weight:600;">+8 pts per correct pick</td></tr>
                    <tr style="border-bottom:1px solid #eee;"><td style="padding:7px 0;">Quarterfinal</td>  <td style="text-align:right;color:#2e7d32;font-weight:600;">+16 pts per correct pick</td></tr>
                    <tr style="border-bottom:1px solid #eee;"><td style="padding:7px 0;">Semifinal</td>     <td style="text-align:right;color:#2e7d32;font-weight:600;">+32 pts per correct pick</td></tr>
                    <tr>                                       <td style="padding:7px 0;">Final</td>         <td style="text-align:right;color:#c9a84c;font-weight:700;">+64 pts per correct pick</td></tr>
                  </table>

                  <div style="text-align:center;margin:32px 0 8px;">
                    <a href="%s/bracket"
                       style="background:#C9A84C;color:#0A1628;text-decoration:none;padding:14px 36px;border-radius:8px;font-weight:700;font-size:16px;display:inline-block;letter-spacing:0.3px;">
                      Complete My Bracket →
                    </a>
                  </div>
                </div>

                <div style="background:#f4f6fa;padding:20px 40px;text-align:center;border-top:1px solid #e8ecf0;">
                  <p style="margin:0;font-size:12px;color:#999;">
                    World Cup Fantasy 2026 · You are receiving this because you registered at %s
                  </p>
                </div>

              </div>
            </body>
            </html>
            """.formatted(displayName, deadline, frontendUrl, frontendUrl);
    }
}
