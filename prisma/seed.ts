import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting database seeding...')

  // Create default roles
  console.log('📝 Creating roles...')
  const superAdminRole = await prisma.idbi_roles.upsert({
    where: { name: 'Super Admin' },
    update: {},
    create: {
      name: 'Super Admin',
      description: 'Full system access with all permissions',
      is_active: true,
    },
  })

  const adminRole = await prisma.idbi_roles.upsert({
    where: { name: 'Admin' },
    update: {},
    create: {
      name: 'Admin',
      description: 'Administrative access with content management permissions',
      is_active: true,
    },
  })

  const editorRole = await prisma.idbi_roles.upsert({
    where: { name: 'Editor' },
    update: {},
    create: {
      name: 'Editor',
      description: 'Content creation and editing permissions',
      is_active: true,
    },
  })

  const viewerRole = await prisma.idbi_roles.upsert({
    where: { name: 'Viewer' },
    update: {},
    create: {
      name: 'Viewer',
      description: 'Read-only access to dashboards and content',
      is_active: true,
    },
  })

  // Create permissions
  console.log('🔐 Creating permissions...')
  const permissions = [
    // User management
    { name: 'users.create', description: 'Create new users', resource: 'users', action: 'create' },
    { name: 'users.read', description: 'View user information', resource: 'users', action: 'read' },
    { name: 'users.update', description: 'Update user information', resource: 'users', action: 'update' },
    { name: 'users.delete', description: 'Delete users', resource: 'users', action: 'delete' },
    { name: 'users.invite', description: 'Invite new users', resource: 'users', action: 'invite' },
    
    // Role management
    { name: 'roles.create', description: 'Create new roles', resource: 'roles', action: 'create' },
    { name: 'roles.read', description: 'View role information', resource: 'roles', action: 'read' },
    { name: 'roles.update', description: 'Update role information', resource: 'roles', action: 'update' },
    { name: 'roles.delete', description: 'Delete roles', resource: 'roles', action: 'delete' },
    
    // Content management
    { name: 'content.create', description: 'Create new content', resource: 'content', action: 'create' },
    { name: 'content.read', description: 'View content', resource: 'content', action: 'read' },
    { name: 'content.update', description: 'Update content', resource: 'content', action: 'update' },
    { name: 'content.delete', description: 'Delete content', resource: 'content', action: 'delete' },
    { name: 'content.publish', description: 'Publish content', resource: 'content', action: 'publish' },
    
    // Dashboard management
    { name: 'dashboard.create', description: 'Create dashboards', resource: 'dashboard', action: 'create' },
    { name: 'dashboard.read', description: 'View dashboards', resource: 'dashboard', action: 'read' },
    { name: 'dashboard.update', description: 'Update dashboards', resource: 'dashboard', action: 'update' },
    { name: 'dashboard.delete', description: 'Delete dashboards', resource: 'dashboard', action: 'delete' },
    
    // System settings
    { name: 'settings.read', description: 'View system settings', resource: 'settings', action: 'read' },
    { name: 'settings.update', description: 'Update system settings', resource: 'settings', action: 'update' },
    
    // Audit logs
    { name: 'audit.read', description: 'View audit logs', resource: 'audit', action: 'read' },
    
    // File management
    { name: 'files.upload', description: 'Upload files', resource: 'files', action: 'upload' },
    { name: 'files.read', description: 'View files', resource: 'files', action: 'read' },
    { name: 'files.delete', description: 'Delete files', resource: 'files', action: 'delete' },
  ]

  for (const permission of permissions) {
    await prisma.idbi_permissions.upsert({
      where: { name: permission.name },
      update: {},
      create: permission,
    })
  }

  // Assign permissions to roles
  console.log('🔗 Assigning permissions to roles...')
  
  // Super Admin gets all permissions
  const allPermissions = await prisma.idbi_permissions.findMany()
  for (const permission of allPermissions) {
    await prisma.idbi_role_permissions.upsert({
      where: {
        role_id_permission_id: {
          role_id: superAdminRole.id,
          permission_id: permission.id,
        },
      },
      update: {},
      create: {
        role_id: superAdminRole.id,
        permission_id: permission.id,
      },
    })
  }

  // Admin permissions (exclude user deletion and system settings)
  const adminPermissions = allPermissions.filter(p => 
    !['users.delete', 'roles.delete', 'settings.update'].includes(p.name)
  )
  for (const permission of adminPermissions) {
    await prisma.idbi_role_permissions.upsert({
      where: {
        role_id_permission_id: {
          role_id: adminRole.id,
          permission_id: permission.id,
        },
      },
      update: {},
      create: {
        role_id: adminRole.id,
        permission_id: permission.id,
      },
    })
  }

  // Editor permissions (content and dashboard management)
  const editorPermissions = allPermissions.filter(p => 
    p.resource === 'content' || p.resource === 'dashboard' || p.resource === 'files'
  )
  for (const permission of editorPermissions) {
    await prisma.idbi_role_permissions.upsert({
      where: {
        role_id_permission_id: {
          role_id: editorRole.id,
          permission_id: permission.id,
        },
      },
      update: {},
      create: {
        role_id: editorRole.id,
        permission_id: permission.id,
      },
    })
  }

  // Viewer permissions (read-only)
  const viewerPermissions = allPermissions.filter(p => 
    p.action === 'read' && ['content', 'dashboard'].includes(p.resource)
  )
  for (const permission of viewerPermissions) {
    await prisma.idbi_role_permissions.upsert({
      where: {
        role_id_permission_id: {
          role_id: viewerRole.id,
          permission_id: permission.id,
        },
      },
      update: {},
      create: {
        role_id: viewerRole.id,
        permission_id: permission.id,
      },
    })
  }

  // Create default categories
  console.log('📂 Creating default categories...')
  const categories = [
    { name: 'Analytics', description: 'Business analytics and metrics', color: '#FF7A00', icon: 'mdi:chart-line' },
    { name: 'Reports', description: 'Business reports and summaries', color: '#4F46E5', icon: 'mdi:file-chart' },
    { name: 'Dashboards', description: 'Interactive dashboards', color: '#059669', icon: 'mdi:view-dashboard' },
    { name: 'KPIs', description: 'Key Performance Indicators', color: '#DC2626', icon: 'mdi:speedometer' },
    { name: 'Finance', description: 'Financial data and reports', color: '#7C2D12', icon: 'mdi:currency-usd' },
    { name: 'Marketing', description: 'Marketing analytics and campaigns', color: '#BE185D', icon: 'mdi:bullhorn' },
    { name: 'Sales', description: 'Sales performance and metrics', color: '#0891B2', icon: 'mdi:trending-up' },
    { name: 'Operations', description: 'Operational metrics and data', color: '#65A30D', icon: 'mdi:cog' },
  ]

  for (const category of categories) {
    await prisma.idbi_categories.upsert({
      where: { name: category.name },
      update: {},
      create: category,
    })
  }

  // Create default admin user
  console.log('👤 Creating default admin user...')
  const hashedPassword = await bcrypt.hash('Admin@123!', 12)
  
  const adminUser = await prisma.idbi_users.upsert({
    where: { email: 'admin@analyticshub.com' },
    update: {},
    create: {
      email: 'admin@analyticshub.com',
      username: 'admin',
      password_hash: hashedPassword,
      first_name: 'System',
      last_name: 'Administrator',
      role_id: superAdminRole.id,
      is_active: true,
      is_email_verified: true,
      must_change_password: false,
      terms_accepted: true,
      terms_accepted_at: new Date(),
    },
  })

  // Create system settings
  console.log('⚙️ Creating system settings...')
  const settings = [
    { key: 'app.name', value: 'Analytics Hub', description: 'Application name', is_public: true },
    { key: 'app.version', value: '1.0.0', description: 'Application version', is_public: true },
    { key: 'auth.max_login_attempts', value: '30', description: 'Maximum login attempts before IP block', is_public: false },
    { key: 'auth.session_timeout', value: '3600', description: 'Session timeout in seconds', is_public: false },
    { key: 'auth.password_min_length', value: '8', description: 'Minimum password length', is_public: true },
    { key: 'auth.require_password_change', value: 'true', description: 'Require password change on first login', is_public: false },
    { key: 'ui.theme', value: 'dark', description: 'Default UI theme', is_public: true },
    { key: 'ui.primary_color', value: '#FF7A00', description: 'Primary accent color', is_public: true },
    { key: 'ui.background_color', value: '#0E0E44', description: 'Background color', is_public: true },
    { key: 'email.from_name', value: 'Analytics Hub', description: 'Email sender name', is_public: false },
    { key: 'upload.max_file_size', value: '2097152', description: 'Maximum file upload size in bytes', is_public: true },
    { key: 'upload.allowed_types', value: 'image/jpeg,image/png,image/gif,application/pdf', description: 'Allowed file types for upload', is_public: true },
  ]

  for (const setting of settings) {
    await prisma.idbi_settings.upsert({
      where: { key: setting.key },
      update: {},
      create: setting,
    })
  }

  // Create sample dashboard
  console.log('📊 Creating sample dashboard...')
  let sampleDashboard = await prisma.idbi_dashboards.findFirst({
    where: { name: 'Default Dashboard' }
  })
  
  if (!sampleDashboard) {
    sampleDashboard = await prisma.idbi_dashboards.create({
      data: {
        name: 'Default Dashboard',
        description: 'Default analytics dashboard with key metrics',
        layout_data: {
          columns: 12,
          rows: 8,
          gap: 16,
        },
        is_default: true,
        is_active: true,
        created_by: adminUser.id,
      },
    })
  }

  // Create sample content
  console.log('📄 Creating sample content...')
  const analyticsCategory = await prisma.idbi_categories.findFirst({
    where: { name: 'Analytics' }
  })

  const sampleContent = await prisma.idbi_content.create({
    data: {
      title: 'Welcome to Analytics Hub',
      description: 'Getting started with your analytics dashboard',
      content_type: 'widget',
      content_data: {
        type: 'welcome',
        message: 'Welcome to Analytics Hub! This is your central hub for business intelligence and data analytics.',
        actions: [
          { label: 'View Documentation', url: '/docs' },
          { label: 'Create Content', url: '/content/create' }
        ]
      },
      is_active: true,
      is_public: false,
      created_by: adminUser.id,
    },
  })

  // Link content to category
  if (analyticsCategory) {
    await prisma.idbi_content_categories.create({
      data: {
        content_id: sampleContent.id,
        category_id: analyticsCategory.id,
      },
    })
  }

  // Add content to dashboard
  await prisma.idbi_dashboard_items.create({
    data: {
      dashboard_id: sampleDashboard.id,
      content_id: sampleContent.id,
      position_x: 0,
      position_y: 0,
      width: 6,
      height: 3,
      order_index: 0,
    },
  })

  console.log('✅ Database seeding completed successfully!')
  console.log('📧 Default admin user: admin@analyticshub.com')
  console.log('🔑 Default admin password: Admin@123!')
  console.log('⚠️  Please change the default password after first login')
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })