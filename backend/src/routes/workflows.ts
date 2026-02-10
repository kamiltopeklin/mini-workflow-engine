import { Router } from 'express';
import { workflowController } from '../controllers/workflow-controller';

export const workflowRoutes = Router();

workflowRoutes.post('/', (req, res, next) => workflowController.create(req, res, next));
workflowRoutes.get('/', (req, res, next) => workflowController.getAll(req, res, next));
workflowRoutes.get('/:id', (req, res, next) => workflowController.getById(req, res, next));
workflowRoutes.patch('/:id', (req, res, next) => workflowController.update(req, res, next));
workflowRoutes.put('/:id', (req, res, next) => workflowController.update(req, res, next));
workflowRoutes.delete('/:id', (req, res, next) => workflowController.delete(req, res, next));
