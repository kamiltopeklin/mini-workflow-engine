export interface TransformOp {
  op: 'template' | 'default' | 'pick';
  path?: string;
  to?: string;
  template?: string;
  value?: any;
  paths?: string[];
}

export interface FilterCondition {
  path: string;
  op: 'eq' | 'neq';
  value: any;
}

export interface HttpRequestBody {
  mode: 'ctx' | 'custom';
  value?: any;
}

export type Step =
  | {
      type: 'transform';
      ops: TransformOp[];
    }
  | {
      type: 'filter';
      conditions: FilterCondition[];
    }
  | {
      type: 'http_request';
      method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
      url: string;
      headers?: Record<string, string>;
      body?: HttpRequestBody;
      timeoutMs?: number;
      retries?: number;
    };

export interface Trigger {
  type: 'http';
  path: string;
}

export interface Workflow {
  id: string;
  name: string;
  enabled: boolean;
  trigger: Trigger;
  steps: Step[];
}

export interface CreateWorkflowInput {
  name: string;
  enabled?: boolean;
  steps: Step[];
}

export interface UpdateWorkflowInput {
  name?: string;
  enabled?: boolean;
  steps?: Step[];
}

export interface WorkflowRun {
  id: string;
  workflow_id: string;
  status: 'success' | 'failed' | 'skipped';
  ctx?: any;
  error_message?: string;
  error_details?: any;
  started_at: string;
  completed_at?: string;
}
