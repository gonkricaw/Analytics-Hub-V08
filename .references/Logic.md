# Analytics Hub System Logic Documentation

## Overview

This document outlines the comprehensive system logic and flow for the Analytics Hub web application built with Next.js 14 and PostgreSQL. The system implements a role-based access control architecture with invitation-only user management, content management with encryption, and advanced security features.

## Core System Architecture

### Authentication Flow Logic

#### 1. Initial User Creation and Invitation Logic
```
System Administrator/Administrator Action:
1. Creates new user record in idbi_users table
2. Assigns role via idbi_user_has_roles table
3. Generates 8-character temporary password (uppercase, lowercase, numbers)
4. Stores hashed temporary password in idbi_users.password
5. Sets user status to 'invited' in idbi_users.status
6. Triggers email template system:
   - Retrieves invitation template from idbi_email_templates
   - Populates dynamic values (username, email, temporary password)
   - Sends invitation email via nodemailer
7. Logs action in idbi_user_logs table
```

#### 2. First Login Flow Logic
```
User First Login Process:
1. User submits login credentials (email + temporary password)
2. System validates credentials against idbi_users table
3. If validation fails:
   - Increment failed_attempts in idbi_user_logs
   - If failed_attempts >= 30: Add IP to idbi_ip_blacklist
   - Return error message
4. If validation succeeds:
   - Check if password is temporary (is_temporary_password = true)
   - Create JWT session token
   - Redirect to /update-password page
   - Log successful login in idbi_user_login_activities
```

#### 3. Password Update Logic
```
Password Update Process:
1. User submits new password on /update-password page
2. Validate password strength (minimum requirements)
3. Hash new password using bcryptjs
4. Update idbi_users table:
   - Set new hashed password
   - Set is_temporary_password = false
   - Update updated_at timestamp
5. Redirect to dashboard home page
6. Trigger Terms & Conditions modal logic
```

#### 4. Terms & Conditions Enforcement Logic
```
T&C Modal Logic:
1. On dashboard access, check idbi_user_tcs table
2. Get latest T&C version from idbi_system_configs
3. Compare user's accepted version with current version
4. If versions don't match or no acceptance record:
   - Display modal with current T&C content
   - Modal cannot be closed without action
   - User must click Accept or Decline
5. If Accept:
   - Insert/Update record in idbi_user_tcs
   - Allow dashboard access
6. If Decline:
   - Force logout and redirect to login page
   - Log action in idbi_user_logs
```

#### 5. Subsequent Login Flow Logic
```
Regular Login Process:
1. User submits login credentials
2. Validate against idbi_users table
3. Check user status (active/suspended)
4. If suspended: Return error and deny access
5. If active and credentials valid:
   - Create JWT session
   - Update last_login in idbi_users
   - Log activity in idbi_user_login_activities
   - Update online status in idbi_user_online_status
   - Redirect to dashboard
   - Trigger T&C check logic
```

#### 6. Forgot Password Flow Logic
```
Forgot Password Process:
1. User clicks "Forgot Password" on login page
2. User enters email on forgot password form
3. System validates email exists in idbi_users
4. Check rate limiting (30-second cooldown per email)
5. If valid and not rate-limited:
   - Generate UUID token using crypto.randomUUID()
   - Store token in idbi_password_resets with 120-minute expiration
   - Send reset email with encrypted token link
   - Start 30-second cooldown timer
6. User clicks reset link from email
7. System validates token:
   - Check if token exists and not expired
   - Check if token not already used
8. If valid: Display password reset form
9. On password update:
   - Hash new password
   - Update idbi_users.password
   - Delete token from idbi_password_resets
   - Redirect to login page
```

### Role-Based Access Control Logic

#### 1. Permission System Logic
```
Permission Checking Process:
1. User attempts to access resource/action
2. Middleware extracts user ID from JWT token
3. Query user roles from idbi_user_has_roles
4. Query role permissions from idbi_role_has_permissions
5. Check if required permission exists for user's roles
6. If permission exists: Allow access
7. If permission missing: Return 403 Forbidden
8. Log access attempt in idbi_user_logs
```

#### 2. Menu Visibility Logic
```
Menu Rendering Process:
1. User accesses dashboard
2. Get user's roles from idbi_user_has_roles
3. Query accessible menus from idbi_menu_role_access
4. Build hierarchical menu structure (max 3 levels)
5. Sort menus by index_sequence
6. Render only accessible menus with icons
7. Hide menus without proper role access
```

#### 3. Content Access Logic
```
Content Access Validation:
1. User clicks on menu item
2. System checks if menu has associated content
3. Query content from idbi_contents via idbi_content_menu_map
4. Validate user has role access to parent menu
5. Check content status (published/draft)
6. If all checks pass: Render content
7. If access denied: Return 403 or redirect
8. Log content access in idbi_content_visit_logs
```

### Content Management Logic

