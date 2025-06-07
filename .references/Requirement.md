# Analytics Hub Web Application - Technical Requirements Specification

## Project Overview

The Analytics Hub is a comprehensive web application designed to display analytics information through custom content and embedded reports from Microsoft PowerBI, Tableau, and Google Data Studio. This application implements an invitation-only access system with role-based permissions and advanced security features.

### Core Architecture
- **Framework**: Next.js 14 with App Router
- **Database**: PostgreSQL (Remote Server)
- **Authentication**: Invitation-only system with temporary passwords
- **Access Control**: Role-based permission system
- **Security**: Multi-layered security with IP blacklisting and URL encryption

## Technical Stack Requirements

### Frontend Framework
- **Next.js 14** with App Router architecture
- **TypeScript** for type safety and development efficiency
- **Tailwind CSS** for styling with custom dark theme implementation
- **React Hook Form** with Zod validation for form management
- **Framer Motion** for smooth animations and transitions
- **React Query (TanStack Query)** for efficient data fetching and caching
- **Iconify React** with Material Design Icons
- **React Hot Toast** or **SweetAlert2** for user notifications
- **React Quill** for rich text editing capabilities
- **Chart.js** or **Recharts** for dashboard analytics widgets
- **Canvas API** for login page background animations

### Backend & Database
- **PostgreSQL** (Remote Server) with connection pooling
- **Prisma ORM** for database management and migrations
- **NextAuth.js** for authentication and session management
- **bcryptjs** for secure password hashing
- **jsonwebtoken** for JWT token management
- **nodemailer** for email functionality
- **crypto** module for URL encryption/decryption
- **uuid** for unique identifier generation

### Security & Performance
- **Rate limiting** implementation for API endpoints
- **CSRF protection** for state-changing operations
- **Input sanitization** to prevent XSS attacks
- **Image optimization** with Next.js Image component
- **Code splitting** and lazy loading for performance
- **Server-side rendering** for optimal SEO and performance

## Suggested Next.js Project Structure

```
analytics-hub/
├── .env.local                    # Environment variables
├── .env.example                  # Environment template
├── .gitignore
├── next.config.js               # Next.js configuration
├── package.json
├── tailwind.config.js           # Tailwind configuration
├── tsconfig.json               # TypeScript configuration
├── prisma/
│   ├── schema.prisma           # Database schema
│   ├── migrations/             # Database migrations
│   └── seed.ts                 # Database seeding
├── public/
│   ├── icons/                  # Application icons
│   ├── images/                 # Static images
│   └── avatars/               # Default user avatars
├── src/
│   ├── app/                   # Next.js App Router
│   │   ├── globals.css        # Global styles
│   │   ├── layout.tsx         # Root layout
│   │   ├── page.tsx           # Root page (redirect to login)
│   │   ├── login/
│   │   │   └── page.tsx       # Login page
│   │   ├── forgot-password/
│   │   │   └── page.tsx       # Forgot password page
│   │   ├── reset-password/
│   │   │   └── page.tsx       # Reset password page
│   │   ├── update-password/
│   │   │   └── page.tsx       # Update password page
│   │   ├── dashboard/
│   │   │   ├── layout.tsx     # Dashboard layout with navbar
│   │   │   ├── page.tsx       # Home/Welcome page
│   │   │   ├── profile/
│   │   │   │   └── page.tsx   # User profile management
│   │   │   ├── notifications/
│   │   │   │   └── page.tsx   # Notification list
│   │   │   └── system/        # System management routes
│   │   │       ├── permissions/
│   │   │       ├── roles/
│   │   │       ├── users/
│   │   │       ├── menus/
│   │   │       ├── contents/
│   │   │       ├── email-templates/
│   │   │       ├── notifications/
│   │   │       ├── terms-conditions/
│   │   │       ├── security/
│   │   │       ├── configuration/
│   │   │       └── monitoring/
│   │   ├── content/
│   │   │   └── [...slug]/     # Dynamic content pages
│   │   │       └── page.tsx
│   │   └── api/               # API routes
│   │       ├── auth/
│   │       ├── users/
│   │       ├── roles/
│   │       ├── permissions/
│   │       ├── menus/
│   │       ├── contents/
│   │       ├── notifications/
│   │       ├── email-templates/
│   │       ├── system/
│   │       └── dashboard/
│   ├── components/            # Reusable components
│   │   ├── ui/               # Base UI components
│   │   ├── layout/           # Layout components
│   │   ├── auth/             # Authentication components
│   │   ├── dashboard/        # Dashboard components
│   │   ├── forms/            # Form components
│   │   ├── content/          # Content components
│   │   └── animations/       # Animation components
│   ├── lib/                  # Utility libraries
│   │   ├── auth.ts          # Authentication utilities
│   │   ├── db.ts            # Database connection
│   │   ├── email.ts         # Email utilities
│   │   ├── encryption.ts    # URL encryption/decryption
│   │   ├── validation.ts    # Zod schemas
│   │   ├── utils.ts         # General utilities
│   │   ├── constants.ts     # Application constants
│   │   └── permissions.ts   # Permission checking utilities
│   ├── hooks/               # Custom React hooks
│   ├── store/               # State management
│   ├── types/               # TypeScript type definitions
│   └── middleware.ts        # Next.js middleware for auth
└── docs/
    ├── API.md              # API documentation
    ├── DATABASE.md         # Database schema documentation
    └── DEPLOYMENT.md       # Deployment guide
```

