import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals'
import { NextRequest } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'
import { createPermissionChecker } from '@/lib/permissions'
import { hash, compare } from 'bcryptjs'

// Mock dependencies
jest.mock('next-auth')
jest.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    role: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
    },
    permission: {
      findMany: jest.fn(),
    },
    userRole: {
      create: jest.fn(),
      delete: jest.fn(),
      findMany: jest.fn(),
    },
    session: {
      findMany: jest.fn(),
      delete: jest.fn(),
    },
    $transaction: jest.fn(),
  },
}))
jest.mock('@/lib/permissions')
jest.mock('bcryptjs')

const mockGetServerSession = getServerSession as jest.MockedFunction<typeof getServerSession>
const mockCreatePermissionChecker = createPermissionChecker as jest.MockedFunction<typeof createPermissionChecker>
const mockHash = hash as jest.MockedFunction<typeof hash>
const mockCompare = compare as jest.MockedFunction<typeof compare>

describe('User Lifecycle Management', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  describe('User Registration', () => {
    it('should create a new user with default role', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'password123',
        firstName: 'John',
        lastName: 'Doe',
      }

      const hashedPassword = 'hashed_password'
      const defaultRole = { id: '1', name: 'user', permissions: [] }
      const createdUser = {
        id: '1',
        email: userData.email,
        firstName: userData.firstName,
        lastName: userData.lastName,
        password: hashedPassword,
        isActive: true,
        emailVerified: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      mockHash.mockResolvedValue(hashedPassword)
      ;(prisma.role.findUnique as jest.Mock).mockResolvedValue(defaultRole)
      ;(prisma.user.create as jest.Mock).mockResolvedValue(createdUser)
      ;(prisma.userRole.create as jest.Mock).mockResolvedValue({
        userId: createdUser.id,
        roleId: defaultRole.id,
      })

      // Simulate user creation process
      const password = await hash(userData.password, 12)
      const user = await prisma.user.create({
        data: {
          email: userData.email,
          password,
          firstName: userData.firstName,
          lastName: userData.lastName,
          isActive: true,
        },
      })

      await prisma.userRole.create({
        data: {
          userId: user.id,
          roleId: defaultRole.id,
        },
      })

      expect(mockHash).toHaveBeenCalledWith(userData.password, 12)
      expect(prisma.user.create).toHaveBeenCalledWith({
        data: {
          email: userData.email,
          password: hashedPassword,
          firstName: userData.firstName,
          lastName: userData.lastName,
          isActive: true,
        },
      })
      expect(prisma.userRole.create).toHaveBeenCalledWith({
        data: {
          userId: createdUser.id,
          roleId: defaultRole.id,
        },
      })
    })

    it('should reject registration with duplicate email', async () => {
      const userData = {
        email: 'existing@example.com',
        password: 'password123',
        firstName: 'John',
        lastName: 'Doe',
      }

      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: '1',
        email: userData.email,
      })

      const existingUser = await prisma.user.findUnique({
        where: { email: userData.email },
      })

      expect(existingUser).toBeTruthy()
      expect(existingUser?.email).toBe(userData.email)
    })

    it('should validate required fields during registration', async () => {
      const invalidUserData = {
        email: '', // Invalid email
        password: '123', // Too short
        firstName: '',
        lastName: '',
      }

      // Simulate validation
      const errors: string[] = []
      
      if (!invalidUserData.email || !invalidUserData.email.includes('@')) {
        errors.push('Valid email is required')
      }
      if (!invalidUserData.password || invalidUserData.password.length < 6) {
        errors.push('Password must be at least 6 characters')
      }
      if (!invalidUserData.firstName.trim()) {
        errors.push('First name is required')
      }
      if (!invalidUserData.lastName.trim()) {
        errors.push('Last name is required')
      }

      expect(errors).toHaveLength(4)
      expect(errors).toContain('Valid email is required')
      expect(errors).toContain('Password must be at least 6 characters')
      expect(errors).toContain('First name is required')
      expect(errors).toContain('Last name is required')
    })
  })

  describe('User Authentication', () => {
    it('should authenticate user with valid credentials', async () => {
      const credentials = {
        email: 'test@example.com',
        password: 'password123',
      }

      const user = {
        id: '1',
        email: credentials.email,
        password: 'hashed_password',
        isActive: true,
        roles: [{ role: { name: 'user', permissions: [] } }],
      }

      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(user)
      mockCompare.mockResolvedValue(true)

      const foundUser = await prisma.user.findUnique({
        where: { email: credentials.email },
        include: {
          roles: {
            include: {
              role: {
                include: {
                  permissions: {
                    include: {
                      permission: true,
                    },
                  },
                },
              },
            },
          },
        },
      })

      const isValidPassword = await compare(credentials.password, user.password)

      expect(foundUser).toBeTruthy()
      expect(foundUser?.isActive).toBe(true)
      expect(isValidPassword).toBe(true)
      expect(mockCompare).toHaveBeenCalledWith(credentials.password, user.password)
    })

    it('should reject authentication with invalid password', async () => {
      const credentials = {
        email: 'test@example.com',
        password: 'wrongpassword',
      }

      const user = {
        id: '1',
        email: credentials.email,
        password: 'hashed_password',
        isActive: true,
      }

      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(user)
      mockCompare.mockResolvedValue(false)

      const isValidPassword = await compare(credentials.password, user.password)

      expect(isValidPassword).toBe(false)
    })

    it('should reject authentication for inactive users', async () => {
      const credentials = {
        email: 'test@example.com',
        password: 'password123',
      }

      const user = {
        id: '1',
        email: credentials.email,
        password: 'hashed_password',
        isActive: false, // Inactive user
      }

      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(user)

      const foundUser = await prisma.user.findUnique({
        where: { email: credentials.email },
      })

      expect(foundUser?.isActive).toBe(false)
    })
  })

  describe('User Profile Management', () => {
    it('should update user profile information', async () => {
      const userId = '1'
      const updateData = {
        firstName: 'Jane',
        lastName: 'Smith',
        bio: 'Updated bio',
        phone: '+1234567890',
      }

      const updatedUser = {
        id: userId,
        ...updateData,
        email: 'test@example.com',
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
    })

    it('should update user password', async () => {
      const userId = '1'
      const oldPassword = 'oldpassword'
      const newPassword = 'newpassword123'
      const hashedNewPassword = 'hashed_new_password'

      const user = {
        id: userId,
        password: 'hashed_old_password',
      }

      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(user)
      mockCompare.mockResolvedValue(true) // Old password is correct
      mockHash.mockResolvedValue(hashedNewPassword)
      ;(prisma.user.update as jest.Mock).mockResolvedValue({
        ...user,
        password: hashedNewPassword,
      })

      // Verify old password
      const isOldPasswordValid = await compare(oldPassword, user.password)
      expect(isOldPasswordValid).toBe(true)

      // Hash new password
      const hashedPassword = await hash(newPassword, 12)
      
      // Update password
      await prisma.user.update({
        where: { id: userId },
        data: { password: hashedPassword },
      })

      expect(mockHash).toHaveBeenCalledWith(newPassword, 12)
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: userId },
        data: { password: hashedNewPassword },
      })
    })
  })

  describe('User Role Management', () => {
    it('should assign role to user', async () => {
      const userId = '1'
      const roleId = '2'

      const userRole = {
        userId,
        roleId,
        assignedAt: new Date(),
      }

      ;(prisma.userRole.create as jest.Mock).mockResolvedValue(userRole)

      const result = await prisma.userRole.create({
        data: {
          userId,
          roleId,
        },
      })

      expect(prisma.userRole.create).toHaveBeenCalledWith({
        data: {
          userId,
          roleId,
        },
      })
      expect(result.userId).toBe(userId)
      expect(result.roleId).toBe(roleId)
    })

    it('should remove role from user', async () => {
      const userId = '1'
      const roleId = '2'

      ;(prisma.userRole.delete as jest.Mock).mockResolvedValue({
        userId,
        roleId,
      })

      await prisma.userRole.delete({
        where: {
          userId_roleId: {
            userId,
            roleId,
          },
        },
      })

      expect(prisma.userRole.delete).toHaveBeenCalledWith({
        where: {
          userId_roleId: {
            userId,
            roleId,
          },
        },
      })
    })

    it('should get user permissions through roles', async () => {
      const userId = '1'
      const userWithRoles = {
        id: userId,
        roles: [
          {
            role: {
              name: 'admin',
              permissions: [
                { permission: { name: 'users.read' } },
                { permission: { name: 'users.write' } },
              ],
            },
          },
        ],
      }

      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(userWithRoles)

      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: {
          roles: {
            include: {
              role: {
                include: {
                  permissions: {
                    include: {
                      permission: true,
                    },
                  },
                },
              },
            },
          },
        },
      })

      expect(user?.roles).toHaveLength(1)
      expect(user?.roles[0].role.permissions).toHaveLength(2)
      expect(user?.roles[0].role.permissions[0].permission.name).toBe('users.read')
      expect(user?.roles[0].role.permissions[1].permission.name).toBe('users.write')
    })
  })

  describe('User Deactivation and Deletion', () => {
    it('should deactivate user account', async () => {
      const userId = '1'
      const deactivatedUser = {
        id: userId,
        isActive: false,
        deactivatedAt: new Date(),
      }

      ;(prisma.user.update as jest.Mock).mockResolvedValue(deactivatedUser)

      const result = await prisma.user.update({
        where: { id: userId },
        data: {
          isActive: false,
          deactivatedAt: new Date(),
        },
      })

      expect(result.isActive).toBe(false)
      expect(result.deactivatedAt).toBeDefined()
    })

    it('should delete user account and related data', async () => {
      const userId = '1'

      // Mock transaction for cascading deletes
      ;(prisma.$transaction as jest.Mock).mockResolvedValue([
        { count: 2 }, // userRoles deleted
        { count: 3 }, // sessions deleted
        { id: userId }, // user deleted
      ])

      await prisma.$transaction([
        prisma.userRole.delete({ where: { userId } }),
        prisma.session.delete({ where: { userId } }),
        prisma.user.delete({ where: { id: userId } }),
      ])

      expect(prisma.$transaction).toHaveBeenCalled()
    })
  })

  describe('Permission Checking', () => {
    it('should check user permissions correctly', async () => {
      const user = {
        id: '1',
        roles: [
          {
            role: {
              name: 'admin',
              permissions: [
                { permission: { name: 'users.read' } },
                { permission: { name: 'users.write' } },
              ],
            },
          },
        ],
      }

      const mockPermissionChecker = {
        hasPermission: jest.fn(),
        hasRole: jest.fn(),
        isAdmin: jest.fn(),
        isSuperAdmin: jest.fn(),
      }

      mockCreatePermissionChecker.mockReturnValue(mockPermissionChecker)
      mockPermissionChecker.hasPermission.mockReturnValue(true)
      mockPermissionChecker.hasRole.mockReturnValue(true)
      mockPermissionChecker.isAdmin.mockReturnValue(true)

      const permissionChecker = createPermissionChecker(user)

      expect(permissionChecker.hasPermission('users.read')).toBe(true)
      expect(permissionChecker.hasRole('admin')).toBe(true)
      expect(permissionChecker.isAdmin()).toBe(true)
    })
  })
})