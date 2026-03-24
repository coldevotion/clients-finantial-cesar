export type TenantPlan = 'STARTER' | 'GROWTH' | 'ENTERPRISE';
export type TenantStatus = 'ACTIVE' | 'SUSPENDED';
export interface TenantContext {
    id: string;
    slug: string;
    plan: TenantPlan;
    status: TenantStatus;
}
