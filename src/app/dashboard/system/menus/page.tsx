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
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { toast } from 'sonner'
import { useSession } from 'next-auth/react'
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd'

interface Menu {
  id: string
  title: string
  slug: string
  icon?: string
  path?: string
  parent_id?: string
  order_index: number
  level: number
  is_active: boolean
  is_external: boolean
  target: string
  description?: string
  children?: Menu[]
  menu_roles: {
    role: {
      id: string
      name: string
    }
  }[]
}

interface Role {
  id: string
  name: string
  description?: string
}

interface MenuFormData {
  title: string
  slug: string
  icon: string
  path: string
  parent_id: string
  is_active: boolean
  is_external: boolean
  target: string
  description: string
  role_ids: string[]
}

const ICON_OPTIONS = [
  { value: 'mdi:view-dashboard', label: 'Dashboard', icon: 'mdi:view-dashboard' },
  { value: 'mdi:chart-line', label: 'Analytics', icon: 'mdi:chart-line' },
  { value: 'mdi:file-document', label: 'Content', icon: 'mdi:file-document' },
  { value: 'mdi:account-multiple', label: 'Users', icon: 'mdi:account-multiple' },
  { value: 'mdi:shield-account', label: 'Roles', icon: 'mdi:shield-account' },
  { value: 'mdi:key', label: 'Permissions', icon: 'mdi:key' },
  { value: 'mdi:cog', label: 'Settings', icon: 'mdi:cog' },
  { value: 'mdi:folder', label: 'Folder', icon: 'mdi:folder' },
  { value: 'mdi:home', label: 'Home', icon: 'mdi:home' },
  { value: 'mdi:menu', label: 'Menu', icon: 'mdi:menu' },
  { value: 'mdi:link', label: 'Link', icon: 'mdi:link' },
  { value: 'mdi:external-link', label: 'External Link', icon: 'mdi:external-link' },
]

const TARGET_OPTIONS = [
  { value: '_self', label: 'Same Window' },
  { value: '_blank', label: 'New Window' },
  { value: '_parent', label: 'Parent Frame' },
  { value: '_top', label: 'Top Frame' },
]

