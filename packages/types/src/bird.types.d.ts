export interface BirdCredentials {
    workspaceId: string;
    apiKey: string;
    channelId: string;
}
export interface BirdMessageReceiver {
    contacts: Array<{
        identifierValue: string;
    }>;
}
export interface BirdTemplateVariables {
    header?: Array<{
        key: string;
        value: string;
    }>;
    body?: Array<{
        key: string;
        value: string;
    }>;
}
export interface BirdSendTemplateRequest {
    receiver: BirdMessageReceiver;
    template: {
        projectId: string;
        version: 'latest' | string;
        locale: string;
        variables?: BirdTemplateVariables;
    };
}
export interface BirdSendTextRequest {
    receiver: BirdMessageReceiver;
    body: {
        type: 'text';
        text: {
            text: string;
        };
    };
}
export interface BirdSendMessageResponse {
    id: string;
    status: 'accepted' | 'failed';
}
export interface BirdWebhookPayload {
    type: 'message.created' | 'message.status.updated';
    payload: {
        id: string;
        status?: 'sent' | 'delivered' | 'read' | 'failed';
        direction?: 'sent' | 'received';
        body?: {
            type: string;
            text?: {
                text: string;
            };
        };
        contact?: {
            identifierValue: string;
        };
        channel?: {
            id: string;
        };
        updatedAt?: string;
        receivedAt?: string;
    };
}
