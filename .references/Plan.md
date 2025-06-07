# Analytics Hub Development Plan

## Project Overview

The Analytics Hub is a comprehensive web application designed to display analytics information through custom content and embedded reports from Microsoft PowerBI, Tableau, and Google Data Studio. This application implements a role-based access control system with invitation-only user management and advanced security features.

## Technology Stack

### Frontend Framework
- **Next.js 14** (App Router)
- **TypeScript** for type safety
- **Tailwind CSS** for styling with dark theme implementation
- **React Hook Form** for form management
- **Zod** for schema validation
- **Framer Motion** for smooth animations
- **React Query (TanStack Query)** for data fetching and caching
- **Iconify React** for Material Design Icons
- **React Hot Toast** for notifications
- **SweetAlert2** for modal dialogs
- **React Quill** for rich text editor
- **Chart.js/Recharts** for dashboard widgets
- **Canvas API** for login page animations

### Backend & Database
- **PostgreSQL** (Remote Server)
- **Prisma ORM** for database management
- **NextAuth.js** for authentication
- **bcryptjs** for password hashing
- **jsonwebtoken** for JWT token management
- **nodemailer** for email functionality
- **crypto** for URL encryption/decryption
- **uuid** for unique identifiers

### Security & Performance
- **Rate limiting** for API endpoints
- **CSRF protection**
- **Input sanitization**
- **Image optimization** with Next.js Image component
- **Code splitting** and lazy loading
- **Server-side rendering** for performance

## Project Structure

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
│   │       │   ├── login/
│   │       │   ├── logout/
│   │       │   ├── forgot-password/
│   │       │   └── reset-password/
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
│   │   │   ├── Button.tsx
│   │   │   ├── Input.tsx
│   │   │   ├── Modal.tsx
│   │   │   ├── Table.tsx
│   │   │   ├── Card.tsx
│   │   │   ├── Loading.tsx
│   │   │   └── Toast.tsx
│   │   ├── layout/           # Layout components
│   │   │   ├── Navbar.tsx
│   │   │   ├── Sidebar.tsx
│   │   │   ├── Footer.tsx
│   │   │   └── LoadingScreen.tsx
│   │   ├── auth/             # Authentication components
│   │   │   ├── LoginForm.tsx
│   │   │   ├── ForgotPasswordForm.tsx
│   │   │   ├── ResetPasswordForm.tsx
│   │   │   └── TermsConditionsModal.tsx
│   │   ├── dashboard/        # Dashboard components
│   │   │   ├── WidgetCard.tsx
│   │   │   ├── DigitalClock.tsx
│   │   │   ├── LoginChart.tsx
│   │   │   ├── UserStats.tsx
│   │   │   ├── MarqueeText.tsx
│   │   │   └── ImageBanner.tsx
│   │   ├── forms/            # Form components
│   │   │   ├── UserForm.tsx
│   │   │   ├── RoleForm.tsx
│   │   │   ├── MenuForm.tsx
│   │   │   ├── ContentForm.tsx
│   │   │   └── ProfileForm.tsx
│   │   ├── content/          # Content components
│   │   │   ├── RichTextEditor.tsx
│   │   │   ├── EmbedViewer.tsx
│   │   │   └── ContentRenderer.tsx
│   │   └── animations/       # Animation components
│   │       ├── CanvasBackground.tsx
│   │       └── PageTransition.tsx
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
│   │   ├── useAuth.ts       # Authentication hook
│   │   ├── usePermissions.ts # Permission checking hook
│   │   ├── useNotifications.ts # Notification hook
│   │   └── useLocalStorage.ts # Local storage hook
│   ├── store/               # State management
│   │   ├── authStore.ts     # Authentication state
│   │   ├── uiStore.ts       # UI state
│   │   └── notificationStore.ts # Notification state
│   ├── types/               # TypeScript type definitions
│   │   ├── auth.ts
│   │   ├── user.ts
│   │   ├── content.ts
│   │   ├── menu.ts
│   │   └── api.ts
│   └── middleware.ts        # Next.js middleware for auth
└── docs/
    ├── API.md              # API documentation
    ├── DATABASE.md         # Database schema documentation
    └── DEPLOYMENT.md       # Deployment guide
