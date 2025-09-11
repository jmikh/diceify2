import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// PATCH /api/projects/[id]/upload - Update upload step data only
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth()
  
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  
  console.log(`[DB] PATCH /api/projects/${params.id}/upload - Updating upload data for user ${session.user.id}`)
  try {
    const body = await request.json()
    const { originalImage, lastReachedStep } = body
    console.log(`[DB] Upload update: hasImage=${!!originalImage}, lastReached=${lastReachedStep}`)
    
    // Check if project belongs to user
    console.log(`[DB] Checking project ownership`)
    const existingProject = await prisma.project.findFirst({
      where: {
        id: params.id,
        userId: session.user.id
      }
    })
    
    if (!existingProject) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }
    
    // Update only upload-related fields
    console.log(`[DB] Updating upload data for project ${params.id}`)
    const project = await prisma.project.update({
      where: {
        id: params.id
      },
      data: {
        originalImage,
        lastReachedStep
      }
    })
    
    console.log(`[DB] Successfully updated upload data for project ${params.id}`)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error updating upload data:', error)
    return NextResponse.json({ error: 'Failed to update upload data' }, { status: 500 })
  }
}