## Functional Requirements

### 1. Permission Management System

#### Technical Specifications:
- Implement granular permission system with CRUD operations (Create, Read, Update, Delete)
- Store permissions in `idbi_permissions` table with unique identifiers
- Establish many-to-many relationship between roles and permissions via `idbi_role_has_permissions`
- Implement permission checking middleware for API routes
- Create permission validation utilities for frontend components

#### Access Control:
- Only System Administrator role can create, modify, or delete permissions
- Implement role-based permission checking before any system operation
- Cache permission data for performance optimization

### 2. Role Management System

#### Technical Specifications:
- Define role hierarchy: System Administrator > Administrator > Stakeholder > Management > Manager > Leader > Officer
- Store roles in `idbi_roles` table with hierarchical structure
- Implement role inheritance for permission management
- Create role assignment interface with permission matrix

#### Implementation Requirements:
- System Administrator and Administrator roles have full CRUD access to role management
- Implement role-based menu filtering and content access control
- Create role validation middleware for API endpoints
- Implement dynamic role assignment with immediate effect

### 3. User Management System

#### Technical Specifications:
- Implement invitation-only user creation system
- Generate 8-character temporary passwords (uppercase, lowercase, numbers)
- Store user data in `idbi_users` table with encrypted sensitive information
- Implement user status management (active, suspended, invited)
- Create user-role assignment system via `idbi_user_has_roles`

#### Email Integration:
- Implement automated invitation email system using nodemailer
- Create dynamic email templates with user-specific information
- Implement email queue system for bulk invitations
- Track email delivery status and handle bounces

#### Profile Management:
- Implement avatar upload with image processing (max 2MB, 400x400px)
- Create image cropping interface for oversized uploads
- Store profile images with optimized formats
- Implement default avatar selection system

### 4. Menu Management System

#### Technical Specifications:
- Implement hierarchical menu structure (maximum 3 levels)
- Store menu data in `idbi_menus` table with parent-child relationships
- Create menu-role access mapping via `idbi_menu_role_access`
- Implement menu ordering system with index sequencing

#### Frontend Implementation:
- Create horizontal sticky navigation bar
- Implement Material Design Icons from Iconify
- Create responsive menu system for desktop and tablet
- Implement smooth transitions and hover effects
- Create breadcrumb navigation for deep menu structures

### 5. Content Management System

#### Technical Specifications:
- Implement dual content types: Custom and Embed
- Store content in `idbi_contents` table with type differentiation
- Create content-menu association via `idbi_content_menu_map`
- Implement content status management (draft, published)

#### Custom Content Features:
- Integrate React Quill rich text editor
- Support HTML code editor for advanced users
- Implement file upload system for documents (PDF, Word, Excel, PPT)
- Create image upload and management system
- Support iframe embedding for external content

