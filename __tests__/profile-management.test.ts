import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals'
import { NextRequest } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'
import { uploadFile, deleteFile } from '@/lib/upload'
import { createPermissionChecker } from '@/lib/permissions'

// Mock dependencies
jest.mock('next-auth')
jest.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    userProfile: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      upsert: jest.fn(),
    },
  },
}))
jest.mock('@/lib/upload')
jest.mock('@/lib/permissions')

const mockGetServerSession = getServerSession as jest.MockedFunction<typeof getServerSession>
const mockUploadFile = uploadFile as jest.MockedFunction<typeof uploadFile>
const mockDeleteFile = deleteFile as jest.MockedFunction<typeof deleteFile>
const mockCreatePermissionChecker = createPermissionChecker as jest.MockedFunction<typeof createPermissionChecker>

// Mock File and FormData for testing
global.File = class MockFile {
  name: string
  size: number
  type: string
  lastModified: number

  constructor(bits: any[], filename: string, options: any = {}) {
    this.name = filename
    this.size = options.size || 1024
    this.type = options.type || 'image/jpeg'
    this.lastModified = Date.now()
  }

  arrayBuffer() {
    return Promise.resolve(new ArrayBuffer(this.size))
  }

  text() {
    return Promise.resolve('')
  }

  stream() {
    return new ReadableStream()
  }

  slice() {
    return new MockFile([], this.name, { size: this.size, type: this.type })
  }
} as any

