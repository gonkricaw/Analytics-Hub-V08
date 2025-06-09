'use client'

import React, { useState, useRef, useCallback } from 'react'
import { Icon } from '@iconify/react'
import { Button } from '@/components/ui/Button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/Dialog'
import { Slider } from '@/components/ui/Slider'

interface ImageCropperProps {
  isOpen: boolean
  onClose: () => void
  imageSrc: string
  onCropComplete: (croppedImage: File) => void
  aspectRatio?: number // width/height ratio, default 1 (square)
  maxWidth?: number
  maxHeight?: number
  quality?: number // 0-1, default 0.9
}

interface CropArea {
  x: number
  y: number
  width: number
  height: number
}

export function ImageCropper({
  isOpen,
  onClose,
  imageSrc,
  onCropComplete,
  aspectRatio = 1,
  maxWidth = 400,
  maxHeight = 400,
  quality = 0.9
}: ImageCropperProps) {
  const [scale, setScale] = useState(1)
  const [rotation, setRotation] = useState(0)
  const [cropArea, setCropArea] = useState<CropArea>({ x: 0, y: 0, width: 200, height: 200 })
  const [isDragging, setIsDragging] = useState(false)
  const [isResizing, setIsResizing] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const [imageLoaded, setImageLoaded] = useState(false)
  
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const imageRef = useRef<HTMLImageElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // Handle image load
  const handleImageLoad = useCallback(() => {
    if (imageRef.current && containerRef.current) {
      const img = imageRef.current
      const container = containerRef.current
      
      // Calculate initial crop area (centered)
      const containerRect = container.getBoundingClientRect()
      const imgRect = img.getBoundingClientRect()
      
      const cropSize = Math.min(imgRect.width, imgRect.height) * 0.8
      const cropWidth = cropSize
      const cropHeight = cropSize / aspectRatio
      
      setCropArea({
        x: (imgRect.width - cropWidth) / 2,
        y: (imgRect.height - cropHeight) / 2,
        width: cropWidth,
        height: cropHeight
      })
      
      setImageLoaded(true)
    }
  }, [aspectRatio])

  // Handle mouse down on crop area
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    setIsDragging(true)
    setDragStart({ x: e.clientX - cropArea.x, y: e.clientY - cropArea.y })
  }, [cropArea])

  // Handle mouse move
  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging || !imageRef.current) return
    
    const imgRect = imageRef.current.getBoundingClientRect()
    const newX = Math.max(0, Math.min(e.clientX - dragStart.x, imgRect.width - cropArea.width))
    const newY = Math.max(0, Math.min(e.clientY - dragStart.y, imgRect.height - cropArea.height))
    
    setCropArea(prev => ({ ...prev, x: newX, y: newY }))
  }, [isDragging, dragStart, cropArea.width, cropArea.height])

  // Handle mouse up
  const handleMouseUp = useCallback(() => {
    setIsDragging(false)
    setIsResizing(false)
  }, [])

  // Handle scale change
  const handleScaleChange = useCallback((value: number[]) => {
    setScale(value[0])
  }, [])

  // Handle rotation change
  const handleRotationChange = useCallback((value: number[]) => {
    setRotation(value[0])
  }, [])

  // Crop and return the image
  const handleCrop = useCallback(async () => {
    if (!imageRef.current || !canvasRef.current) return
    
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    
    const img = imageRef.current
    
    // Set canvas size
    canvas.width = maxWidth
    canvas.height = maxHeight
    
    // Calculate scale factors
    const scaleX = img.naturalWidth / img.width
    const scaleY = img.naturalHeight / img.height
    
    // Apply transformations
    ctx.save()
    ctx.translate(canvas.width / 2, canvas.height / 2)
    ctx.rotate((rotation * Math.PI) / 180)
    ctx.scale(scale, scale)
    
    // Draw the cropped image
    ctx.drawImage(
      img,
      cropArea.x * scaleX,
      cropArea.y * scaleY,
      cropArea.width * scaleX,
      cropArea.height * scaleY,
      -canvas.width / 2,
      -canvas.height / 2,
      canvas.width,
      canvas.height
    )
    
    ctx.restore()
    
    // Convert to blob and create file
    canvas.toBlob((blob) => {
      if (blob) {
        const file = new File([blob], 'cropped-image.jpg', { type: 'image/jpeg' })
        onCropComplete(file)
      }
    }, 'image/jpeg', quality)
  }, [cropArea, scale, rotation, maxWidth, maxHeight, quality, onCropComplete])

  // Reset transformations
  const handleReset = useCallback(() => {
    setScale(1)
    setRotation(0)
    handleImageLoad()
  }, [handleImageLoad])

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle>Crop Image</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Image cropping area */}
          <div 
            ref={containerRef}
            className="relative bg-gray-900 rounded-lg overflow-hidden"
            style={{ height: '400px' }}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
          >
            <img
              ref={imageRef}
              src={imageSrc}
              alt="Crop preview"
              className="w-full h-full object-contain"
              style={{
                transform: `scale(${scale}) rotate(${rotation}deg)`,
                transformOrigin: 'center'
              }}
              onLoad={handleImageLoad}
              draggable={false}
            />
            
            {/* Crop overlay */}
            {imageLoaded && (
              <>
                {/* Dark overlay */}
                <div className="absolute inset-0 bg-black bg-opacity-50 pointer-events-none" />
                
                {/* Crop area */}
                <div
                  className="absolute border-2 border-white cursor-move"
                  style={{
                    left: cropArea.x,
                    top: cropArea.y,
                    width: cropArea.width,
                    height: cropArea.height,
                    backgroundColor: 'transparent'
                  }}
                  onMouseDown={handleMouseDown}
                >
                  {/* Corner handles */}
                  <div className="absolute -top-1 -left-1 w-3 h-3 bg-white border border-gray-400 cursor-nw-resize" />
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-white border border-gray-400 cursor-ne-resize" />
                  <div className="absolute -bottom-1 -left-1 w-3 h-3 bg-white border border-gray-400 cursor-sw-resize" />
                  <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-white border border-gray-400 cursor-se-resize" />
                  
                  {/* Grid lines */}
                  <div className="absolute inset-0 grid grid-cols-3 grid-rows-3 pointer-events-none">
                    {Array.from({ length: 9 }).map((_, i) => (
                      <div key={i} className="border border-white border-opacity-30" />
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
          
          {/* Controls */}
          <div className="space-y-4">
            {/* Scale control */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-300">Scale: {scale.toFixed(1)}x</label>
              <Slider
                value={[scale]}
                onValueChange={handleScaleChange}
                min={0.5}
                max={3}
                step={0.1}
                className="w-full"
              />
            </div>
            
            {/* Rotation control */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-300">Rotation: {rotation}°</label>
              <Slider
                value={[rotation]}
                onValueChange={handleRotationChange}
                min={-180}
                max={180}
                step={1}
                className="w-full"
              />
            </div>
          </div>
          
          {/* Action buttons */}
          <div className="flex justify-between">
            <Button
              variant="outline"
              onClick={handleReset}
              className="flex items-center space-x-2"
            >
              <Icon icon="mdi:refresh" className="w-4 h-4" />
              <span>Reset</span>
            </Button>
            
            <div className="flex space-x-2">
              <Button variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button onClick={handleCrop} className="bg-orange-600 hover:bg-orange-700">
                <Icon icon="mdi:crop" className="w-4 h-4 mr-2" />
                Crop Image
              </Button>
            </div>
          </div>
        </div>
        
        {/* Hidden canvas for cropping */}
        <canvas ref={canvasRef} className="hidden" />
      </DialogContent>
    </Dialog>
  )
}