#### 1. Content Creation Logic
```
Content Creation Process:
1. Admin selects content type (Custom/Embed)
2. For Custom Content:
   - Use Rich Text Editor or HTML Code Editor
   - Validate HTML for security (sanitize dangerous tags)
   - Store content in idbi_contents.content_data
3. For Embed Content:
   - Validate URL format (PowerBI/Tableau/Data Studio)
   - Encrypt URL using AES encryption
   - Store original URL in idbi_contents.original_url
   - Store encrypted URL in idbi_contents.encrypted_url
   - Generate UUID for content access
4. Associate content with menu via idbi_content_menu_map
5. Set content status (draft/published)
6. Log creation in idbi_user_logs
```

#### 2. Embed Content Rendering Logic
```
Embed Content Display Process:
1. User accesses content page
2. Validate user permissions for content
3. Retrieve encrypted URL from idbi_contents
4. Decrypt URL server-side using stored encryption key
5. Generate secure iframe with decrypted URL
6. Implement iframe security headers:
   - X-Frame-Options: SAMEORIGIN
   - Content-Security-Policy for iframe sources
7. Mask URL in browser developer tools
8. Log content view in idbi_content_visit_logs
```

#### 3. Content Security Logic
```
Content Security Implementation:
1. URL Encryption:
   - Use AES-256-GCM encryption for embed URLs
   - Generate unique encryption key per content
   - Store encryption metadata separately
2. Access Control:
   - Validate user session before content access
   - Check role-based permissions
   - Implement content-level access logging
3. Iframe Protection:
   - Implement CSP headers
   - Use sandbox attributes for iframe
   - Prevent URL extraction via JavaScript
```

### User Management Logic

#### 1. User Suspension Logic
```
User Suspension Process:
1. Admin initiates user suspension
2. Update idbi_users.status to 'suspended'
3. Invalidate all active sessions for user
4. Send suspension notification email
5. Log suspension action in idbi_user_logs
6. User login attempts return "Account Suspended" error
7. Only System Admin/Admin can reactivate
```

#### 2. Profile Management Logic
```
Profile Update Process:
1. User accesses profile page
2. For photo upload:
   - Validate file size (max 2MB)
   - Check dimensions (400x400 pixels)
   - If oversized: Trigger crop interface
   - Process and store cropped image
   - Update idbi_users.profile_photo_path
3. For password change:
   - Validate current password
   - Check new password strength
   - Hash and update password
   - Log password change action
4. Send profile update notification
```

### Notification System Logic

#### 1. Notification Creation Logic
```
Notification Generation Process:
1. System Event Triggers:
   - User login/logout
   - Profile updates
   - Password changes
   - Content additions
   - System announcements
2. Create notification record in idbi_notifications
3. Determine target users based on:
   - Event type
   - User roles
   - System configuration
4. Insert notification-user mappings
5. Update notification counters
6. Trigger real-time notification delivery
```

#### 2. Notification Delivery Logic
```
Notification Display Process:
1. User accesses dashboard
2. Query unread notifications from idbi_notifications
3. Display notification count in bell icon
4. On notification click:
   - Mark as read in idbi_notification_user_read
   - Display notification details
   - Update notification counter
5. Implement real-time updates using WebSocket/SSE
```

### Email System Logic

#### 1. Email Template Processing Logic
```
Email Template System:
1. Retrieve template from idbi_email_templates by type
2. Parse template for dynamic placeholders
3. Replace placeholders with actual data:
   - {{username}} → user.full_name
   - {{email}} → user.email
   - {{reset_link}} → generated reset URL
   - {{temp_password}} → generated password
4. Compile final email content
5. Send via configured SMTP provider
6. Log email delivery status
```

#### 2. Email Queue Logic
```
Email Queue Processing:
1. Add email to queue with priority
2. Process queue in background job
3. Implement retry logic for failed sends
4. Track delivery status and bounces
5. Update email logs in database
6. Handle rate limiting for bulk emails
```

### Security Implementation Logic

#### 1. IP Blacklisting Logic
```
IP Blacklist Management:
1. Monitor failed login attempts per IP
2. If attempts >= configured threshold (default 30):
   - Add IP to idbi_ip_blacklist
   - Set block_reason and timestamp
   - Block all requests from IP
3. Admin can manually add/remove IPs
4. Implement IP whitelist for admin access
5. Log all IP blocking actions
```

#### 2. Session Management Logic
```
Session Security Implementation:
1. Generate JWT tokens with expiration
2. Store session metadata in database
3. Implement token refresh mechanism
4. Validate session on each request
5. Handle concurrent session limits
6. Implement session invalidation on logout
7. Clean up expired sessions periodically
```

#### 3. Rate Limiting Logic
```
Rate Limiting Implementation:
1. Track requests per IP/user/endpoint
2. Implement sliding window rate limiting
3. Different limits for different endpoints:
   - Login: 5 attempts per minute
   - Password reset: 1 request per 30 seconds
   - API calls: 100 requests per minute
4. Return 429 status when limit exceeded
5. Log rate limit violations
```

