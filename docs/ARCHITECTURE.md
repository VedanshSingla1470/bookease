# BookEase – System Architecture

## 1. Architecture Overview

BookEase follows a modular monolithic architecture using the MERN stack.

The application consists of:
- React frontend.
- Express.js REST API.
- MongoDB database.
- Authentication and authorization middleware.

The frontend communicates with the backend through versioned REST APIs.

## 2. Backend Architecture

The backend follows a modular structure.

Each module contains:
- Models: Database schemas.
- Controllers: HTTP request and response handling.
- Services: Business logic.
- Routes: API endpoint definitions.
- Validators: Request validation.

### Backend Modules

1. Identity
2. Organization
3. Membership
4. Service
5. Staff
6. Availability
7. Booking
8. Notification
9. Review
10. Analytics

## 3. Frontend Architecture

The frontend contains three primary interfaces:

- Customer Portal
- Business Dashboard
- Platform Admin Dashboard

Shared components and authentication state will be maintained centrally.

React Router will handle navigation and protected routes.

## 4. Database Architecture

MongoDB collections:

- users
- organizations
- memberships
- services
- staff_profiles
- availability_rules
- availability_exceptions
- bookings
- booking_slots
- reviews

### Relationships

- A user can belong to multiple organizations.
- An organization can have multiple memberships.
- An organization can offer multiple services.
- An organization can have multiple staff members.
- Staff members can be assigned to multiple services.
- Customers can create multiple bookings.
- Every booking belongs to one organization, one customer, one service and one staff member.

## 5. Multi-Tenancy

BookEase uses organization-based multi-tenancy.

Every organization-owned resource contains an organizationId.

The backend validates organization membership and permissions before allowing access to business resources.

Cross-organization access is prohibited.

## 6. Authentication and Authorization

- JWT-based authentication.
- bcrypt password hashing.
- Role-based authorization.
- Organization membership authorization.
- Protected API routes.

Platform administrator permissions are separate from organization membership roles.

## 7. Booking Architecture

The booking engine uses availability rules, exceptions and existing reservations.

Booking times are stored in UTC.

Each organization maintains its own IANA time zone.

The initial booking system uses 15-minute reservation blocks.

A unique compound database index prevents multiple reservations for the same organization, staff member and time block.

All reservation blocks for a booking are acquired within a MongoDB transaction.

## 8. Technology Stack

Frontend:
- React
- Vite
- Tailwind CSS
- React Router
- Axios
- Context API

Backend:
- Node.js
- Express.js
- MongoDB
- Mongoose
- JWT
- bcrypt
- Zod

Tools:
- Git
- GitHub
- Postman
- MongoDB Compass

Deployment:
- Vercel
- Render
- MongoDB Atlas

## 9. API Design

API base path: /api/v1

API modules:
- /auth
- /organizations
- /organizations/:orgId/members
- /organizations/:orgId/services
- /organizations/:orgId/staff
- /organizations/:orgId/availability
- /bookings
- /reviews
- /admin

## 10. Security Principles

- Validate all incoming requests.
- Authenticate protected requests.
- Enforce authorization on the backend.
- Prevent cross-tenant data access.
- Protect sensitive environment variables.
- Use secure password hashing.
- Enforce booking conflict prevention at database level.
- Apply appropriate rate limiting and security headers.