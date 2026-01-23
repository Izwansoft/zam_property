import { Injectable, Logger } from '@nestjs/common';
import { IEmailProvider, ChannelPayload, EmailDeliveryResult } from '../types/notification.types';
import * as nodemailer from 'nodemailer';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class SmtpEmailProvider implements IEmailProvider {
  private readonly logger = new Logger(SmtpEmailProvider.name);
  private transporter: nodemailer.Transporter;

  constructor(private readonly configService: ConfigService) {
    this.transporter = nodemailer.createTransport({
      host: this.configService.get<string>('SMTP_HOST'),
      port: this.configService.get<number>('SMTP_PORT') || 587,
      secure: this.configService.get<boolean>('SMTP_SECURE') || false,
      auth: {
        user: this.configService.get<string>('SMTP_USER'),
        pass: this.configService.get<string>('SMTP_PASS'),
      },
    });
  }

  async send(payload: ChannelPayload): Promise<EmailDeliveryResult> {
    const startTime = new Date();

    try {
      const info = await this.transporter.sendMail({
        from:
          this.configService.get<string>('SMTP_FROM') ||
          '"Zam Property" <noreply@zam-property.com>',
        to: payload.to,
        subject: payload.subject || 'Notification',
        html: payload.body,
        // text: payload.body, // TODO: Strip HTML for plain text version
      });

      this.logger.log(`Email sent to ${payload.to}: ${info.messageId}`);

      return {
        success: true,
        messageId: info.messageId,
        timestamp: startTime,
        to: payload.to,
        subject: payload.subject || 'Notification',
        provider: 'smtp',
      };
    } catch (error) {
      this.logger.error(`Failed to send email to ${payload.to}:`, error);

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: startTime,
        to: payload.to,
        subject: payload.subject || 'Notification',
        provider: 'smtp',
      };
    }
  }

  getProviderName(): string {
    return 'smtp';
  }
}
