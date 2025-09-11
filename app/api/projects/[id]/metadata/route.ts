import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// PATCH /api/projects/[id]/metadata - Update project metadata only
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth()
  
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  
  console.log(`[DB] PATCH /api/projects/${params.id}/metadata - Updating metadata for user ${session.user.id}`)
  try {
    const body = await request.json()
    const { name } = body
    console.log(`[DB] Metadata update: name="${name}"`)
    
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
    
    // Update only metadata fields
    console.log(`[DB] Updating metadata for project ${params.id}`)
    const project = await prisma.project.update({
      where: {
        id: params.id
      },
      data: {
        name
      }
    })
    
    console.log(`[DB] Successfully updated metadata for project ${params.id}`)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error updating metadata:', error)
    return NextResponse.json({ error: 'Failed to update metadata' }, { status: 500 })
  }
}