#### Embed Content Security:
- Implement AES-256 encryption for embed URLs
- Store original and encrypted URLs separately
- Generate UUID-based access tokens
- Implement URL decryption on server-side only
- Prevent URL exposure in browser developer tools
- Create secure iframe rendering with CSP headers

### 6. Email Template Management

#### Technical Specifications:
- Define four template types: Invitation, Reset Password, Suspension, Announcement
- Store templates in `idbi_email_templates` table
- Implement dynamic variable replacement system
- Create HTML email template editor

#### Template System:
- Implement template versioning for system templates
- Create announcement template system for bulk communications
- Implement template preview functionality
- Support dynamic variables: {{username}}, {{email}}, {{reset_link}}, etc.
- Implement template validation and testing

### 7. Notification System

#### Technical Specifications:
- Store notifications in `idbi_notifications` table
- Implement notification-user mapping via `idbi_notification_user_read`
- Create real-time notification delivery system
- Implement notification categorization and prioritization

#### Frontend Implementation:
- Create bell icon notification indicator
- Implement notification count display
- Create notification detail pages
- Implement mark as read/unread functionality
- Create notification history and search

### 8. Terms and Conditions Management

#### Technical Specifications:
- Store T&C content in `idbi_system_configs` table
- Implement T&C versioning system
- Track user acceptance in `idbi_user_tcs` table
- Create forced acceptance modal system

#### Implementation Requirements:
- Create rich text editor for T&C content
- Implement modal dialog that cannot be dismissed
- Force logout for non-acceptance
- Track acceptance timestamps and versions
- Implement T&C update notification system

### 9. Dashboard and Analytics

#### Widget Requirements:
- **Digital Clock Widget**: Real-time local time synchronization
- **Login Activity Chart**: 15-day login statistics with Chart.js
- **Top Users Widgets**: Most active users and online status
- **Announcement Widget**: Latest system announcements
- **New Users Widget**: Recently invited users
- **Content Analytics**: Most visited content tracking

#### Technical Implementation:
- Implement responsive grid layout for widgets
- Create real-time data updates using WebSocket or Server-Sent Events
- Implement data caching for performance optimization
- Create widget configuration system
- Implement marquee text component with smooth scrolling
- Create image banner with auto-slideshow functionality

### 10. User Profile Management

#### Technical Specifications:
- Implement profile editing interface
- Create password change functionality with validation
- Implement avatar upload with image processing
- Store profile changes in audit logs

#### Security Features:
- Implement current password verification for changes
- Create password strength validation
- Implement profile change notifications
- Track profile modification history

### 11. Authentication and Access Control

#### Login System:
- Implement secure login with bcrypt password hashing
- Create temporary password flow for new users
- Implement forced password update for temporary passwords
- Create session management with JWT tokens

#### Password Reset Flow:
- Implement forgot password functionality
- Generate UUID-based reset tokens with 120-minute expiration
- Implement one-time use token system
- Create 30-second cooldown for reset requests
- Implement secure password reset pages

#### Security Measures:
- Implement brute force protection (30 failed attempts = IP blacklist)
- Create IP blacklisting system in `idbi_ip_blacklist` table
- Implement rate limiting for all authentication endpoints
- Create security audit logging
- Implement session timeout and concurrent session management

### 12. Security Management

#### Technical Specifications:
- Create IP blacklist management interface
- Implement automatic IP blocking based on failed login attempts
- Create manual IP blacklist addition functionality
- Implement security monitoring dashboard

#### Implementation Requirements:
- Store blocked IPs in `idbi_ip_blacklist` table
- Create IP whitelist for administrative access
- Implement security event logging
- Create security alert system
- Implement IP geolocation tracking

### 13. System Configuration Management

#### Technical Specifications:
- Store all configurations in `idbi_system_configs` table
- Implement configuration versioning and rollback
- Create configuration validation system
- Implement configuration change audit logging

#### Configuration Options:
- **Logo Management**: Upload and manage logos for navbar and login pages
- **Marquee Text**: Configure scrolling text for homepage
- **Image Banner**: Manage banner images and slideshow settings
- **Footer Configuration**: Customize footer content and links
- **Security Settings**: Configure failed login thresholds
- **Theme Settings**: Manage color schemes and UI preferences

