import React, { useState, useEffect } from 'react'
import { GetServerSideProps } from 'next'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../../api/auth/[...nextauth]'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import {
  BellIcon,
  MailIcon,
  SmartphoneIcon,
  SettingsIcon,
  SaveIcon,
  RefreshCwIcon
} from 'lucide-react'
import { toast } from 'sonner'
import DashboardLayout from '@/components/layout/dashboard-layout'

interface NotificationSettingsPageProps {
  user: any
  settings: {
    emailNotifications: boolean
    pushNotifications: boolean
    inAppNotifications: boolean
    digestFrequency: 'immediate' | 'hourly' | 'daily' | 'weekly' | 'never'
    notificationTypes: {
      system: boolean
      security: boolean
      updates: boolean
      marketing: boolean
      reports: boolean
    }
    quietHours: {
      enabled: boolean
      startTime: string
      endTime: string
    }
  }
}

const NotificationSettingsPage: React.FC<NotificationSettingsPageProps> = ({ user, settings: initialSettings }) => {
  const [settings, setSettings] = useState(initialSettings)
  const [isLoading, setIsLoading] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)

  useEffect(() => {
    const hasChanges = JSON.stringify(settings) !== JSON.stringify(initialSettings)
    setHasChanges(hasChanges)
  }, [settings, initialSettings])

  const handleSave = async () => {
    setIsLoading(true)
    
    try {
      const response = await fetch('/api/user/notification-settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(settings)
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to save settings')
      }

      toast.success('Notification settings saved successfully')
      setHasChanges(false)
    } catch (error) {
      console.error('Error saving settings:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to save settings')
    } finally {
      setIsLoading(false)
    }
  }

  const handleReset = () => {
    setSettings(initialSettings)
    toast.info('Settings reset to last saved values')
  }

  const updateSetting = (path: string, value: any) => {
    setSettings(prev => {
      const newSettings = { ...prev }
      const keys = path.split('.')
      let current = newSettings as any
      
      for (let i = 0; i < keys.length - 1; i++) {
        if (!(keys[i] in current)) {
          current[keys[i]] = {}
        }
        current = current[keys[i]]
      }
      
      current[keys[keys.length - 1]] = value
      return newSettings
    })
  }

  return (
    <DashboardLayout user={user}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Notification Settings</h1>
            <p className="text-muted-foreground">
              Manage how and when you receive notifications
            </p>
          </div>
          <div className="flex items-center gap-2">
            {hasChanges && (
              <Badge variant="secondary">
                Unsaved changes
              </Badge>
            )}
          </div>
        </div>

        {/* General Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <SettingsIcon className="h-5 w-5" />
              General Settings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-base">In-App Notifications</Label>
                <p className="text-sm text-muted-foreground">
                  Show notifications within the application
                </p>
              </div>
              <Switch
                checked={settings.inAppNotifications}
                onCheckedChange={(checked) => updateSetting('inAppNotifications', checked)}
              />
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-base flex items-center gap-2">
                  <MailIcon className="h-4 w-4" />
                  Email Notifications
                </Label>
                <p className="text-sm text-muted-foreground">
                  Receive notifications via email
                </p>
              </div>
              <Switch
                checked={settings.emailNotifications}
                onCheckedChange={(checked) => updateSetting('emailNotifications', checked)}
              />
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-base flex items-center gap-2">
                  <SmartphoneIcon className="h-4 w-4" />
                  Push Notifications
                </Label>
                <p className="text-sm text-muted-foreground">
                  Receive push notifications on your device
                </p>
              </div>
              <Switch
                checked={settings.pushNotifications}
                onCheckedChange={(checked) => updateSetting('pushNotifications', checked)}
              />
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-base">Digest Frequency</Label>
                <p className="text-sm text-muted-foreground">
                  How often to receive notification summaries
                </p>
              </div>
              <Select
                value={settings.digestFrequency}
                onValueChange={(value: any) => updateSetting('digestFrequency', value)}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="immediate">Immediate</SelectItem>
                  <SelectItem value="hourly">Hourly</SelectItem>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="never">Never</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Notification Types */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BellIcon className="h-5 w-5" />
              Notification Types
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-base">System Notifications</Label>
                <p className="text-sm text-muted-foreground">
                  Important system updates and maintenance notices
                </p>
              </div>
              <Switch
                checked={settings.notificationTypes.system}
                onCheckedChange={(checked) => updateSetting('notificationTypes.system', checked)}
              />
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-base">Security Notifications</Label>
                <p className="text-sm text-muted-foreground">
                  Login attempts, password changes, and security alerts
                </p>
              </div>
              <Switch
                checked={settings.notificationTypes.security}
                onCheckedChange={(checked) => updateSetting('notificationTypes.security', checked)}
              />
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-base">Update Notifications</Label>
                <p className="text-sm text-muted-foreground">
                  New features, improvements, and application updates
                </p>
              </div>
              <Switch
                checked={settings.notificationTypes.updates}
                onCheckedChange={(checked) => updateSetting('notificationTypes.updates', checked)}
              />
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-base">Marketing Notifications</Label>
                <p className="text-sm text-muted-foreground">
                  Product announcements, tips, and promotional content
                </p>
              </div>
              <Switch
                checked={settings.notificationTypes.marketing}
                onCheckedChange={(checked) => updateSetting('notificationTypes.marketing', checked)}
              />
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-base">Report Notifications</Label>
                <p className="text-sm text-muted-foreground">
                  Scheduled reports, data insights, and analytics updates
                </p>
              </div>
              <Switch
                checked={settings.notificationTypes.reports}
                onCheckedChange={(checked) => updateSetting('notificationTypes.reports', checked)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Quiet Hours */}
        <Card>
          <CardHeader>
            <CardTitle>Quiet Hours</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-base">Enable Quiet Hours</Label>
                <p className="text-sm text-muted-foreground">
                  Pause non-urgent notifications during specified hours
                </p>
              </div>
              <Switch
                checked={settings.quietHours.enabled}
                onCheckedChange={(checked) => updateSetting('quietHours.enabled', checked)}
              />
            </div>

            {settings.quietHours.enabled && (
              <>
                <Separator />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="startTime">Start Time</Label>
                    <input
                      id="startTime"
                      type="time"
                      value={settings.quietHours.startTime}
                      onChange={(e) => updateSetting('quietHours.startTime', e.target.value)}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="endTime">End Time</Label>
                    <input
                      id="endTime"
                      type="time"
                      value={settings.quietHours.endTime}
                      onChange={(e) => updateSetting('quietHours.endTime', e.target.value)}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    />
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-4">
          <Button
            variant="outline"
            onClick={handleReset}
            disabled={!hasChanges || isLoading}
          >
            <RefreshCwIcon className="h-4 w-4 mr-2" />
            Reset
          </Button>
          <Button
            onClick={handleSave}
            disabled={!hasChanges || isLoading}
          >
            <SaveIcon className="h-4 w-4 mr-2" />
            {isLoading ? 'Saving...' : 'Save Settings'}
          </Button>
        </div>
      </div>
    </DashboardLayout>
  )
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const session = await getServerSession(context.req, context.res, authOptions)

  if (!session?.user) {
    return {
      redirect: {
        destination: '/auth/signin',
        permanent: false,
      },
    }
  }

  // Fetch user's notification settings
  const { prisma } = await import('@/lib/prisma')
  
  let userSettings = await prisma.idbi_user_settings.findUnique({
    where: {
      userId: session.user.id
    }
  })

  // Default settings if none exist
  const defaultSettings = {
    emailNotifications: true,
    pushNotifications: true,
    inAppNotifications: true,
    digestFrequency: 'immediate' as const,
    notificationTypes: {
      system: true,
      security: true,
      updates: true,
      marketing: false,
      reports: true
    },
    quietHours: {
      enabled: false,
      startTime: '22:00',
      endTime: '08:00'
    }
  }

  let settings = defaultSettings

  if (userSettings?.notificationSettings) {
    try {
      const parsed = JSON.parse(userSettings.notificationSettings as string)
      settings = { ...defaultSettings, ...parsed }
    } catch (error) {
      console.error('Error parsing notification settings:', error)
    }
  }

  return {
    props: {
      user: session.user,
      settings
    },
  }
}

export default NotificationSettingsPage