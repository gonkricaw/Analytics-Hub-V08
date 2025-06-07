'use client'

import Link from 'next/link'
import { Icon } from '@iconify/react'

export default function HomePage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-dark via-dark to-secondary/20">
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-16">
        <div className="text-center space-y-8">
          {/* Logo/Icon */}
          <div className="flex justify-center">
            <div className="p-6 bg-accent/10 rounded-full border border-accent/20">
              <Icon 
                icon="mdi:chart-line" 
                className="w-16 h-16 text-accent"
              />
            </div>
          </div>
          
          {/* Main Heading */}
          <div className="space-y-4">
            <h1 className="text-5xl md:text-7xl font-bold">
              <span className="gradient-text">Analytics Hub</span>
            </h1>
            <p className="text-xl md:text-2xl text-white/80 max-w-3xl mx-auto">
              Your comprehensive business intelligence platform for data-driven insights and decision making
            </p>
          </div>
          
          {/* Feature Cards */}
          <div className="grid md:grid-cols-3 gap-6 mt-16 max-w-4xl mx-auto">
            <div className="card text-center space-y-4">
              <Icon icon="mdi:chart-bar" className="w-12 h-12 text-accent mx-auto" />
              <h3 className="text-xl font-semibold">Real-time Analytics</h3>
              <p className="text-white/70">
                Monitor your business metrics with live data visualization and interactive dashboards
              </p>
            </div>
            
            <div className="card text-center space-y-4">
              <Icon icon="mdi:shield-check" className="w-12 h-12 text-accent mx-auto" />
              <h3 className="text-xl font-semibold">Secure Access</h3>
              <p className="text-white/70">
                Role-based authentication with enterprise-grade security and access controls
              </p>
            </div>
            
            <div className="card text-center space-y-4">
              <Icon icon="mdi:cog" className="w-12 h-12 text-accent mx-auto" />
              <h3 className="text-xl font-semibold">Content Management</h3>
              <p className="text-white/70">
                Manage and organize your analytics content with powerful CMS capabilities
              </p>
            </div>
          </div>
          
          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mt-12">
            <Link 
              href="/auth/login" 
              className="btn-primary px-8 py-3 text-lg inline-flex items-center gap-2"
            >
              <Icon icon="mdi:login" className="w-5 h-5" />
              Get Started
            </Link>
            <Link 
              href="/about" 
              className="btn-secondary px-8 py-3 text-lg inline-flex items-center gap-2"
            >
              <Icon icon="mdi:information" className="w-5 h-5" />
              Learn More
            </Link>
          </div>
        </div>
      </div>
      
      {/* Background Animation */}
      <div className="fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-accent/5 rounded-full blur-3xl animate-float"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent/3 rounded-full blur-3xl animate-float" style={{ animationDelay: '2s' }}></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-accent/4 rounded-full blur-3xl animate-float" style={{ animationDelay: '4s' }}></div>
      </div>
    </main>
  )
}