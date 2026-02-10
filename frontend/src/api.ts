import axios from 'axios';
import { Workflow, CreateWorkflowInput, UpdateWorkflowInput, WorkflowRun } from './types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const workflowApi = {
  getAll: async (): Promise<Workflow[]> => {
    const response = await api.get('/api/workflows');
    return response.data;
  },

  getById: async (id: string): Promise<Workflow> => {
    const response = await api.get(`/api/workflows/${id}`);
    return response.data;
  },

  create: async (input: CreateWorkflowInput): Promise<Workflow> => {
    const response = await api.post('/api/workflows', input);
    return response.data;
  },

  update: async (id: string, input: UpdateWorkflowInput): Promise<Workflow> => {
    const response = await api.patch(`/api/workflows/${id}`, input);
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/api/workflows/${id}`);
  },
};

export const runApi = {
  getByWorkflowId: async (workflowId: string): Promise<WorkflowRun[]> => {
    const response = await api.get(`/api/runs/workflow/${workflowId}`);
    return response.data;
  },

  getById: async (id: string): Promise<WorkflowRun> => {
    const response = await api.get(`/api/runs/${id}`);
    return response.data;
  },
};
