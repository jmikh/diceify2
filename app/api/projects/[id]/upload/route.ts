import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { devLog, devError } from '@/lib/utils/debug'

// PATCH /api/projects/[id]/upload - Update upload step data only
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth()

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  devLog(`[DB] PATCH /api/projects/${params.id}/upload - Updating upload data for user ${session.user.id}`)
  try {
    const body = await request.json()
    const { originalImage } = body
    devLog(`[DB] Upload update: hasImage=${!!originalImage}`)

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

    // Update only upload-related fields
    devLog(`[DB] Updating upload data for project ${params.id}`)
    const project = await prisma.project.update({
      where: {
        id: params.id
      },
      data: {
        originalImage,

      }
    })

    devLog(`[DB] Successfully updated upload data for project ${params.id}`)
    return NextResponse.json({ success: true })
  } catch (error) {
    devError('Error updating upload data:', error)
    return NextResponse.json({ error: 'Failed to update upload data' }, { status: 500 })
  }
}