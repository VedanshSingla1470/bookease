# BookEase – Multi-Tenant Appointment Booking Platform

BookEase is a multi-tenant SaaS appointment booking and management platform designed to help businesses manage their services, staff, availability, and customer appointments from a centralized platform.

The platform supports multiple businesses, each with its own workspace, members, services, schedules, and bookings.

## Project Overview

BookEase aims to simplify appointment management for businesses such as:

- Salons and spas
- Clinics and healthcare providers
- Fitness studios
- Consultants
- Professional service providers
- Other appointment-based businesses

The platform provides business owners with tools to manage their operations while allowing customers to discover services and schedule appointments.

## Key Features

### Identity and Authentication
- User registration and login
- Secure password hashing using bcrypt
- JWT-based authentication
- Request validation using Zod
- Authentication middleware
- Role foundations
- Authentication rate limiting

### Organization Management
- Create business organizations
- Manage organization information
- Organization-specific workspaces
- Business contact information and address
- Organization status management
- Organization timezone configuration

### Membership Management
- Multiple users within an organization
- Organization-level roles
- Owner, Admin, and Staff permissions
- Member listing and management
- Role updates
- Member removal
- Organization-level access control

### Planned Features

- Service management
- Staff management
- Staff availability and scheduling
- Appointment booking
- Appointment cancellation and rescheduling
- Booking notifications
- Customer reviews and ratings
- Business analytics and dashboards
- Platform administration

## User Types and Roles

BookEase separates platform-level permissions from organization-level permissions.

### Platform Roles

| Role | Description |
|---|---|
| USER | Standard registered platform user |
| PLATFORM_ADMIN | Manages the overall BookEase platform |

### Organization Roles

| Role | Description |
|---|---|
| OWNER | Full organization management permissions |
| ADMIN | Manages organization information and staff |
| STAFF | Accesses permitted organization resources |

A user can belong to multiple organizations and have different roles in each organization.

## Technology Stack

### Frontend

| Technology | Purpose |
|---|---|
| React | User interface |
| Vite | Development and build tooling |
| Tailwind CSS | Styling |
| React Router | Client-side routing |
| Axios | API communication |
| Context API | Application state management |
| Lucide React | Icons |

### Backend

| Technology | Purpose |
|---|---|
| Node.js 22 | JavaScript runtime |
| Express.js | REST API framework |
| MongoDB 8 | Database |
| Mongoose | MongoDB object modeling |
| JWT | Authentication |
| bcrypt | Password hashing |
| Zod | Request validation |
| Helmet | HTTP security headers |
| CORS | Cross-origin configuration |
| express-rate-limit | API rate limiting |
| dotenv | Environment configuration |
| Nodemon | Development server |

### Development Environment

- Docker
- Docker Compose
- Git and GitHub

## Architecture

BookEase follows a modular monolith architecture.

The backend is organized into independent feature modules. Each module contains its own controllers, services, models, routes, and validators where applicable.

### High-Level Architecture

```text
React Frontend
      |
      | HTTP / REST API
      |
Express Backend
      |
      ├── Authentication
      ├── Users
      ├── Organizations
      ├── Memberships
      ├── Services
      ├── Staff
      ├── Availability
      ├── Bookings
      ├── Notifications
      ├── Reviews
      └── Analytics
      |
      |
MongoDB Database
```

### Multi-Tenancy

BookEase uses a shared database architecture with logical tenant isolation.

Organization-owned records reference their organization.

Access to organization resources is verified using the authenticated user's active membership and organization role.

This ensures that users cannot access another organization's private resources simply by knowing its ID.

### Booking Concurrency

The planned booking system will use a dedicated booking-slot collection and unique compound indexes to prevent overlapping reservations.

MongoDB replica set support is configured to enable transactional booking operations.

## Project Structure

