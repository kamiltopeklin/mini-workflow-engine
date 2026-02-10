import { useState, useEffect } from 'react';
import Editor from '@monaco-editor/react';
import { Workflow, CreateWorkflowInput, UpdateWorkflowInput } from '../types';
import { workflowApi } from '../api';
import './WorkflowEditor.css';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

interface WorkflowEditorProps {
  workflow: Workflow | null;
  onSave: () => void;
  onCancel: () => void;
}

const defaultWorkflow: CreateWorkflowInput = {
  name: '',
  enabled: true,
  steps: [
    {
      type: 'transform',
      ops: [
        { op: 'default', path: 'message', value: 'Hello World' },
      ],
    },
    {
      type: 'http_request',
      method: 'POST',
      url: 'https://hooks.slack.com/services/YOUR/WEBHOOK/URL',
      headers: { 'Content-Type': 'application/json' },
      body: { mode: 'custom', value: { text: '{{message}}' } },
      timeoutMs: 2000,
      retries: 3,
    },
  ],
};

export function WorkflowEditor({ workflow, onSave, onCancel }: WorkflowEditorProps) {
  const [name, setName] = useState('');
  const [enabled, setEnabled] = useState(true);
  const [stepsJson, setStepsJson] = useState('');
  const [stepsError, setStepsError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [triggerUrl, setTriggerUrl] = useState<string | null>(null);

  useEffect(() => {
    if (workflow) {
      setName(workflow.name);
      setEnabled(workflow.enabled);
      setStepsJson(JSON.stringify(workflow.steps, null, 2));
      setTriggerUrl(`${API_BASE_URL}${workflow.trigger.path}`);
    } else {
      setName('');
      setEnabled(true);
      setStepsJson(JSON.stringify(defaultWorkflow.steps, null, 2));
      setTriggerUrl(null);
    }
  }, [workflow]);

  const validateSteps = (json: string): boolean => {
    try {
      const parsed = JSON.parse(json);
      if (!Array.isArray(parsed) || parsed.length === 0) {
        setStepsError('Steps must be a non-empty array');
        return false;
      }
      setStepsError(null);
      return true;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Invalid JSON';
      setStepsError(`Invalid JSON: ${message}`);
      return false;
    }
  };

  const handleStepsChange = (value: string | undefined) => {
    if (value !== undefined) {
      setStepsJson(value);
      validateSteps(value);
    }
  };

  const handleSave = async () => {
    if (!name.trim()) {
      alert('Workflow name is required');
      return;
    }

    if (!validateSteps(stepsJson)) {
      alert('Please fix the steps JSON errors');
      return;
    }

    try {
      setSaving(true);
      const steps = JSON.parse(stepsJson);

      if (workflow) {
        const update: UpdateWorkflowInput = {
          name,
          enabled,
          steps,
        };
        await workflowApi.update(workflow.id, update);
      } else {
        const create: CreateWorkflowInput = {
          name,
          enabled,
          steps,
        };
        const created = await workflowApi.create(create);
        setTriggerUrl(`${API_BASE_URL}${created.trigger.path}`);
      }

      onSave();
    } catch (err: unknown) {
      let message = 'Failed to save workflow';
      if (err instanceof Error) {
        message = err.message;
      } else if (typeof err === 'object' && err !== null && 'response' in err) {
        const axiosError = err as { response?: { data?: { error?: string } } };
        message = axiosError.response?.data?.error || message;
      }
      alert(message);
    } finally {
      setSaving(false);
    }
  };

  const copyTriggerUrl = () => {
    if (triggerUrl) {
      navigator.clipboard.writeText(triggerUrl);
      alert('Trigger URL copied to clipboard!');
    }
  };

  return (
    <div className="workflow-editor">
      <div className="editor-header">
        <h2>{workflow ? 'Edit Workflow' : 'Create Workflow'}</h2>
        <div className="editor-actions">
          <button className="btn btn-secondary" onClick={onCancel} disabled={saving}>
            Cancel
          </button>
          <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
            {saving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>

      <div className="editor-form">
        <div className="form-group">
          <label htmlFor="name">Name</label>
          <input
            id="name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Workflow name"
            disabled={saving}
          />
        </div>

        <div className="form-group">
          <label>
            <input
              type="checkbox"
              checked={enabled}
              onChange={(e) => setEnabled(e.target.checked)}
              disabled={saving}
            />
            Enabled
          </label>
        </div>

        {triggerUrl && (
          <div className="form-group">
            <label>Trigger URL</label>
            <div className="trigger-url-container">
              <input type="text" value={triggerUrl} readOnly className="trigger-url-input" />
              <button className="btn btn-secondary" onClick={copyTriggerUrl}>
                Copy
              </button>
            </div>
            <p className="help-text">
              Send a POST request to this URL to trigger the workflow
            </p>
          </div>
        )}

        <div className="form-group">
          <label>Steps (JSON)</label>
          {stepsError && <div className="error-message">{stepsError}</div>}
          <div className="editor-container">
            <Editor
              height="400px"
              defaultLanguage="json"
              value={stepsJson}
              onChange={handleStepsChange}
              options={{
                minimap: { enabled: false },
                fontSize: 14,
                lineNumbers: 'on',
                scrollBeyondLastLine: false,
                automaticLayout: true,
              }}
            />
          </div>
          <p className="help-text">
            Define workflow steps as JSON. See README for step types and examples.
          </p>
        </div>
      </div>
    </div>
  );
}
