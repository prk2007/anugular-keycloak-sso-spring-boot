# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is the **Angular frontend** for a Spring Boot + Keycloak + Angular authentication system. The project integrates Keycloak for OAuth2/OIDC authentication with role-based access control.

**Architecture**: Full-stack application with:
- Angular 14 frontend (this directory)
- Spring Boot backend (../spring-app)
- Keycloak 20.0.0 identity provider
- PostgreSQL database

## Development Commands

### Starting the Application

```bash
# Start Angular dev server with proxy configuration
npm start
# Or explicitly:
ng serve --proxy-config proxy.conf.json
```

The app runs on `http://localhost:4200` and proxies `/api` requests to `http://localhost:8080` (Spring Boot backend).

### Building

```bash
# Production build
ng build

# Development build with watch mode
ng build --watch --configuration development
```

### Testing

```bash
# Run unit tests with Karma
ng test
```

### Code Generation

```bash
# Generate components, services, etc.
ng generate component component-name
ng generate service service-name
ng generate guard guard-name
```

## Infrastructure

### Docker Services

Start the required services from the project root:

```bash
docker compose up
```

This starts:
- PostgreSQL (port 5432)
- pgAdmin (port 81)
- Keycloak (port 8081)

**Keycloak Admin Console**: http://localhost:8081 (admin/admin)

### Environment Configuration

**Keycloak settings** are defined in `src/environments/environment.ts`:
- Issuer: http://localhost:8081
- Realm: `test-app`
- Client ID: `frontend`

**API proxy** configured in `proxy.conf.json` redirects `/api/*` to Spring Boot backend at `http://localhost:8080`.

## Authentication Architecture

### Keycloak Integration

The app uses `keycloak-angular` and `keycloak-js` libraries with initialization handled via `APP_INITIALIZER` provider:

1. **Initialization**: `src/utils/app-init.ts` configures Keycloak with `login-required` mode
2. **Auth Guard**: `src/app/auth/auth.guard.ts` extends `KeycloakAuthGuard` to protect routes
3. **Auth Service**: `src/app/auth/auth.service.ts` wraps KeycloakService for app-specific auth operations

### Authorization Flow

Routes are protected using `AuthGuard` with role-based access control:

```typescript
{
  path: 'user-info',
  component: UserInfoComponent,
  canActivate: [AuthGuard],
  data: { roles: ['user'] }  // Required Keycloak realm roles
}
```

**Role Checking Logic** (in `auth.guard.ts:17-45`):
1. Verify user authentication (redirect to Keycloak login if not authenticated)
2. Extract required roles from route configuration
3. Compare Keycloak user roles against required roles
4. Allow access if user has all required roles, otherwise redirect to `/access-denied`

### Token Management

- Keycloak automatically adds `Authorization: Bearer TOKEN` header to HTTP requests
- Excluded URLs configured via `bearerExcludedUrls: ['/assets']` in app initialization
- Token refresh handled automatically by keycloak-angular library

## Backend Integration

### API Communication

**Service Layer**: `src/app/api/web-api.service.ts` handles backend communication
- Uses HttpClient with environment-based API URL (`/api`)
- JWT token automatically included in requests (except excluded URLs)

### Spring Boot Backend Architecture

The backend (../spring-app) is an OAuth2 Resource Server that:

1. **Validates JWT tokens** issued by Keycloak
2. **Extracts realm roles** from JWT using custom converter (`SecurityConfig.java`)
3. **Syncs user data** from JWT to local PostgreSQL database via `JwtUserSyncFilter`
4. **Enforces role-based access**: All endpoints require `ROLE_user`

**Key Backend Files**:
- `SecurityConfig.java`: Spring Security + OAuth2 configuration with JWT authentication converter
- `JwtUserSyncFilter.java`: Custom filter that extracts user attributes (email, firstname, lastname, gender) from JWT and syncs to local User table on every request
- `UserService.java`: Manages local user database and provides logged user context

The local user database enables foreign key relationships (e.g., linking users to other entities) while Keycloak remains the source of truth for authentication/authorization.

## Key Architectural Patterns

### Keycloak Initialization Pattern

The app uses Angular's `APP_INITIALIZER` token to ensure Keycloak is fully initialized before the app bootstraps. This prevents race conditions where components might try to access auth state before Keycloak is ready.

### Role Synchronization

**Frontend**: Roles are read from Keycloak JWT at route guard level
**Backend**: Spring Security extracts roles from JWT `realm_access.roles` claim and maps them to `GrantedAuthority` with `ROLE_` prefix

### Stateless Session Management

Both frontend and backend use stateless authentication:
- No server-side sessions
- JWT contains all necessary authentication/authorization data
- Backend configured with `SessionCreationPolicy.STATELESS`

## Common Development Tasks

### Adding a New Protected Route

1. Create the component: `ng generate component my-component`
2. Add route to `src/app/app-routing.module.ts` with `AuthGuard`:
   ```typescript
   {
     path: 'my-route',
     component: MyComponent,
     canActivate: [AuthGuard],
     data: { roles: ['required-role'] }  // Optional
   }
   ```

### Calling Backend APIs

1. Add method to `src/app/api/web-api.service.ts`:
   ```typescript
   public myEndpoint(): Observable<ResponseType> {
     return this.http.get<ResponseType>(`${environment.apiUrl}/endpoint`);
   }
   ```
2. Use in component by injecting `WebApiService`
3. JWT token automatically included in request headers

### Getting Current User Info

```typescript
constructor(private keycloakService: KeycloakService) {}

// Get username
const username = this.keycloakService.getUsername();

// Get user roles
const roles = this.keycloakService.getUserRoles();

// Check if authenticated
const isAuthenticated = this.keycloakService.isLoggedIn();
```

### Logout

```typescript
constructor(private authService: AuthService) {}

logout() {
  this.authService.logout();  // Clears token and redirects to Keycloak
}
```

## Important Configuration Notes

### Keycloak Realm Setup

The backend expects Keycloak realm `test-app` with:
- Frontend client: `frontend` (public client, Standard flow + Implicit flow enabled)
- Backend client: `backend` (confidential client, used for token validation)
- Realm role: `user` (assigned by default to new users)
- JWT issuer URI: `http://localhost:8081/realms/test-app`

### CORS and Proxy

The proxy configuration (`proxy.conf.json`) eliminates CORS issues during development by routing Angular dev server requests to Spring Boot. In production, ensure proper CORS configuration on the backend.

### Environment Files

When deploying, update `src/environments/environment.prod.ts` with production Keycloak URLs and API endpoints.
