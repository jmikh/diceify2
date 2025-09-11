'use client'

import { useState, useEffect } from 'react'
import { X, Plus, FolderOpen, Clock, Trash2, AlertCircle } from 'lucide-react'
import { theme } from '@/lib/theme'

interface Project {
  id: string
  name: string
  updatedAt: string
  originalImage?: string | null
  croppedImage?: string | null
  percentComplete?: number
}

interface ProjectSelectionModalProps {
  isOpen: boolean
  onClose?: () => void  // Made optional - won't be provided when modal must stay open
  onCreateFromCurrent?: () => void
  onCreateNew: () => void
  onSelectProject: (projectId: string) => void
  onDeleteProject?: (projectId: string) => void
  projects: Project[]
  hasCurrentState: boolean
  maxProjects?: number
}

export default function ProjectSelectionModal({
  isOpen,
  onClose,
  onCreateFromCurrent,
  onCreateNew,
  onSelectProject,
  onDeleteProject,
  projects,
  hasCurrentState,
  maxProjects = 3
}: ProjectSelectionModalProps) {
  const [selectedProject, setSelectedProject] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  
  const isAtCapacity = projects.length >= maxProjects
  
  // Sort projects by most recently updated
  const sortedProjects = [...projects].sort((a, b) => 
    new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  )

  if (!isOpen) return null

  const handleDeleteProject = async (projectId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    if (isDeleting) return
    
    if (!window.confirm('Are you sure you want to delete this project?')) return
    
    setIsDeleting(true)
    try {
      await onDeleteProject?.(projectId)
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose ? onClose : undefined}
        style={{ cursor: onClose ? 'pointer' : 'default' }}
      />
      
      {/* Modal */}
      <div 
        className="relative w-full max-w-2xl mx-4 rounded-2xl border overflow-hidden"
        style={{
          background: 'rgba(10, 0, 20, 0.95)',
          borderColor: theme.colors.glass.border,
          boxShadow: `0 20px 60px rgba(139, 92, 246, 0.3),
                     0 0 100px rgba(59, 130, 246, 0.15)`
        }}
      >
        {/* Header */}
        <div 
          className="px-6 py-4 border-b flex items-center justify-between"
          style={{ borderColor: theme.colors.glass.border }}
        >
          <h2 className="text-xl font-semibold" style={{ color: theme.colors.text.primary }}>
            Select or Create Project
          </h2>
          {onClose && (
            <button
              onClick={onClose}
              className="p-1 rounded-lg hover:bg-white/10 transition-colors"
            >
              <X size={20} style={{ color: theme.colors.text.secondary }} />
            </button>
          )}
        </div>
        
        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Required selection message */}
          {!onClose && (
            <div 
              className="p-3 rounded-lg border flex items-center gap-2"
              style={{ 
                borderColor: theme.colors.accent.blue + '40',
                backgroundColor: theme.colors.accent.blue + '10'
              }}
            >
              <AlertCircle size={16} style={{ color: theme.colors.accent.blue }} />
              <span className="text-sm" style={{ color: theme.colors.text.primary }}>
                Please select or create a project to continue
              </span>
            </div>
          )}
          
          {/* Create Options */}
          <div className="space-y-3">
            <h3 className="text-sm font-medium mb-3" style={{ color: theme.colors.text.secondary }}>
              Create New
            </h3>
            
            {/* Create from Current State */}
            {hasCurrentState && onCreateFromCurrent && (
              <button
                onClick={onCreateFromCurrent}
                disabled={isAtCapacity}
                className="w-full p-4 rounded-lg border flex items-center gap-3 transition-all hover:bg-white/5 disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ 
                  borderColor: theme.colors.glass.border,
                  backgroundColor: 'rgba(255, 255, 255, 0.02)'
                }}
              >
                <div 
                  className="p-2 rounded-lg"
                  style={{ backgroundColor: theme.colors.accent.blue + '20' }}
                >
                  <Plus size={20} style={{ color: theme.colors.accent.blue }} />
                </div>
                <div className="flex-1 text-left">
                  <div className="font-medium" style={{ color: theme.colors.text.primary }}>
                    Create from Current Editor
                  </div>
                  <div className="text-xs" style={{ color: theme.colors.text.muted }}>
                    Save your current work as a new project
                  </div>
                </div>
              </button>
            )}
            
            {/* Create New Empty Project */}
            <button
              onClick={onCreateNew}
              disabled={isAtCapacity}
              className="w-full p-4 rounded-lg border flex items-center gap-3 transition-all hover:bg-white/5 disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ 
                borderColor: theme.colors.glass.border,
                backgroundColor: 'rgba(255, 255, 255, 0.02)'
              }}
            >
              <div 
                className="p-2 rounded-lg"
                style={{ backgroundColor: theme.colors.accent.green + '20' }}
              >
                <FolderOpen size={20} style={{ color: theme.colors.accent.green }} />
              </div>
              <div className="flex-1 text-left">
                <div className="font-medium" style={{ color: theme.colors.text.primary }}>
                  Create Empty Project
                </div>
                <div className="text-xs" style={{ color: theme.colors.text.muted }}>
                  Start fresh with a new project
                </div>
              </div>
            </button>
            
            {/* Capacity Warning */}
            {isAtCapacity && (
              <div 
                className="flex items-center gap-2 p-3 rounded-lg border"
                style={{ 
                  borderColor: theme.colors.accent.pink + '40',
                  backgroundColor: theme.colors.accent.pink + '10'
                }}
              >
                <AlertCircle size={16} style={{ color: theme.colors.accent.pink }} />
                <span className="text-sm" style={{ color: theme.colors.text.primary }}>
                  At project capacity ({maxProjects} max). Delete a project to create a new one.
                </span>
              </div>
            )}
          </div>
          
          {/* Existing Projects */}
          {sortedProjects.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-sm font-medium mb-3" style={{ color: theme.colors.text.secondary }}>
                Existing Projects
              </h3>
              
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {sortedProjects.map(project => (
                  <div
                    key={project.id}
                    onClick={() => onSelectProject(project.id)}
                    className="p-4 rounded-lg border flex items-center gap-3 cursor-pointer transition-all hover:bg-white/5 group"
                    style={{ 
                      borderColor: selectedProject === project.id 
                        ? theme.colors.accent.blue 
                        : theme.colors.glass.border,
                      backgroundColor: selectedProject === project.id 
                        ? theme.colors.accent.blue + '10' 
                        : 'rgba(255, 255, 255, 0.02)'
                    }}
                  >
                    {/* Project Thumbnail */}
                    <div 
                      className="w-12 h-12 rounded-lg overflow-hidden flex-shrink-0"
                      style={{ backgroundColor: theme.colors.glass.light }}
                    >
                      {(project.croppedImage || project.originalImage) ? (
                        <img 
                          src={project.croppedImage || project.originalImage || ''} 
                          alt={project.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <FolderOpen size={20} style={{ color: theme.colors.text.muted }} />
                        </div>
                      )}
                    </div>
                    
                    {/* Project Info */}
                    <div className="flex-1">
                      <div className="font-medium" style={{ color: theme.colors.text.primary }}>
                        {project.name}
                      </div>
                      <div className="flex items-center gap-2 text-xs" style={{ color: theme.colors.text.muted }}>
                        <Clock size={12} />
                        <span>
                          {new Date(project.updatedAt).toLocaleDateString()} at{' '}
                          {new Date(project.updatedAt).toLocaleTimeString([], { 
                            hour: '2-digit', 
                            minute: '2-digit' 
                          })}
                        </span>
                        {project.percentComplete !== undefined && (
                          <>
                            <span>•</span>
                            <span>{project.percentComplete}% complete</span>
                          </>
                        )}
                      </div>
                    </div>
                    
                    {/* Delete Button */}
                    {onDeleteProject && (
                      <button
                        onClick={(e) => handleDeleteProject(project.id, e)}
                        disabled={isDeleting}
                        className="p-2 rounded-lg opacity-0 group-hover:opacity-100 transition-all hover:bg-white/10"
                      >
                        <Trash2 size={16} style={{ color: theme.colors.accent.pink }} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}