### 14. System Function Monitoring

#### Technical Specifications:
- Implement health check endpoints for all system functions
- Create system status monitoring dashboard
- Implement performance metrics collection
- Create error tracking and reporting system

#### Monitoring Features:
- **Database Connectivity**: Monitor PostgreSQL connection status
- **Email Service**: Track email delivery success rates
- **API Performance**: Monitor response times and error rates
- **Security Events**: Track authentication and authorization events
- **System Resources**: Monitor memory and CPU usage
- **User Activity**: Track user engagement and system usage

## Frontend Design Requirements

### Theme and Styling
- **Primary Background Color**: `#0E0E44` (Dark Navy)
- **Primary Accent Color**: `#FF7A00` (Orange)
- **Design System**: Implement consistent dark theme across all components
- **Hover Effects**: Create smooth transitions with appropriate contrast
- **Typography**: Use consistent font hierarchy with good readability

### Layout Requirements
- **Navigation**: Horizontal sticky navbar (not vertical)
- **Content Layout**: Wide layout for optimal content display
- **Responsive Design**: Landscape orientation support (desktop and tablet)
- **Grid System**: Implement responsive grid for dashboard widgets
- **Consistency**: Maintain navbar across all pages except login/reset password

### User Experience
- **Loading States**: Implement masking animation loading screens
- **Notifications**: Use Toast notifications or SweetAlert for user feedback
- **Transitions**: Smooth animations for all state changes
- **Performance**: Fast page load times and responsive interactions
- **Accessibility**: Follow WCAG guidelines for accessibility compliance

### Animation and Interactions
- **Canvas Background**: Implement animated background for login and reset password pages
- **Icon System**: Use Iconify Material Design Icons consistently
- **Image Fallbacks**: Use Unsplash random images as default placeholders
- **Smooth Transitions**: Implement smooth transitions for all UI interactions
- **Loading Animations**: Create engaging loading states for all operations

## Database Schema Requirements

### Core Tables with `idbi_` Prefix

#### Authentication & User Management
- `idbi_users`: User accounts with profile information and security settings
- `idbi_roles`: System roles with hierarchical structure
- `idbi_permissions`: Granular permissions for system operations
- `idbi_role_has_permissions`: Many-to-many role-permission relationships
- `idbi_user_has_roles`: User role assignments with timestamps
- `idbi_password_resets`: Password reset tokens with expiration
- `idbi_user_tcs`: Terms & conditions acceptance tracking
- `idbi_user_logs`: Comprehensive user activity logging

#### Menu & Navigation
- `idbi_menus`: Hierarchical menu structure (maximum 3 levels)
- `idbi_menu_role_access`: Role-based menu access permissions

#### Content Management
- `idbi_contents`: Content storage with type differentiation and encryption
- `idbi_content_menu_map`: Content-menu associations
- `idbi_content_attachments`: File attachments and media management
- `idbi_content_visit_logs`: Content access tracking and analytics

#### Communication
- `idbi_email_templates`: Email template management with versioning
- `idbi_notifications`: System notification management
- `idbi_notification_user_read`: Notification read status tracking

#### Security & System
- `idbi_ip_blacklist`: IP address blocking and security management
- `idbi_system_configs`: System configuration and settings
- `idbi_function_logs`: System function monitoring and health checks

#### Analytics & Tracking
- `idbi_user_login_activities`: Login tracking for dashboard analytics
- `idbi_user_online_status`: Real-time user online status
- `idbi_user_avatars`: Default avatar options and management

## API Design Requirements

### RESTful API Structure
- Implement RESTful API endpoints following REST conventions
- Use appropriate HTTP methods (GET, POST, PUT, DELETE)
- Implement consistent response formats with proper status codes
- Create comprehensive error handling with descriptive messages
- Implement API versioning for future compatibility

### Authentication & Authorization
- Implement JWT-based authentication for API access
- Create middleware for route protection and permission checking
- Implement rate limiting for all API endpoints
- Create API key authentication for internal services
- Implement request/response logging for audit trails

