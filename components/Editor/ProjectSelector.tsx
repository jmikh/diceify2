'use client'

import { useState, useRef, useEffect } from 'react'
import { ChevronDown, Check } from 'lucide-react'
import { theme } from '@/lib/theme'

interface Project {
  id: string
  name: string
  lastModified: Date
}

interface ProjectSelectorProps {
  currentProject: string
  onProjectChange: (name: string) => void
  onProjectSelect?: (id: string) => void
}

export default function ProjectSelector({ 
  currentProject, 
  onProjectChange,
  onProjectSelect 
}: ProjectSelectorProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editValue, setEditValue] = useState(currentProject)
  const [showDropdown, setShowDropdown] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)
  
  // Sample projects - in a real app, these would come from a database
  const [recentProjects] = useState<Project[]>([
    { id: '1', name: 'Dice Art Project 1', lastModified: new Date('2024-01-15') },
    { id: '2', name: 'Family Portrait', lastModified: new Date('2024-01-10') },
    { id: '3', name: 'Logo Design', lastModified: new Date('2024-01-05') },
    { id: '4', name: 'Abstract Pattern', lastModified: new Date('2023-12-20') },
  ])

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
      onProjectChange(editValue.trim())
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
      onProjectSelect(project.id)
    }
    setShowDropdown(false)
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
            <div className="px-3 py-1 text-xs font-medium" style={{ color: theme.colors.text.muted }}>
              Recent Projects
            </div>
            {recentProjects.map((project) => (
              <button
                key={project.id}
                onClick={() => handleProjectSelect(project)}
                className="w-full px-3 py-2 flex items-center justify-between hover:bg-white/10 transition-colors"
              >
                <div className="flex-1 text-left">
                  <div className="text-sm" style={{ color: theme.colors.text.primary }}>
                    {project.name}
                  </div>
                  <div className="text-xs" style={{ color: theme.colors.text.muted }}>
                    {project.lastModified.toLocaleDateString()}
                  </div>
                </div>
                {project.name === currentProject && (
                  <Check size={14} style={{ color: theme.colors.accent.green }} />
                )}
              </button>
            ))}
            
            <div className="border-t mt-2 pt-2" style={{ borderColor: theme.colors.glass.border }}>
              <button
                className="w-full px-3 py-2 text-left text-sm hover:bg-white/10 transition-colors"
                style={{ color: theme.colors.accent.blue }}
                onClick={() => {
                  setShowDropdown(false)
                  // In a real app, this would open a dialog to create a new project
                  const newName = 'New Project'
                  onProjectChange(newName)
                  setIsEditing(true)
                  setEditValue(newName)
                }}
              >
                + Create New Project
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}