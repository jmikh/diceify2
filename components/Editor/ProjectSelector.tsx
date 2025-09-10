'use client'

import { useState, useRef, useEffect } from 'react'
import { ChevronDown, Check, Plus, Loader2, Trash2, AlertCircle } from 'lucide-react'
import { theme } from '@/lib/theme'
import { useSession } from 'next-auth/react'

interface Project {
  id: string
  name: string
  updatedAt: string
  percentComplete?: number
}

interface ProjectSelectorProps {
  currentProject: string
  currentProjectId?: string | null
  onProjectChange: (name: string) => void
  onProjectSelect?: (project: Project) => void
  onCreateProject?: () => void
}

export default function ProjectSelector({ 
  currentProject,
  currentProjectId,
  onProjectChange,
  onProjectSelect,
  onCreateProject
}: ProjectSelectorProps) {
  const { data: session } = useSession()
  const [isEditing, setIsEditing] = useState(false)
  const [editValue, setEditValue] = useState(currentProject)
  const [showDropdown, setShowDropdown] = useState(false)
  const [projects, setProjects] = useState<Project[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [deletingProjectId, setDeletingProjectId] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)
  
  // Fetch user's projects
  useEffect(() => {
    if (session?.user) {
      fetchProjects()
    }
  }, [session])

  const fetchProjects = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/projects')
      if (response.ok) {
        const data = await response.json()
        setProjects(data)
      }
    } catch (error) {
      console.error('Failed to fetch projects:', error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
    }
  }, [isEditing])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleEditComplete = () => {
    setIsEditing(false)
    if (editValue.trim() && editValue !== currentProject) {
      handleRenameProject()
    } else {
      setEditValue(currentProject)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleEditComplete()
    } else if (e.key === 'Escape') {
      setEditValue(currentProject)
      setIsEditing(false)
    }
  }

  const handleProjectSelect = (project: Project) => {
    onProjectChange(project.name)
    if (onProjectSelect) {
      onProjectSelect(project)
    }
    setShowDropdown(false)
  }

  const handleRenameProject = async () => {
    if (!currentProjectId || !editValue.trim() || editValue === currentProject) {
      setEditValue(currentProject)
      return
    }

    try {
      const response = await fetch(`/api/projects/${currentProjectId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: editValue.trim() })
      })
      
      if (response.ok) {
        onProjectChange(editValue.trim())
        fetchProjects() // Refresh the list
      }
    } catch (error) {
      console.error('Failed to rename project:', error)
      setEditValue(currentProject)
    }
  }

  const handleDeleteProject = async (projectId: string, projectName: string) => {
    if (!confirm(`Are you sure you want to delete "${projectName}"? This cannot be undone.`)) {
      return
    }

    setDeletingProjectId(projectId)
    try {
      const response = await fetch(`/api/projects/${projectId}`, {
        method: 'DELETE',
      })
      
      if (response.ok) {
        // Remove project from list
        setProjects(prev => prev.filter(p => p.id !== projectId))
      } else {
        console.error('Failed to delete project')
      }
    } catch (error) {
      console.error('Failed to delete project:', error)
    } finally {
      setDeletingProjectId(null)
    }
  }

  return (
    <div className="relative min-w-[200px]" ref={dropdownRef}>
      <div 
        className="flex items-center gap-2 px-4 py-3 border-b"
        style={{ borderColor: theme.colors.glass.border }}
      >
        {isEditing ? (
          <input
            ref={inputRef}
            type="text"
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onBlur={handleEditComplete}
            onKeyDown={handleKeyDown}
            className="flex-1 bg-transparent outline-none text-sm font-medium"
            style={{ color: theme.colors.text.primary }}
            placeholder="Project name..."
          />
        ) : (
          <button
            onClick={() => setIsEditing(true)}
            className="flex-1 text-left text-sm font-medium hover:opacity-80 transition-opacity"
            style={{ color: theme.colors.text.primary }}
          >
            {currentProject}
          </button>
        )}
        
        <button
          onClick={() => setShowDropdown(!showDropdown)}
          className="p-1 rounded hover:bg-white/10 transition-colors"
          style={{ color: theme.colors.text.secondary }}
        >
          <ChevronDown 
            size={16} 
            className={`transition-transform ${showDropdown ? 'rotate-180' : ''}`}
          />
        </button>
      </div>

      {/* Dropdown */}
      {showDropdown && (
        <div 
          className="absolute top-full left-0 right-0 border rounded-b-lg shadow-xl overflow-hidden"
          style={{ 
            backgroundColor: '#1a1a2e',
            borderColor: theme.colors.glass.border,
            borderTop: 'none',
            zIndex: 9999
          }}
        >
          <div className="py-2">
            {isLoading ? (
              <div className="px-3 py-4 flex items-center justify-center">
                <Loader2 className="animate-spin" size={16} style={{ color: theme.colors.text.muted }} />
                <span className="ml-2 text-sm" style={{ color: theme.colors.text.muted }}>Loading projects...</span>
              </div>
            ) : projects.length > 0 ? (
              <>
                <div className="px-3 py-1 text-xs font-medium" style={{ color: theme.colors.text.muted }}>
                  Your Projects
                </div>
                {projects.map((project) => (
              <div
                key={project.id}
                className="w-full px-3 py-2 flex items-center justify-between hover:bg-white/10 transition-colors group"
              >
                <button
                  onClick={() => handleProjectSelect(project)}
                  className="flex-1 text-left"
                >
                  <div className="text-sm" style={{ color: theme.colors.text.primary }}>
                    {project.name}
                  </div>
                  <div className="text-xs" style={{ color: theme.colors.text.muted }}>
                    {new Date(project.updatedAt).toLocaleDateString()}
                    {project.percentComplete !== undefined && (
                      <span className="ml-2">
                        • {Math.round(project.percentComplete)}% complete
                      </span>
                    )}
                  </div>
                </button>
                <div className="flex items-center gap-2">
                  {project.id === currentProjectId ? (
                    <Check size={14} style={{ color: theme.colors.accent.green }} />
                  ) : (
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleDeleteProject(project.id, project.name)
                      }}
                      disabled={deletingProjectId === project.id}
                      className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-red-500/20 transition-all"
                      style={{ color: theme.colors.accent.red }}
                      title="Delete project"
                    >
                      {deletingProjectId === project.id ? (
                        <Loader2 size={14} className="animate-spin" />
                      ) : (
                        <Trash2 size={14} />
                      )}
                    </button>
                  )}
                </div>
              </div>
            ))}
              </>
            ) : (
              <div className="px-3 py-3 text-sm text-center" style={{ color: theme.colors.text.muted }}>
                No projects yet
              </div>
            )}
            
            <div className="border-t mt-2 pt-2" style={{ borderColor: theme.colors.glass.border }}>
              {projects.length >= 5 ? (
                <div className="px-3 py-2 text-sm" style={{ color: theme.colors.text.muted }}>
                  <div className="flex items-center gap-2">
                    <AlertCircle size={14} />
                    <div>
                      <div>At project capacity (5 max)</div>
                      <div className="text-xs mt-1">Delete a project to create a new one</div>
                    </div>
                  </div>
                </div>
              ) : (
                <button
                  className="w-full px-3 py-2 text-left text-sm hover:bg-white/10 transition-colors"
                  style={{ color: theme.colors.accent.blue }}
                  onClick={() => {
                    setShowDropdown(false)
                    if (onCreateProject) {
                      onCreateProject()
                    }
                  }}
                >
                  <Plus size={14} className="inline mr-1" /> Create New Project
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}