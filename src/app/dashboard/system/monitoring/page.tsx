'use client'

import React, { useState, useEffect } from 'react'
import { Icon } from '@iconify/react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'
import { useSession } from 'next-auth/react'

interface SystemMetrics {
  cpu_usage: number
  memory_usage: number
  disk_usage: number
  network_in: number
  network_out: number
  active_connections: number
  response_time: number
  uptime: number
  last_updated: string
}

interface DatabaseMetrics {
  total_tables: number
  total_records: number
  database_size: number
  active_connections: number
  slow_queries: number
  cache_hit_ratio: number
  last_backup: string
  backup_size: number
}

interface ApplicationMetrics {
  total_users: number
  active_users_24h: number
  total_sessions: number
  api_requests_24h: number
  error_rate: number
  avg_response_time: number
  cache_hit_ratio: number
  queue_size: number
}

interface LogEntry {
  id: string
  level: 'INFO' | 'WARN' | 'ERROR' | 'DEBUG'
  message: string
  timestamp: string
  source: string
  details?: any
}

interface PerformanceData {
  timestamp: string
  cpu: number
  memory: number
  response_time: number
  requests_per_minute: number
}

export default function SystemMonitoringPage() {
  const { data: session } = useSession()
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('overview')
  const [systemMetrics, setSystemMetrics] = useState<SystemMetrics | null>(null)
  const [databaseMetrics, setDatabaseMetrics] = useState<DatabaseMetrics | null>(null)
  const [applicationMetrics, setApplicationMetrics] = useState<ApplicationMetrics | null>(null)
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [performanceData, setPerformanceData] = useState<PerformanceData[]>([])
  const [refreshInterval, setRefreshInterval] = useState(30) // seconds
  const [autoRefresh, setAutoRefresh] = useState(true)
  const [logLevel, setLogLevel] = useState('all')
  const [logSource, setLogSource] = useState('all')

  useEffect(() => {
    fetchMonitoringData()
    
    if (autoRefresh) {
      const interval = setInterval(() => {
        fetchMonitoringData()
      }, refreshInterval * 1000)
      
      return () => clearInterval(interval)
    }
  }, [autoRefresh, refreshInterval])

  const fetchMonitoringData = async () => {
    try {
      setLoading(true)
      const [systemRes, databaseRes, applicationRes, logsRes, performanceRes] = await Promise.all([
        fetch('/api/system/monitoring/system'),
        fetch('/api/system/monitoring/database'),
        fetch('/api/system/monitoring/application'),
        fetch('/api/system/monitoring/logs'),
        fetch('/api/system/monitoring/performance')
      ])

      if (systemRes.ok) {
        const systemData = await systemRes.json()
        setSystemMetrics(systemData.metrics)
      }

      if (databaseRes.ok) {
        const databaseData = await databaseRes.json()
        setDatabaseMetrics(databaseData.metrics)
      }

      if (applicationRes.ok) {
        const applicationData = await applicationRes.json()
        setApplicationMetrics(applicationData.metrics)
      }

      if (logsRes.ok) {
        const logsData = await logsRes.json()
        setLogs(logsData.logs)
      }

      if (performanceRes.ok) {
        const performanceDataRes = await performanceRes.json()
        setPerformanceData(performanceDataRes.data)
      }
    } catch (error) {
      console.error('Error fetching monitoring data:', error)
      toast.error('Failed to load monitoring data')
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (value: number, thresholds: { warning: number; critical: number }) => {
    if (value >= thresholds.critical) return 'text-red-500'
    if (value >= thresholds.warning) return 'text-yellow-500'
    return 'text-green-500'
  }

  const getStatusBadge = (value: number, thresholds: { warning: number; critical: number }) => {
    if (value >= thresholds.critical) return <Badge className="bg-red-600">Critical</Badge>
    if (value >= thresholds.warning) return <Badge className="bg-yellow-600">Warning</Badge>
    return <Badge className="bg-green-600">Good</Badge>
  }

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const formatUptime = (seconds: number) => {
    const days = Math.floor(seconds / 86400)
    const hours = Math.floor((seconds % 86400) / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    return `${days}d ${hours}h ${minutes}m`
  }

  const getLevelIcon = (level: string) => {
    switch (level) {
      case 'ERROR': return 'mdi:alert-circle'
      case 'WARN': return 'mdi:alert'
      case 'INFO': return 'mdi:information'
      case 'DEBUG': return 'mdi:bug'
      default: return 'mdi:help-circle'
    }
  }

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'ERROR': return 'text-red-500'
      case 'WARN': return 'text-yellow-500'
      case 'INFO': return 'text-blue-500'
      case 'DEBUG': return 'text-gray-500'
      default: return 'text-gray-400'
    }
  }

  const filteredLogs = logs.filter(log => {
    const matchesLevel = logLevel === 'all' || log.level === logLevel
    const matchesSource = logSource === 'all' || log.source === logSource
    return matchesLevel && matchesSource
  })

  if (loading && !systemMetrics) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex items-center space-x-2">
          <Icon icon="mdi:loading" className="w-6 h-6 animate-spin text-orange-500" />
          <span className="text-white">Loading monitoring data...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">System Monitoring</h1>
          <p className="text-gray-400 mt-1">Real-time system performance and health monitoring</p>
        </div>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <label className="text-white text-sm">Auto Refresh:</label>
            <Button
              size="sm"
              variant={autoRefresh ? 'default' : 'outline'}
              onClick={() => setAutoRefresh(!autoRefresh)}
              className={autoRefresh ? 'bg-green-600 hover:bg-green-700' : ''}
            >
              <Icon icon={autoRefresh ? 'mdi:play' : 'mdi:pause'} className="w-4 h-4" />
            </Button>
          </div>
          <Select value={refreshInterval.toString()} onValueChange={(value) => setRefreshInterval(parseInt(value))}>
            <SelectTrigger className="w-32 bg-gray-700 border-gray-600 text-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="10">10s</SelectItem>
              <SelectItem value="30">30s</SelectItem>
              <SelectItem value="60">1m</SelectItem>
              <SelectItem value="300">5m</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={fetchMonitoringData} className="bg-orange-600 hover:bg-orange-700">
            <Icon icon="mdi:refresh" className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* System Status Overview */}
      {systemMetrics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">CPU Usage</p>
                  <p className={`text-2xl font-bold ${getStatusColor(systemMetrics.cpu_usage, { warning: 70, critical: 90 })}`}>
                    {systemMetrics.cpu_usage.toFixed(1)}%
                  </p>
                </div>
                <Icon icon="mdi:cpu-64-bit" className="w-8 h-8 text-blue-500" />
              </div>
              <Progress value={systemMetrics.cpu_usage} className="mt-2" />
              {getStatusBadge(systemMetrics.cpu_usage, { warning: 70, critical: 90 })}
            </CardContent>
          </Card>
          
          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">Memory Usage</p>
                  <p className={`text-2xl font-bold ${getStatusColor(systemMetrics.memory_usage, { warning: 80, critical: 95 })}`}>
                    {systemMetrics.memory_usage.toFixed(1)}%
                  </p>
                </div>
                <Icon icon="mdi:memory" className="w-8 h-8 text-green-500" />
              </div>
              <Progress value={systemMetrics.memory_usage} className="mt-2" />
              {getStatusBadge(systemMetrics.memory_usage, { warning: 80, critical: 95 })}
            </CardContent>
          </Card>
          
          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">Disk Usage</p>
                  <p className={`text-2xl font-bold ${getStatusColor(systemMetrics.disk_usage, { warning: 85, critical: 95 })}`}>
                    {systemMetrics.disk_usage.toFixed(1)}%
                  </p>
                </div>
                <Icon icon="mdi:harddisk" className="w-8 h-8 text-purple-500" />
              </div>
              <Progress value={systemMetrics.disk_usage} className="mt-2" />
              {getStatusBadge(systemMetrics.disk_usage, { warning: 85, critical: 95 })}
            </CardContent>
          </Card>
          
          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">Response Time</p>
                  <p className={`text-2xl font-bold ${getStatusColor(systemMetrics.response_time, { warning: 500, critical: 1000 })}`}>
                    {systemMetrics.response_time}ms
                  </p>
                </div>
                <Icon icon="mdi:speedometer" className="w-8 h-8 text-orange-500" />
              </div>
              <div className="mt-2">
                <p className="text-gray-400 text-xs">Uptime: {formatUptime(systemMetrics.uptime)}</p>
              </div>
              {getStatusBadge(systemMetrics.response_time, { warning: 500, critical: 1000 })}
            </CardContent>
          </Card>
        </div>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4 bg-gray-800">
          <TabsTrigger value="overview" className="data-[state=active]:bg-orange-600">
            <Icon icon="mdi:view-dashboard" className="w-4 h-4 mr-2" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="database" className="data-[state=active]:bg-orange-600">
            <Icon icon="mdi:database" className="w-4 h-4 mr-2" />
            Database
          </TabsTrigger>
          <TabsTrigger value="application" className="data-[state=active]:bg-orange-600">
            <Icon icon="mdi:application" className="w-4 h-4 mr-2" />
            Application
          </TabsTrigger>
          <TabsTrigger value="logs" className="data-[state=active]:bg-orange-600">
            <Icon icon="mdi:text-box" className="w-4 h-4 mr-2" />
            Logs
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Network Activity */}
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center">
                  <Icon icon="mdi:network" className="w-5 h-5 mr-2" />
                  Network Activity
                </CardTitle>
              </CardHeader>
              <CardContent>
                {systemMetrics && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400">Network In</span>
                      <span className="text-white font-medium">{formatBytes(systemMetrics.network_in)}/s</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400">Network Out</span>
                      <span className="text-white font-medium">{formatBytes(systemMetrics.network_out)}/s</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400">Active Connections</span>
                      <span className="text-white font-medium">{systemMetrics.active_connections}</span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Application Health */}
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center">
                  <Icon icon="mdi:heart-pulse" className="w-5 h-5 mr-2" />
                  Application Health
                </CardTitle>
              </CardHeader>
              <CardContent>
                {applicationMetrics && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400">Active Users (24h)</span>
                      <span className="text-white font-medium">{applicationMetrics.active_users_24h}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400">API Requests (24h)</span>
                      <span className="text-white font-medium">{applicationMetrics.api_requests_24h.toLocaleString()}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400">Error Rate</span>
                      <span className={`font-medium ${getStatusColor(applicationMetrics.error_rate, { warning: 5, critical: 10 })}`}>
                        {applicationMetrics.error_rate.toFixed(2)}%
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400">Cache Hit Ratio</span>
                      <span className="text-green-500 font-medium">{applicationMetrics.cache_hit_ratio.toFixed(1)}%</span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Performance Chart Placeholder */}
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center">
                <Icon icon="mdi:chart-line" className="w-5 h-5 mr-2" />
                Performance Trends (Last 24 Hours)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64 flex items-center justify-center">
                <div className="text-center">
                  <Icon icon="mdi:chart-line" className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                  <p className="text-gray-400">Performance chart would be displayed here</p>
                  <p className="text-gray-500 text-sm">Integration with Chart.js or Recharts recommended</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Database Tab */}
        <TabsContent value="database" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {databaseMetrics && (
              <>
                <Card className="bg-gray-800 border-gray-700">
                  <CardContent className="p-6">
                    <div className="flex items-center space-x-2">
                      <Icon icon="mdi:table" className="w-8 h-8 text-blue-500" />
                      <div>
                        <p className="text-2xl font-bold text-white">{databaseMetrics.total_tables}</p>
                        <p className="text-gray-400 text-sm">Total Tables</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card className="bg-gray-800 border-gray-700">
                  <CardContent className="p-6">
                    <div className="flex items-center space-x-2">
                      <Icon icon="mdi:database" className="w-8 h-8 text-green-500" />
                      <div>
                        <p className="text-2xl font-bold text-white">{databaseMetrics.total_records.toLocaleString()}</p>
                        <p className="text-gray-400 text-sm">Total Records</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card className="bg-gray-800 border-gray-700">
                  <CardContent className="p-6">
                    <div className="flex items-center space-x-2">
                      <Icon icon="mdi:harddisk" className="w-8 h-8 text-purple-500" />
                      <div>
                        <p className="text-2xl font-bold text-white">{formatBytes(databaseMetrics.database_size)}</p>
                        <p className="text-gray-400 text-sm">Database Size</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card className="bg-gray-800 border-gray-700">
                  <CardContent className="p-6">
                    <div className="flex items-center space-x-2">
                      <Icon icon="mdi:connection" className="w-8 h-8 text-orange-500" />
                      <div>
                        <p className="text-2xl font-bold text-white">{databaseMetrics.active_connections}</p>
                        <p className="text-gray-400 text-sm">Active Connections</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </>
            )}
          </div>

          {databaseMetrics && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white flex items-center">
                    <Icon icon="mdi:speedometer" className="w-5 h-5 mr-2" />
                    Database Performance
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">Slow Queries</span>
                    <span className={`font-medium ${databaseMetrics.slow_queries > 10 ? 'text-red-500' : 'text-green-500'}`}>
                      {databaseMetrics.slow_queries}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">Cache Hit Ratio</span>
                    <span className="text-green-500 font-medium">{databaseMetrics.cache_hit_ratio.toFixed(1)}%</span>
                  </div>
                  <Progress value={databaseMetrics.cache_hit_ratio} className="mt-2" />
                </CardContent>
              </Card>

              <Card className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white flex items-center">
                    <Icon icon="mdi:backup-restore" className="w-5 h-5 mr-2" />
                    Backup Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">Last Backup</span>
                    <span className="text-white font-medium">
                      {new Date(databaseMetrics.last_backup).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">Backup Size</span>
                    <span className="text-white font-medium">{formatBytes(databaseMetrics.backup_size)}</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        {/* Application Tab */}
        <TabsContent value="application" className="space-y-6">
          {applicationMetrics && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="bg-gray-800 border-gray-700">
                  <CardContent className="p-6">
                    <div className="flex items-center space-x-2">
                      <Icon icon="mdi:account-group" className="w-8 h-8 text-blue-500" />
                      <div>
                        <p className="text-2xl font-bold text-white">{applicationMetrics.total_users}</p>
                        <p className="text-gray-400 text-sm">Total Users</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card className="bg-gray-800 border-gray-700">
                  <CardContent className="p-6">
                    <div className="flex items-center space-x-2">
                      <Icon icon="mdi:account-clock" className="w-8 h-8 text-green-500" />
                      <div>
                        <p className="text-2xl font-bold text-white">{applicationMetrics.active_users_24h}</p>
                        <p className="text-gray-400 text-sm">Active Users (24h)</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card className="bg-gray-800 border-gray-700">
                  <CardContent className="p-6">
                    <div className="flex items-center space-x-2">
                      <Icon icon="mdi:api" className="w-8 h-8 text-purple-500" />
                      <div>
                        <p className="text-2xl font-bold text-white">{applicationMetrics.api_requests_24h.toLocaleString()}</p>
                        <p className="text-gray-400 text-sm">API Requests (24h)</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card className="bg-gray-800 border-gray-700">
                  <CardContent className="p-6">
                    <div className="flex items-center space-x-2">
                      <Icon icon="mdi:queue-first-in-last-out" className="w-8 h-8 text-orange-500" />
                      <div>
                        <p className="text-2xl font-bold text-white">{applicationMetrics.queue_size}</p>
                        <p className="text-gray-400 text-sm">Queue Size</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="bg-gray-800 border-gray-700">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center">
                      <Icon icon="mdi:speedometer" className="w-5 h-5 mr-2" />
                      Performance Metrics
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400">Average Response Time</span>
                      <span className={`font-medium ${getStatusColor(applicationMetrics.avg_response_time, { warning: 500, critical: 1000 })}`}>
                        {applicationMetrics.avg_response_time}ms
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400">Error Rate</span>
                      <span className={`font-medium ${getStatusColor(applicationMetrics.error_rate, { warning: 5, critical: 10 })}`}>
                        {applicationMetrics.error_rate.toFixed(2)}%
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400">Cache Hit Ratio</span>
                      <span className="text-green-500 font-medium">{applicationMetrics.cache_hit_ratio.toFixed(1)}%</span>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-gray-800 border-gray-700">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center">
                      <Icon icon="mdi:account-multiple" className="w-5 h-5 mr-2" />
                      User Activity
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400">Total Sessions</span>
                      <span className="text-white font-medium">{applicationMetrics.total_sessions}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400">Active Sessions</span>
                      <span className="text-white font-medium">{applicationMetrics.active_users_24h}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400">Session Activity</span>
                      <Progress 
                        value={(applicationMetrics.active_users_24h / applicationMetrics.total_users) * 100} 
                        className="flex-1 ml-4" 
                      />
                    </div>
                  </CardContent>
                </Card>
              </div>
            </>
          )}
        </TabsContent>

        {/* Logs Tab */}
        <TabsContent value="logs" className="space-y-6">
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center">
                <Icon icon="mdi:text-box" className="w-5 h-5 mr-2" />
                System Logs
              </CardTitle>
              <CardDescription className="text-gray-400">
                Monitor system events and application logs
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Log Filters */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Select value={logLevel} onValueChange={setLogLevel}>
                  <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                    <SelectValue placeholder="Log Level" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Levels</SelectItem>
                    <SelectItem value="ERROR">Error</SelectItem>
                    <SelectItem value="WARN">Warning</SelectItem>
                    <SelectItem value="INFO">Info</SelectItem>
                    <SelectItem value="DEBUG">Debug</SelectItem>
                  </SelectContent>
                </Select>
                
                <Select value={logSource} onValueChange={setLogSource}>
                  <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                    <SelectValue placeholder="Source" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Sources</SelectItem>
                    <SelectItem value="application">Application</SelectItem>
                    <SelectItem value="database">Database</SelectItem>
                    <SelectItem value="security">Security</SelectItem>
                    <SelectItem value="system">System</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Logs List */}
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {filteredLogs.map((log) => (
                  <div key={log.id} className="p-3 bg-gray-700 rounded-lg">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-3 flex-1">
                        <Icon 
                          icon={getLevelIcon(log.level)} 
                          className={`w-5 h-5 mt-0.5 ${getLevelColor(log.level)}`} 
                        />
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-1">
                            <Badge className={`text-xs ${
                              log.level === 'ERROR' ? 'bg-red-600' :
                              log.level === 'WARN' ? 'bg-yellow-600' :
                              log.level === 'INFO' ? 'bg-blue-600' : 'bg-gray-600'
                            }`}>
                              {log.level}
                            </Badge>
                            <span className="text-gray-400 text-xs">{log.source}</span>
                          </div>
                          <p className="text-white text-sm">{log.message}</p>
                          {log.details && (
                            <div className="mt-2 text-gray-400 text-xs">
                              <pre className="whitespace-pre-wrap">
                                {JSON.stringify(log.details, null, 2)}
                              </pre>
                            </div>
                          )}
                        </div>
                      </div>
                      <span className="text-gray-400 text-xs">
                        {new Date(log.timestamp).toLocaleString()}
                      </span>
                    </div>
                  </div>
                ))}
                
                {filteredLogs.length === 0 && (
                  <div className="text-center py-8">
                    <Icon icon="mdi:text-box-outline" className="w-12 h-12 text-gray-500 mx-auto mb-4" />
                    <p className="text-gray-400">No logs found</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}