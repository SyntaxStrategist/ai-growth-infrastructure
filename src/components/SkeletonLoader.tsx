"use client";

import { motion } from "framer-motion";
import { memo } from "react";

interface SkeletonLoaderProps {
  className?: string;
  variant?: 'card' | 'text' | 'circle' | 'rect' | 'table' | 'dashboard' | 'stats-card' | 'prospect-table' | 'form' | 'button';
  lines?: number;
  width?: string;
  height?: string;
  animate?: boolean;
}

export const SkeletonLoader = memo(function SkeletonLoader({ 
  className = "", 
  variant = 'rect', 
  lines = 1, 
  width = "100%", 
  height = "1rem",
  animate = true
}: SkeletonLoaderProps) {
  const baseClasses = "bg-white/10 rounded";
  const animationClasses = animate ? "loading-shimmer" : "animate-pulse";
  
  const variantClasses = {
    card: "bg-white/5 border border-white/10 rounded-xl p-4",
    text: "h-4 bg-white/10 rounded",
    circle: "rounded-full bg-white/10",
    rect: "bg-white/10 rounded",
    table: "bg-white/5 border border-white/10 rounded-lg p-4",
    dashboard: "bg-white/5 border border-white/10 rounded-xl p-6",
    'stats-card': "bg-gradient-to-br from-purple-500/20 to-blue-500/20 backdrop-blur-sm border border-white/20 rounded-xl p-6",
    'prospect-table': "bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6",
    form: "bg-white/5 border border-white/10 rounded-lg p-4",
    button: "bg-white/10 rounded-lg"
  };

  if (variant === 'card') {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className={`${variantClasses.card} ${animationClasses} ${className}`}
        style={{ width, height }}
      >
        <div className="space-y-3">
          <div className="h-4 bg-white/10 rounded w-3/4"></div>
          <div className="h-3 bg-white/10 rounded w-1/2"></div>
          <div className="h-3 bg-white/10 rounded w-2/3"></div>
        </div>
      </motion.div>
    );
  }

  if (variant === 'dashboard') {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className={`${variantClasses.dashboard} ${animationClasses} ${className}`}
        style={{ width, height }}
      >
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="h-6 bg-white/10 rounded w-1/3"></div>
            <div className="h-8 bg-white/10 rounded w-24"></div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <div className="h-3 bg-white/10 rounded w-1/2"></div>
                <div className="h-8 bg-white/10 rounded w-3/4"></div>
              </div>
            ))}
          </div>
        </div>
      </motion.div>
    );
  }

  if (variant === 'table') {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className={`${variantClasses.table} ${animationClasses} ${className}`}
        style={{ width, height }}
      >
        <div className="space-y-3">
          {Array.from({ length: lines || 3 }).map((_, i) => (
            <div key={i} className="flex items-center space-x-4">
              <div className="h-10 w-10 bg-white/10 rounded-full"></div>
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-white/10 rounded w-3/4"></div>
                <div className="h-3 bg-white/10 rounded w-1/2"></div>
              </div>
              <div className="h-6 bg-white/10 rounded w-16"></div>
            </div>
          ))}
        </div>
      </motion.div>
    );
  }

  if (variant === 'stats-card') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className={`${variantClasses['stats-card']} ${animationClasses} ${className}`}
        style={{ width, height }}
      >
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <div className="h-4 bg-white/10 rounded w-24 mb-2"></div>
            <div className="h-8 bg-white/10 rounded w-16"></div>
          </div>
          <div className="w-12 h-12 bg-white/10 rounded-lg"></div>
        </div>
      </motion.div>
    );
  }

  if (variant === 'prospect-table') {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className={`${variantClasses['prospect-table']} ${animationClasses} ${className}`}
        style={{ width, height }}
      >
        <div className="space-y-4">
          {/* Table header */}
          <div className="flex items-center justify-between pb-4 border-b border-white/10">
            <div className="h-6 bg-white/10 rounded w-48"></div>
            <div className="flex gap-2">
              <div className="h-8 bg-white/10 rounded w-20"></div>
              <div className="h-8 bg-white/10 rounded w-20"></div>
            </div>
          </div>
          {/* Table rows */}
          {Array.from({ length: lines || 5 }).map((_, i) => (
            <div key={i} className="flex items-center space-x-4 py-3">
              <div className="flex-1">
                <div className="h-4 bg-white/10 rounded w-32 mb-1"></div>
                <div className="h-3 bg-white/10 rounded w-24"></div>
              </div>
              <div className="h-4 bg-white/10 rounded w-20"></div>
              <div className="h-4 bg-white/10 rounded w-16"></div>
              <div className="h-4 bg-white/10 rounded w-12"></div>
              <div className="flex gap-2">
                <div className="h-6 bg-white/10 rounded w-16"></div>
                <div className="h-6 bg-white/10 rounded w-16"></div>
              </div>
            </div>
          ))}
        </div>
      </motion.div>
    );
  }

  if (variant === 'form') {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className={`${variantClasses.form} ${animationClasses} ${className}`}
        style={{ width, height }}
      >
        <div className="space-y-4">
          {Array.from({ length: lines || 3 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <div className="h-4 bg-white/10 rounded w-24"></div>
              <div className="h-10 bg-white/10 rounded w-full"></div>
            </div>
          ))}
        </div>
      </motion.div>
    );
  }

  if (variant === 'button') {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className={`${variantClasses.button} ${animationClasses} ${className}`}
        style={{ width, height }}
      />
    );
  }

  if (variant === 'text' && lines > 1) {
    return (
      <div className={`space-y-2 ${className}`}>
        {Array.from({ length: lines }).map((_, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: i * 0.1 }}
            className={`${variantClasses.text} ${animationClasses} ${i === lines - 1 ? 'w-2/3' : 'w-full'}`}
            style={{ height }}
          />
        ))}
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className={`${variantClasses[variant]} ${animationClasses} ${className}`}
      style={{ width, height }}
    />
  );
});