```

## Database Schema Design

### Core Tables with `idbi_` Prefix

#### Authentication & User Management
- `idbi_users` - User accounts with profile information
- `idbi_roles` - System roles (System Administrator, Administrator, etc.)
- `idbi_permissions` - Granular permissions (Create, Edit, View, Delete)
- `idbi_role_has_permissions` - Role-permission relationships
- `idbi_user_has_roles` - User-role assignments
- `idbi_password_resets` - Password reset tokens with expiration
- `idbi_user_tcs` - Terms & conditions acceptance tracking
- `idbi_user_logs` - User activity logging

#### Menu & Navigation
- `idbi_menus` - Hierarchical menu structure (3 levels max)
- `idbi_menu_role_access` - Menu access permissions per role

#### Content Management
- `idbi_contents` - Content storage (Custom/Embed types)
- `idbi_content_menu_map` - Content-menu associations
- `idbi_content_attachments` - File attachments for content

#### Communication
- `idbi_email_templates` - Email template management
- `idbi_notifications` - System notifications
- `idbi_notification_user_read` - Notification read status

#### Security & System
- `idbi_ip_blacklist` - Blocked IP addresses
- `idbi_system_configs` - System configuration settings
- `idbi_function_logs` - System function monitoring

#### Analytics & Tracking
- `idbi_user_login_activities` - Login tracking for dashboard widgets
- `idbi_user_online_status` - Real-time online status
- `idbi_content_visit_logs` - Content access tracking
- `idbi_user_avatars` - Default avatar options

## Development Phases

### Phase 1: Project Setup & Infrastructure

#### 1.1 Environment Setup
- Initialize Next.js 14 project with TypeScript
- Configure Tailwind CSS with dark theme variables
- Set up Prisma ORM with PostgreSQL connection
- Configure environment variables for development/production
- Set up ESLint, Prettier, and Husky for code quality

#### 1.2 Database Foundation
- Create Prisma schema with all required tables
- Implement database migrations
- Create comprehensive seed data for all tables
- Set up database views and stored procedures for analytics
- Test database connections and queries

#### 1.3 Authentication Infrastructure
- Configure NextAuth.js with custom providers
- Implement JWT token management
- Set up middleware for route protection
- Create authentication utilities and hooks
- Implement session management

### Phase 2: Core Authentication System

#### 2.1 Login System
- Design and implement login page with canvas animation
- Create login form with validation
- Implement brute force protection (30 attempts = IP blacklist)
- Add rate limiting for login attempts
- Create loading animations and transitions

#### 2.2 Password Management
- Implement forgot password functionality
- Create password reset flow with UUID tokens
- Build update password page for temporary passwords
- Add password strength validation
- Implement 30-second cooldown for password reset requests

#### 2.3 Security Features
- Implement IP blacklisting system
- Create security monitoring dashboard
- Add CSRF protection
- Implement input sanitization
- Set up audit logging for security events

### Phase 3: User & Role Management

#### 3.1 Role-Based Access Control
- Implement permission system (Create, Edit, View, Delete)
- Create role management interface
- Build permission assignment functionality
- Implement role-based menu filtering
- Create permission checking utilities

#### 3.2 User Management
- Build user creation and invitation system
- Implement email invitation with temporary passwords
- Create user profile management
- Add user suspension/activation functionality
- Implement avatar upload with image cropping

#### 3.3 Terms & Conditions
- Create T&C management interface
- Implement forced T&C acceptance modal
- Add T&C versioning system
- Create T&C enforcement middleware
- Build rich text editor for T&C content

### Phase 4: Menu & Navigation System

#### 4.1 Menu Management
- Implement hierarchical menu structure (3 levels)
- Create menu management interface
- Add icon selection from Iconify Material Design
- Implement menu ordering and sequencing
- Build role-based menu visibility

#### 4.2 Navigation Components
- Design and build horizontal sticky navbar
- Implement responsive navigation for desktop/tablet
- Create breadcrumb navigation
- Add smooth transitions and animations
- Implement active menu highlighting

### Phase 5: Content Management System

#### 5.1 Content Creation
- Build rich text editor for custom content
- Implement HTML code editor option
- Create embed URL management with encryption
- Add content type selection (Custom/Embed)
- Implement content-menu association

#### 5.2 Content Security
- Implement URL encryption/decryption for embeds
- Add content access control based on roles
- Create content status management (Draft/Published)
- Implement content bypass protection
- Add iframe security measures

#### 5.3 Content Rendering
- Build dynamic content rendering system
- Implement secure embed iframe rendering
- Add content caching for performance
- Create content access logging
- Implement content search functionality

### Phase 6: Dashboard & Analytics

#### 6.1 Home Page Widgets
- Create digital clock widget with local time sync
- Build login activity chart (15-day period)
- Implement top users widgets (login frequency, online status)
- Create announcement notification widget
- Build content visit tracking widget

#### 6.2 Dashboard Layout
- Implement responsive grid layout for widgets
- Create marquee text component
- Build image banner with slideshow
- Add widget card animations
- Implement real-time data updates

#### 6.3 Analytics Features
- Create user activity tracking
- Implement content visit analytics
- Build system performance monitoring
- Add dashboard data caching
- Create analytics API endpoints

### Phase 7: Communication System

#### 7.1 Email System
- Implement email template management
- Create dynamic email template engine
- Build invitation email functionality
- Add password reset email system
- Implement announcement email broadcasting

#### 7.2 Notification System
- Create notification management interface
- Implement real-time notification delivery
- Build notification bell component
- Add notification read/unread tracking
- Create notification detail pages

### Phase 8: System Administration

#### 8.1 System Configuration
- Build system configuration management
- Implement logo upload and management
- Create banner and marquee text configuration
- Add footer customization
- Implement failed login threshold configuration

#### 8.2 System Monitoring
- Create system function monitoring dashboard
- Implement health check endpoints
- Add performance monitoring
- Create error logging and reporting
- Build system status indicators

### Phase 9: UI/UX Implementation

#### 9.1 Dark Theme Implementation
- Implement dark theme with specified colors (#0E0E44, #FF7A00)
- Create consistent color palette
- Add hover effects and transitions
- Implement theme consistency across all pages
- Add smooth animations and transitions

#### 9.2 Responsive Design
- Ensure landscape responsiveness (desktop/tablet)
- Optimize for wide content layout
- Implement consistent navigation across pages
- Add loading screens and animations
- Create error and success feedback systems

### Phase 10: Testing & Optimization

#### 10.1 Performance Optimization
- Implement code splitting and lazy loading
- Optimize database queries and indexing
- Add image optimization and caching
- Implement API response caching
- Optimize bundle size and loading times

#### 10.2 Security Testing
- Conduct security vulnerability assessment
- Test authentication and authorization flows
- Validate input sanitization and CSRF protection
- Test rate limiting and brute force protection
- Verify URL encryption and content security

#### 10.3 User Acceptance Testing
- Test all user flows and scenarios
- Validate role-based access control
- Test email functionality and templates
- Verify notification system functionality
- Conduct cross-browser compatibility testing

## Security Implementation Strategy

### Authentication Security
- Implement JWT tokens with secure httpOnly cookies
- Add refresh token rotation
- Use bcrypt for password hashing with salt rounds
- Implement session timeout and concurrent session management
- Add device fingerprinting for suspicious activity detection

### API Security
- Implement rate limiting per IP and user
- Add request validation with Zod schemas
- Use CSRF tokens for state-changing operations
- Implement API key authentication for internal services
- Add request/response logging for audit trails

### Data Protection
- Encrypt sensitive data at rest
- Implement URL encryption for embed content
- Use parameterized queries to prevent SQL injection
- Add input sanitization for XSS prevention
- Implement data masking for sensitive information

### Infrastructure Security
- Use environment variables for sensitive configuration
- Implement secure headers (HSTS, CSP, etc.)
- Add IP whitelisting for admin functions
- Use secure communication protocols (HTTPS only)
- Implement backup and disaster recovery procedures

## Performance Optimization Strategy

### Frontend Optimization
- Implement Next.js App Router for optimal performance
- Use React Server Components where appropriate
- Add image optimization with Next.js Image component
- Implement code splitting and dynamic imports
- Use React Query for efficient data fetching and caching

### Backend Optimization
- Implement database connection pooling
- Add database query optimization and indexing
- Use Redis for session and cache management
- Implement API response caching
- Add database query monitoring and optimization

### Caching Strategy
- Implement browser caching for static assets
- Add server-side caching for frequently accessed data
- Use CDN for static content delivery
- Implement cache invalidation strategies
- Add cache warming for critical data

## Deployment Strategy

### Environment Configuration
- Set up development, staging, and production environments
- Configure environment-specific variables
- Implement CI/CD pipeline with automated testing
- Add database migration automation
- Set up monitoring and alerting systems

### Production Deployment
- Deploy to cloud platform (Vercel/AWS/Azure)
- Configure PostgreSQL database with backup strategies
- Set up SSL certificates and security headers
- Implement load balancing and auto-scaling
- Add performance monitoring and error tracking

## Monitoring & Maintenance

### Application Monitoring
- Implement application performance monitoring (APM)
- Add error tracking and reporting
- Monitor database performance and query optimization
- Track user activity and system usage
- Set up automated health checks

### Security Monitoring
- Monitor failed login attempts and suspicious activity
- Track API usage and rate limiting violations
- Monitor system configuration changes
- Add security event logging and alerting
- Implement regular security audits

### Maintenance Procedures
- Regular database backup and recovery testing
- Security patch management and updates
- Performance optimization and monitoring
- User feedback collection and feature enhancement
- Documentation updates and maintenance

## Success Criteria

### Functional Requirements
- All 14 core functional requirements implemented
- Role-based access control working correctly
- Email system functioning with all template types
- Content management with encryption working
- Dashboard widgets displaying real-time data

### Performance Requirements
- Page load times under 2 seconds
- API response times under 500ms
- Support for 100+ concurrent users
- 99.9% uptime availability
- Mobile-responsive design for landscape orientation

### Security Requirements
- No critical security vulnerabilities
- Successful penetration testing results
- Compliance with data protection standards
- Secure authentication and authorization
- Encrypted data transmission and storage

### User Experience Requirements
- Intuitive and consistent user interface
- Smooth animations and transitions
- Comprehensive error handling and feedback
- Accessible design following WCAG guidelines
- Cross-browser compatibility (Chrome, Firefox, Safari, Edge)