```text
bookease/
│
├── client/
│   ├── public/
│   └── src/
│       ├── assets/
│       ├── components/
│       │   ├── common/
│       │   └── ui/
│       ├── context/
│       ├── hooks/
│       ├── layouts/
│       ├── pages/
│       │   ├── auth/
│       │   ├── dashboard/
│       │   └── public/
│       ├── services/
│       ├── utils/
│       ├── App.jsx
│       ├── main.jsx
│       └── index.css
│
├── server/
│   ├── src/
│   │   ├── common/
│   │   │   ├── constants/
│   │   │   ├── errors/
│   │   │   └── utils/
│   │   ├── config/
│   │   ├── middleware/
│   │   ├── modules/
│   │   │   ├── auth/
│   │   │   ├── users/
│   │   │   ├── organizations/
│   │   │   ├── memberships/
│   │   │   ├── services/
│   │   │   ├── staff/
│   │   │   ├── availability/
│   │   │   ├── bookings/
│   │   │   ├── notifications/
│   │   │   ├── reviews/
│   │   │   └── analytics/
│   │   ├── routes/
│   │   ├── app.js
│   │   └── server.js
│   ├── .env.example
│   └── package.json
│
├── docs/
│   ├── PRD.md
│   └── ARCHITECTURE.md
│
├── compose.yaml
├── .gitignore
└── README.md
```

## API Documentation

The backend API uses the following base URL:

```text
/api/v1
```

### Health Check

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/v1/health` | Check API health |

### Authentication

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/v1/auth/register` | Register a new user |
| POST | `/api/v1/auth/login` | Authenticate a user |

### Organizations

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/v1/organizations` | Create an organization |
| GET | `/api/v1/organizations` | Get user's organizations |
| GET | `/api/v1/organizations/:organizationId` | Get organization details |
| PATCH | `/api/v1/organizations/:organizationId` | Update organization |

### Memberships

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/v1/organizations/:organizationId/members` | List organization members |
| PATCH | `/api/v1/organizations/:organizationId/members/:membershipId/role` | Update member role |
| DELETE | `/api/v1/organizations/:organizationId/members/:membershipId` | Remove a member |

Protected endpoints require a valid JWT access token.

```http
Authorization: Bearer <access_token>
```

## Local Development Setup

BookEase uses Docker for development so Node.js, npm, and MongoDB do not need to be installed globally on the host machine.

### Prerequisites

- Docker Desktop
- Git
- Code editor such as Visual Studio Code

### 1. Clone the repository

```bash
git clone <your-github-repository-url>
cd bookease
```

### 2. Configure environment variables

Create the backend environment file:

```bash
cp server/.env.example server/.env
```

On Windows PowerShell, you can use:

```powershell
Copy-Item server/.env.example server/.env
```

Configure the required environment variables:

```env
PORT=5000
NODE_ENV=development

MONGODB_URI=mongodb://mongo:27017/bookease?replicaSet=rs0

JWT_SECRET=your_secure_random_secret
JWT_EXPIRES_IN=1d

CLIENT_URL=http://localhost:5173
```

Generate a secure JWT secret instead of using the placeholder.

### 3. Start MongoDB and initialize the replica set

```bash
docker compose up -d mongo mongo-init
```

### 4. Start the backend

```bash
docker compose up backend
```

Backend URL:

```text
http://localhost:5000
```

### 5. Start the frontend

Open another terminal from the project root:

```bash
docker compose up frontend
```

Frontend URL:

```text
http://localhost:5173
```

### 6. Start all services together

Alternatively:

```bash
docker compose up
```

To run services in the background:

```bash
docker compose up -d
```

### Stop services

```bash
docker compose down
```

MongoDB data is stored in a Docker named volume and is preserved when containers are stopped.

**Warning:** Avoid `docker compose down -v` unless you intentionally want to delete the stored database and dependency volumes.

## Environment Variables

| Variable | Description |
|---|---|
| PORT | Backend server port |
| NODE_ENV | Application environment |
| MONGODB_URI | MongoDB connection string |
| JWT_SECRET | JWT signing secret |
| JWT_EXPIRES_IN | JWT token expiration |
| CLIENT_URL | Frontend origin allowed by CORS |

Never commit actual `.env` files or production secrets.

## Database Design

The initial database collections include:

| Collection | Purpose |
|---|---|
| users | Platform user accounts |
| organizations | Business organizations |
| memberships | User-to-organization relationships |

Planned collections:

| Collection | Purpose |
|---|---|
| services | Business services |
| staff | Staff profiles and assignments |
| availability | Working hours and schedules |
| bookings | Customer appointments |
| booking_slots | Reservation concurrency control |
| notifications | Booking and account notifications |
| reviews | Customer feedback |

## Development Roadmap

### Phase 1 – Project Foundation

- [x] Initialize Git repository
- [x] Set up React with Vite
- [x] Configure Tailwind CSS
- [x] Configure Docker development environment
- [x] Set up Express backend
- [x] Configure MongoDB
- [x] Configure MongoDB replica set

### Phase 2 – Identity and Organization Management

- [x] Create user model
- [x] Implement registration and login foundation
- [x] Implement bcrypt password hashing
- [x] Implement JWT authentication
- [x] Add request validation
- [x] Add authentication middleware
- [x] Create organization model
- [x] Implement organization creation
- [x] Implement membership model
- [x] Implement membership management
- [x] Add organization role authorization
- [x] Establish tenant access-control foundation

### Phase 3 – Business Management

- [ ] Service management
- [ ] Staff management
- [ ] Staff-service assignments
- [ ] Availability management
- [ ] Business operating hours

### Phase 4 – Appointment Management

- [ ] Booking creation
- [ ] Booking-slot reservation
- [ ] Prevent overlapping appointments
- [ ] Booking cancellation
- [ ] Booking rescheduling
- [ ] Booking status management

### Phase 5 – Customer Experience

- [ ] Customer-facing service discovery
- [ ] Public business pages
- [ ] Appointment booking interface
- [ ] Booking history
- [ ] Customer profiles
- [ ] Reviews and ratings

### Phase 6 – Notifications and Analytics

- [ ] Email notifications
- [ ] Booking reminders
- [ ] Business dashboards
- [ ] Booking analytics
- [ ] Revenue reporting

### Phase 7 – Frontend Integration

- [ ] Authentication pages
- [ ] Organization onboarding
- [ ] Business dashboard
- [ ] Staff management interface
- [ ] Service management interface
- [ ] Availability management interface
- [ ] Booking management interface
- [ ] Customer booking interface

### Phase 8 – Security and Testing

- [ ] Unit testing
- [ ] Integration testing
- [ ] API testing
- [ ] Tenant-isolation testing
- [ ] Authorization testing
- [ ] Security testing
- [ ] Performance testing

### Phase 9 – Deployment

- [ ] Production environment configuration
- [ ] Database deployment
- [ ] Backend deployment
- [ ] Frontend deployment
- [ ] CI/CD pipeline
- [ ] Monitoring and logging

## Security Considerations

- Passwords are hashed using bcrypt.
- JWT authentication is used for protected endpoints.
- Zod validates incoming request data.
- Helmet provides HTTP security headers.
- Rate limiting protects API endpoints.
- Organization membership is checked before accessing tenant resources.
- Organization roles determine permitted operations.
- Environment secrets are excluded from version control.
- Database transactions are used where atomic operations are required.

## Future Enhancements

- Refresh-token authentication
- Email verification
- Password reset
- Organization invitations
- Ownership transfer
- Subscription and billing management
- Payment gateway integration
- Calendar integrations
- Advanced analytics
- Audit logs
- Automated reminders
- Platform administration dashboard

## Contributing

BookEase is currently under active development.

Development follows a modular architecture with feature-based backend modules.

Contributions should follow consistent naming conventions, maintain tenant isolation, and include appropriate documentation.

## License

This project is licensed under the MIT License.
