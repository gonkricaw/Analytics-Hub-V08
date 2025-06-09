'use client'

import React, { useState } from 'react'
import { Icon } from '@iconify/react'
import { Button } from '@/components/ui/Button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/Dialog'

interface DefaultAvatarSelectorProps {
  isOpen: boolean
  onClose: () => void
  onSelect: (avatarUrl: string) => void
  currentAvatar?: string
}

// Default avatar options
const DEFAULT_AVATARS = [
  {
    id: 'avatar-1',
    url: '/avatars/default-1.svg',
    name: 'Professional',
    category: 'business'
  },
  {
    id: 'avatar-2',
    url: '/avatars/default-2.svg',
    name: 'Casual',
    category: 'casual'
  },
  {
    id: 'avatar-3',
    url: '/avatars/default-3.svg',
    name: 'Creative',
    category: 'creative'
  },
  {
    id: 'avatar-4',
    url: '/avatars/default-4.svg',
    name: 'Tech',
    category: 'tech'
  },
  {
    id: 'avatar-5',
    url: '/avatars/default-5.svg',
    name: 'Academic',
    category: 'academic'
  },
  {
    id: 'avatar-6',
    url: '/avatars/default-6.svg',
    name: 'Executive',
    category: 'business'
  },
  {
    id: 'avatar-7',
    url: '/avatars/default-7.svg',
    name: 'Designer',
    category: 'creative'
  },
  {
    id: 'avatar-8',
    url: '/avatars/default-8.svg',
    name: 'Developer',
    category: 'tech'
  },
  {
    id: 'avatar-9',
    url: '/avatars/default-9.svg',
    name: 'Analyst',
    category: 'business'
  },
  {
    id: 'avatar-10',
    url: '/avatars/default-10.svg',
    name: 'Manager',
    category: 'business'
  },
  {
    id: 'avatar-11',
    url: '/avatars/default-11.svg',
    name: 'Consultant',
    category: 'business'
  },
  {
    id: 'avatar-12',
    url: '/avatars/default-12.svg',
    name: 'Researcher',
    category: 'academic'
  }
]

// Avatar categories
const AVATAR_CATEGORIES = [
  { id: 'all', name: 'All', icon: 'mdi:view-grid' },
  { id: 'business', name: 'Business', icon: 'mdi:briefcase' },
  { id: 'tech', name: 'Technology', icon: 'mdi:laptop' },
  { id: 'creative', name: 'Creative', icon: 'mdi:palette' },
  { id: 'academic', name: 'Academic', icon: 'mdi:school' },
  { id: 'casual', name: 'Casual', icon: 'mdi:account-casual' }
]

// Generate initials-based avatar
function generateInitialsAvatar(initials: string, backgroundColor: string = '#6B7280'): string {
  const canvas = document.createElement('canvas')
  canvas.width = 200
  canvas.height = 200
  const ctx = canvas.getContext('2d')
  
  if (ctx) {
    // Background
    ctx.fillStyle = backgroundColor
    ctx.fillRect(0, 0, 200, 200)
    
    // Text
    ctx.fillStyle = '#FFFFFF'
    ctx.font = 'bold 80px Arial'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(initials.toUpperCase(), 100, 100)
  }
  
  return canvas.toDataURL('image/png')
}

// Color options for initials avatars
const AVATAR_COLORS = [
  '#EF4444', // red
  '#F97316', // orange
  '#F59E0B', // amber
  '#EAB308', // yellow
  '#84CC16', // lime
  '#22C55E', // green
  '#10B981', // emerald
  '#14B8A6', // teal
  '#06B6D4', // cyan
  '#0EA5E9', // sky
  '#3B82F6', // blue
  '#6366F1', // indigo
  '#8B5CF6', // violet
  '#A855F7', // purple
  '#D946EF', // fuchsia
  '#EC4899', // pink
  '#6B7280', // gray
  '#374151'  // dark gray
]

