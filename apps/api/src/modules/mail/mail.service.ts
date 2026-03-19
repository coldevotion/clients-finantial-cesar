import { Injectable, Logger } from '@nestjs/common';
import { createTransport, type Transporter } from 'nodemailer';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private readonly transporter: Transporter;
  private readonly from: string;
  private readonly appUrl: string;

  constructor() {
    this.from = `"${process.env.MAIL_FROM_NAME ?? 'WA Campaigns'}" <${process.env.MAIL_FROM_ADDRESS ?? 'noreply@example.com'}>`;
    this.appUrl = process.env.WEB_URL ?? 'http://localhost:3000';

    this.transporter = createTransport({
      host: process.env.SMTP_HOST ?? 'localhost',
      port: parseInt(process.env.SMTP_PORT ?? '587'),
      secure: process.env.SMTP_SECURE === 'true',
      auth: process.env.SMTP_USER
        ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
        : undefined,
    });
  }

  async sendEmailVerification(to: string, token: string) {
    const url = `${this.appUrl}/verify-email?token=${token}`;

    await this.send(to, 'Verifica tu correo electrónico', `
      <h2>Bienvenido a WA Campaigns</h2>
      <p>Haz click en el siguiente enlace para verificar tu correo:</p>
      <a href="${url}" style="background:#16a34a;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;display:inline-block;">
        Verificar correo
      </a>
      <p>Este enlace expira en 24 horas.</p>
      <p>Si no creaste esta cuenta, ignora este mensaje.</p>
    `);
  }

  async sendPasswordReset(to: string, name: string, token: string) {
    const url = `${this.appUrl}/reset-password?token=${token}`;

    await this.send(to, 'Restablece tu contraseña', `
      <h2>Hola ${name},</h2>
      <p>Recibimos una solicitud para restablecer tu contraseña.</p>
      <a href="${url}" style="background:#16a34a;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;display:inline-block;">
        Restablecer contraseña
      </a>
      <p>Este enlace expira en 1 hora.</p>
      <p>Si no solicitaste esto, ignora este mensaje. Tu contraseña no cambiará.</p>
    `);
  }

  async sendWelcome(to: string, name: string) {
    await this.send(to, '¡Bienvenido a WA Campaigns!', `
      <h2>¡Hola ${name}!</h2>
      <p>Tu cuenta ha sido verificada exitosamente.</p>
      <a href="${this.appUrl}" style="background:#16a34a;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;display:inline-block;">
        Ir al dashboard
      </a>
    `);
  }

  private async send(to: string, subject: string, html: string) {
    try {
      await this.transporter.sendMail({
        from: this.from,
        to,
        subject,
        html: this.wrapHtml(subject, html),
      });
    } catch (err) {
      this.logger.error(`Failed to send email to ${to}: ${err}`);
      // No lanzar — el flujo principal no debe fallar por un email
    }
  }

  private wrapHtml(title: string, body: string): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>${title}</title>
      </head>
      <body style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:20px;color:#111;">
        ${body}
        <hr style="margin:40px 0;border:none;border-top:1px solid #e5e7eb;">
        <p style="color:#6b7280;font-size:12px;">
          Este mensaje fue enviado automáticamente. Por favor no respondas este correo.
        </p>
      </body>
      </html>
    `;
  }
}
