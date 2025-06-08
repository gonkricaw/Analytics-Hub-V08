'use client'

import React, { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { Icon } from '@iconify/react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { Badge } from '@/components/ui/Badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/Dialog'
import { userProfileSchema, changePasswordSchema } from '@/lib/validation'
import { z } from 'zod'
import { formatDistanceToNow, format } from 'date-fns'

interface UserProfile {
  id: string
  firstName: string
  lastName: string
  email: string
  username?: string
  phone?: string
  bio?: string
  avatar?: string
  isActive: boolean
  emailVerified: boolean
  lastLoginAt?: string
  createdAt: string
  updatedAt: string
  role: {
    id: string
    name: string
    permissions: Permission[]
  }
  loginHistory: LoginHistory[]
  activityLogs: ActivityLog[]
}

interface Permission {
  id: string
  name: string
  resource: string
  action: string
  description?: string
}

interface LoginHistory {
  id: string
  ipAddress: string
  userAgent: string
  location?: string
  timestamp: string
  success: boolean
}

interface ActivityLog {
  id: string
  action: string
  details: string
  timestamp: string
  ipAddress?: string
}

type UserProfileData = z.infer<typeof userProfileSchema>
type ChangePasswordData = z.infer<typeof changePasswordSchema>

export function UserProfileManagement() {
  const { data: session, update: updateSession } = useSession()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isUpdating, setIsUpdating] = useState(false)
  const [activeTab, setActiveTab] = useState('profile')
  const [showPasswordDialog, setShowPasswordDialog] = useState(false)
  const [showAvatarDialog, setShowAvatarDialog] = useState(false)

  // Profile form state
  const [profileForm, setProfileForm] = useState<UserProfileData>({
    firstName: '',
    lastName: '',
    username: '',
    phone: '',
    bio: ''
  })
  const [profileErrors, setProfileErrors] = useState<Record<string, string>>({})

  // Password form state
  const [passwordForm, setPasswordForm] = useState<ChangePasswordData>({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })
  const [passwordErrors, setPasswordErrors] = useState<Record<string, string>>({})
  const [isChangingPassword, setIsChangingPassword] = useState(false)

  // Avatar upload state
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false)

  // Fetch user profile
  useEffect(() => {
    fetchProfile()
  }, [])

  const fetchProfile = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/profile')
      if (response.ok) {
        const data = await response.json()
        setProfile(data)
        setProfileForm({
          firstName: data.firstName || '',
          lastName: data.lastName || '',
          username: data.username || '',
          phone: data.phone || '',
          bio: data.bio || ''
        })
      } else {
        console.error('Failed to fetch profile')
      }
    } catch (error) {
      console.error('Error fetching profile:', error)
    } finally {
      setIsLoading(false)
    }
  }

  // Handle profile form changes
  const handleProfileChange = (field: keyof UserProfileData, value: string) => {
    setProfileForm(prev => ({ ...prev, [field]: value }))
    // Clear error when user starts typing
    if (profileErrors[field]) {
      setProfileErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  // Handle password form changes
  const handlePasswordChange = (field: keyof ChangePasswordData, value: string) => {
    setPasswordForm(prev => ({ ...prev, [field]: value }))
    // Clear error when user starts typing
    if (passwordErrors[field]) {
      setPasswordErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  // Validate profile form
  const validateProfileForm = () => {
    try {
      userProfileSchema.parse(profileForm)
      setProfileErrors({})
      return true
    } catch (error) {
      if (error instanceof z.ZodError) {
        const newErrors: Record<string, string> = {}
        error.errors.forEach((err) => {
          if (err.path.length > 0) {
            newErrors[err.path[0] as string] = err.message
          }
        })
        setProfileErrors(newErrors)
      }
      return false
    }
  }

  // Validate password form
  const validatePasswordForm = () => {
    try {
      changePasswordSchema.parse(passwordForm)
      setPasswordErrors({})
      return true
    } catch (error) {
      if (error instanceof z.ZodError) {
        const newErrors: Record<string, string> = {}
        error.errors.forEach((err) => {
          if (err.path.length > 0) {
            newErrors[err.path[0] as string] = err.message
          }
        })
        setPasswordErrors(newErrors)
      }
      return false
    }
  }

  // Update profile
  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateProfileForm()) {
      return
    }

    setIsUpdating(true)
    try {
      const response = await fetch('/api/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(profileForm)
      })

      if (response.ok) {
        const updatedProfile = await response.json()
        setProfile(updatedProfile)
        // Update session if name changed
        if (profileForm.firstName !== profile?.firstName || profileForm.lastName !== profile?.lastName) {
          await updateSession({
            ...session,
            user: {
              ...session?.user,
              name: `${profileForm.firstName} ${profileForm.lastName}`
            }
          })
        }
        alert('Profile updated successfully!')
      } else {
        const error = await response.json()
        alert(error.message || 'Failed to update profile')
      }
    } catch (error) {
      console.error('Error updating profile:', error)
      alert('An error occurred while updating profile')
    } finally {
      setIsUpdating(false)
    }
  }

  // Change password
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validatePasswordForm()) {
      return
    }

    setIsChangingPassword(true)
    try {
      const response = await fetch('/api/profile/password', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(passwordForm)
      })

      if (response.ok) {
        setPasswordForm({
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        })
        setShowPasswordDialog(false)
        alert('Password changed successfully!')
      } else {
        const error = await response.json()
        alert(error.message || 'Failed to change password')
      }
    } catch (error) {
      console.error('Error changing password:', error)
      alert('An error occurred while changing password')
    } finally {
      setIsChangingPassword(false)
    }
  }

  // Handle avatar file selection
  const handleAvatarSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        alert('File size must be less than 5MB')
        return
      }
      
      if (!file.type.startsWith('image/')) {
        alert('Please select an image file')
        return
      }

      setSelectedFile(file)
      const reader = new FileReader()
      reader.onload = (e) => {
        setAvatarPreview(e.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  // Upload avatar
  const handleUploadAvatar = async () => {
    if (!selectedFile) return

    setIsUploadingAvatar(true)
    try {
      const formData = new FormData()
      formData.append('avatar', selectedFile)

      const response = await fetch('/api/profile/avatar', {
        method: 'POST',
        body: formData
      })

      if (response.ok) {
        const data = await response.json()
        setProfile(prev => prev ? { ...prev, avatar: data.avatarUrl } : null)
        setShowAvatarDialog(false)
        setSelectedFile(null)
        setAvatarPreview(null)
        alert('Avatar updated successfully!')
      } else {
        const error = await response.json()
        alert(error.message || 'Failed to upload avatar')
      }
    } catch (error) {
      console.error('Error uploading avatar:', error)
      alert('An error occurred while uploading avatar')
    } finally {
      setIsUploadingAvatar(false)
    }
  }

  // Format date
  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'MMM dd, yyyy HH:mm')
  }

  // Format relative time
  const formatRelativeTime = (dateString: string) => {
    return formatDistanceToNow(new Date(dateString), { addSuffix: true })
  }

  // Get activity icon
  const getActivityIcon = (action: string) => {
    switch (action.toLowerCase()) {
      case 'login':
        return 'mdi:login'
      case 'logout':
        return 'mdi:logout'
      case 'profile_updated':
        return 'mdi:account-edit'
      case 'password_changed':
        return 'mdi:key'
      case 'avatar_updated':
        return 'mdi:image-edit'
      default:
        return 'mdi:information'
    }
  }

  // Group permissions by resource
  const groupedPermissions = profile?.role.permissions.reduce((acc, permission) => {
    if (!acc[permission.resource]) {
      acc[permission.resource] = []
    }
    acc[permission.resource].push(permission)
    return acc
  }, {} as Record<string, Permission[]>) || {}

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Icon icon="mdi:loading" className="w-8 h-8 animate-spin text-orange-500" />
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Icon icon="mdi:alert-circle" className="w-12 h-12 mx-auto text-red-500 mb-4" />
          <h2 className="text-xl font-semibold text-white mb-2">Profile Not Found</h2>
          <p className="text-gray-400">Unable to load your profile information.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">My Profile</h1>
          <p className="text-gray-400 mt-1">Manage your account settings and preferences</p>
        </div>
      </div>

      {/* Profile Overview Card */}
      <Card className="bg-gray-800 border-gray-700">
        <CardContent className="p-6">
          <div className="flex items-center space-x-6">
            {/* Avatar */}
            <div className="relative">
              <div className="w-24 h-24 bg-orange-600 rounded-full flex items-center justify-center overflow-hidden">
                {profile.avatar ? (
                  <img 
                    src={profile.avatar} 
                    alt="Profile" 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-white text-2xl font-bold">
                    {profile.firstName.charAt(0)}{profile.lastName.charAt(0)}
                  </span>
                )}
              </div>
              <Dialog open={showAvatarDialog} onOpenChange={setShowAvatarDialog}>
                <DialogTrigger asChild>
                  <button className="absolute -bottom-1 -right-1 p-2 bg-gray-700 rounded-full hover:bg-gray-600 transition-colors">
                    <Icon icon="mdi:camera" className="w-4 h-4 text-white" />
                  </button>
                </DialogTrigger>
                <DialogContent className="bg-gray-800 border-gray-700">
                  <DialogHeader>
                    <DialogTitle className="text-white">Update Avatar</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleAvatarSelect}
                        className="w-full text-white"
                      />
                      <p className="text-sm text-gray-400 mt-1">
                        Maximum file size: 5MB. Supported formats: JPG, PNG, GIF
                      </p>
                    </div>
                    {avatarPreview && (
                      <div className="flex justify-center">
                        <img 
                          src={avatarPreview} 
                          alt="Preview" 
                          className="w-32 h-32 object-cover rounded-full"
                        />
                      </div>
                    )}
                    <div className="flex justify-end space-x-3">
                      <Button
                        variant="outline"
                        onClick={() => {
                          setShowAvatarDialog(false)
                          setSelectedFile(null)
                          setAvatarPreview(null)
                        }}
                        className="border-gray-600 text-gray-300"
                      >
                        Cancel
                      </Button>
                      <Button
                        onClick={handleUploadAvatar}
                        disabled={!selectedFile || isUploadingAvatar}
                        className="bg-orange-600 hover:bg-orange-700"
                      >
                        {isUploadingAvatar ? (
                          <>
                            <Icon icon="mdi:loading" className="w-4 h-4 mr-2 animate-spin" />
                            Uploading...
                          </>
                        ) : (
                          'Upload'
                        )}
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            {/* Basic Info */}
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-white">
                {profile.firstName} {profile.lastName}
              </h2>
              <p className="text-gray-400">{profile.email}</p>
              {profile.username && (
                <p className="text-gray-400">@{profile.username}</p>
              )}
              <div className="flex items-center space-x-3 mt-2">
                <Badge 
                  variant={profile.isActive ? 'default' : 'secondary'}
                  className={profile.isActive ? 'bg-green-600' : 'bg-gray-600'}
                >
                  {profile.isActive ? 'Active' : 'Inactive'}
                </Badge>
                <Badge variant="outline" className="border-gray-600 text-gray-300">
                  {profile.role.name}
                </Badge>
                {profile.emailVerified && (
                  <Badge variant="outline" className="border-green-600 text-green-400">
                    <Icon icon="mdi:check-circle" className="w-3 h-3 mr-1" />
                    Verified
                  </Badge>
                )}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="space-y-2">
              <Dialog open={showPasswordDialog} onOpenChange={setShowPasswordDialog}>
                <DialogTrigger asChild>
                  <Button variant="outline" className="border-gray-600 text-gray-300 hover:bg-gray-700">
                    <Icon icon="mdi:key" className="w-4 h-4 mr-2" />
                    Change Password
                  </Button>
                </DialogTrigger>
                <DialogContent className="bg-gray-800 border-gray-700">
                  <DialogHeader>
                    <DialogTitle className="text-white">Change Password</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleChangePassword} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Current Password *
                      </label>
                      <Input
                        type="password"
                        value={passwordForm.currentPassword}
                        onChange={(e) => handlePasswordChange('currentPassword', e.target.value)}
                        className={`bg-gray-700 border-gray-600 ${passwordErrors.currentPassword ? 'border-red-500' : ''}`}
                        disabled={isChangingPassword}
                      />
                      {passwordErrors.currentPassword && (
                        <p className="mt-1 text-sm text-red-400">{passwordErrors.currentPassword}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        New Password *
                      </label>
                      <Input
                        type="password"
                        value={passwordForm.newPassword}
                        onChange={(e) => handlePasswordChange('newPassword', e.target.value)}
                        className={`bg-gray-700 border-gray-600 ${passwordErrors.newPassword ? 'border-red-500' : ''}`}
                        disabled={isChangingPassword}
                      />
                      {passwordErrors.newPassword && (
                        <p className="mt-1 text-sm text-red-400">{passwordErrors.newPassword}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Confirm New Password *
                      </label>
                      <Input
                        type="password"
                        value={passwordForm.confirmPassword}
                        onChange={(e) => handlePasswordChange('confirmPassword', e.target.value)}
                        className={`bg-gray-700 border-gray-600 ${passwordErrors.confirmPassword ? 'border-red-500' : ''}`}
                        disabled={isChangingPassword}
                      />
                      {passwordErrors.confirmPassword && (
                        <p className="mt-1 text-sm text-red-400">{passwordErrors.confirmPassword}</p>
                      )}
                    </div>
                    <div className="flex justify-end space-x-3 pt-4">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setShowPasswordDialog(false)}
                        disabled={isChangingPassword}
                        className="border-gray-600 text-gray-300"
                      >
                        Cancel
                      </Button>
                      <Button
                        type="submit"
                        disabled={isChangingPassword}
                        className="bg-orange-600 hover:bg-orange-700"
                      >
                        {isChangingPassword ? (
                          <>
                            <Icon icon="mdi:loading" className="w-4 h-4 mr-2 animate-spin" />
                            Changing...
                          </>
                        ) : (
                          'Change Password'
                        )}
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4 bg-gray-700">
          <TabsTrigger value="profile" className="data-[state=active]:bg-gray-600">
            Profile
          </TabsTrigger>
          <TabsTrigger value="permissions" className="data-[state=active]:bg-gray-600">
            Permissions
          </TabsTrigger>
          <TabsTrigger value="security" className="data-[state=active]:bg-gray-600">
            Security
          </TabsTrigger>
          <TabsTrigger value="activity" className="data-[state=active]:bg-gray-600">
            Activity
          </TabsTrigger>
        </TabsList>

        <div className="mt-6">
          <TabsContent value="profile">
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white">Profile Information</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleUpdateProfile} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        First Name *
                      </label>
                      <Input
                        type="text"
                        value={profileForm.firstName}
                        onChange={(e) => handleProfileChange('firstName', e.target.value)}
                        className={`bg-gray-700 border-gray-600 ${profileErrors.firstName ? 'border-red-500' : ''}`}
                        disabled={isUpdating}
                      />
                      {profileErrors.firstName && (
                        <p className="mt-1 text-sm text-red-400">{profileErrors.firstName}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Last Name *
                      </label>
                      <Input
                        type="text"
                        value={profileForm.lastName}
                        onChange={(e) => handleProfileChange('lastName', e.target.value)}
                        className={`bg-gray-700 border-gray-600 ${profileErrors.lastName ? 'border-red-500' : ''}`}
                        disabled={isUpdating}
                      />
                      {profileErrors.lastName && (
                        <p className="mt-1 text-sm text-red-400">{profileErrors.lastName}</p>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Username
                      </label>
                      <Input
                        type="text"
                        value={profileForm.username}
                        onChange={(e) => handleProfileChange('username', e.target.value)}
                        className={`bg-gray-700 border-gray-600 ${profileErrors.username ? 'border-red-500' : ''}`}
                        placeholder="Optional username"
                        disabled={isUpdating}
                      />
                      {profileErrors.username && (
                        <p className="mt-1 text-sm text-red-400">{profileErrors.username}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Phone
                      </label>
                      <Input
                        type="tel"
                        value={profileForm.phone}
                        onChange={(e) => handleProfileChange('phone', e.target.value)}
                        className={`bg-gray-700 border-gray-600 ${profileErrors.phone ? 'border-red-500' : ''}`}
                        placeholder="Optional phone number"
                        disabled={isUpdating}
                      />
                      {profileErrors.phone && (
                        <p className="mt-1 text-sm text-red-400">{profileErrors.phone}</p>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Bio
                    </label>
                    <Textarea
                      value={profileForm.bio}
                      onChange={(e) => handleProfileChange('bio', e.target.value)}
                      className={`bg-gray-700 border-gray-600 ${profileErrors.bio ? 'border-red-500' : ''}`}
                      placeholder="Tell us about yourself..."
                      rows={4}
                      disabled={isUpdating}
                    />
                    {profileErrors.bio && (
                      <p className="mt-1 text-sm text-red-400">{profileErrors.bio}</p>
                    )}
                  </div>

                  <div className="flex justify-end">
                    <Button
                      type="submit"
                      disabled={isUpdating}
                      className="bg-orange-600 hover:bg-orange-700"
                    >
                      {isUpdating ? (
                        <>
                          <Icon icon="mdi:loading" className="w-4 h-4 mr-2 animate-spin" />
                          Updating...
                        </>
                      ) : (
                        <>
                          <Icon icon="mdi:content-save" className="w-4 h-4 mr-2" />
                          Save Changes
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="permissions">
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white">Your Permissions</CardTitle>
              </CardHeader>
              <CardContent>
                {Object.keys(groupedPermissions).length === 0 ? (
                  <div className="text-center py-8">
                    <Icon icon="mdi:shield-off" className="w-12 h-12 mx-auto text-gray-500 mb-2" />
                    <p className="text-gray-400">No permissions assigned</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {Object.entries(groupedPermissions).map(([resource, permissions]) => (
                      <div key={resource} className="bg-gray-700 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="font-semibold text-white capitalize">
                            {resource.replace('_', ' ')}
                          </h4>
                          <Badge variant="outline" className="border-gray-600 text-gray-300">
                            {permissions.length} permission{permissions.length !== 1 ? 's' : ''}
                          </Badge>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {permissions.map((permission) => (
                            <div key={permission.id} className="flex items-center space-x-3 p-2 bg-gray-800 rounded">
                              <Icon icon="mdi:shield-check" className="w-4 h-4 text-green-400" />
                              <div className="flex-1">
                                <p className="text-white font-medium">{permission.action}</p>
                                {permission.description && (
                                  <p className="text-gray-400 text-xs">{permission.description}</p>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="security">
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white">Security & Login History</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {/* Account Security */}
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-3">Account Security</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="bg-gray-700 p-4 rounded-lg">
                        <div className="flex items-center space-x-2 mb-2">
                          <Icon icon="mdi:email" className="w-5 h-5 text-blue-400" />
                          <span className="text-white font-medium">Email Verification</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge 
                            variant={profile.emailVerified ? 'default' : 'secondary'}
                            className={profile.emailVerified ? 'bg-green-600' : 'bg-red-600'}
                          >
                            {profile.emailVerified ? 'Verified' : 'Not Verified'}
                          </Badge>
                          {!profile.emailVerified && (
                            <Button size="sm" variant="outline" className="border-gray-600 text-gray-300">
                              Verify Email
                            </Button>
                          )}
                        </div>
                      </div>
                      <div className="bg-gray-700 p-4 rounded-lg">
                        <div className="flex items-center space-x-2 mb-2">
                          <Icon icon="mdi:key" className="w-5 h-5 text-orange-400" />
                          <span className="text-white font-medium">Password</span>
                        </div>
                        <p className="text-gray-400 text-sm mb-2">Last changed {formatRelativeTime(profile.updatedAt)}</p>
                        <Button 
                          size="sm" 
                          variant="outline" 
                          onClick={() => setShowPasswordDialog(true)}
                          className="border-gray-600 text-gray-300"
                        >
                          Change Password
                        </Button>
                      </div>
                    </div>
                  </div>

                  {/* Login History */}
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-3">Recent Login History</h3>
                    {profile.loginHistory && profile.loginHistory.length > 0 ? (
                      <div className="space-y-3">
                        {profile.loginHistory.slice(0, 5).map((login) => (
                          <div key={login.id} className="flex items-center justify-between p-3 bg-gray-700 rounded-lg">
                            <div className="flex items-center space-x-3">
                              <div className={`p-1 rounded ${login.success ? 'text-green-400' : 'text-red-400'}`}>
                                <Icon icon={login.success ? 'mdi:check-circle' : 'mdi:alert-circle'} className="w-5 h-5" />
                              </div>
                              <div>
                                <p className="text-white font-medium">
                                  {login.success ? 'Successful Login' : 'Failed Login'}
                                </p>
                                <p className="text-gray-400 text-sm">
                                  {login.ipAddress} • {login.location || 'Unknown location'}
                                </p>
                              </div>
                            </div>
                            <span className="text-gray-400 text-sm">
                              {formatRelativeTime(login.timestamp)}
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <Icon icon="mdi:history" className="w-12 h-12 mx-auto text-gray-500 mb-2" />
                        <p className="text-gray-400">No login history available</p>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="activity">
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white">Recent Activity</CardTitle>
              </CardHeader>
              <CardContent>
                {profile.activityLogs && profile.activityLogs.length > 0 ? (
                  <div className="space-y-3">
                    {profile.activityLogs.slice(0, 10).map((log) => (
                      <div key={log.id} className="flex items-start space-x-3 p-3 bg-gray-700 rounded-lg">
                        <div className="p-1 rounded text-blue-400">
                          <Icon icon={getActivityIcon(log.action)} className="w-4 h-4" />
                        </div>
                        <div className="flex-1">
                          <p className="text-white font-medium">{log.action.replace('_', ' ')}</p>
                          <p className="text-gray-400 text-sm">{log.details}</p>
                          <div className="flex items-center space-x-2 mt-1">
                            <span className="text-xs text-gray-500">
                              {formatRelativeTime(log.timestamp)}
                            </span>
                            {log.ipAddress && (
                              <>
                                <span className="text-xs text-gray-500">•</span>
                                <span className="text-xs text-gray-500">{log.ipAddress}</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Icon icon="mdi:history" className="w-12 h-12 mx-auto text-gray-500 mb-2" />
                    <p className="text-gray-400">No activity logs found</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </div>
      </Tabs>
    </div>
  )
}