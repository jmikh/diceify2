'use client'

import { useState, useRef, useEffect } from 'react'
import { theme } from '@/lib/theme'
import { Cloud, CloudOff } from 'lucide-react'
import { devError } from '@/lib/utils/debug'

interface ProjectSelectorProps {
  currentProject: string
  currentProjectId?: string | null
  onProjectChange: (name: string) => void
  lastSaved?: Date | null
  isSaving?: boolean
}

export default function ProjectSelector({
  currentProject,
  currentProjectId,
  onProjectChange,
  lastSaved,
  isSaving = false
}: ProjectSelectorProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editValue, setEditValue] = useState(currentProject)
  const [isCloudHovering, setIsCloudHovering] = useState(false)
  const [showSaveAnimation, setShowSaveAnimation] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const prevIsSavingRef = useRef(isSaving)

  // Check if the current project name is actually empty/untitled or has the default pattern
  const isDefaultName = !currentProject ||
    currentProject.startsWith('Untitled Project') ||
    currentProject.trim() === ''

  // Format display name with ellipsis if needed
  const rawDisplayName = currentProject || 'Untitled Project'
  const displayName = rawDisplayName.length > 20
    ? rawDisplayName.substring(0, 17) + '...'
    : rawDisplayName

  // Update edit value when current project changes
  useEffect(() => {
    setEditValue(currentProject)
  }, [currentProject])

  // Trigger save animation when saving completes
  useEffect(() => {
    if (prevIsSavingRef.current && !isSaving) {
      // Just finished saving - trigger the green flash
      setShowSaveAnimation(true)
      setTimeout(() => setShowSaveAnimation(false), 600) // Match animation duration
    }
    prevIsSavingRef.current = isSaving
  }, [isSaving])

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
      devError('Failed to rename project:', error)
      setEditValue(currentProject)
    }
  }

  const [isHovering, setIsHovering] = useState(false)

  // Format the last saved time
  const formatSaveTime = (date: Date | null | undefined) => {
    if (!date) return 'Never saved'

    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const seconds = Math.floor(diff / 1000)
    const minutes = Math.floor(seconds / 60)
    const hours = Math.floor(minutes / 60)

    if (seconds < 15) return 'Just now'
    if (seconds < 60) return `${seconds} seconds ago`
    if (minutes < 60) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`
    if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`
    return date.toLocaleDateString()
  }

  // Determine save status text
  const getSaveStatus = () => {
    if (isSaving) return 'Saving...'
    if (!lastSaved) return 'Not saved'
    return `Saved ${formatSaveTime(lastSaved)}`
  }

  return (
    <div
      data-testid="project-selector"
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
          ? theme.colors.accent.pink + '66'
          : isHovering
            ? 'rgba(255, 255, 255, 0.3)'
            : 'rgba(255, 255, 255, 0.1)',
        minWidth: isEditing ? '200px' : `100px`,
        transition: 'width 0.2s ease',
        cursor: !isEditing ? 'pointer' : 'text'
      }}
    >
      {/* Cloud icon with save status */}
      <div className="relative mr-2">
        <div
          onMouseEnter={() => setIsCloudHovering(true)}
          onMouseLeave={() => setIsCloudHovering(false)}
          className="relative"
        >
          <Cloud
            size={16}
            className={`transition-all ${showSaveAnimation ? 'save-flash' : ''}`}
            style={{
              color: showSaveAnimation
                ? undefined // Let the animation control the color
                : lastSaved
                  ? theme.colors.text.secondary
                  : theme.colors.text.muted
            }}
          />

          {/* Tooltip */}
          {isCloudHovering && (
            <div className="absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 px-2 py-1 text-xs rounded-lg transition-opacity pointer-events-none whitespace-nowrap backdrop-blur-md border z-50"
              style={{
                backgroundColor: 'rgba(0, 0, 0, 0.8)',
                borderColor: theme.colors.glass.border,
                color: theme.colors.text.primary
              }}
            >
              {getSaveStatus()}
            </div>
          )}
        </div>
      </div>

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
          title={rawDisplayName.length > 20 ? rawDisplayName : undefined}
        >
          {displayName}
        </button>
      )}
    </div>
  )
}