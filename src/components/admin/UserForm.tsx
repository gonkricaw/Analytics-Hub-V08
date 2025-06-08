'use client'

import React, { useState, useEffect } from 'react'
import { Icon } from '@iconify/react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Switch } from '@/components/ui/Switch'
import { createUserSchema, updateUserSchema } from '@/lib/validation'
import { z } from 'zod'

interface User {
  id: string
  firstName: string
  lastName: string
  email: string
  username?: string
  role: {
    id: string
    name: string
  }
  status: string
  isActive: boolean
}

interface Role {
  id: string
  name: string
  description?: string
}

interface UserFormProps {
  user?: User
  roles: Role[]
  onSubmit: (data: any) => Promise<void>
  onCancel: () => void
  isEditing?: boolean
}

type CreateUserData = z.infer<typeof createUserSchema>
type UpdateUserData = z.infer<typeof updateUserSchema>

export function UserForm({ user, roles, onSubmit, onCancel, isEditing = false }: UserFormProps) {
  const [formData, setFormData] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    email: user?.email || '',
    username: user?.username || '',
    roleId: user?.role.id || '',
    sendInvitation: true,
    is_active: user?.isActive ?? true
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Handle input changes
  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  // Validate form
  const validateForm = () => {
    try {
      if (isEditing) {
        // For editing, only validate provided fields
        const dataToValidate: any = {}
        if (formData.firstName) dataToValidate.firstName = formData.firstName
        if (formData.lastName) dataToValidate.lastName = formData.lastName
        if (formData.email) dataToValidate.email = formData.email
        if (formData.username) dataToValidate.username = formData.username
        if (formData.roleId) dataToValidate.role_id = formData.roleId
        dataToValidate.is_active = formData.is_active
        
        updateUserSchema.parse(dataToValidate)
      } else {
        // For creation, validate all required fields
        createUserSchema.parse({
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          roleId: formData.roleId,
          username: formData.username || undefined,
          sendInvitation: formData.sendInvitation
        })
      }
      setErrors({})
      return true
    } catch (error) {
      if (error instanceof z.ZodError) {
        const newErrors: Record<string, string> = {}
        error.errors.forEach((err) => {
          if (err.path.length > 0) {
            newErrors[err.path[0] as string] = err.message
          }
        })
        setErrors(newErrors)
      }
      return false
    }
  }

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    setIsSubmitting(true)
    try {
      if (isEditing) {
        // For editing, only send changed fields
        const updateData: any = {}
        if (formData.firstName !== user?.firstName) updateData.firstName = formData.firstName
        if (formData.lastName !== user?.lastName) updateData.lastName = formData.lastName
        if (formData.email !== user?.email) updateData.email = formData.email
        if (formData.username !== user?.username) updateData.username = formData.username
        if (formData.roleId !== user?.role.id) updateData.role_id = formData.roleId
        if (formData.is_active !== user?.isActive) updateData.is_active = formData.is_active
        
        await onSubmit(updateData)
      } else {
        // For creation, send all data
        await onSubmit({
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          roleId: formData.roleId,
          username: formData.username || undefined,
          sendInvitation: formData.sendInvitation
        })
      }
    } catch (error) {
      console.error('Form submission error:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  // Generate username suggestion
  const generateUsername = () => {
    if (formData.firstName && formData.lastName) {
      const suggestion = `${formData.firstName.toLowerCase()}.${formData.lastName.toLowerCase()}`
        .replace(/[^a-z0-9.]/g, '')
      setFormData(prev => ({ ...prev, username: suggestion }))
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Basic Information */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            First Name *
          </label>
          <Input
            type="text"
            value={formData.firstName}
            onChange={(e) => handleChange('firstName', e.target.value)}
            className={`bg-gray-700 border-gray-600 ${errors.firstName ? 'border-red-500' : ''}`}
            placeholder="Enter first name"
            disabled={isSubmitting}
          />
          {errors.firstName && (
            <p className="mt-1 text-sm text-red-400">{errors.firstName}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Last Name *
          </label>
          <Input
            type="text"
            value={formData.lastName}
            onChange={(e) => handleChange('lastName', e.target.value)}
            className={`bg-gray-700 border-gray-600 ${errors.lastName ? 'border-red-500' : ''}`}
            placeholder="Enter last name"
            disabled={isSubmitting}
          />
          {errors.lastName && (
            <p className="mt-1 text-sm text-red-400">{errors.lastName}</p>
          )}
        </div>
      </div>

      {/* Email */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Email Address *
        </label>
        <Input
          type="email"
          value={formData.email}
          onChange={(e) => handleChange('email', e.target.value)}
          className={`bg-gray-700 border-gray-600 ${errors.email ? 'border-red-500' : ''}`}
          placeholder="Enter email address"
          disabled={isSubmitting}
        />
        {errors.email && (
          <p className="mt-1 text-sm text-red-400">{errors.email}</p>
        )}
      </div>

      {/* Username */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Username
          <span className="text-gray-500 text-xs ml-1">(optional)</span>
        </label>
        <div className="flex space-x-2">
          <Input
            type="text"
            value={formData.username}
            onChange={(e) => handleChange('username', e.target.value)}
            className={`bg-gray-700 border-gray-600 ${errors.username ? 'border-red-500' : ''}`}
            placeholder="Enter username"
            disabled={isSubmitting}
          />
          {!isEditing && (
            <Button
              type="button"
              variant="outline"
              onClick={generateUsername}
              disabled={!formData.firstName || !formData.lastName || isSubmitting}
              className="border-gray-600 text-gray-300 hover:bg-gray-700"
            >
              <Icon icon="mdi:auto-fix" className="w-4 h-4" />
            </Button>
          )}
        </div>
        {errors.username && (
          <p className="mt-1 text-sm text-red-400">{errors.username}</p>
        )}
        <p className="mt-1 text-xs text-gray-500">
          If not provided, user can set their own username on first login
        </p>
      </div>

      {/* Role */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Role *
        </label>
        <Select
          value={formData.roleId}
          onChange={(e) => handleChange('roleId', e.target.value)}
          className={`bg-gray-700 border-gray-600 ${errors.roleId || errors.role_id ? 'border-red-500' : ''}`}
          disabled={isSubmitting}
        >
          <option value="">Select a role</option>
          {roles.map((role) => (
            <option key={role.id} value={role.id}>
              {role.name}
              {role.description && ` - ${role.description}`}
            </option>
          ))}
        </Select>
        {(errors.roleId || errors.role_id) && (
          <p className="mt-1 text-sm text-red-400">{errors.roleId || errors.role_id}</p>
        )}
      </div>

      {/* Options */}
      <div className="space-y-4">
        {!isEditing && (
          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium text-gray-300">
                Send Invitation Email
              </label>
              <p className="text-xs text-gray-500">
                Send an email invitation with login instructions
              </p>
            </div>
            <Switch
              checked={formData.sendInvitation}
              onCheckedChange={(checked) => handleChange('sendInvitation', checked)}
              disabled={isSubmitting}
            />
          </div>
        )}

        {isEditing && (
          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium text-gray-300">
                Active Status
              </label>
              <p className="text-xs text-gray-500">
                Enable or disable user account
              </p>
            </div>
            <Switch
              checked={formData.is_active}
              onCheckedChange={(checked) => handleChange('is_active', checked)}
              disabled={isSubmitting}
            />
          </div>
        )}
      </div>

      {/* Information Box */}
      <div className="bg-blue-900/20 border border-blue-700/30 rounded-lg p-4">
        <div className="flex items-start space-x-3">
          <Icon icon="mdi:information" className="w-5 h-5 text-blue-400 mt-0.5" />
          <div className="text-sm text-blue-300">
            {isEditing ? (
              <p>
                Changes will be applied immediately. The user will be notified of any role changes.
              </p>
            ) : (
              <div className="space-y-1">
                <p>
                  A temporary password will be generated and sent to the user via email.
                </p>
                <p>
                  The user will be required to change their password on first login.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Form Actions */}
      <div className="flex justify-end space-x-3 pt-4 border-t border-gray-700">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isSubmitting}
          className="border-gray-600 text-gray-300 hover:bg-gray-700"
        >
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={isSubmitting}
          className="bg-orange-600 hover:bg-orange-700"
        >
          {isSubmitting ? (
            <>
              <Icon icon="mdi:loading" className="w-4 h-4 mr-2 animate-spin" />
              {isEditing ? 'Updating...' : 'Creating...'}
            </>
          ) : (
            <>
              <Icon icon={isEditing ? 'mdi:content-save' : 'mdi:plus'} className="w-4 h-4 mr-2" />
              {isEditing ? 'Update User' : 'Create User'}
            </>
          )}
        </Button>
      </div>
    </form>
  )
}