### Dashboard Analytics Logic

#### 1. Widget Data Processing Logic
```
Dashboard Widget System:
1. Digital Clock Widget:
   - Sync with user's local timezone
   - Update every second via JavaScript
   - Display formatted date/time

2. Login Activity Chart:
   - Query idbi_user_login_activities for last 15 days
   - Aggregate login counts by date
   - Generate chart data for visualization
   - Cache results for performance

3. Top Users Widgets:
   - Query login frequency from activity logs
   - Calculate online status from last activity
   - Sort and limit to top 5 users
   - Update data every 5 minutes

4. Content Visit Tracking:
   - Query idbi_content_visit_logs
   - Aggregate visit counts per content
   - Filter by user's accessible content
   - Generate top 5 most visited list
```

#### 2. Real-time Data Updates Logic
```
Real-time Dashboard Updates:
1. Implement WebSocket connection for live data
2. Push updates for:
   - New notifications
   - User online status changes
   - System announcements
3. Update widget data without page refresh
4. Handle connection failures gracefully
5. Implement data synchronization on reconnect
```

### System Configuration Logic

#### 1. Configuration Management Logic
```
System Configuration Process:
1. Store all configurations in idbi_system_configs
2. Implement configuration categories:
   - UI Settings (logos, colors, themes)
   - Security Settings (login attempts, timeouts)
   - Email Settings (SMTP configuration)
   - Feature Toggles (enable/disable features)
3. Cache configurations for performance
4. Implement configuration validation
5. Log all configuration changes
6. Support configuration rollback
```

#### 2. System Monitoring Logic
```
System Function Monitoring:
1. Health Check Endpoints:
   - Database connectivity
   - Email service status
   - External API availability
   - File system access
2. Performance Monitoring:
   - Response time tracking
   - Memory usage monitoring
   - Database query performance
   - Error rate tracking
3. Alert System:
   - Threshold-based alerting
   - Email notifications for critical issues
   - Dashboard status indicators
4. Logging System:
   - Structured logging for all operations
   - Log rotation and archival
   - Error tracking and reporting
```

### Database Transaction Logic

#### 1. Transaction Management
```
Database Transaction Handling:
1. Use database transactions for multi-table operations
2. Implement proper rollback on errors
3. Handle concurrent access with proper locking
4. Optimize queries with appropriate indexing
5. Implement connection pooling for performance
6. Monitor and log slow queries
```

#### 2. Data Integrity Logic
```
Data Integrity Implementation:
1. Foreign key constraints for referential integrity
2. Unique constraints for business rules
3. Check constraints for data validation
4. Trigger-based audit logging
5. Soft delete implementation for critical data
6. Data backup and recovery procedures
```

### API Logic and Middleware

#### 1. API Request Processing Logic
```
API Request Flow:
1. Request hits Next.js API route
2. Middleware chain execution:
   - CORS handling
   - Rate limiting check
   - Authentication validation
   - Permission verification
   - Input validation
3. Business logic execution
4. Response formatting
5. Error handling and logging
6. Response delivery
```

#### 2. Error Handling Logic
```
Error Management System:
1. Centralized error handling middleware
2. Error classification:
   - Validation errors (400)
   - Authentication errors (401)
   - Authorization errors (403)
   - Not found errors (404)
   - Server errors (500)
3. Error logging with context
4. User-friendly error messages
5. Error reporting to monitoring systems
```

### Performance Optimization Logic

#### 1. Caching Strategy Logic
```
Caching Implementation:
1. Browser Caching:
   - Static assets with long-term caching
   - API responses with appropriate cache headers
2. Server-side Caching:
   - Database query result caching
   - Session data caching
   - Configuration data caching
3. Cache Invalidation:
   - Time-based expiration
   - Event-based invalidation
   - Manual cache clearing
```

#### 2. Database Optimization Logic
```
Database Performance:
1. Query Optimization:
   - Proper indexing strategy
   - Query plan analysis
   - N+1 query prevention
2. Connection Management:
   - Connection pooling
   - Connection timeout handling
   - Load balancing for read replicas
3. Data Archival:
   - Historical data archival
   - Log rotation policies
   - Cleanup procedures
```

## System Flow Summary

The Analytics Hub system operates through interconnected flows that ensure security, performance, and user experience:

1. **Authentication Flow**: Secure user onboarding with temporary passwords, forced password updates, and T&C acceptance
2. **Authorization Flow**: Role-based access control with granular permissions and menu visibility
3. **Content Flow**: Secure content management with encryption for embed URLs and access logging
4. **Communication Flow**: Automated email notifications and real-time system notifications
5. **Security Flow**: Multi-layered security with IP blacklisting, rate limiting, and session management
6. **Analytics Flow**: Real-time dashboard with user activity tracking and system monitoring
7. **Configuration Flow**: Centralized system configuration with audit trails and rollback capabilities
