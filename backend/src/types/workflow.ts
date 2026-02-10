import { z } from 'zod';

export const TransformOpSchema = z.object({
  op: z.enum(['template', 'default', 'pick']),
  path: z.string().optional(),
  to: z.string().optional(),
  template: z.string().optional(),
  value: z.any().optional(),
  paths: z.array(z.string()).optional(),
});

export type TransformOp = z.infer<typeof TransformOpSchema>;

export const FilterConditionSchema = z.object({
  path: z.string(),
  op: z.enum(['eq', 'neq']),
  value: z.any(),
});

export type FilterCondition = z.infer<typeof FilterConditionSchema>;

export const HttpRequestBodySchema = z.union([
  z.object({ mode: z.literal('ctx') }),
  z.object({ mode: z.literal('custom'), value: z.any() }),
]);

export type HttpRequestBody = z.infer<typeof HttpRequestBodySchema>;

export const TransformStepSchema = z.object({
  type: z.literal('transform'),
  ops: z.array(TransformOpSchema),
});

export const FilterStepSchema = z.object({
  type: z.literal('filter'),
  conditions: z.array(FilterConditionSchema).min(1),
});

export const HttpRequestStepSchema = z.object({
  type: z.literal('http_request'),
  method: z.enum(['GET', 'POST', 'PUT', 'PATCH', 'DELETE']),
  url: z.string().url(),
  headers: z.record(z.string()).optional(),
  body: HttpRequestBodySchema.optional(),
  timeoutMs: z.number().int().positive().default(5000),
  retries: z.number().int().min(0).max(10).default(0),
});

export const StepSchema = z.discriminatedUnion('type', [
  TransformStepSchema,
  FilterStepSchema,
  HttpRequestStepSchema,
]);

export type Step = z.infer<typeof StepSchema>;
export type TransformStep = z.infer<typeof TransformStepSchema>;
export type FilterStep = z.infer<typeof FilterStepSchema>;
export type HttpRequestStep = z.infer<typeof HttpRequestStepSchema>;

export const TriggerSchema = z.object({
  type: z.literal('http'),
  path: z.string(),
});

export type Trigger = z.infer<typeof TriggerSchema>;

export const WorkflowSchema = z.object({
  id: z.string(),
  name: z.string().min(1),
  enabled: z.boolean(),
  trigger: TriggerSchema,
  steps: z.array(StepSchema).min(1),
});

export type Workflow = z.infer<typeof WorkflowSchema>;

export const CreateWorkflowSchema = z.object({
  name: z.string().min(1),
  enabled: z.boolean().default(true),
  steps: z.array(StepSchema).min(1),
});

export const UpdateWorkflowSchema = z.object({
  name: z.string().min(1).optional(),
  enabled: z.boolean().optional(),
  steps: z.array(StepSchema).min(1).optional(),
});

export type CreateWorkflowInput = z.infer<typeof CreateWorkflowSchema>;
export type UpdateWorkflowInput = z.infer<typeof UpdateWorkflowSchema>;

export type RunStatus = 'success' | 'failed' | 'skipped';

export interface WorkflowRun {
  id: string;
  workflow_id: string;
  status: RunStatus;
  ctx?: any;
  error_message?: string;
  error_details?: any;
  started_at: Date;
  completed_at?: Date;
}
