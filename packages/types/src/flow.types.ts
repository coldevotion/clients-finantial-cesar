export enum NodeType {
  TRIGGER = 'trigger',
  SEND_MESSAGE = 'send_message',
  WAIT_RESPONSE = 'wait_response',
  CONDITION = 'condition',
  DELAY = 'delay',
  WEBHOOK_CALL = 'webhook_call',
  ASSIGN_TAG = 'assign_tag',
  END = 'end',
}

export interface FlowNodePosition {
  x: number;
  y: number;
}

export interface TriggerNodeConfig {
  label: string;
}

export interface SendMessageNodeConfig {
  messageType: 'text' | 'image' | 'document' | 'template';
  content: string;
  mediaUrl?: string;
}

export interface WaitResponseNodeConfig {
  timeoutHours: number;
  timeoutNodeId: string;
  saveAs: string;
}

export interface ConditionRule {
  expression: string;
  targetNodeId: string;
}

export interface ConditionNodeConfig {
  rules: ConditionRule[];
  defaultNodeId: string;
}

export interface DelayNodeConfig {
  delayMinutes: number;
  scheduledTime?: string; // HH:mm
  timezone?: string;
}

export interface WebhookCallNodeConfig {
  url: string;
  method: 'GET' | 'POST' | 'PUT' | 'PATCH';
  headers?: Record<string, string>;
  body?: Record<string, unknown>;
  saveResponseAs?: string;
}

export interface AssignTagNodeConfig {
  tags: string[];
}

export interface EndNodeConfig {
  closeConversation: boolean;
  finalTag?: string;
}

export type NodeConfig =
  | TriggerNodeConfig
  | SendMessageNodeConfig
  | WaitResponseNodeConfig
  | ConditionNodeConfig
  | DelayNodeConfig
  | WebhookCallNodeConfig
  | AssignTagNodeConfig
  | EndNodeConfig;

export interface FlowNode {
  id: string;
  type: NodeType;
  position: FlowNodePosition;
  config: NodeConfig;
  label?: string;
}

export interface FlowEdge {
  id: string;
  source: string;
  target: string;
  label?: string;
  condition?: string;
}

export interface FlowContext {
  contact: {
    phone: string;
    name?: string;
    metadata?: Record<string, unknown>;
  };
  campaign: {
    id: string;
    name: string;
  };
  [key: string]: unknown;
}
