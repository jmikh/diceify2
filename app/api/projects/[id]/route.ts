import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET /api/projects/[id] - Get single project
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth()
  
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  
  console.log(`[DB] GET /api/projects/${params.id} - Fetching project for user ${session.user.id}`)
  try {
    const project = await prisma.project.findFirst({
      where: {
        id: params.id,
        userId: session.user.id
      }
    })
    
    if (!project) {
      console.log(`[DB] Project ${params.id} not found`)
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }
    
    console.log(`[DB] Found project ${params.id}`)
    return NextResponse.json(project)
  } catch (error) {
    console.error('Error fetching project:', error)
    return NextResponse.json({ error: 'Failed to fetch project' }, { status: 500 })
  }
}

// PATCH /api/projects/[id] - Update project
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth()
  
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  
  console.log(`[DB] PATCH /api/projects/${params.id} - Updating project for user ${session.user.id}`)
  try {
    const body = await request.json()
    console.log(`[DB] Update data keys: ${Object.keys(body).join(', ')}`)
    
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
    
    // Update project
    console.log(`[DB] Updating project ${params.id}`)
    const project = await prisma.project.update({
      where: {
        id: params.id
      },
      data: {
        ...body,
        // Calculate percentage if dice counts are updated
        percentComplete: body.totalDice && body.completedDice 
          ? (body.completedDice / body.totalDice) * 100
          : existingProject.percentComplete
      }
    })
    
    console.log(`[DB] Successfully updated project ${params.id}`)
    return NextResponse.json(project)
  } catch (error) {
    console.error('Error updating project:', error)
    return NextResponse.json({ error: 'Failed to update project' }, { status: 500 })
  }
}

// DELETE /api/projects/[id] - Delete project
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth()
  
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  
  console.log(`[DB] DELETE /api/projects/${params.id} - Deleting project for user ${session.user.id}`)
  try {
    // Check if project belongs to user
    console.log(`[DB] Checking project ownership before deletion`)
    const project = await prisma.project.findFirst({
      where: {
        id: params.id,
        userId: session.user.id
      }
    })
    
    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }
    
    // Delete project
    console.log(`[DB] Deleting project ${params.id}`)
    await prisma.project.delete({
      where: {
        id: params.id
      }
    })
    
    console.log(`[DB] Successfully deleted project ${params.id}`)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting project:', error)
    return NextResponse.json({ error: 'Failed to delete project' }, { status: 500 })
  }
}