// Pre-built skeleton components for common use cases
export const LeadCardSkeleton = memo(function LeadCardSkeleton() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="card-base card-hover p-6 space-y-4"
    >
      <div className="flex items-center justify-between">
        <SkeletonLoader variant="text" width="200px" height="1.5rem" />
        <SkeletonLoader variant="circle" width="2rem" height="2rem" />
      </div>
      <SkeletonLoader variant="text" lines={2} />
      <div className="flex gap-2">
        <SkeletonLoader variant="rect" width="80px" height="1.5rem" />
        <SkeletonLoader variant="rect" width="60px" height="1.5rem" />
      </div>
    </motion.div>
  );
});

export const StatsCardSkeleton = memo(function StatsCardSkeleton() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="card-base card-hover p-6 space-y-3"
    >
      <SkeletonLoader variant="text" width="120px" height="1rem" />
      <SkeletonLoader variant="text" width="60px" height="2rem" />
      <SkeletonLoader variant="text" width="80px" height="0.875rem" />
    </motion.div>
  );
});

export const TableSkeleton = memo(function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: i * 0.1 }}
          className="card-base p-4"
        >
          <div className="flex items-center space-x-4">
            <SkeletonLoader variant="circle" width="2.5rem" height="2.5rem" />
            <div className="flex-1 space-y-2">
              <SkeletonLoader variant="text" width="200px" height="1rem" />
              <SkeletonLoader variant="text" width="150px" height="0.875rem" />
            </div>
            <SkeletonLoader variant="rect" width="80px" height="1.5rem" />
          </div>
        </motion.div>
      ))}
    </div>
  );
});

// New specialized skeleton components
export const DashboardSkeleton = memo(function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header skeleton */}
      <div className="flex items-center justify-between">
        <SkeletonLoader variant="text" width="300px" height="2rem" />
        <div className="flex gap-2">
          <SkeletonLoader variant="rect" width="100px" height="2rem" />
          <SkeletonLoader variant="rect" width="100px" height="2rem" />
        </div>
      </div>
      
      {/* Stats grid skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <StatsCardSkeleton key={i} />
        ))}
      </div>
      
      {/* Content skeleton */}
      <SkeletonLoader variant="dashboard" height="400px" />
    </div>
  );
});

export const LeadListSkeleton = memo(function LeadListSkeleton({ count = 5 }: { count?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <LeadCardSkeleton key={i} />
      ))}
    </div>
  );
});

// Enhanced skeleton components for dashboard improvements
export const StatsGridSkeleton = memo(function StatsGridSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {Array.from({ length: 4 }).map((_, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: i * 0.1 }}
        >
          <SkeletonLoader variant="stats-card" />
        </motion.div>
      ))}
    </div>
  );
});

export const ProspectTableSkeleton = memo(function ProspectTableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <SkeletonLoader variant="prospect-table" lines={rows} height="400px" />
    </motion.div>
  );
});

export const FilterControlsSkeleton = memo(function FilterControlsSkeleton() {
  return (
    <div className="space-y-6 mb-8">
      {/* Tab Navigation Skeleton */}
      <div className="flex flex-wrap gap-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <SkeletonLoader key={i} variant="button" width="120px" height="40px" />
        ))}
      </div>
      
      {/* Filter Controls Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="space-y-2">
            <SkeletonLoader variant="text" width="100px" height="16px" />
            <SkeletonLoader variant="button" width="100%" height="40px" />
          </div>
        ))}
      </div>
    </div>
  );
});

export const AdminSettingsSkeleton = memo(function AdminSettingsSkeleton() {
  return (
    <div className="space-y-6">
      {/* Client Selector Skeleton */}
      <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 mb-6 border border-white/10">
        <SkeletonLoader variant="text" width="150px" height="16px" className="mb-2" />
        <SkeletonLoader variant="button" width="100%" height="48px" />
      </div>
      
      {/* Settings Form Skeleton */}
      <div className="space-y-6">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
            <SkeletonLoader variant="text" width="200px" height="20px" className="mb-4" />
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, j) => (
                <div key={j} className="space-y-2">
                  <SkeletonLoader variant="text" width="120px" height="16px" />
                  <SkeletonLoader variant="button" width="100%" height="48px" />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
});

export const LoginFormSkeleton = memo(function LoginFormSkeleton() {
  return (
    <div className="w-full max-w-md">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-8"
      >
        {/* Logo and title skeleton */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-white/10 rounded-lg mx-auto mb-4"></div>
          <SkeletonLoader variant="text" width="200px" height="24px" className="mx-auto mb-2" />
          <SkeletonLoader variant="text" width="250px" height="16px" className="mx-auto" />
        </div>
        
        {/* Form fields skeleton */}
        <div className="space-y-6">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <SkeletonLoader variant="text" width="80px" height="16px" />
              <SkeletonLoader variant="button" width="100%" height="48px" />
            </div>
          ))}
          
          <SkeletonLoader variant="button" width="100%" height="48px" />
        </div>
      </motion.div>
    </div>
  );
});