export default function MenuManagementPage() {
  const { data: session } = useSession()
  const [menus, setMenus] = useState<Menu[]>([])
  const [roles, setRoles] = useState<Role[]>([])
  const [loading, setLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingMenu, setEditingMenu] = useState<Menu | null>(null)
  const [formData, setFormData] = useState<MenuFormData>({
    title: '',
    slug: '',
    icon: '',
    path: '',
    parent_id: '',
    is_active: true,
    is_external: false,
    target: '_self',
    description: '',
    role_ids: []
  })

  useEffect(() => {
    fetchMenus()
    fetchRoles()
  }, [])

  const fetchMenus = async () => {
    try {
      const response = await fetch('/api/menus')
      if (response.ok) {
        const data = await response.json()
        setMenus(data)
      }
    } catch (error) {
      console.error('Error fetching menus:', error)
      toast.error('Failed to load menus')
    } finally {
      setLoading(false)
    }
  }

  const fetchRoles = async () => {
    try {
      const response = await fetch('/api/roles')
      if (response.ok) {
        const data = await response.json()
        setRoles(data)
      }
    } catch (error) {
      console.error('Error fetching roles:', error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      const url = editingMenu ? `/api/menus/${editingMenu.id}` : '/api/menus'
      const method = editingMenu ? 'PUT' : 'POST'
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        toast.success(editingMenu ? 'Menu updated successfully' : 'Menu created successfully')
        setIsDialogOpen(false)
        resetForm()
        fetchMenus()
      } else {
        const error = await response.json()
        toast.error(error.message || 'Failed to save menu')
      }
    } catch (error) {
      console.error('Error saving menu:', error)
      toast.error('Failed to save menu')
    }
  }

  const handleEdit = (menu: Menu) => {
    setEditingMenu(menu)
    setFormData({
      title: menu.title,
      slug: menu.slug,
      icon: menu.icon || '',
      path: menu.path || '',
      parent_id: menu.parent_id || '',
      is_active: menu.is_active,
      is_external: menu.is_external,
      target: menu.target,
      description: menu.description || '',
      role_ids: menu.menu_roles.map(mr => mr.role.id)
    })
    setIsDialogOpen(true)
  }

  const handleDelete = async (menuId: string) => {
    if (!confirm('Are you sure you want to delete this menu? This action cannot be undone.')) {
      return
    }

    try {
      const response = await fetch(`/api/menus/${menuId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        toast.success('Menu deleted successfully')
        fetchMenus()
      } else {
        const error = await response.json()
        toast.error(error.message || 'Failed to delete menu')
      }
    } catch (error) {
      console.error('Error deleting menu:', error)
      toast.error('Failed to delete menu')
    }
  }

  const handleDragEnd = async (result: any) => {
    if (!result.destination) return

    const items = Array.from(menus)
    const [reorderedItem] = items.splice(result.source.index, 1)
    items.splice(result.destination.index, 0, reorderedItem)

    // Update order_index for all items
    const updatedItems = items.map((item, index) => ({
      ...item,
      order_index: index
    }))

    setMenus(updatedItems)

    try {
      await fetch('/api/menus/reorder', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          menus: updatedItems.map(item => ({ id: item.id, order_index: item.order_index }))
        }),
      })
      toast.success('Menu order updated successfully')
    } catch (error) {
      console.error('Error updating menu order:', error)
      toast.error('Failed to update menu order')
      fetchMenus() // Revert on error
    }
  }

  const resetForm = () => {
    setFormData({
      title: '',
      slug: '',
      icon: '',
      path: '',
      parent_id: '',
      is_active: true,
      is_external: false,
      target: '_self',
      description: '',
      role_ids: []
    })
    setEditingMenu(null)
  }

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')
  }

  const buildMenuTree = (menus: Menu[]): Menu[] => {
    const menuMap = new Map<string, Menu>()
    const rootMenus: Menu[] = []

    // Create a map of all menus
    menus.forEach(menu => {
      menuMap.set(menu.id, { ...menu, children: [] })
    })

    // Build the tree structure
    menus.forEach(menu => {
      const menuItem = menuMap.get(menu.id)!
      if (menu.parent_id && menuMap.has(menu.parent_id)) {
        const parent = menuMap.get(menu.parent_id)!
        parent.children!.push(menuItem)
      } else {
        rootMenus.push(menuItem)
      }
    })

    return rootMenus.sort((a, b) => a.order_index - b.order_index)
  }

  const renderMenuTree = (menus: Menu[], level = 0) => {
    return menus.map((menu, index) => (
      <Draggable key={menu.id} draggableId={menu.id} index={index}>
        {(provided) => (
          <div
            ref={provided.innerRef}
            {...provided.draggableProps}
            {...provided.dragHandleProps}
            className={`mb-2 ${level > 0 ? 'ml-6' : ''}`}
          >
            <Card className="border-l-4 border-l-orange-500">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Icon icon="mdi:drag-vertical" className="text-gray-400 cursor-grab" />
                    {menu.icon && <Icon icon={menu.icon} className="w-5 h-5" />}
                    <div>
                      <div className="flex items-center space-x-2">
                        <h3 className="font-medium">{menu.title}</h3>
                        {!menu.is_active && <Badge variant="secondary">Inactive</Badge>}
                        {menu.is_external && <Badge variant="outline">External</Badge>}
                      </div>
                      <p className="text-sm text-gray-500">
                        {menu.path || 'No path'} • Level {menu.level}
                      </p>
                      {menu.menu_roles.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1">
                          {menu.menu_roles.map(mr => (
                            <Badge key={mr.role.id} variant="outline" className="text-xs">
                              {mr.role.name}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(menu)}
                    >
                      <Icon icon="mdi:pencil" className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(menu.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Icon icon="mdi:delete" className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
            {menu.children && menu.children.length > 0 && (
              <div className="mt-2">
                {renderMenuTree(menu.children, level + 1)}
              </div>
            )}
          </div>
        )}
      </Draggable>
    ))
  }

  const menuTree = buildMenuTree(menus)
  const parentMenuOptions = menus.filter(menu => menu.level < 3)

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Icon icon="mdi:loading" className="w-8 h-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Menu Management</h1>
          <p className="text-gray-600 mt-1">
            Manage navigation menus and their hierarchical structure
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Icon icon="mdi:plus" className="w-4 h-4 mr-2" />
              Add Menu
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingMenu ? 'Edit Menu' : 'Create New Menu'}
              </DialogTitle>
              <DialogDescription>
                {editingMenu ? 'Update the menu details below.' : 'Create a new menu item with hierarchical support.'}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="title">Title *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => {
                      const title = e.target.value
                      setFormData(prev => ({
                        ...prev,
                        title,
                        slug: generateSlug(title)
                      }))
                    }}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="slug">Slug *</Label>
                  <Input
                    id="slug"
                    value={formData.slug}
                    onChange={(e) => setFormData(prev => ({ ...prev, slug: e.target.value }))}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="icon">Icon</Label>
                  <Select value={formData.icon} onValueChange={(value) => setFormData(prev => ({ ...prev, icon: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select an icon" />
                    </SelectTrigger>
                    <SelectContent>
                      {ICON_OPTIONS.map(option => (
                        <SelectItem key={option.value} value={option.value}>
                          <div className="flex items-center space-x-2">
                            <Icon icon={option.icon} className="w-4 h-4" />
                            <span>{option.label}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="parent_id">Parent Menu</Label>
                  <Select value={formData.parent_id} onValueChange={(value) => setFormData(prev => ({ ...prev, parent_id: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select parent menu" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">No Parent (Root Level)</SelectItem>
                      {parentMenuOptions.map(menu => (
                        <SelectItem key={menu.id} value={menu.id}>
                          {'  '.repeat(menu.level - 1)}{menu.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="path">Path/URL</Label>
                <Input
                  id="path"
                  value={formData.path}
                  onChange={(e) => setFormData(prev => ({ ...prev, path: e.target.value }))}
                  placeholder="/dashboard/example or https://external.com"
                />
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Optional description for this menu item"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="target">Link Target</Label>
                  <Select value={formData.target} onValueChange={(value) => setFormData(prev => ({ ...prev, target: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {TARGET_OPTIONS.map(option => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="is_active"
                      checked={formData.is_active}
                      onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_active: checked }))}
                    />
                    <Label htmlFor="is_active">Active</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="is_external"
                      checked={formData.is_external}
                      onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_external: checked }))}
                    />
                    <Label htmlFor="is_external">External Link</Label>
                  </div>
                </div>
              </div>

              <div>
                <Label>Role Access</Label>
                <div className="grid grid-cols-2 gap-2 mt-2 max-h-32 overflow-y-auto border rounded p-2">
                  {roles.map(role => (
                    <div key={role.id} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id={`role-${role.id}`}
                        checked={formData.role_ids.includes(role.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setFormData(prev => ({ ...prev, role_ids: [...prev.role_ids, role.id] }))
                          } else {
                            setFormData(prev => ({ ...prev, role_ids: prev.role_ids.filter(id => id !== role.id) }))
                          }
                        }}
                        className="rounded"
                      />
                      <Label htmlFor={`role-${role.id}`} className="text-sm">
                        {role.name}
                      </Label>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Leave empty to allow access for all authenticated users
                </p>
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">
                  {editingMenu ? 'Update Menu' : 'Create Menu'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Menu Structure</CardTitle>
          <CardDescription>
            Drag and drop to reorder menus. Maximum 3 levels of hierarchy supported.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {menuTree.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Icon icon="mdi:menu" className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No menus created yet. Click "Add Menu" to get started.</p>
            </div>
          ) : (
            <DragDropContext onDragEnd={handleDragEnd}>
              <Droppable droppableId="menus">
                {(provided) => (
                  <div {...provided.droppableProps} ref={provided.innerRef}>
                    {renderMenuTree(menuTree)}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </DragDropContext>
          )}
        </CardContent>
      </Card>
    </div>
  )
}