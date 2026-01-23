import { Injectable, Logger } from '@nestjs/common';
import { IEmailProvider, ChannelPayload, EmailDeliveryResult } from '../types/notification.types';
import { ConfigService } from '@nestjs/config';
// import * as sgMail from '@sendgrid/mail';

@Injectable()
export class SendGridEmailProvider implements IEmailProvider {
  private readonly logger = new Logger(SendGridEmailProvider.name);

  constructor(private readonly configService: ConfigService) {
    // const apiKey = this.configService.get<string>('SENDGRID_API_KEY');
    // if (apiKey) {
    //   sgMail.setApiKey(apiKey);
    // }
  }

  async send(payload: ChannelPayload): Promise<EmailDeliveryResult> {
    const startTime = new Date();

    try {
      // TODO: Uncomment when @sendgrid/mail is installed
      // const msg = {
      //   to: payload.to,
      //   from: this.configService.get<string>('SENDGRID_FROM') || 'noreply@zam-property.com',
      //   subject: payload.subject || 'Notification',
      //   html: payload.body,
      // };
      //
      // const [response] = await sgMail.send(msg);

      // this.logger.log(`Email sent to ${payload.to} via SendGrid`);

      // return {
      //   success: true,
      //   messageId: response.headers['x-message-id'] || 'sendgrid-unknown',
      //   timestamp: startTime,
      //   to: payload.to,
      //   subject: payload.subject || 'Notification',
      //   provider: 'sendgrid',
      // };

      // Placeholder implementation for now
      this.logger.warn('SendGrid provider not configured. Email NOT sent.');
      return {
        success: false,
        error: 'SendGrid not configured',
        timestamp: startTime,
        to: payload.to,
        subject: payload.subject || 'Notification',
        provider: 'sendgrid',
      };
    } catch (error) {
      this.logger.error(`Failed to send email via SendGrid to ${payload.to}:`, error);

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: startTime,
        to: payload.to,
        subject: payload.subject || 'Notification',
        provider: 'sendgrid',
      };
    }
  }

  getProviderName(): string {
    return 'sendgrid';
  }
}