### Data Validation
- Use Zod schemas for request validation
- Implement input sanitization to prevent injection attacks
- Create comprehensive validation error responses
- Implement file upload validation and processing
- Create data transformation utilities for consistent responses

## Security Requirements

### Authentication Security
- Implement secure password hashing using bcrypt with appropriate salt rounds
- Create JWT tokens with secure httpOnly cookies
- Implement refresh token rotation for enhanced security
- Create session timeout and concurrent session management
- Implement device fingerprinting for suspicious activity detection

### Data Protection
- Encrypt sensitive data at rest using AES-256 encryption
- Implement URL encryption for embed content protection
- Use parameterized queries to prevent SQL injection
- Implement input sanitization for XSS prevention
- Create data masking for sensitive information display

### Infrastructure Security
- Use environment variables for all sensitive configuration
- Implement secure headers (HSTS, CSP, X-Frame-Options)
- Create IP whitelisting for administrative functions
- Use HTTPS-only communication protocols
- Implement comprehensive backup and disaster recovery procedures

## Performance Requirements

### Frontend Optimization
- Implement code splitting and dynamic imports for optimal bundle sizes
- Use React Server Components where appropriate for better performance
- Implement image optimization with Next.js Image component
- Create efficient data fetching with React Query caching
- Implement lazy loading for non-critical components

### Backend Optimization
- Implement database connection pooling for efficient resource usage
- Create database query optimization with proper indexing
- Implement Redis caching for frequently accessed data
- Create API response caching with appropriate cache headers
- Implement database query monitoring and optimization tools

### Caching Strategy
- Implement browser caching for static assets with long-term cache headers
- Create server-side caching for frequently accessed database queries
- Use CDN for static content delivery and global performance
- Implement cache invalidation strategies for dynamic content
- Create cache warming procedures for critical application data

## Development Guidelines

### Code Quality Standards
- Implement TypeScript for type safety and better development experience
- Use ESLint and Prettier for consistent code formatting
- Create comprehensive unit and integration tests
- Implement code review processes for all changes
- Use Git hooks for automated code quality checks

### Documentation Requirements
- Create comprehensive API documentation with examples
- Document all database schema changes and migrations
- Maintain deployment and configuration documentation
- Create user guides for administrative functions
- Document all security procedures and incident response plans

### Testing Strategy
- Implement unit tests for all business logic components
- Create integration tests for API endpoints
- Implement end-to-end tests for critical user flows
- Create performance tests for load and stress testing
- Implement security testing for vulnerability assessment

## Deployment Requirements

### Environment Configuration
- Set up development, staging, and production environments
- Implement environment-specific configuration management
- Create CI/CD pipeline with automated testing and deployment
- Implement database migration automation
- Set up monitoring and alerting systems for production

### Production Deployment
- Deploy to cloud platform with auto-scaling capabilities
- Configure PostgreSQL database with high availability and backup strategies
- Implement SSL certificates and security headers
- Set up load balancing and failover mechanisms
- Create comprehensive monitoring and error tracking systems

## Success Criteria

### Functional Compliance
- All 14 core functional requirements fully implemented and tested
- Role-based access control working correctly across all system components
- Email system functioning with all template types and delivery tracking
- Content management with encryption working securely
- Dashboard widgets displaying accurate real-time data

### Performance Benchmarks
- Page load times consistently under 2 seconds
- API response times consistently under 500ms
- Support for 100+ concurrent users without performance degradation
- 99.9% uptime availability with proper monitoring
- Mobile-responsive design optimized for landscape orientation

### Security Compliance
- Zero critical security vulnerabilities in production
- Successful penetration testing results with remediation
- Compliance with data protection standards and regulations
- Secure authentication and authorization implementation
- Encrypted data transmission and storage verification

### User Experience Standards
- Intuitive and consistent user interface across all pages
- Smooth animations and transitions enhancing user experience
- Comprehensive error handling with helpful user feedback
- Accessible design following WCAG 2.1 AA guidelines
- Cross-browser compatibility (Chrome, Firefox, Safari, Edge)