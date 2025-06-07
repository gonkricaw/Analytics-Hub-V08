# Project Rules for Analytics Hub Development

## Overview

This document defines the essential rules and guidelines that AI agents must follow when working on the Analytics Hub web application project. These rules ensure consistent development practices, proper understanding of project requirements, and adherence to the established architecture and design patterns.

## Mandatory Project Understanding

### Required Reference Documents

Before executing ANY task, AI agents MUST thoroughly read and understand these core documents:

1. **Requirement.md** - Complete technical requirements specification
   - 14 functional system areas with detailed specifications
   - Frontend design requirements (dark theme #0E0E44, accent #FF7A00)
   - Database schema with mandatory `idbi_` table prefixes
   - API design patterns and security requirements
   - Performance and scalability requirements

2. **Logic.md** - System logic and business flow documentation
   - Authentication flows (invitation, login, password management, T&C)
   - Role-based access control implementation logic
   - Content management with URL encryption logic
   - Security implementation patterns
   - Database transaction and data integrity logic

3. **Plan.md** - Development architecture and implementation plan
   - Next.js 14 App Router project structure
   - Technology stack specifications and versions
   - Database schema design with relationships
   - Development phases and milestone requirements
   - Security and performance optimization strategies

4. **Task.md** - Sequential implementation task list
   - 200+ specific tasks across 15 development phases
   - Mandatory sequential execution order
   - Frontend-backend-database alignment verification
   - Testing and validation procedures for each task

### Critical Implementation Rules

#### Technology Stack Compliance
- **Framework**: Next.js 14 with App Router (MANDATORY)
- **Database**: PostgreSQL with Prisma ORM
- **Language**: TypeScript for all code
- **Styling**: Tailwind CSS with specified color scheme
- **Authentication**: NextAuth.js with custom providers
- **Security**: bcryptjs, JWT tokens, AES encryption

#### Database Requirements
- ALL table names MUST use `idbi_` prefix
- Follow exact schema design from Plan.md
- Implement all foreign key relationships
- Use proper indexing for performance
- Implement audit logging for security

#### Frontend Requirements
- Dark theme with colors: Background #0E0E44, Accent #FF7A00
- Horizontal sticky navbar (NOT vertical)
- Responsive design for desktop and tablet landscape
- Smooth animations and transitions
- Material Design Icons from Iconify
- Canvas API animations for login pages

#### Security Implementation
- Role-based access control with granular permissions
- IP blacklisting after 30 failed login attempts
- AES-256 encryption for embed URLs
- Rate limiting on all API endpoints
- Input sanitization and CSRF protection
- Session management with JWT tokens

## Development Workflow Rules

### Sequential Task Execution
1. Follow Task.md order EXACTLY - no skipping or reordering
2. Complete each task fully before proceeding to next
3. Verify implementation works correctly
4. Test UI changes are visible in browser
5. Ensure backend-frontend-database alignment
6. Never skip verification steps

### Code Quality Standards
- Include comprehensive comments explaining business logic
- Use TypeScript with proper type definitions
- Implement proper error handling with user-friendly messages
- Follow SOLID principles and separation of concerns
- Use consistent naming conventions
- Implement proper input validation

### Testing and Verification
- Test all functionality locally before proceeding
- Verify UI changes are visible and responsive
- Check database operations work correctly
- Validate API endpoints function properly
- Test security measures are implemented
- Ensure cross-browser compatibility

## Architecture Compliance

### File Structure
Follow the EXACT folder structure specified in Plan.md:
```
src/
├── app/                   # Next.js App Router
├── components/            # Reusable components
├── lib/                   # Utility libraries
├── hooks/                 # Custom React hooks
├── store/                 # State management
├── types/                 # TypeScript definitions
└── middleware.ts          # Auth middleware
```

### Component Organization
- UI components in `components/ui/`
- Layout components in `components/layout/`
- Form components in `components/forms/`
- Authentication components in `components/auth/`
- Dashboard widgets in `components/dashboard/`

### API Structure
- RESTful endpoints following REST conventions
- Proper HTTP methods and status codes
- Consistent error response formats
- Input validation with Zod schemas
- Authentication middleware on protected routes

## Security and Performance Rules

### Security Implementation
- Encrypt all sensitive data at rest
- Use HTTPS for all communications
- Implement proper session management
- Validate and sanitize all user inputs
- Follow authentication best practices
- Implement audit logging for security events

### Performance Optimization
- Implement code splitting and lazy loading
- Use React Query for data fetching and caching
- Optimize images with Next.js Image component
- Implement database query optimization
- Use proper caching strategies
- Monitor and optimize bundle sizes

## User Experience Requirements

### Design Consistency
- Maintain dark theme across all pages
- Use consistent spacing and typography
- Implement smooth hover effects and transitions
- Ensure responsive design for landscape orientation
- Provide clear loading states and error messages

### Navigation and Layout
- Horizontal sticky navbar on all dashboard pages
- Breadcrumb navigation for deep menu structures
- Consistent footer across all pages
- Proper error boundaries and fallback UI
- Accessible design following WCAG guidelines

## Error Handling and Logging

### Error Management
- Implement comprehensive error boundaries
- Provide user-friendly error messages
- Log all errors with proper context
- Handle edge cases and validation errors
- Implement proper fallback UI states

### Logging Requirements
- Log all user activities for audit trails
- Track system performance metrics
- Monitor security events and violations
- Implement structured logging format
- Store logs with proper retention policies

## Documentation Standards

### Code Documentation
- Include JSDoc comments for all functions
- Document complex business logic thoroughly
- Provide usage examples for reusable components
- Document API endpoints with proper schemas
- Explain any deviations from the original plan

### Implementation Notes
- Document configuration requirements
- Provide troubleshooting information
- Explain complex implementation decisions
- Include setup and deployment instructions
- Maintain up-to-date API documentation

## Quality Assurance

### Pre-deployment Checklist
- All functionality works as specified in requirements
- UI is responsive and follows design specifications
- Security measures are properly implemented
- Performance meets specified requirements
- Code is maintainable and well-documented
- All tests pass and coverage is adequate

### Success Criteria
- Complete implementation of all 14 functional areas
- Role-based access control working correctly
- Email system functioning with all templates
- Content management with encryption operational
- Dashboard widgets displaying real-time data
- Security features preventing unauthorized access

## Communication Guidelines

### Progress Reporting
- Report completion of each major task
- Highlight any issues or blockers encountered
- Provide clear status updates on implementation
- Document any changes to original requirements
- Communicate testing results and findings

### Problem Resolution
- Escalate technical issues promptly
- Provide detailed error information
- Suggest alternative solutions when needed
- Document workarounds and temporary fixes
- Follow up on resolution implementation

## Final Notes

### Compliance Verification
AI agents MUST verify compliance with these rules before marking any task as complete. Non-compliance with these rules may result in implementation rejection and requirement for rework.

### Continuous Improvement
These rules may be updated based on project evolution and lessons learned. AI agents should check for rule updates before starting new development phases.

### Support and Resources
Refer to the reference documents (Requirement.md, Logic.md, Plan.md, Task.md) for detailed specifications and implementation guidance. These documents provide the authoritative source for all project requirements and technical specifications.