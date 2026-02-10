import { Step, TransformStep, FilterStep, HttpRequestStep, RunStatus } from '../types/workflow';
import { getValue, setValue, renderTemplate, deepClone } from '../utils/ctx';
import axios, { AxiosRequestConfig } from 'axios';

export interface ExecutionContext {
  [key: string]: any;
}

export interface ExecutionResult {
  status: RunStatus;
  ctx: ExecutionContext;
  error?: string;
  errorDetails?: any;
}

async function executeTransformStep(step: TransformStep, ctx: ExecutionContext): Promise<ExecutionContext> {
  const newCtx = deepClone(ctx);

  for (const op of step.ops) {
    if (op.op === 'default') {
      if (!op.path) {
        throw new Error('Transform operation "default" requires a path');
      }
      const currentValue = getValue(newCtx, op.path);
      if (currentValue == null || currentValue === '' || (Array.isArray(currentValue) && currentValue.length === 0)) {
        setValue(newCtx, op.path, op.value);
      }
    } else if (op.op === 'template') {
      if (!op.to || !op.template) {
        throw new Error('Transform operation "template" requires "to" and "template"');
      }
      const rendered = renderTemplate(op.template, newCtx);
      setValue(newCtx, op.to, rendered);
    } else if (op.op === 'pick') {
      if (!op.paths || op.paths.length === 0) {
        throw new Error('Transform operation "pick" requires "paths" array');
      }
      const picked: ExecutionContext = {};
      for (const path of op.paths) {
        const value = getValue(newCtx, path);
        if (value !== null && value !== undefined) {
          setValue(picked, path, value);
        }
      }
      Object.keys(newCtx).forEach(key => delete newCtx[key]);
      Object.assign(newCtx, picked);
    }
  }

  return newCtx;
}

function executeFilterStep(step: FilterStep, ctx: ExecutionContext): boolean {
  for (const condition of step.conditions) {
    const ctxValue = getValue(ctx, condition.path);
    let matches = false;

    if (condition.op === 'eq') {
      matches = ctxValue === condition.value;
    } else if (condition.op === 'neq') {
      matches = ctxValue !== condition.value;
    }

    if (!matches) {
      return false;
    }
  }
  return true;
}

async function executeHttpRequestStep(
  step: HttpRequestStep,
  ctx: ExecutionContext,
  workflowId: string
): Promise<void> {
  let lastError: Error | null = null;

  const ctxWithWorkflowId = { ...ctx, workflow_id: workflowId };

  const url = renderTemplate(step.url, ctxWithWorkflowId);
  const headers: Record<string, string> = {};
  
  if (step.headers) {
    for (const [key, value] of Object.entries(step.headers)) {
      headers[key] = renderTemplate(value, ctxWithWorkflowId);
    }
  }

  let body: any;
  if (step.body) {
    if (step.body.mode === 'ctx') {
      body = ctxWithWorkflowId;
    } else if (step.body.mode === 'custom') {
      body = deepClone(step.body.value);
      body = renderTemplatesInObject(body, ctxWithWorkflowId);
    }
  }

  const config: AxiosRequestConfig = {
    method: step.method,
    url,
    headers,
    data: body,
    timeout: step.timeoutMs,
    validateStatus: (status) => status < 500,
  };

  for (let attempt = 0; attempt <= step.retries; attempt++) {
    try {
      const response = await axios(config);
      
      if (response.status >= 400 && response.status < 500) {
        throw new Error(`HTTP ${response.status}: ${JSON.stringify(response.data)}`);
      }
      
      if (response.status < 400) {
        return;
      }
    } catch (error: unknown) {
      lastError = error as Error;
      
      if (axios.isAxiosError(error) && error.response) {
        const status = error.response.status;
        if (status >= 400 && status < 500) {
          throw error;
        }
      }

      if (attempt < step.retries) {
        const backoffMs = Math.min(1000 * Math.pow(2, attempt), 10000);
        await new Promise(resolve => setTimeout(resolve, backoffMs));
      }
    }
  }

  throw lastError ?? new Error('HTTP request failed after retries');
}

function renderTemplatesInObject(obj: any, ctx: ExecutionContext): any {
  if (typeof obj === 'string') {
    return renderTemplate(obj, ctx);
  } else if (Array.isArray(obj)) {
    return obj.map(item => renderTemplatesInObject(item, ctx));
  } else if (obj && typeof obj === 'object') {
    const result: any = {};
    for (const [key, value] of Object.entries(obj)) {
      result[key] = renderTemplatesInObject(value, ctx);
    }
    return result;
  }
  return obj;
}

async function executeStep(
  step: Step,
  ctx: ExecutionContext,
  workflowId: string
): Promise<{ ctx: ExecutionContext; status: RunStatus }> {
  if (step.type === 'transform') {
    const newCtx = await executeTransformStep(step, ctx);
    return { ctx: newCtx, status: 'success' };
  } else if (step.type === 'filter') {
    const passes = executeFilterStep(step, ctx);
    if (!passes) {
      return { ctx, status: 'skipped' };
    }
    return { ctx, status: 'success' };
  } else if (step.type === 'http_request') {
    await executeHttpRequestStep(step, ctx, workflowId);
    return { ctx, status: 'success' };
  } else {
    throw new Error(`Unknown step type: ${(step as any).type}`);
  }
}

export async function executeWorkflow(
  steps: Step[],
  initialCtx: ExecutionContext,
  workflowId: string
): Promise<ExecutionResult> {
  let ctx = deepClone(initialCtx);

  for (const step of steps) {
    try {
      const result = await executeStep(step, ctx, workflowId);
      
      if (result.status === 'skipped') {
        return {
          status: 'skipped',
          ctx,
        };
      }
      
      ctx = result.ctx;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Step execution failed';
      const errorStack = error instanceof Error ? error.stack : undefined;
      const axiosError = axios.isAxiosError(error) ? {
        status: error.response?.status,
        data: error.response?.data,
      } : {};

      return {
        status: 'failed',
        ctx,
        error: errorMessage,
        errorDetails: {
          step: step.type,
          error: errorMessage,
          ...(errorStack && { stack: errorStack }),
          ...axiosError,
        },
      };
    }
  }

  return {
    status: 'success',
    ctx,
  };
}
