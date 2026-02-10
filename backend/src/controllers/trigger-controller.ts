import { Request, Response, NextFunction } from 'express';
import { workflowService } from '../services/workflow-service';
import { runService } from '../services/run-service';
import { executeWorkflow } from '../services/workflow-executor';

export class TriggerController {
  async trigger(req: Request, res: Response, next: NextFunction) {
    try {
      const pathAfterT = req.path.startsWith('/') ? req.path : `/${req.path}`;
      const triggerPath = `/t${pathAfterT}`;
      const workflow = await workflowService.getWorkflowByTriggerPath(triggerPath);

      if (!workflow) {
        res.status(404).json({ error: 'Workflow not found' });
        return;
      }

      if (!workflow.enabled) {
        res.status(403).json({ error: 'Workflow is disabled' });
        return;
      }

      const initialCtx = req.body || {};
      const result = await executeWorkflow(workflow.steps, initialCtx, workflow.id);

      await runService.createRun(
        workflow.id,
        result.status,
        result.ctx,
        result.error,
        result.errorDetails
      );

      const statusCode = result.status === 'success' ? 200 : result.status === 'skipped' ? 200 : 500;
      res.status(statusCode).json({
        status: result.status,
        ...(result.error && { error: result.error }),
      });
    } catch (error: unknown) {
      next(error);
    }
  }
}

export const triggerController = new TriggerController();
