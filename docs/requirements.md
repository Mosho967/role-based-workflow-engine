# Requirements

## Functional Requirements

- Administrators can create and configure workflows with named states and transition rules
- Users can submit task instances that follow a configured workflow
- The system validates that a state transition is permitted before applying it
- Role-based access control restricts which users can trigger which transitions
- All state changes are recorded in a timestamped audit log

## Non-Functional Requirements

- The backend API must return appropriate HTTP error codes for invalid transitions
- Passwords must be stored as hashed values (bcrypt)
- JWT tokens must be used for stateless authentication
- Database schema changes must be managed via Alembic migrations
