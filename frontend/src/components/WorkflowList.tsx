import type { MouseEvent } from 'react';
import { Workflow } from '../types';
import './WorkflowList.css';

interface WorkflowListProps {
  workflows: Workflow[];
  selectedId: string | null;
  onSelect: (workflow: Workflow) => void;
  onDelete: (id: string) => void;
}

export function WorkflowList({ workflows, selectedId, onSelect, onDelete }: WorkflowListProps) {
  if (workflows.length === 0) {
    return (
      <div className="workflow-list-empty">
        <p>No workflows yet. Create one to get started!</p>
      </div>
    );
  }

  return (
    <div className="workflow-list">
      {workflows.map((workflow) => (
        <div
          key={workflow.id}
          className={`workflow-item${selectedId === workflow.id ? ' selected' : ''}`}
          onClick={() => onSelect(workflow)}
        >
          <div className="workflow-item-header">
            <h3>{workflow.name}</h3>
            <span className={`status-badge ${workflow.enabled ? 'enabled' : 'disabled'}`}>
              {workflow.enabled ? 'Enabled' : 'Disabled'}
            </span>
          </div>
          <div className="workflow-item-meta">
            <span>{workflow.steps.length} step{workflow.steps.length !== 1 ? 's' : ''}</span>
          </div>
          <button
            className="btn-delete"
            onClick={(e: MouseEvent<HTMLButtonElement>) => {
              e.stopPropagation();
              onDelete(workflow.id);
            }}
          >
            Delete
          </button>
        </div>
      ))}
    </div>
  );
}