export function DefaultAvatarSelector({
  isOpen,
  onClose,
  onSelect,
  currentAvatar
}: DefaultAvatarSelectorProps) {
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [selectedAvatar, setSelectedAvatar] = useState<string | null>(currentAvatar || null)
  const [showInitialsGenerator, setShowInitialsGenerator] = useState(false)
  const [initials, setInitials] = useState('')
  const [selectedColor, setSelectedColor] = useState(AVATAR_COLORS[0])

  // Filter avatars by category
  const filteredAvatars = selectedCategory === 'all' 
    ? DEFAULT_AVATARS 
    : DEFAULT_AVATARS.filter(avatar => avatar.category === selectedCategory)

  // Handle avatar selection
  const handleAvatarSelect = (avatarUrl: string) => {
    setSelectedAvatar(avatarUrl)
  }

  // Handle confirm selection
  const handleConfirm = () => {
    if (selectedAvatar) {
      onSelect(selectedAvatar)
      onClose()
    }
  }

  // Generate initials avatar
  const handleGenerateInitials = () => {
    if (initials.trim()) {
      const avatarUrl = generateInitialsAvatar(initials.trim(), selectedColor)
      setSelectedAvatar(avatarUrl)
      setShowInitialsGenerator(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle>Choose Default Avatar</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Category tabs */}
          <div className="flex flex-wrap gap-2">
            {AVATAR_CATEGORIES.map((category) => (
              <Button
                key={category.id}
                variant={selectedCategory === category.id ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedCategory(category.id)}
                className="flex items-center space-x-2"
              >
                <Icon icon={category.icon} className="w-4 h-4" />
                <span>{category.name}</span>
              </Button>
            ))}
            <Button
              variant={showInitialsGenerator ? 'default' : 'outline'}
              size="sm"
              onClick={() => setShowInitialsGenerator(!showInitialsGenerator)}
              className="flex items-center space-x-2"
            >
              <Icon icon="mdi:format-letter-case" className="w-4 h-4" />
              <span>Initials</span>
            </Button>
          </div>

          {/* Initials generator */}
          {showInitialsGenerator && (
            <div className="bg-gray-800 rounded-lg p-4 space-y-4">
              <h3 className="text-lg font-medium text-white">Generate Initials Avatar</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-300">Initials (1-3 characters)</label>
                  <input
                    type="text"
                    value={initials}
                    onChange={(e) => setInitials(e.target.value.slice(0, 3))}
                    placeholder="e.g., JD"
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-300">Background Color</label>
                  <div className="flex flex-wrap gap-2">
                    {AVATAR_COLORS.map((color) => (
                      <button
                        key={color}
                        onClick={() => setSelectedColor(color)}
                        className={`w-8 h-8 rounded-full border-2 ${
                          selectedColor === color ? 'border-white' : 'border-gray-600'
                        }`}
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                </div>
              </div>
              
              <div className="flex items-center space-x-4">
                {initials.trim() && (
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-300">Preview:</span>
                    <div 
                      className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold"
                      style={{ backgroundColor: selectedColor }}
                    >
                      {initials.toUpperCase()}
                    </div>
                  </div>
                )}
                
                <Button
                  onClick={handleGenerateInitials}
                  disabled={!initials.trim()}
                  size="sm"
                  className="bg-orange-600 hover:bg-orange-700"
                >
                  Generate Avatar
                </Button>
              </div>
            </div>
          )}

          {/* Avatar grid */}
          <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-4 max-h-96 overflow-y-auto">
            {filteredAvatars.map((avatar) => (
              <div
                key={avatar.id}
                className={`relative cursor-pointer rounded-lg overflow-hidden border-2 transition-all ${
                  selectedAvatar === avatar.url
                    ? 'border-orange-500 ring-2 ring-orange-500 ring-opacity-50'
                    : 'border-gray-600 hover:border-gray-500'
                }`}
                onClick={() => handleAvatarSelect(avatar.url)}
              >
                <div className="aspect-square bg-gray-700 flex items-center justify-center">
                  {/* Placeholder for avatar image */}
                  <Icon icon="mdi:account" className="w-8 h-8 text-gray-400" />
                </div>
                <div className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-20 transition-all" />
                {selectedAvatar === avatar.url && (
                  <div className="absolute top-1 right-1">
                    <Icon icon="mdi:check-circle" className="w-5 h-5 text-orange-500" />
                  </div>
                )}
                <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-75 text-white text-xs p-1 text-center">
                  {avatar.name}
                </div>
              </div>
            ))}
          </div>

          {/* Action buttons */}
          <div className="flex justify-between">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            
            <Button
              onClick={handleConfirm}
              disabled={!selectedAvatar}
              className="bg-orange-600 hover:bg-orange-700"
            >
              <Icon icon="mdi:check" className="w-4 h-4 mr-2" />
              Select Avatar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}