# Requirements

## Functional Requirements

### Workflow Management
- Administrators can create and configure workflows with named states and transition rules
- Each state can be marked as initial (start) or final (end)
- The builder detects dead-end states — non-final states with no outgoing transitions — and highlights them
- Administrators can clear a workflow's states and transitions, provided no active tasks exist on it

### Task Management
- Users can submit task instances that are automatically placed in the workflow's initial state
- The system validates that a state transition is permitted before applying it
- Role-based access control restricts which users can trigger which transitions
- Users can only view their own tasks; reviewers and admins have visibility of all tasks

### Audit Log
- All state changes are recorded in a timestamped audit log
- The audit log captures the task, the from-state, the to-state, and the actor

### User Management
- Administrators can create user accounts and assign roles (user, reviewer, admin)
- Administrators can deactivate accounts to prevent login without deleting history

### Visual Workflow Canvas
- A graph view renders the workflow as a state machine diagram
- Transitions are colour-coded by required role (user, reviewer, admin)

### Cogsy — AI Workflow Assistant
- Administrators can describe a workflow in plain English and Cogsy will generate the states and transitions
- Cogsy uses a preview flow — it describes the plan before building, requiring admin confirmation
- Cogsy detects redundant or conflicting transitions and flags them with a warn-and-confirm pattern
- Conversation history is maintained per workflow across the session and persisted in localStorage
- Cogsy correctly interprets business language (e.g. "admin can terminate") into appropriate workflow structure

## Non-Functional Requirements

- The backend API must return appropriate HTTP error codes for invalid transitions and unauthorised actions
- Role-based access control is enforced at the backend — the client cannot bypass it
- Passwords must be stored as hashed values (bcrypt)
- JWT tokens must be used for stateless authentication
- Database schema changes must be managed via Alembic migrations
- The test suite must use an isolated database to prevent state leakage between tests
