import { useState, useEffect } from 'react';
import { WorkflowList } from './components/WorkflowList';
import { WorkflowEditor } from './components/WorkflowEditor';
import { Workflow } from './types';
import { workflowApi } from './api';
import './App.css';

function App() {
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [selectedWorkflow, setSelectedWorkflow] = useState<Workflow | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadWorkflows();
  }, []);

  const loadWorkflows = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await workflowApi.getAll();
      setWorkflows(data);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to load workflows';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setSelectedWorkflow(null);
  };

  const handleEdit = (workflow: Workflow) => {
    setSelectedWorkflow(workflow);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this workflow?')) {
      return;
    }
    try {
      await workflowApi.delete(id);
      await loadWorkflows();
      if (selectedWorkflow?.id === id) {
        setSelectedWorkflow(null);
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to delete workflow';
      alert(message);
    }
  };

  const handleSave = async () => {
    await loadWorkflows();
    setSelectedWorkflow(null);
  };

  const handleCancel = () => {
    setSelectedWorkflow(null);
  };

  return (
    <div className="app">
      <header className="app-header">
        <h1>Mini Workflow Engine</h1>
      </header>
      <main className="app-main">
        <div className="app-sidebar">
          <button className="btn btn-primary" onClick={handleCreate}>
            + New Workflow
          </button>
          {loading ? (
            <div className="loading">Loading...</div>
          ) : error ? (
            <div className="error">{error}</div>
          ) : (
            <WorkflowList
              workflows={workflows}
              selectedId={selectedWorkflow?.id || null}
              onSelect={handleEdit}
              onDelete={handleDelete}
            />
          )}
        </div>
        <div className="app-content">
          <WorkflowEditor
            workflow={selectedWorkflow}
            onSave={handleSave}
            onCancel={handleCancel}
          />
        </div>
      </main>
    </div>
  );
}

export default App;
