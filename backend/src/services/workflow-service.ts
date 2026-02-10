import { pool } from '../db/init';
import { Workflow, CreateWorkflowInput, UpdateWorkflowInput } from '../types/workflow';
import { generateTriggerPath } from '../utils/path';
import { v4 as uuidv4 } from 'uuid';
import { WorkflowSchema, CreateWorkflowSchema, UpdateWorkflowSchema } from '../types/workflow';

export class WorkflowService {
  
  async createWorkflow(input: CreateWorkflowInput): Promise<Workflow> {

    const validated = CreateWorkflowSchema.parse(input);
    
    const id = `wf_${uuidv4().replace(/-/g, '')}`;
    const triggerPath = generateTriggerPath();
    
    const workflow: Workflow = {
      id,
      name: validated.name,
      enabled: validated.enabled ?? true,
      trigger: {
        type: 'http',
        path: triggerPath,
      },
      steps: validated.steps,
    };

    WorkflowSchema.parse(workflow);

    const result = await pool.query(
      `INSERT INTO workflows (id, name, enabled, trigger_path, steps)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [id, workflow.name, workflow.enabled, triggerPath, JSON.stringify(workflow.steps)]
    );

    return this.mapRowToWorkflow(result.rows[0]);
  }

  async getAllWorkflows(): Promise<Workflow[]> {
    const result = await pool.query('SELECT * FROM workflows ORDER BY created_at DESC');
    return result.rows.map(row => this.mapRowToWorkflow(row));
  }

  async getWorkflowById(id: string): Promise<Workflow | null> {
    const result = await pool.query('SELECT * FROM workflows WHERE id = $1', [id]);
    if (result.rows.length === 0) {
      return null;
    }
    return this.mapRowToWorkflow(result.rows[0]);
  }


  async getWorkflowByTriggerPath(path: string): Promise<Workflow | null> {
    const result = await pool.query('SELECT * FROM workflows WHERE trigger_path = $1', [path]);
    if (result.rows.length === 0) {
      return null;
    }
    return this.mapRowToWorkflow(result.rows[0]);
  }

  async updateWorkflow(id: string, input: UpdateWorkflowInput): Promise<Workflow> {
    const existing = await this.getWorkflowById(id);
    if (!existing) {
      throw new Error('Workflow not found');
    }

    const validated = UpdateWorkflowSchema.parse(input);

    const updated: Workflow = {
      ...existing,
      ...(validated.name !== undefined && { name: validated.name }),
      ...(validated.enabled !== undefined && { enabled: validated.enabled }),
      ...(validated.steps !== undefined && { steps: validated.steps }),
    };

    WorkflowSchema.parse(updated);

    const result = await pool.query(
      `UPDATE workflows 
       SET name = $1, enabled = $2, steps = $3, updated_at = CURRENT_TIMESTAMP
       WHERE id = $4
       RETURNING *`,
      [updated.name, updated.enabled, JSON.stringify(updated.steps), id]
    );

    return this.mapRowToWorkflow(result.rows[0]);
  }

  async deleteWorkflow(id: string): Promise<void> {
    const result = await pool.query('DELETE FROM workflows WHERE id = $1', [id]);
    if (result.rowCount === 0) {
      throw new Error('Workflow not found');
    }
  }

  private mapRowToWorkflow(row: {
    id: string;
    name: string;
    enabled: boolean;
    trigger_path: string;
    steps: unknown;
  }): Workflow {
    return {
      id: row.id,
      name: row.name,
      enabled: row.enabled,
      trigger: {
        type: 'http',
        path: row.trigger_path,
      },
      steps: row.steps as Workflow['steps'],
    };
  }
}

export const workflowService = new WorkflowService();
