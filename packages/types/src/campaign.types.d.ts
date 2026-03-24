export type CampaignStatus = 'DRAFT' | 'SCHEDULED' | 'RUNNING' | 'PAUSED' | 'COMPLETED' | 'CANCELLED';
export type DispatchStatus = 'PENDING' | 'SENT' | 'DELIVERED' | 'READ' | 'FAILED' | 'FAILED_PERMANENT';
export interface CampaignDispatchEvent {
    campaignId: string;
    tenantId: string;
    batchId: string;
    dispatchIds: string[];
}
export interface CampaignStats {
    total: number;
    sent: number;
    delivered: number;
    read: number;
    failed: number;
    deliveryRate: number;
    readRate: number;
}
