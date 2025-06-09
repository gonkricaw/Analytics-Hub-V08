'use client'

import React, { useState, useEffect } from 'react'
import { Icon } from '@iconify/react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { toast } from 'sonner'
import { useSession } from 'next-auth/react'
import Image from 'next/image'

interface SystemConfig {
  id: string
  logo_url?: string
  site_title: string
  marquee_text?: string
  marquee_enabled: boolean
  banner_images: string[]
  banner_enabled: boolean
  banner_autoplay: boolean
  banner_interval: number
  footer_content?: string
  footer_enabled: boolean
  theme_primary_color: string
  theme_secondary_color: string
  failed_login_threshold: number
  ip_blacklist_duration: number
  session_timeout: number
  maintenance_mode: boolean
  maintenance_message?: string
  updated_at: string
  updated_by: string
}

interface SecuritySettings {
  failed_login_threshold: number
  ip_blacklist_duration: number
  session_timeout: number
  password_min_length: number
  password_require_uppercase: boolean
  password_require_lowercase: boolean
  password_require_numbers: boolean
  password_require_symbols: boolean
  two_factor_enabled: boolean
}

export default function SystemConfigurationPage() {
  const { data: session } = useSession()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [config, setConfig] = useState<SystemConfig | null>(null)
  const [securitySettings, setSecuritySettings] = useState<SecuritySettings | null>(null)
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [bannerFiles, setBannerFiles] = useState<File[]>([])
  const [activeTab, setActiveTab] = useState('general')

  useEffect(() => {
    fetchConfiguration()
  }, [])

  const fetchConfiguration = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/system/configuration')
      if (response.ok) {
        const data = await response.json()
        setConfig(data.config)
        setSecuritySettings(data.security)
      } else {
        toast.error('Failed to load configuration')
      }
    } catch (error) {
      console.error('Error fetching configuration:', error)
      toast.error('Error loading configuration')
    } finally {
      setLoading(false)
    }
  }

  const handleLogoUpload = async (file: File) => {
    const formData = new FormData()
    formData.append('logo', file)
    
    try {
      const response = await fetch('/api/system/configuration/logo', {
        method: 'POST',
        body: formData
      })
      
      if (response.ok) {
        const data = await response.json()
        setConfig(prev => prev ? { ...prev, logo_url: data.logo_url } : null)
        toast.success('Logo uploaded successfully')
      } else {
        toast.error('Failed to upload logo')
      }
    } catch (error) {
      console.error('Error uploading logo:', error)
      toast.error('Error uploading logo')
    }
  }

  const handleBannerUpload = async (files: File[]) => {
    const formData = new FormData()
    files.forEach(file => formData.append('banners', file))
    
    try {
      const response = await fetch('/api/system/configuration/banners', {
        method: 'POST',
        body: formData
      })
      
      if (response.ok) {
        const data = await response.json()
        setConfig(prev => prev ? { ...prev, banner_images: data.banner_images } : null)
        toast.success('Banner images uploaded successfully')
      } else {
        toast.error('Failed to upload banner images')
      }
    } catch (error) {
      console.error('Error uploading banners:', error)
      toast.error('Error uploading banner images')
    }
  }

  const saveConfiguration = async () => {
    if (!config) return
    
    try {
      setSaving(true)
      const response = await fetch('/api/system/configuration', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          config,
          security: securitySettings
        })
      })
      
      if (response.ok) {
        toast.success('Configuration saved successfully')
        fetchConfiguration() // Refresh data
      } else {
        const error = await response.json()
        toast.error(error.message || 'Failed to save configuration')
      }
    } catch (error) {
      console.error('Error saving configuration:', error)
      toast.error('Error saving configuration')
    } finally {
      setSaving(false)
    }
  }

  const removeBannerImage = (index: number) => {
    if (!config) return
    const newBannerImages = config.banner_images.filter((_, i) => i !== index)
    setConfig({ ...config, banner_images: newBannerImages })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex items-center space-x-2">
          <Icon icon="mdi:loading" className="w-6 h-6 animate-spin text-orange-500" />
          <span className="text-white">Loading configuration...</span>
        </div>
      </div>
    )
  }

  if (!config || !securitySettings) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Icon icon="mdi:alert-circle" className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-white mb-2">Configuration Not Found</h3>
          <p className="text-gray-400">Unable to load system configuration.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">System Configuration</h1>
          <p className="text-gray-400 mt-1">Manage system settings, branding, and security configuration</p>
        </div>
        <Button 
          onClick={saveConfiguration}
          disabled={saving}
          className="bg-orange-600 hover:bg-orange-700"
        >
          {saving ? (
            <>
              <Icon icon="mdi:loading" className="w-4 h-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Icon icon="mdi:content-save" className="w-4 h-4 mr-2" />
              Save Configuration
            </>
          )}
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4 bg-gray-800">
          <TabsTrigger value="general" className="data-[state=active]:bg-orange-600">
            <Icon icon="mdi:cog" className="w-4 h-4 mr-2" />
            General
          </TabsTrigger>
          <TabsTrigger value="branding" className="data-[state=active]:bg-orange-600">
            <Icon icon="mdi:palette" className="w-4 h-4 mr-2" />
            Branding
          </TabsTrigger>
          <TabsTrigger value="security" className="data-[state=active]:bg-orange-600">
            <Icon icon="mdi:shield" className="w-4 h-4 mr-2" />
            Security
          </TabsTrigger>
          <TabsTrigger value="maintenance" className="data-[state=active]:bg-orange-600">
            <Icon icon="mdi:wrench" className="w-4 h-4 mr-2" />
            Maintenance
          </TabsTrigger>
        </TabsList>

        {/* General Settings */}
        <TabsContent value="general" className="space-y-6">
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center">
                <Icon icon="mdi:cog" className="w-5 h-5 mr-2" />
                General Settings
              </CardTitle>
              <CardDescription className="text-gray-400">
                Configure basic system settings and site information
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="site_title" className="text-white">Site Title</Label>
                  <Input
                    id="site_title"
                    value={config.site_title}
                    onChange={(e) => setConfig({ ...config, site_title: e.target.value })}
                    className="bg-gray-700 border-gray-600 text-white"
                    placeholder="Analytics Hub"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="session_timeout" className="text-white">Session Timeout (minutes)</Label>
                  <Input
                    id="session_timeout"
                    type="number"
                    value={securitySettings.session_timeout}
                    onChange={(e) => setSecuritySettings({ ...securitySettings, session_timeout: parseInt(e.target.value) || 30 })}
                    className="bg-gray-700 border-gray-600 text-white"
                    min="5"
                    max="1440"
                  />
                </div>
              </div>

              <Separator className="bg-gray-600" />

              {/* Marquee Settings */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-white">Marquee Text</h3>
                    <p className="text-gray-400 text-sm">Display scrolling text at the top of pages</p>
                  </div>
                  <Switch
                    checked={config.marquee_enabled}
                    onCheckedChange={(checked) => setConfig({ ...config, marquee_enabled: checked })}
                  />
                </div>
                
                {config.marquee_enabled && (
                  <div className="space-y-2">
                    <Label htmlFor="marquee_text" className="text-white">Marquee Text</Label>
                    <Textarea
                      id="marquee_text"
                      value={config.marquee_text || ''}
                      onChange={(e) => setConfig({ ...config, marquee_text: e.target.value })}
                      className="bg-gray-700 border-gray-600 text-white"
                      placeholder="Welcome to Analytics Hub - Your data visualization platform"
                      rows={2}
                    />
                  </div>
                )}
              </div>

              <Separator className="bg-gray-600" />

              {/* Footer Settings */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-white">Footer Content</h3>
                    <p className="text-gray-400 text-sm">Customize footer text and links</p>
                  </div>
                  <Switch
                    checked={config.footer_enabled}
                    onCheckedChange={(checked) => setConfig({ ...config, footer_enabled: checked })}
                  />
                </div>
                
                {config.footer_enabled && (
                  <div className="space-y-2">
                    <Label htmlFor="footer_content" className="text-white">Footer Content (HTML allowed)</Label>
                    <Textarea
                      id="footer_content"
                      value={config.footer_content || ''}
                      onChange={(e) => setConfig({ ...config, footer_content: e.target.value })}
                      className="bg-gray-700 border-gray-600 text-white"
                      placeholder="© 2024 Analytics Hub. All rights reserved."
                      rows={4}
                    />
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Branding Settings */}
        <TabsContent value="branding" className="space-y-6">
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center">
                <Icon icon="mdi:palette" className="w-5 h-5 mr-2" />
                Branding & Visual Settings
              </CardTitle>
              <CardDescription className="text-gray-400">
                Customize logos, banners, and theme colors
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Logo Upload */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-white">Site Logo</h3>
                <div className="flex items-center space-x-4">
                  {config.logo_url && (
                    <div className="relative w-24 h-24 bg-gray-700 rounded-lg overflow-hidden">
                      <Image
                        src={config.logo_url}
                        alt="Site Logo"
                        fill
                        className="object-contain"
                      />
                    </div>
                  )}
                  <div className="flex-1">
                    <Input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0]
                        if (file) {
                          setLogoFile(file)
                          handleLogoUpload(file)
                        }
                      }}
                      className="bg-gray-700 border-gray-600 text-white"
                    />
                    <p className="text-gray-400 text-sm mt-1">Recommended: PNG or SVG, max 2MB</p>
                  </div>
                </div>
              </div>

              <Separator className="bg-gray-600" />

              {/* Banner Images */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-white">Banner Slideshow</h3>
                    <p className="text-gray-400 text-sm">Upload images for the homepage banner</p>
                  </div>
                  <Switch
                    checked={config.banner_enabled}
                    onCheckedChange={(checked) => setConfig({ ...config, banner_enabled: checked })}
                  />
                </div>
                
                {config.banner_enabled && (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-white">Autoplay</Label>
                        <Switch
                          checked={config.banner_autoplay}
                          onCheckedChange={(checked) => setConfig({ ...config, banner_autoplay: checked })}
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="banner_interval" className="text-white">Interval (seconds)</Label>
                        <Input
                          id="banner_interval"
                          type="number"
                          value={config.banner_interval}
                          onChange={(e) => setConfig({ ...config, banner_interval: parseInt(e.target.value) || 5 })}
                          className="bg-gray-700 border-gray-600 text-white"
                          min="1"
                          max="60"
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-4">
                      <Input
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={(e) => {
                          const files = Array.from(e.target.files || [])
                          if (files.length > 0) {
                            setBannerFiles(files)
                            handleBannerUpload(files)
                          }
                        }}
                        className="bg-gray-700 border-gray-600 text-white"
                      />
                      <p className="text-gray-400 text-sm">Select multiple images for slideshow</p>
                      
                      {config.banner_images.length > 0 && (
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          {config.banner_images.map((image, index) => (
                            <div key={index} className="relative group">
                              <div className="relative w-full h-24 bg-gray-700 rounded-lg overflow-hidden">
                                <Image
                                  src={image}
                                  alt={`Banner ${index + 1}`}
                                  fill
                                  className="object-cover"
                                />
                              </div>
                              <Button
                                size="sm"
                                variant="destructive"
                                className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                onClick={() => removeBannerImage(index)}
                              >
                                <Icon icon="mdi:close" className="w-3 h-3" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>

              <Separator className="bg-gray-600" />

              {/* Theme Colors */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-white">Theme Colors</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="primary_color" className="text-white">Primary Color</Label>
                    <div className="flex items-center space-x-2">
                      <Input
                        id="primary_color"
                        type="color"
                        value={config.theme_primary_color}
                        onChange={(e) => setConfig({ ...config, theme_primary_color: e.target.value })}
                        className="w-12 h-10 bg-gray-700 border-gray-600"
                      />
                      <Input
                        value={config.theme_primary_color}
                        onChange={(e) => setConfig({ ...config, theme_primary_color: e.target.value })}
                        className="bg-gray-700 border-gray-600 text-white"
                        placeholder="#FF7A00"
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="secondary_color" className="text-white">Secondary Color</Label>
                    <div className="flex items-center space-x-2">
                      <Input
                        id="secondary_color"
                        type="color"
                        value={config.theme_secondary_color}
                        onChange={(e) => setConfig({ ...config, theme_secondary_color: e.target.value })}
                        className="w-12 h-10 bg-gray-700 border-gray-600"
                      />
                      <Input
                        value={config.theme_secondary_color}
                        onChange={(e) => setConfig({ ...config, theme_secondary_color: e.target.value })}
                        className="bg-gray-700 border-gray-600 text-white"
                        placeholder="#0E0E44"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security Settings */}
        <TabsContent value="security" className="space-y-6">
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center">
                <Icon icon="mdi:shield" className="w-5 h-5 mr-2" />
                Security Configuration
              </CardTitle>
              <CardDescription className="text-gray-400">
                Configure security thresholds and authentication settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Login Security */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-white">Login Security</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="failed_login_threshold" className="text-white">Failed Login Threshold</Label>
                    <Input
                      id="failed_login_threshold"
                      type="number"
                      value={securitySettings.failed_login_threshold}
                      onChange={(e) => setSecuritySettings({ ...securitySettings, failed_login_threshold: parseInt(e.target.value) || 5 })}
                      className="bg-gray-700 border-gray-600 text-white"
                      min="3"
                      max="100"
                    />
                    <p className="text-gray-400 text-xs">Number of failed attempts before IP blacklist</p>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="ip_blacklist_duration" className="text-white">IP Blacklist Duration (hours)</Label>
                    <Input
                      id="ip_blacklist_duration"
                      type="number"
                      value={securitySettings.ip_blacklist_duration}
                      onChange={(e) => setSecuritySettings({ ...securitySettings, ip_blacklist_duration: parseInt(e.target.value) || 24 })}
                      className="bg-gray-700 border-gray-600 text-white"
                      min="1"
                      max="168"
                    />
                    <p className="text-gray-400 text-xs">How long to blacklist an IP address</p>
                  </div>
                </div>
              </div>

              <Separator className="bg-gray-600" />

              {/* Password Policy */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-white">Password Policy</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="password_min_length" className="text-white">Minimum Length</Label>
                    <Input
                      id="password_min_length"
                      type="number"
                      value={securitySettings.password_min_length}
                      onChange={(e) => setSecuritySettings({ ...securitySettings, password_min_length: parseInt(e.target.value) || 8 })}
                      className="bg-gray-700 border-gray-600 text-white"
                      min="6"
                      max="50"
                    />
                  </div>
                  
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Label className="text-white">Require Uppercase</Label>
                      <Switch
                        checked={securitySettings.password_require_uppercase}
                        onCheckedChange={(checked) => setSecuritySettings({ ...securitySettings, password_require_uppercase: checked })}
                      />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <Label className="text-white">Require Lowercase</Label>
                      <Switch
                        checked={securitySettings.password_require_lowercase}
                        onCheckedChange={(checked) => setSecuritySettings({ ...securitySettings, password_require_lowercase: checked })}
                      />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <Label className="text-white">Require Numbers</Label>
                      <Switch
                        checked={securitySettings.password_require_numbers}
                        onCheckedChange={(checked) => setSecuritySettings({ ...securitySettings, password_require_numbers: checked })}
                      />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <Label className="text-white">Require Symbols</Label>
                      <Switch
                        checked={securitySettings.password_require_symbols}
                        onCheckedChange={(checked) => setSecuritySettings({ ...securitySettings, password_require_symbols: checked })}
                      />
                    </div>
                  </div>
                </div>
              </div>

              <Separator className="bg-gray-600" />

              {/* Two-Factor Authentication */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-white">Two-Factor Authentication</h3>
                    <p className="text-gray-400 text-sm">Enable 2FA for enhanced security</p>
                  </div>
                  <Switch
                    checked={securitySettings.two_factor_enabled}
                    onCheckedChange={(checked) => setSecuritySettings({ ...securitySettings, two_factor_enabled: checked })}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Maintenance Mode */}
        <TabsContent value="maintenance" className="space-y-6">
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center">
                <Icon icon="mdi:wrench" className="w-5 h-5 mr-2" />
                Maintenance Mode
              </CardTitle>
              <CardDescription className="text-gray-400">
                Enable maintenance mode to restrict access during updates
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-white">Maintenance Mode</h3>
                    <p className="text-gray-400 text-sm">When enabled, only administrators can access the system</p>
                  </div>
                  <Switch
                    checked={config.maintenance_mode}
                    onCheckedChange={(checked) => setConfig({ ...config, maintenance_mode: checked })}
                  />
                </div>
                
                {config.maintenance_mode && (
                  <div className="space-y-2">
                    <Label htmlFor="maintenance_message" className="text-white">Maintenance Message</Label>
                    <Textarea
                      id="maintenance_message"
                      value={config.maintenance_message || ''}
                      onChange={(e) => setConfig({ ...config, maintenance_message: e.target.value })}
                      className="bg-gray-700 border-gray-600 text-white"
                      placeholder="The system is currently under maintenance. Please check back later."
                      rows={4}
                    />
                  </div>
                )}
                
                {config.maintenance_mode && (
                  <div className="bg-yellow-900/20 border border-yellow-600 rounded-lg p-4">
                    <div className="flex items-center space-x-2">
                      <Icon icon="mdi:alert" className="w-5 h-5 text-yellow-500" />
                      <span className="text-yellow-500 font-medium">Warning</span>
                    </div>
                    <p className="text-yellow-200 mt-2">
                      Maintenance mode is currently enabled. Regular users will not be able to access the system.
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Configuration Info */}
      <Card className="bg-gray-800 border-gray-700">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between text-sm text-gray-400">
            <span>Last updated: {new Date(config.updated_at).toLocaleString()}</span>
            <span>Updated by: {config.updated_by}</span>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}