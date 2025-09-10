import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// PATCH /api/projects/[id]/progress - Update project progress (auto-save)
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth()
  
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  
  try {
    const body = await request.json()
    const { currentX, currentY, completedDice } = body
    
    // Check if project belongs to user
    const existingProject = await prisma.project.findFirst({
      where: {
        id: params.id,
        userId: session.user.id
      }
    })
    
    if (!existingProject) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }
    
    // Update only progress fields
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
          : 0
      }
    })
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error updating progress:', error)
    return NextResponse.json({ error: 'Failed to update progress' }, { status: 500 })
  }
}