import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { devLog, devError } from '@/lib/utils/debug'

// Shared function for updating progress
async function updateProgress(
  request: NextRequest,
  params: { id: string }
) {
  const session = await auth()
  
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  devLog(`[DB] /api/projects/${params.id}/progress - Updating progress for user ${session.user.id}`)
  try {
    const body = await request.json()
    const { currentX, currentY, completedDice, lastReachedStep } = body
    devLog(`[DB] Progress update: x=${currentX}, y=${currentY}, completed=${completedDice}, lastReachedStep=${lastReachedStep}`)
    
    // Check if project belongs to user
    devLog(`[DB] Checking project ownership`)
    const existingProject = await prisma.project.findFirst({
      where: {
        id: params.id,
        userId: session.user.id
      }
    })
    
    if (!existingProject) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }
    
    // Update progress fields and lastReachedStep
    devLog(`[DB] Updating progress for project ${params.id}`)
    const project = await prisma.project.update({
      where: {
        id: params.id
      },
      data: {
        currentX,
        currentY,
        completedDice,
        percentComplete: existingProject.totalDice > 0
          ? (completedDice / existingProject.totalDice) * 100
          : 0,
        lastReachedStep: lastReachedStep || 'build' // Default to 'build' if not provided
      }
    })
    
    devLog(`[DB] Successfully updated progress for project ${params.id}`)
    return NextResponse.json({ success: true })
  } catch (error) {
    devError('Error updating progress:', error)
    return NextResponse.json({ error: 'Failed to update progress' }, { status: 500 })
  }
}

// PATCH /api/projects/[id]/progress - Update project progress (auto-save)
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return updateProgress(request, params)
}

// POST /api/projects/[id]/progress - Update project progress (for navigator.sendBeacon)
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return updateProgress(request, params)
}