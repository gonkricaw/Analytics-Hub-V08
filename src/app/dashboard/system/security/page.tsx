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
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { toast } from 'sonner'
import { useSession } from 'next-auth/react'

interface IPBlacklistEntry {
  id: string
  ip_address: string
  reason?: string
  blocked_at: string
  blocked_until?: string
  is_permanent: boolean
  is_active: boolean
  created_by?: string
  location?: {
    country: string
    city: string
    region: string
  }
  attempts_count: number
}

interface SecurityEvent {
  id: string
  event_type: string
  ip_address: string
  user_id?: string
  user_email?: string
  details: any
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
  created_at: string
  location?: {
    country: string
    city: string
    region: string
  }
}

interface SecurityStats {
  total_blocked_ips: number
  active_blocks: number
  failed_logins_24h: number
  security_events_24h: number
  top_threat_countries: Array<{
    country: string
    count: number
  }>
}

export default function SecurityManagementPage() {
  const { data: session } = useSession()
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('overview')
  const [blacklist, setBlacklist] = useState<IPBlacklistEntry[]>([])
  const [securityEvents, setSecurityEvents] = useState<SecurityEvent[]>([])
  const [securityStats, setSecurityStats] = useState<SecurityStats | null>(null)
  const [showAddIPDialog, setShowAddIPDialog] = useState(false)
  const [newIPAddress, setNewIPAddress] = useState('')
  const [newIPReason, setNewIPReason] = useState('')
  const [isPermanentBlock, setIsPermanentBlock] = useState(false)
  const [blockDuration, setBlockDuration] = useState(24)
  const [searchTerm, setSearchTerm] = useState('')
  const [eventFilter, setEventFilter] = useState('all')
  const [severityFilter, setSeverityFilter] = useState('all')

  useEffect(() => {
    fetchSecurityData()
  }, [])

  const fetchSecurityData = async () => {
    try {
      setLoading(true)
      const [blacklistRes, eventsRes, statsRes] = await Promise.all([
        fetch('/api/system/security/blacklist'),
        fetch('/api/system/security/events'),
        fetch('/api/system/security/stats')
      ])

      if (blacklistRes.ok) {
        const blacklistData = await blacklistRes.json()
        setBlacklist(blacklistData.blacklist)
      }

      if (eventsRes.ok) {
        const eventsData = await eventsRes.json()
        setSecurityEvents(eventsData.events)
      }

      if (statsRes.ok) {
        const statsData = await statsRes.json()
        setSecurityStats(statsData.stats)
      }
    } catch (error) {
      console.error('Error fetching security data:', error)
      toast.error('Failed to load security data')
    } finally {
      setLoading(false)
    }
  }

  const addIPToBlacklist = async () => {
    if (!newIPAddress.trim()) {
      toast.error('Please enter an IP address')
      return
    }

    // Basic IP validation
    const ipRegex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/
    if (!ipRegex.test(newIPAddress.trim())) {
      toast.error('Please enter a valid IP address')
      return
    }

    try {
      const response = await fetch('/api/system/security/blacklist', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ip_address: newIPAddress.trim(),
          reason: newIPReason.trim() || 'Manually blocked',
          is_permanent: isPermanentBlock,
          duration_hours: isPermanentBlock ? null : blockDuration
        })
      })

      if (response.ok) {
        toast.success('IP address added to blacklist')
        setShowAddIPDialog(false)
        setNewIPAddress('')
        setNewIPReason('')
        setIsPermanentBlock(false)
        setBlockDuration(24)
        fetchSecurityData()
      } else {
        const error = await response.json()
        toast.error(error.message || 'Failed to add IP to blacklist')
      }
    } catch (error) {
      console.error('Error adding IP to blacklist:', error)
      toast.error('Error adding IP to blacklist')
    }
  }

  const removeFromBlacklist = async (id: string) => {
    try {
      const response = await fetch(`/api/system/security/blacklist/${id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        toast.success('IP address removed from blacklist')
        fetchSecurityData()
      } else {
        const error = await response.json()
        toast.error(error.message || 'Failed to remove IP from blacklist')
      }
    } catch (error) {
      console.error('Error removing IP from blacklist:', error)
      toast.error('Error removing IP from blacklist')
    }
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'CRITICAL': return 'bg-red-600'
      case 'HIGH': return 'bg-orange-600'
      case 'MEDIUM': return 'bg-yellow-600'
      case 'LOW': return 'bg-blue-600'
      default: return 'bg-gray-600'
    }
  }

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'CRITICAL': return 'mdi:alert-octagon'
      case 'HIGH': return 'mdi:alert'
      case 'MEDIUM': return 'mdi:alert-circle'
      case 'LOW': return 'mdi:information'
      default: return 'mdi:help-circle'
    }
  }

  const filteredBlacklist = blacklist.filter(entry => 
    entry.ip_address.toLowerCase().includes(searchTerm.toLowerCase()) ||
    entry.reason?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const filteredEvents = securityEvents.filter(event => {
    const matchesSearch = event.ip_address.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         event.user_email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         event.event_type.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesEventFilter = eventFilter === 'all' || event.event_type === eventFilter
    const matchesSeverityFilter = severityFilter === 'all' || event.severity === severityFilter
    
    return matchesSearch && matchesEventFilter && matchesSeverityFilter
  })

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex items-center space-x-2">
          <Icon icon="mdi:loading" className="w-6 h-6 animate-spin text-orange-500" />
          <span className="text-white">Loading security data...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Security Management</h1>
          <p className="text-gray-400 mt-1">Monitor security events and manage IP blacklist</p>
        </div>
        <Button 
          onClick={() => setShowAddIPDialog(true)}
          className="bg-orange-600 hover:bg-orange-700"
        >
          <Icon icon="mdi:plus" className="w-4 h-4 mr-2" />
          Block IP Address
        </Button>
      </div>

      {/* Security Stats */}
      {securityStats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <Icon icon="mdi:shield-off" className="w-8 h-8 text-red-500" />
                <div>
                  <p className="text-2xl font-bold text-white">{securityStats.total_blocked_ips}</p>
                  <p className="text-gray-400 text-sm">Total Blocked IPs</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <Icon icon="mdi:shield-alert" className="w-8 h-8 text-orange-500" />
                <div>
                  <p className="text-2xl font-bold text-white">{securityStats.active_blocks}</p>
                  <p className="text-gray-400 text-sm">Active Blocks</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <Icon icon="mdi:login-variant" className="w-8 h-8 text-yellow-500" />
                <div>
                  <p className="text-2xl font-bold text-white">{securityStats.failed_logins_24h}</p>
                  <p className="text-gray-400 text-sm">Failed Logins (24h)</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <Icon icon="mdi:security" className="w-8 h-8 text-blue-500" />
                <div>
                  <p className="text-2xl font-bold text-white">{securityStats.security_events_24h}</p>
                  <p className="text-gray-400 text-sm">Security Events (24h)</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3 bg-gray-800">
          <TabsTrigger value="overview" className="data-[state=active]:bg-orange-600">
            <Icon icon="mdi:view-dashboard" className="w-4 h-4 mr-2" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="blacklist" className="data-[state=active]:bg-orange-600">
            <Icon icon="mdi:shield-off" className="w-4 h-4 mr-2" />
            IP Blacklist
          </TabsTrigger>
          <TabsTrigger value="events" className="data-[state=active]:bg-orange-600">
            <Icon icon="mdi:security" className="w-4 h-4 mr-2" />
            Security Events
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Top Threat Countries */}
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center">
                  <Icon icon="mdi:earth" className="w-5 h-5 mr-2" />
                  Top Threat Countries
                </CardTitle>
              </CardHeader>
              <CardContent>
                {securityStats?.top_threat_countries.length ? (
                  <div className="space-y-3">
                    {securityStats.top_threat_countries.map((country, index) => (
                      <div key={country.country} className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <span className="text-gray-400">#{index + 1}</span>
                          <span className="text-white">{country.country}</span>
                        </div>
                        <Badge variant="secondary">{country.count} threats</Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-400">No threat data available</p>
                )}
              </CardContent>
            </Card>

            {/* Recent Security Events */}
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center">
                  <Icon icon="mdi:clock-outline" className="w-5 h-5 mr-2" />
                  Recent Security Events
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {securityEvents.slice(0, 5).map((event) => (
                    <div key={event.id} className="flex items-center space-x-3 p-2 bg-gray-700 rounded">
                      <Icon 
                        icon={getSeverityIcon(event.severity)} 
                        className={`w-4 h-4 ${event.severity === 'CRITICAL' ? 'text-red-500' : 
                          event.severity === 'HIGH' ? 'text-orange-500' : 
                          event.severity === 'MEDIUM' ? 'text-yellow-500' : 'text-blue-500'}`} 
                      />
                      <div className="flex-1">
                        <p className="text-white text-sm font-medium">{event.event_type}</p>
                        <p className="text-gray-400 text-xs">{event.ip_address}</p>
                      </div>
                      <span className="text-gray-400 text-xs">
                        {new Date(event.created_at).toLocaleTimeString()}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* IP Blacklist Tab */}
        <TabsContent value="blacklist" className="space-y-6">
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center">
                <Icon icon="mdi:shield-off" className="w-5 h-5 mr-2" />
                IP Blacklist Management
              </CardTitle>
              <CardDescription className="text-gray-400">
                Manage blocked IP addresses and their access restrictions
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Search */}
              <div className="flex items-center space-x-2">
                <div className="relative flex-1">
                  <Icon icon="mdi:magnify" className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    placeholder="Search IP addresses or reasons..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 bg-gray-700 border-gray-600 text-white"
                  />
                </div>
              </div>

              {/* Blacklist Table */}
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-600">
                      <th className="text-left text-white font-medium py-2">IP Address</th>
                      <th className="text-left text-white font-medium py-2">Reason</th>
                      <th className="text-left text-white font-medium py-2">Location</th>
                      <th className="text-left text-white font-medium py-2">Status</th>
                      <th className="text-left text-white font-medium py-2">Blocked At</th>
                      <th className="text-left text-white font-medium py-2">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredBlacklist.map((entry) => (
                      <tr key={entry.id} className="border-b border-gray-700">
                        <td className="py-3">
                          <span className="text-white font-mono">{entry.ip_address}</span>
                        </td>
                        <td className="py-3">
                          <span className="text-gray-300">{entry.reason || 'No reason provided'}</span>
                        </td>
                        <td className="py-3">
                          {entry.location ? (
                            <span className="text-gray-300">
                              {entry.location.city}, {entry.location.country}
                            </span>
                          ) : (
                            <span className="text-gray-500">Unknown</span>
                          )}
                        </td>
                        <td className="py-3">
                          <Badge 
                            variant={entry.is_active ? 'destructive' : 'secondary'}
                            className={entry.is_active ? 'bg-red-600' : 'bg-gray-600'}
                          >
                            {entry.is_active ? 'Active' : 'Expired'}
                          </Badge>
                          {entry.is_permanent && (
                            <Badge variant="outline" className="ml-2 border-orange-500 text-orange-500">
                              Permanent
                            </Badge>
                          )}
                        </td>
                        <td className="py-3">
                          <span className="text-gray-400 text-sm">
                            {new Date(entry.blocked_at).toLocaleString()}
                          </span>
                        </td>
                        <td className="py-3">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => removeFromBlacklist(entry.id)}
                            className="border-red-600 text-red-600 hover:bg-red-600 hover:text-white"
                          >
                            <Icon icon="mdi:delete" className="w-4 h-4" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                
                {filteredBlacklist.length === 0 && (
                  <div className="text-center py-8">
                    <Icon icon="mdi:shield-check" className="w-12 h-12 text-gray-500 mx-auto mb-4" />
                    <p className="text-gray-400">No blocked IP addresses found</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security Events Tab */}
        <TabsContent value="events" className="space-y-6">
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center">
                <Icon icon="mdi:security" className="w-5 h-5 mr-2" />
                Security Events Log
              </CardTitle>
              <CardDescription className="text-gray-400">
                Monitor and analyze security-related events and activities
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Filters */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="relative">
                  <Icon icon="mdi:magnify" className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    placeholder="Search events..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 bg-gray-700 border-gray-600 text-white"
                  />
                </div>
                
                <Select value={eventFilter} onValueChange={setEventFilter}>
                  <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                    <SelectValue placeholder="Event Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Events</SelectItem>
                    <SelectItem value="LOGIN_FAILED">Failed Login</SelectItem>
                    <SelectItem value="LOGIN_SUCCESS">Successful Login</SelectItem>
                    <SelectItem value="IP_BLOCKED">IP Blocked</SelectItem>
                    <SelectItem value="SUSPICIOUS_ACTIVITY">Suspicious Activity</SelectItem>
                  </SelectContent>
                </Select>
                
                <Select value={severityFilter} onValueChange={setSeverityFilter}>
                  <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                    <SelectValue placeholder="Severity" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Severities</SelectItem>
                    <SelectItem value="CRITICAL">Critical</SelectItem>
                    <SelectItem value="HIGH">High</SelectItem>
                    <SelectItem value="MEDIUM">Medium</SelectItem>
                    <SelectItem value="LOW">Low</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Events List */}
              <div className="space-y-2">
                {filteredEvents.map((event) => (
                  <div key={event.id} className="p-4 bg-gray-700 rounded-lg">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-3">
                        <Icon 
                          icon={getSeverityIcon(event.severity)} 
                          className={`w-5 h-5 mt-0.5 ${
                            event.severity === 'CRITICAL' ? 'text-red-500' : 
                            event.severity === 'HIGH' ? 'text-orange-500' : 
                            event.severity === 'MEDIUM' ? 'text-yellow-500' : 'text-blue-500'
                          }`} 
                        />
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-1">
                            <h4 className="text-white font-medium">{event.event_type}</h4>
                            <Badge 
                              className={getSeverityColor(event.severity)}
                            >
                              {event.severity}
                            </Badge>
                          </div>
                          <p className="text-gray-300 text-sm mb-2">
                            IP: {event.ip_address}
                            {event.user_email && ` • User: ${event.user_email}`}
                            {event.location && ` • Location: ${event.location.city}, ${event.location.country}`}
                          </p>
                          {event.details && (
                            <div className="text-gray-400 text-xs">
                              <pre className="whitespace-pre-wrap">
                                {JSON.stringify(event.details, null, 2)}
                              </pre>
                            </div>
                          )}
                        </div>
                      </div>
                      <span className="text-gray-400 text-sm">
                        {new Date(event.created_at).toLocaleString()}
                      </span>
                    </div>
                  </div>
                ))}
                
                {filteredEvents.length === 0 && (
                  <div className="text-center py-8">
                    <Icon icon="mdi:security" className="w-12 h-12 text-gray-500 mx-auto mb-4" />
                    <p className="text-gray-400">No security events found</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Add IP Dialog */}
      <Dialog open={showAddIPDialog} onOpenChange={setShowAddIPDialog}>
        <DialogContent className="bg-gray-800 border-gray-700">
          <DialogHeader>
            <DialogTitle className="text-white">Block IP Address</DialogTitle>
            <DialogDescription className="text-gray-400">
              Add an IP address to the blacklist to prevent access
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="ip_address" className="text-white">IP Address</Label>
              <Input
                id="ip_address"
                value={newIPAddress}
                onChange={(e) => setNewIPAddress(e.target.value)}
                placeholder="192.168.1.1"
                className="bg-gray-700 border-gray-600 text-white"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="reason" className="text-white">Reason (Optional)</Label>
              <Textarea
                id="reason"
                value={newIPReason}
                onChange={(e) => setNewIPReason(e.target.value)}
                placeholder="Reason for blocking this IP address"
                className="bg-gray-700 border-gray-600 text-white"
                rows={3}
              />
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-white">Permanent Block</Label>
                <Switch
                  checked={isPermanentBlock}
                  onCheckedChange={setIsPermanentBlock}
                />
              </div>
              
              {!isPermanentBlock && (
                <div className="space-y-2">
                  <Label htmlFor="duration" className="text-white">Block Duration (hours)</Label>
                  <Input
                    id="duration"
                    type="number"
                    value={blockDuration}
                    onChange={(e) => setBlockDuration(parseInt(e.target.value) || 24)}
                    min="1"
                    max="8760"
                    className="bg-gray-700 border-gray-600 text-white"
                  />
                </div>
              )}
            </div>
          </div>
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowAddIPDialog(false)}
              className="border-gray-600 text-gray-300 hover:bg-gray-700"
            >
              Cancel
            </Button>
            <Button
              onClick={addIPToBlacklist}
              className="bg-red-600 hover:bg-red-700"
            >
              Block IP Address
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}