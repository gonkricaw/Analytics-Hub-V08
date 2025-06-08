'use client'

import { useRequireAdmin } from '@/hooks/useAuth'
import EmailTemplateManager from '@/components/admin/EmailTemplateManager'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { 
  Users, 
  Mail, 
  Settings, 
  Shield, 
  Database,
  Activity,
  FileText,
  BarChart3
} from 'lucide-react'

const AdminDashboard = () => {
  const { user, loading } = useRequireAdmin()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#FF7A00]"></div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0E0E44] via-[#1a1a5e] to-[#0E0E44] p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-white mb-2">Admin Dashboard</h1>
            <p className="text-white/70">
              Welcome back, {user.first_name}! Manage your Analytics Hub platform.
            </p>
          </div>
          <Badge variant="secondary" className="bg-[#FF7A00]/20 text-[#FF7A00] border-[#FF7A00]/30">
            {user.role.name}
          </Badge>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="bg-white/10 backdrop-blur-sm border-white/20">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-white/80">Total Users</CardTitle>
              <Users className="h-4 w-4 text-[#FF7A00]" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">--</div>
              <p className="text-xs text-white/60">Active platform users</p>
            </CardContent>
          </Card>

          <Card className="bg-white/10 backdrop-blur-sm border-white/20">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-white/80">Email Templates</CardTitle>
              <Mail className="h-4 w-4 text-[#FF7A00]" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">5</div>
              <p className="text-xs text-white/60">Active templates</p>
            </CardContent>
          </Card>

          <Card className="bg-white/10 backdrop-blur-sm border-white/20">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-white/80">System Health</CardTitle>
              <Activity className="h-4 w-4 text-[#FF7A00]" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-400">Good</div>
              <p className="text-xs text-white/60">All systems operational</p>
            </CardContent>
          </Card>

          <Card className="bg-white/10 backdrop-blur-sm border-white/20">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-white/80">Database</CardTitle>
              <Database className="h-4 w-4 text-[#FF7A00]" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">Online</div>
              <p className="text-xs text-white/60">Connection stable</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Card className="bg-white/10 backdrop-blur-sm border-white/20">
          <CardHeader>
            <CardTitle className="text-white">Administration Panel</CardTitle>
            <CardDescription className="text-white/70">
              Manage system settings, users, and configurations
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="email-templates" className="space-y-4">
              <TabsList className="bg-white/10 border-white/20">
                <TabsTrigger value="email-templates" className="data-[state=active]:bg-[#FF7A00] data-[state=active]:text-white">
                  <Mail className="mr-2 h-4 w-4" />
                  Email Templates
                </TabsTrigger>
                <TabsTrigger value="users" className="data-[state=active]:bg-[#FF7A00] data-[state=active]:text-white">
                  <Users className="mr-2 h-4 w-4" />
                  User Management
                </TabsTrigger>
                <TabsTrigger value="security" className="data-[state=active]:bg-[#FF7A00] data-[state=active]:text-white">
                  <Shield className="mr-2 h-4 w-4" />
                  Security
                </TabsTrigger>
                <TabsTrigger value="system" className="data-[state=active]:bg-[#FF7A00] data-[state=active]:text-white">
                  <Settings className="mr-2 h-4 w-4" />
                  System Settings
                </TabsTrigger>
              </TabsList>

              <TabsContent value="email-templates" className="space-y-4">
                <div className="bg-white rounded-lg p-6">
                  <EmailTemplateManager />
                </div>
              </TabsContent>

              <TabsContent value="users" className="space-y-4">
                <Card className="bg-white">
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Users className="mr-2 h-5 w-5" />
                      User Management
                    </CardTitle>
                    <CardDescription>
                      Manage user accounts, roles, and permissions
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center py-12 text-muted-foreground">
                      <Users className="mx-auto h-12 w-12 mb-4 opacity-50" />
                      <p>User management interface will be implemented in a future update.</p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="security" className="space-y-4">
                <Card className="bg-white">
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Shield className="mr-2 h-5 w-5" />
                      Security Settings
                    </CardTitle>
                    <CardDescription>
                      Configure security policies and access controls
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center py-12 text-muted-foreground">
                      <Shield className="mx-auto h-12 w-12 mb-4 opacity-50" />
                      <p>Security management interface will be implemented in a future update.</p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="system" className="space-y-4">
                <Card className="bg-white">
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Settings className="mr-2 h-5 w-5" />
                      System Configuration
                    </CardTitle>
                    <CardDescription>
                      Configure global system settings and preferences
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center py-12 text-muted-foreground">
                      <Settings className="mx-auto h-12 w-12 mb-4 opacity-50" />
                      <p>System settings interface will be implemented in a future update.</p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default AdminDashboard