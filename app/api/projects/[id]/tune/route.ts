import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { devLog, devError } from '@/lib/utils/debug'

// PATCH /api/projects/[id]/tune - Update tune step parameters only
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth()

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  devLog(`[DB] PATCH /api/projects/${params.id}/tune - Updating tune parameters for user ${session.user.id}`)
  try {
    const body = await request.json()
    const {
      numRows,
      colorMode,
      contrast,
      gamma,
      edgeSharpening,
      rotate2,
      rotate3,
      rotate6,
      dieSize,
      costPer1000,
      gridWidth,
      gridHeight,
      totalDice
    } = body

    devLog(`[DB] Tune update: numRows=${numRows}, colorMode=${colorMode}, contrast=${contrast}`)

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

    // Update only tune-related fields (NO images, NO progress fields)
    devLog(`[DB] Updating tune parameters for project ${params.id}`)
    const project = await prisma.project.update({
      where: {
        id: params.id
      },
      data: {
        numRows,
        colorMode,
        contrast,
        gamma,
        edgeSharpening,
        rotate2,
        rotate3,
        rotate6,
        dieSize,
        costPer1000,
        gridWidth,
        gridHeight,
        totalDice,

        // Calculate percentage based on total dice if it changed
        percentComplete: totalDice > 0 && existingProject.completedDice > 0
          ? (existingProject.completedDice / totalDice) * 100
          : existingProject.percentComplete
      }
    })

    devLog(`[DB] Successfully updated tune parameters for project ${params.id}`)
    return NextResponse.json({ success: true })
  } catch (error) {
    devError('Error updating tune parameters:', error)
    return NextResponse.json({ error: 'Failed to update tune parameters' }, { status: 500 })
  }
}