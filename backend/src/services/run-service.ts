import { pool } from '../db/init';
import { WorkflowRun, RunStatus } from '../types/workflow';
import { v4 as uuidv4 } from 'uuid';

export class RunService {
  
  async createRun(
    workflowId: string,
    status: RunStatus,
    ctx?: unknown,
    errorMessage?: string,
    errorDetails?: unknown
  ): Promise<WorkflowRun> {
    const id = `run_${uuidv4().replace(/-/g, '')}`;
    const now = new Date();
    
    const result = await pool.query(
      `INSERT INTO workflow_runs (id, workflow_id, status, ctx, error_message, error_details, started_at, completed_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [id, workflowId, status, ctx ? JSON.stringify(ctx) : null, errorMessage, errorDetails ? JSON.stringify(errorDetails) : null, now, now]
    );

    return this.mapRowToRun(result.rows[0]);
  }

  async getRunsByWorkflowId(workflowId: string, limit: number = 50): Promise<WorkflowRun[]> {
    const result = await pool.query(
      `SELECT * FROM workflow_runs 
       WHERE workflow_id = $1 
       ORDER BY started_at DESC 
       LIMIT $2`,
      [workflowId, limit]
    );
    return result.rows.map(row => this.mapRowToRun(row));
  }

  async getRunById(id: string): Promise<WorkflowRun | null> {
    const result = await pool.query('SELECT * FROM workflow_runs WHERE id = $1', [id]);
    if (result.rows.length === 0) {
      return null;
    }
    return this.mapRowToRun(result.rows[0]);
  }

  private mapRowToRun(row: {
    id: string;
    workflow_id: string;
    status: string;
    ctx: unknown;
    error_message: string | null;
    error_details: unknown;
    started_at: Date;
    completed_at: Date | null;
  }): WorkflowRun {
    return {
      id: row.id,
      workflow_id: row.workflow_id,
      status: row.status as RunStatus,
      ctx: row.ctx,
      error_message: row.error_message ?? undefined,
      error_details: row.error_details,
      started_at: row.started_at,
      completed_at: row.completed_at ?? undefined,
    };
  }
}

export const runService = new RunService();
