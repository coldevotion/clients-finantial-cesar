import type { BirdCredentials } from '@wa/types';
import { BirdClient } from './bird.client';

export interface BirdTemplate {
  id: string;
  name: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  defaultLocale: string;
  components: unknown[];
}

export class BirdTemplatesService {
  private readonly client: BirdClient;

  constructor(credentials: BirdCredentials) {
    this.client = new BirdClient(credentials);
  }

  list(): Promise<{ results: BirdTemplate[] }> {
    return this.client.get('/message-templates');
  }

  get(templateId: string): Promise<BirdTemplate> {
    return this.client.get(`/message-templates/${templateId}`);
  }

  create(data: {
    name: string;
    defaultLocale: string;
    components: unknown[];
  }): Promise<BirdTemplate> {
    return this.client.post('/message-templates', data);
  }

  delete(templateId: string): Promise<void> {
    return this.client.delete(`/message-templates/${templateId}`);
  }
}
