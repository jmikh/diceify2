import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { devLog, devError } from '@/lib/utils/debug'

// PATCH /api/projects/[id]/crop - Update crop step data only
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth()
  
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  
  devLog(`[DB] PATCH /api/projects/${params.id}/crop - Updating crop data for user ${session.user.id}`)
  try {
    const body = await request.json()
    const { cropX, cropY, cropWidth, cropHeight, cropRotation, lastReachedStep } = body
    devLog(`[DB] Crop update: x=${cropX}, y=${cropY}, w=${cropWidth}, h=${cropHeight}, rotation=${cropRotation}, lastReached=${lastReachedStep}`)
    
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
    
    // Update only crop-related fields
    devLog(`[DB] Updating crop data for project ${params.id}`)
    const project = await prisma.project.update({
      where: {
        id: params.id
      },
      data: {
        cropX,
        cropY,
        cropWidth,
        cropHeight,
        cropRotation: cropRotation || 0,
        lastReachedStep
      }
    })
    
    devLog(`[DB] Successfully updated crop data for project ${params.id}`)
    return NextResponse.json({ success: true })
  } catch (error) {
    devError('Error updating crop data:', error)
    return NextResponse.json({ error: 'Failed to update crop data' }, { status: 500 })
  }
}