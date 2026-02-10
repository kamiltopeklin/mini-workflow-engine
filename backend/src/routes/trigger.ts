import { Router } from 'express';
import { triggerController } from '../controllers/trigger-controller';

export const triggerRoutes = Router();

triggerRoutes.post('/*', (req, res, next) => triggerController.trigger(req, res, next));
