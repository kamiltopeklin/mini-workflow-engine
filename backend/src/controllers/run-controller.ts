import { Request, Response, NextFunction } from 'express';
import { runService } from '../services/run-service';

export class RunController {
  async getByWorkflowId(req: Request, res: Response, next: NextFunction) {
    try {
      const workflowId = req.params.workflowId;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;
      const runs = await runService.getRunsByWorkflowId(workflowId, limit);
      res.json(runs);
    } catch (error) {
      next(error);
    }
  }

  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const run = await runService.getRunById(req.params.id);
      if (!run) {
        res.status(404).json({ error: 'Run not found' });
        return;
      }
      res.json(run);
    } catch (error) {
      next(error);
    }
  }
}

export const runController = new RunController();
