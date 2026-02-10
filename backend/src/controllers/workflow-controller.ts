import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { workflowService } from '../services/workflow-service';
import { CreateWorkflowInput, UpdateWorkflowInput } from '../types/workflow';

export class WorkflowController {
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const workflow = await workflowService.createWorkflow(req.body as CreateWorkflowInput);
      res.status(201).json(workflow);
    } catch (error: unknown) {
      if (error instanceof ZodError) {
        res.status(400).json({ error: 'Validation error', details: error.errors });
        return;
      }
      next(error);
    }
  }

  async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const workflows = await workflowService.getAllWorkflows();
      res.json(workflows);
    } catch (error) {
      next(error);
    }
  }

  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const workflow = await workflowService.getWorkflowById(req.params.id);
      if (!workflow) {
        res.status(404).json({ error: 'Workflow not found' });
        return;
      }
      res.json(workflow);
    } catch (error) {
      next(error);
    }
  }

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const workflow = await workflowService.updateWorkflow(req.params.id, req.body as UpdateWorkflowInput);
      res.json(workflow);
    } catch (error: unknown) {
      if (error instanceof Error && error.message === 'Workflow not found') {
        res.status(404).json({ error: error.message });
        return;
      }
      if (error instanceof ZodError) {
        res.status(400).json({ error: 'Validation error', details: error.errors });
        return;
      }
      next(error);
    }
  }

  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      await workflowService.deleteWorkflow(req.params.id);
      res.status(204).send();
    } catch (error: unknown) {
      if (error instanceof Error && error.message === 'Workflow not found') {
        res.status(404).json({ error: error.message });
        return;
      }
      next(error);
    }
  }
}

export const workflowController = new WorkflowController();
