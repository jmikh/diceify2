'use client'

import { useState, useEffect } from 'react'
import { X, FolderOpen, Clock, Trash2, AlertCircle } from 'lucide-react'
import { theme } from '@/lib/theme'
import { devLog } from '@/lib/utils/debug'

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
  const [isDeleting, setIsDeleting] = useState(false)
  
  // Debug logging
  useEffect(() => {
    if (isOpen) {
      devLog('[DEBUG] ProjectSelectionModal opened with:')
      devLog('[DEBUG] - hasCurrentState:', hasCurrentState)
      devLog('[DEBUG] - onCreateFromCurrent:', onCreateFromCurrent ? 'function provided' : 'undefined')
      devLog('[DEBUG] - projects count:', projects.length)
      devLog('[DEBUG] - isAtCapacity:', projects.length >= maxProjects)
      devLog('[DEBUG] - Button will show:', hasCurrentState && onCreateFromCurrent ? 'YES' : 'NO')
    }
  }, [isOpen, hasCurrentState, onCreateFromCurrent, projects.length, maxProjects])
  
  const isAtCapacity = projects.length >= maxProjects
  
  // Sort projects by most recently updated
  const sortedProjects = [...projects].sort((a, b) => 
    new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  )

  if (!isOpen) return null

  const handleDeleteProject = async (projectId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    if (isDeleting) return
    
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
            Project Capacity Reached
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
          
          {/* Capacity Message */}
          <div 
            className="flex items-center gap-2 p-4 rounded-lg border"
            style={{ 
              borderColor: theme.colors.accent.pink + '40',
              backgroundColor: theme.colors.accent.pink + '10'
            }}
          >
            <AlertCircle size={20} style={{ color: theme.colors.accent.pink }} />
            <div>
              <div className="font-medium" style={{ color: theme.colors.text.primary }}>
                You've reached the {maxProjects} project limit
              </div>
              <div className="text-sm mt-1" style={{ color: theme.colors.text.muted }}>
                Delete an existing project to save your current work, or load one of your existing projects below.
              </div>
            </div>
          </div>
          
          {/* Existing Projects */}
          {sortedProjects.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-sm font-medium mb-3" style={{ color: theme.colors.text.secondary }}>
                Existing Projects
              </h3>
              
              <div className="space-y-2">
                {sortedProjects.map(project => (
                  <div
                    key={project.id}
                    className="p-4 rounded-lg border flex items-center gap-3 transition-all group"
                    style={{ 
                      borderColor: theme.colors.glass.border,
                      backgroundColor: 'rgba(255, 255, 255, 0.02)'
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
                            <span>{project.percentComplete.toFixed(1)}% complete</span>
                          </>
                        )}
                      </div>
                    </div>
                    
                    {/* Action Buttons */}
                    <div className="flex items-center gap-2">
                      {/* Load Button */}
                      <button
                        onClick={() => onSelectProject(project.id)}
                        className="px-3 py-1.5 rounded-lg text-sm font-medium transition-all hover:bg-white/10"
                        style={{ 
                          color: theme.colors.accent.blue,
                          border: `1px solid ${theme.colors.accent.blue}40`
                        }}
                      >
                        Load
                      </button>
                      
                      {/* Delete Button */}
                      {onDeleteProject && (
                        <button
                          onClick={(e) => handleDeleteProject(project.id, e)}
                          disabled={isDeleting}
                          className="p-2 rounded-lg transition-all hover:bg-white/10"
                        >
                          <Trash2 size={16} style={{ color: theme.colors.accent.pink }} />
                        </button>
                      )}
                    </div>
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