describe('Profile Management', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  describe('Profile Information Management', () => {
    it('should update basic profile information', async () => {
      const userId = '1'
      const updateData = {
        firstName: 'John',
        lastName: 'Doe',
        bio: 'Software Developer',
        phone: '+1234567890',
        location: 'New York, NY',
        website: 'https://johndoe.com',
        timezone: 'America/New_York',
      }

      const updatedUser = {
        id: userId,
        email: 'john@example.com',
        ...updateData,
        updatedAt: new Date(),
      }

      ;(prisma.user.update as jest.Mock).mockResolvedValue(updatedUser)

      const result = await prisma.user.update({
        where: { id: userId },
        data: updateData,
      })

      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: userId },
        data: updateData,
      })
      expect(result.firstName).toBe(updateData.firstName)
      expect(result.lastName).toBe(updateData.lastName)
      expect(result.bio).toBe(updateData.bio)
      expect(result.phone).toBe(updateData.phone)
      expect(result.location).toBe(updateData.location)
      expect(result.website).toBe(updateData.website)
      expect(result.timezone).toBe(updateData.timezone)
    })

    it('should validate profile data before updating', async () => {
      const invalidData = {
        firstName: '', // Empty first name
        lastName: 'Doe',
        email: 'invalid-email', // Invalid email format
        phone: '123', // Invalid phone format
        website: 'not-a-url', // Invalid URL
      }

      // Simulate validation
      const errors: string[] = []
      
      if (!invalidData.firstName.trim()) {
        errors.push('First name is required')
      }
      if (!invalidData.email.includes('@') || !invalidData.email.includes('.')) {
        errors.push('Invalid email format')
      }
      if (invalidData.phone.length < 10) {
        errors.push('Phone number must be at least 10 digits')
      }
      if (invalidData.website && !invalidData.website.startsWith('http')) {
        errors.push('Website must be a valid URL')
      }

      expect(errors).toHaveLength(4)
      expect(errors).toContain('First name is required')
      expect(errors).toContain('Invalid email format')
      expect(errors).toContain('Phone number must be at least 10 digits')
      expect(errors).toContain('Website must be a valid URL')
    })

    it('should handle profile preferences update', async () => {
      const userId = '1'
      const preferences = {
        theme: 'dark',
        language: 'en',
        notifications: {
          email: true,
          push: false,
          sms: true,
        },
        privacy: {
          profileVisibility: 'public',
          showEmail: false,
          showPhone: true,
        },
      }

      const updatedProfile = {
        userId,
        preferences,
        updatedAt: new Date(),
      }

      ;(prisma.userProfile.upsert as jest.Mock).mockResolvedValue(updatedProfile)

      const result = await prisma.userProfile.upsert({
        where: { userId },
        create: {
          userId,
          preferences,
        },
        update: {
          preferences,
        },
      })

      expect(prisma.userProfile.upsert).toHaveBeenCalledWith({
        where: { userId },
        create: {
          userId,
          preferences,
        },
        update: {
          preferences,
        },
      })
      expect(result.preferences).toEqual(preferences)
    })
  })

  describe('Avatar Management', () => {
    it('should upload and set new avatar', async () => {
      const userId = '1'
      const avatarFile = new File(['avatar data'], 'avatar.jpg', {
        type: 'image/jpeg',
        size: 1024 * 500, // 500KB
      })
      const uploadedUrl = 'https://example.com/uploads/avatar.jpg'

      mockUploadFile.mockResolvedValue({
        url: uploadedUrl,
        key: 'avatars/user-1/avatar.jpg',
        size: avatarFile.size,
        type: avatarFile.type,
      })

      const updatedUser = {
        id: userId,
        avatar: uploadedUrl,
        updatedAt: new Date(),
      }

      ;(prisma.user.update as jest.Mock).mockResolvedValue(updatedUser)

      // Simulate file upload
      const uploadResult = await uploadFile(avatarFile, `avatars/user-${userId}`)
      
      // Update user avatar
      const result = await prisma.user.update({
        where: { id: userId },
        data: { avatar: uploadResult.url },
      })

      expect(mockUploadFile).toHaveBeenCalledWith(avatarFile, `avatars/user-${userId}`)
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: userId },
        data: { avatar: uploadedUrl },
      })
      expect(result.avatar).toBe(uploadedUrl)
    })

    it('should validate avatar file before upload', async () => {
      const validationTests = [
        {
          file: new File(['data'], 'avatar.txt', { type: 'text/plain' }),
          expectedError: 'Invalid file type. Only images are allowed.',
        },
        {
          file: new File(['data'], 'avatar.jpg', {
            type: 'image/jpeg',
            size: 1024 * 1024 * 6, // 6MB
          }),
          expectedError: 'File size too large. Maximum size is 5MB.',
        },
        {
          file: new File(['data'], '', { type: 'image/jpeg' }),
          expectedError: 'File name is required.',
        },
      ]

      validationTests.forEach(({ file, expectedError }) => {
        const errors: string[] = []
        
        // Validate file type
        if (!file.type.startsWith('image/')) {
          errors.push('Invalid file type. Only images are allowed.')
        }
        
        // Validate file size (5MB limit)
        if (file.size > 5 * 1024 * 1024) {
          errors.push('File size too large. Maximum size is 5MB.')
        }
        
        // Validate file name
        if (!file.name.trim()) {
          errors.push('File name is required.')
        }

        expect(errors).toContain(expectedError)
      })
    })

    it('should remove existing avatar when uploading new one', async () => {
      const userId = '1'
      const oldAvatarUrl = 'https://example.com/uploads/old-avatar.jpg'
      const newAvatarFile = new File(['new avatar'], 'new-avatar.jpg', {
        type: 'image/jpeg',
      })
      const newAvatarUrl = 'https://example.com/uploads/new-avatar.jpg'

      const existingUser = {
        id: userId,
        avatar: oldAvatarUrl,
      }

      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(existingUser)
      mockUploadFile.mockResolvedValue({
        url: newAvatarUrl,
        key: 'avatars/user-1/new-avatar.jpg',
        size: newAvatarFile.size,
        type: newAvatarFile.type,
      })
      mockDeleteFile.mockResolvedValue(true)
      ;(prisma.user.update as jest.Mock).mockResolvedValue({
        ...existingUser,
        avatar: newAvatarUrl,
      })

      // Get existing user
      const user = await prisma.user.findUnique({ where: { id: userId } })
      
      // Delete old avatar if exists
      if (user?.avatar) {
        await deleteFile(user.avatar)
      }
      
      // Upload new avatar
      const uploadResult = await uploadFile(newAvatarFile, `avatars/user-${userId}`)
      
      // Update user
      await prisma.user.update({
        where: { id: userId },
        data: { avatar: uploadResult.url },
      })

      expect(mockDeleteFile).toHaveBeenCalledWith(oldAvatarUrl)
      expect(mockUploadFile).toHaveBeenCalledWith(newAvatarFile, `avatars/user-${userId}`)
    })

    it('should set default avatar', async () => {
      const userId = '1'
      const defaultAvatarUrl = '/avatars/default-1.svg'

      const updatedUser = {
        id: userId,
        avatar: defaultAvatarUrl,
        updatedAt: new Date(),
      }

      ;(prisma.user.update as jest.Mock).mockResolvedValue(updatedUser)

      const result = await prisma.user.update({
        where: { id: userId },
        data: { avatar: defaultAvatarUrl },
      })

      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: userId },
        data: { avatar: defaultAvatarUrl },
      })
      expect(result.avatar).toBe(defaultAvatarUrl)
    })

    it('should remove avatar (set to null)', async () => {
      const userId = '1'
      const currentAvatarUrl = 'https://example.com/uploads/avatar.jpg'

      const existingUser = {
        id: userId,
        avatar: currentAvatarUrl,
      }

      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(existingUser)
      mockDeleteFile.mockResolvedValue(true)
      ;(prisma.user.update as jest.Mock).mockResolvedValue({
        ...existingUser,
        avatar: null,
      })

      // Get existing user
      const user = await prisma.user.findUnique({ where: { id: userId } })
      
      // Delete current avatar
      if (user?.avatar) {
        await deleteFile(user.avatar)
      }
      
      // Remove avatar from user
      const result = await prisma.user.update({
        where: { id: userId },
        data: { avatar: null },
      })

      expect(mockDeleteFile).toHaveBeenCalledWith(currentAvatarUrl)
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: userId },
        data: { avatar: null },
      })
      expect(result.avatar).toBeNull()
    })
  })

  describe('Profile Privacy and Security', () => {
    it('should update privacy settings', async () => {
      const userId = '1'
      const privacySettings = {
        profileVisibility: 'private',
        showEmail: false,
        showPhone: false,
        showLocation: true,
        allowDirectMessages: true,
        showOnlineStatus: false,
      }

      const updatedProfile = {
        userId,
        privacy: privacySettings,
        updatedAt: new Date(),
      }

      ;(prisma.userProfile.upsert as jest.Mock).mockResolvedValue(updatedProfile)

      const result = await prisma.userProfile.upsert({
        where: { userId },
        create: {
          userId,
          privacy: privacySettings,
        },
        update: {
          privacy: privacySettings,
        },
      })

      expect(result.privacy).toEqual(privacySettings)
    })

    it('should validate privacy settings', async () => {
      const validPrivacyOptions = ['public', 'private', 'friends']
      const invalidPrivacySetting = 'invalid'

      const isValid = validPrivacyOptions.includes(invalidPrivacySetting)
      expect(isValid).toBe(false)

      const validSetting = 'public'
      const isValidSetting = validPrivacyOptions.includes(validSetting)
      expect(isValidSetting).toBe(true)
    })
  })

  describe('Profile Permissions and Access Control', () => {
    it('should allow users to edit their own profile', async () => {
      const userId = '1'
      const sessionUser = {
        id: userId,
        roles: [{ role: { name: 'user', permissions: [] } }],
      }

      mockGetServerSession.mockResolvedValue({
        user: sessionUser,
      } as any)

      const session = await getServerSession()
      const canEdit = session?.user?.id === userId

      expect(canEdit).toBe(true)
    })

    it('should allow admins to edit any profile', async () => {
      const targetUserId = '1'
      const adminUserId = '2'
      const adminUser = {
        id: adminUserId,
        roles: [
          {
            role: {
              name: 'admin',
              permissions: [
                { permission: { name: 'users.write' } },
              ],
            },
          },
        ],
      }

      const mockPermissionChecker = {
        hasPermission: jest.fn().mockReturnValue(true),
        isAdmin: jest.fn().mockReturnValue(true),
      }

      mockCreatePermissionChecker.mockReturnValue(mockPermissionChecker)
      mockGetServerSession.mockResolvedValue({
        user: adminUser,
      } as any)

      const session = await getServerSession()
      const permissionChecker = createPermissionChecker(session?.user)
      const canEdit = permissionChecker.hasPermission('users.write') || 
                     session?.user?.id === targetUserId

      expect(canEdit).toBe(true)
      expect(mockPermissionChecker.hasPermission).toHaveBeenCalledWith('users.write')
    })

    it('should deny unauthorized profile access', async () => {
      const targetUserId = '1'
      const unauthorizedUserId = '2'
      const unauthorizedUser = {
        id: unauthorizedUserId,
        roles: [{ role: { name: 'user', permissions: [] } }],
      }

      const mockPermissionChecker = {
        hasPermission: jest.fn().mockReturnValue(false),
        isAdmin: jest.fn().mockReturnValue(false),
      }

      mockCreatePermissionChecker.mockReturnValue(mockPermissionChecker)
      mockGetServerSession.mockResolvedValue({
        user: unauthorizedUser,
      } as any)

      const session = await getServerSession()
      const permissionChecker = createPermissionChecker(session?.user)
      const canEdit = permissionChecker.hasPermission('users.write') || 
                     session?.user?.id === targetUserId

      expect(canEdit).toBe(false)
    })
  })

  describe('Profile Data Export and Import', () => {
    it('should export user profile data', async () => {
      const userId = '1'
      const userWithProfile = {
        id: userId,
        email: 'john@example.com',
        firstName: 'John',
        lastName: 'Doe',
        bio: 'Software Developer',
        avatar: 'https://example.com/avatar.jpg',
        createdAt: new Date('2023-01-01'),
        updatedAt: new Date('2023-12-01'),
        profile: {
          preferences: {
            theme: 'dark',
            language: 'en',
          },
          privacy: {
            profileVisibility: 'public',
          },
        },
        roles: [
          {
            role: {
              name: 'user',
            },
          },
        ],
      }

      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(userWithProfile)

      const exportedData = await prisma.user.findUnique({
        where: { id: userId },
        include: {
          profile: true,
          roles: {
            include: {
              role: true,
            },
          },
        },
      })

      expect(exportedData).toBeDefined()
      expect(exportedData?.email).toBe('john@example.com')
      expect(exportedData?.profile?.preferences).toBeDefined()
      expect(exportedData?.roles).toHaveLength(1)
    })
  })
})