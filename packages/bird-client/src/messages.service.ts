import type {
  BirdCredentials,
  BirdSendTemplateRequest,
  BirdSendTextRequest,
  BirdSendMessageResponse,
} from '@wa/types';
import { BirdClient } from './bird.client';

export class BirdMessagesService {
  private readonly client: BirdClient;

  constructor(credentials: BirdCredentials) {
    this.client = new BirdClient(credentials);
  }

  sendTemplate(
    channelId: string,
    to: string,
    templateId: string,
    locale: string,
    variables?: BirdSendTemplateRequest['template']['variables'],
  ): Promise<BirdSendMessageResponse> {
    const body: BirdSendTemplateRequest = {
      receiver: { contacts: [{ identifierValue: to }] },
      template: {
        projectId: templateId,
        version: 'latest',
        locale,
        variables,
      },
    };

    return this.client.post<BirdSendMessageResponse>(
      `/channels/${channelId}/messages`,
      body,
    );
  }

  sendText(
    channelId: string,
    to: string,
    text: string,
  ): Promise<BirdSendMessageResponse> {
    const body: BirdSendTextRequest = {
      receiver: { contacts: [{ identifierValue: to }] },
      body: { type: 'text', text: { text } },
    };

    return this.client.post<BirdSendMessageResponse>(
      `/channels/${channelId}/messages`,
      body,
    );
  }
}
