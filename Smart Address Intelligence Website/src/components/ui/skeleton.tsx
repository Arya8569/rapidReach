import React from 'react'
import { motion } from 'motion/react'

interface SkeletonProps {
  className?: string
  children?: React.ReactNode
}

export const Skeleton: React.FC<SkeletonProps> = ({ className = '', children }) => {
  return (
    <div
      className={`
        relative overflow-hidden bg-gray-200 rounded-md
        before:absolute before:inset-0 before:-translate-x-full
        before:animate-[shimmer_2s_infinite]
        before:bg-gradient-to-r before:from-transparent before:via-white/20 before:to-transparent
        ${className}
      `}
    >
      {children}
    </div>
  )
}

export const CardSkeleton: React.FC = () => {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-4">
      <div className="flex items-center space-x-4">
        <Skeleton className="w-12 h-12 rounded-full" />
        <div className="space-y-2 flex-1">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-3 w-1/2" />
        </div>
      </div>
      <div className="space-y-2">
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-5/6" />
        <Skeleton className="h-3 w-4/6" />
      </div>
      <div className="flex space-x-2">
        <Skeleton className="h-6 w-20 rounded-full" />
        <Skeleton className="h-6 w-24 rounded-full" />
      </div>
    </div>
  )
}

export const TableSkeleton: React.FC<{ rows?: number }> = ({ rows = 5 }) => {
  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="grid grid-cols-4 gap-4 p-4 border-b">
        <Skeleton className="h-4" />
        <Skeleton className="h-4" />
        <Skeleton className="h-4" />
        <Skeleton className="h-4" />
      </div>
      
      {/* Rows */}
      {Array.from({ length: rows }).map((_, index) => (
        <div key={index} className="grid grid-cols-4 gap-4 p-4 border-b">
          <Skeleton className="h-4" />
          <Skeleton className="h-4" />
          <Skeleton className="h-4" />
          <Skeleton className="h-4" />
        </div>
      ))}
    </div>
  )
}

export const MapSkeleton: React.FC = () => {
  return (
    <div className="relative bg-gray-200 rounded-lg overflow-hidden h-96">
      <div className="absolute inset-0 bg-gradient-to-br from-gray-200 to-gray-300">
        <div className="absolute top-4 left-4 space-y-2">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-10 w-48" />
        </div>
        <div className="absolute bottom-4 right-4">
          <Skeleton className="h-12 w-12 rounded-full" />
        </div>
        {/* Mock map markers */}
        <div className="absolute top-1/3 left-1/4">
          <Skeleton className="h-6 w-6 rounded-full" />
        </div>
        <div className="absolute top-1/2 right-1/3">
          <Skeleton className="h-6 w-6 rounded-full" />
        </div>
        <div className="absolute bottom-1/3 left-1/2">
          <Skeleton className="h-6 w-6 rounded-full" />
        </div>
      </div>
    </div>
  )
}

export const ButtonSkeleton: React.FC<{ width?: string; height?: string }> = ({ 
  width = 'w-24', 
  height = 'h-10' 
}) => {
  return <Skeleton className={`${width} ${height} rounded-md`} />
}

// Add shimmer animation to global styles
export const ShimmerStyles: React.FC = () => {
  return (
    <style>{`
      @keyframes shimmer {
        0% {
          transform: translateX(-100%);
        }
        100% {
          transform: translateX(100%);
        }
      }
    `}</style>
  )
}
