'use client'

import { useState, useRef, useEffect } from 'react'
import { theme } from '@/lib/theme'

interface ProjectSelectorProps {
  currentProject: string
  currentProjectId?: string | null
  onProjectChange: (name: string) => void
}

export default function ProjectSelector({ 
  currentProject,
  currentProjectId,
  onProjectChange
}: ProjectSelectorProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editValue, setEditValue] = useState(currentProject)
  const inputRef = useRef<HTMLInputElement>(null)
  
  // Check if the current project name is actually empty/untitled or has the default pattern
  const isDefaultName = !currentProject || 
    currentProject.startsWith('Untitled Project') || 
    currentProject.trim() === ''
  const displayName = currentProject || 'Untitled Project'
  
  // Update edit value when current project changes
  useEffect(() => {
    setEditValue(currentProject)
  }, [currentProject])

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
    }
  }, [isEditing])

  const handleEditComplete = () => {
    setIsEditing(false)
    const trimmedValue = editValue.trim()
    
    // If we have a valid new name that's different from the current stored name
    if (trimmedValue && trimmedValue !== currentProject) {
      handleRenameProject()
    } else if (!trimmedValue) {
      // Reset to current name if empty
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


  const handleRenameProject = async () => {
    const trimmedValue = editValue.trim()
    
    if (!currentProjectId || !trimmedValue) {
      setEditValue(currentProject)
      return
    }

    try {
      const response = await fetch(`/api/projects/${currentProjectId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: trimmedValue })
      })
      
      if (response.ok) {
        onProjectChange(trimmedValue)
      }
    } catch (error) {
      console.error('Failed to rename project:', error)
      setEditValue(currentProject)
    }
  }

  const [isHovering, setIsHovering] = useState(false)

  return (
    <div 
      className="inline-flex items-center px-4 py-2 rounded-full border transition-all"
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
      style={{
        backgroundColor: isEditing 
          ? 'rgba(255, 255, 255, 0.1)' 
          : isHovering 
            ? 'rgba(255, 255, 255, 0.1)'
            : 'rgba(255, 255, 255, 0.05)',
        borderColor: isEditing 
          ? theme.colors.accent.blue + '66' 
          : isHovering
            ? 'rgba(255, 255, 255, 0.3)'
            : 'rgba(255, 255, 255, 0.1)',
        minWidth: '200px',
        cursor: !isEditing ? 'pointer' : 'text'
      }}
    >
      {isEditing ? (
        <input
          ref={inputRef}
          type="text"
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onBlur={handleEditComplete}
          onKeyDown={handleKeyDown}
          className="bg-transparent outline-none text-sm font-medium w-full"
          style={{ 
            color: theme.colors.text.primary
          }}
          placeholder="Enter project name..."
        />
      ) : (
        <button
          onClick={() => {
            setIsEditing(true)
            // Select all text if it's a default name
            if (isDefaultName) {
              setEditValue(currentProject)
            }
          }}
          className="text-left text-sm font-medium w-full transition-all"
          style={{ 
            color: isDefaultName ? theme.colors.text.muted : theme.colors.text.primary
          }}
        >
          {displayName}
        </button>
      )}
    </div>
  )
}