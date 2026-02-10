import { Router } from 'express';
import { runController } from '../controllers/run-controller';

export const runRoutes = Router();

runRoutes.get('/workflow/:workflowId', (req, res, next) => runController.getByWorkflowId(req, res, next));
runRoutes.get('/:id', (req, res, next) => runController.getById(req, res, next));
