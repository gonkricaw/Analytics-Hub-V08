'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Icon } from '@iconify/react'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js'
import { Line } from 'react-chartjs-2'

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
)

interface LoginActivityData {
  date: string
  count: number
}

interface LoginActivityChartProps {
  className?: string
}

export default function LoginActivityChart({ className = '' }: LoginActivityChartProps) {
  const [loginData, setLoginData] = useState<LoginActivityData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchLoginActivity()
  }, [])

  const fetchLoginActivity = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch('/api/dashboard/login-activity')
      if (!response.ok) {
        throw new Error('Failed to fetch login activity data')
      }
      
      const data = await response.json()
      setLoginData(data)
    } catch (error) {
      console.error('Error fetching login activity:', error)
      setError('Failed to load login activity data')
    } finally {
      setLoading(false)
    }
  }

  const chartData = {
    labels: loginData.map(item => {
      const date = new Date(item.date)
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    }),
    datasets: [
      {
        label: 'Daily Logins',
        data: loginData.map(item => item.count),
        borderColor: '#FF7A00',
        backgroundColor: 'rgba(255, 122, 0, 0.1)',
        borderWidth: 2,
        fill: true,
        tension: 0.4,
        pointBackgroundColor: '#FF7A00',
        pointBorderColor: '#ffffff',
        pointBorderWidth: 2,
        pointRadius: 4,
        pointHoverRadius: 6
      }
    ]
  }

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false
      },
      tooltip: {
        backgroundColor: 'rgba(14, 14, 68, 0.9)',
        titleColor: '#ffffff',
        bodyColor: '#ffffff',
        borderColor: '#FF7A00',
        borderWidth: 1,
        cornerRadius: 8,
        displayColors: false,
        callbacks: {
          title: (context: any) => {
            const date = new Date(loginData[context[0].dataIndex].date)
            return date.toLocaleDateString('en-US', { 
              weekday: 'long',
              month: 'long', 
              day: 'numeric' 
            })
          },
          label: (context: any) => {
            return `${context.parsed.y} login${context.parsed.y !== 1 ? 's' : ''}`
          }
        }
      }
    },
    scales: {
      x: {
        grid: {
          color: 'rgba(255, 255, 255, 0.1)',
          drawBorder: false
        },
        ticks: {
          color: 'rgba(255, 255, 255, 0.7)',
          font: {
            size: 11
          }
        }
      },
      y: {
        beginAtZero: true,
        grid: {
          color: 'rgba(255, 255, 255, 0.1)',
          drawBorder: false
        },
        ticks: {
          color: 'rgba(255, 255, 255, 0.7)',
          font: {
            size: 11
          },
          stepSize: 1
        }
      }
    },
    interaction: {
      intersect: false,
      mode: 'index' as const
    }
  }

  const totalLogins = loginData.reduce((sum, item) => sum + item.count, 0)
  const averageLogins = loginData.length > 0 ? (totalLogins / loginData.length).toFixed(1) : '0'

  return (
    <Card className={`bg-white/10 backdrop-blur-sm border-white/20 ${className}`}>
      <CardHeader className="pb-2">
        <CardTitle className="text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Icon icon="mdi:chart-line" className="h-5 w-5" />
            Login Activity (15 Days)
          </div>
          <button
            onClick={fetchLoginActivity}
            className="text-white/70 hover:text-white transition-colors"
            disabled={loading}
          >
            <Icon 
              icon="mdi:refresh" 
              className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} 
            />
          </button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center h-48">
            <Icon icon="mdi:loading" className="h-8 w-8 animate-spin text-orange-500" />
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center h-48 text-center">
            <Icon icon="mdi:alert-circle" className="h-8 w-8 text-red-400 mb-2" />
            <p className="text-white/70 text-sm">{error}</p>
            <button
              onClick={fetchLoginActivity}
              className="mt-2 text-orange-500 hover:text-orange-400 text-sm"
            >
              Try Again
            </button>
          </div>
        ) : loginData.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-center">
            <Icon icon="mdi:chart-line-variant" className="h-8 w-8 text-white/50 mb-2" />
            <p className="text-white/70 text-sm">No login data available</p>
          </div>
        ) : (
          <>
            <div className="h-48 mb-4">
              <Line data={chartData} options={chartOptions} />
            </div>
            <div className="grid grid-cols-2 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-white">{totalLogins}</div>
                <div className="text-xs text-white/70">Total Logins</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-white">{averageLogins}</div>
                <div className="text-xs text-white/70">Daily Average</div>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}