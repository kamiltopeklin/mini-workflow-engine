# Mini Workflow Engine

A full-stack workflow automation engine similar to Zapier, built with Node.js, TypeScript, and React. This application allows users to define custom multi-step workflows that can be triggered via HTTP webhooks.

## Features

- **Workflow Management**: Create, read, update, and delete workflows via REST API
- **HTTP Triggers**: Each workflow gets a unique HTTP endpoint for triggering
- **Step Types**:
  - **Transform**: Modify context data (template, default values, pick fields)
  - **Filter**: Conditionally skip workflow execution
  - **HTTP Request**: Call external APIs with retries and timeouts
- **Workflow Execution**: Sequential step execution with error handling
- **Run History**: Track workflow executions with status and error details
- **React UI**: Simple but functional interface for managing workflows

## Tech Stack

- **Backend**: Node.js, Express, TypeScript, PostgreSQL
- **Frontend**: React, TypeScript, Vite, Monaco Editor
- **Database**: PostgreSQL
- **Validation**: Zod

## Project Structure

```
.
├── backend/           # Backend API server
│   ├── src/
│   │   ├── controllers/  # Request handlers
│   │   ├── services/     # Business logic
│   │   ├── routes/       # Express routes
│   │   ├── db/           # Database setup
│   │   ├── types/        # TypeScript types
│   │   └── utils/        # Utility functions
│   └── package.json
├── frontend/          # React frontend
│   ├── src/
│   │   ├── components/   # React components
│   │   ├── api/          # API client
│   │   └── types/        # TypeScript types
│   └── package.json
└── README.md
```

## Setup Instructions

### Prerequisites

- Node.js 18+ 
- PostgreSQL 12+
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd test-task
   ```

2. **Install dependencies**
   ```bash
   npm run install:all
   ```

3. **Set up the database**
   
   Create a PostgreSQL database:
   ```sql
   CREATE DATABASE workflow_engine;
   ```

   Create a `.env` file in the `backend` directory:
   ```env
   PORT=3001
   DATABASE_URL=postgresql://user:password@localhost:5432/workflow_engine
   NODE_ENV=development
   ```

4. **Initialize the database**
   ```bash
   cd backend
   npm run migrate
   ```
   
   Note: The database tables are automatically created on server startup if they don't exist.

5. **Start the development servers**
   
   From the root directory:
   ```bash
   npm run dev
   ```
   
   This starts both backend (port 3001) and frontend (port 3000).

   Or start them separately:
   ```bash
   # Terminal 1 - Backend
   npm run dev:backend
   
   # Terminal 2 - Frontend
   npm run dev:frontend
   ```

6. **Access the application**
   
   Open http://localhost:3000 in your browser.

## API Endpoints

### Workflows

- `POST /api/workflows` - Create a workflow
- `GET /api/workflows` - List all workflows
- `GET /api/workflows/:id` - Get a workflow by ID
- `PATCH /api/workflows/:id` - Update a workflow
- `DELETE /api/workflows/:id` - Delete a workflow

### Workflow Runs

- `GET /api/runs/workflow/:workflowId` - Get runs for a workflow
- `GET /api/runs/:id` - Get a run by ID

### Trigger

- `POST /t/:triggerPath` - Trigger a workflow (path is auto-generated)

## Workflow Definition

### Example Workflow

```json
{
  "name": "Unlock Alert",
  "enabled": true,
  "steps": [
    {
      "type": "filter",
      "conditions": [
        { "path": "type", "op": "eq", "value": "lock.unlock" },
        { "path": "success", "op": "eq", "value": false }
      ]
    },
    {
      "type": "transform",
      "ops": [
        { "op": "default", "path": "actor_name", "value": "Unknown" },
        { "op": "template", "to": "title", "template": "Event {{type}} by {{actor_name}}" }
      ]
    },
    {
      "type": "http_request",
      "method": "POST",
      "url": "https://hooks.slack.com/services/XXX/YYY/ZZZ",
      "headers": { "Content-Type": "application/json" },
      "body": {
        "mode": "custom",
        "value": { "text": "{{title}}" }
      },
      "timeoutMs": 2000,
      "retries": 3
    }
  ]
}
```

### Step Types

#### Transform Step
- `default`: Set a default value if field is missing/null/empty
- `template`: Create a string using `{{variable}}` placeholders
- `pick`: Keep only specified fields in context

#### Filter Step
- Conditions use dot-notation paths
- Supported operators: `eq`, `neq`
- If conditions don't match, workflow stops with `skipped` status

#### HTTP Request Step
- Supports GET, POST, PUT, PATCH, DELETE methods
- Body modes:
  - `ctx`: Send entire context as JSON
  - `custom`: Send custom JSON (supports templates)
- Retries with exponential backoff (on network errors and 5xx responses)
- Configurable timeout

## Assumptions and Trade-offs

### Assumptions

1. **Exactly-once processing**: Implemented at the application level. Each webhook trigger creates a single run record. No duplicate detection beyond this.

2. **Synchronous execution**: Workflows execute synchronously and return immediately. For long-running workflows, this may timeout. In production, consider async execution with job queues.

3. **No authentication**: As per requirements, no auth is implemented. In production, add authentication/authorization.

4. **Template rendering**: Missing template variables are replaced with empty strings.

5. **Error handling**: HTTP 4xx errors are not retried (treated as client errors). Only 5xx and network errors trigger retries.

6. **Context manipulation**: Transform steps use deep cloning to avoid side effects. The original context is preserved until all steps succeed.

### Trade-offs

1. **Database**: Using PostgreSQL for reliability and JSONB support. Could use MongoDB for more flexible schema, but PostgreSQL provides better ACID guarantees.

2. **Architecture**: Clean separation (controllers → services → integrations) for maintainability. Could be more microservice-oriented but adds complexity.

3. **Frontend**: Simple React UI without state management library (Redux/Zustand). Sufficient for the scope but may need refactoring for larger scale.

4. **Validation**: Using Zod for runtime validation. Provides type safety and clear error messages.

5. **Retry strategy**: Exponential backoff with max 10s delay. Simple but effective. Could use more sophisticated strategies.

6. **Trigger path generation**: Random 32-character hex string. Collision probability is negligible but not zero. Could use UUIDs for absolute uniqueness.

## Testing the Application

### Create a Test Workflow

1. Open the UI at http://localhost:3000
2. Click "New Workflow"
3. Enter a name (e.g., "Test Workflow")
4. Define steps in JSON editor:

```json
[
  {
    "type": "transform",
    "ops": [
      { "op": "default", "path": "message", "value": "Hello from workflow!" }
    ]
  },
  {
    "type": "http_request",
    "method": "POST",
    "url": "https://httpbin.org/post",
    "headers": { "Content-Type": "application/json" },
    "body": { "mode": "custom", "value": { "message": "{{message}}" } },
    "timeoutMs": 5000,
    "retries": 2
  }
]
```

5. Click "Save"
6. Copy the trigger URL
7. Test with curl:

```bash
curl -X POST http://localhost:3001/t/YOUR_TRIGGER_PATH \
  -H "Content-Type: application/json" \
  -d '{"test": "data"}'
```

### Slack/Discord Integration Example

Replace the HTTP request step URL with your Slack webhook URL:

```json
{
  "type": "http_request",
  "method": "POST",
  "url": "https://hooks.slack.com/services/YOUR/WEBHOOK/URL",
  "headers": { "Content-Type": "application/json" },
  "body": {
    "mode": "custom",
    "value": { "text": "{{message}}" }
  },
  "timeoutMs": 2000,
  "retries": 3
}
```

