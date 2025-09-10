import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET /api/projects - Get all projects for current user
export async function GET() {
  const session = await auth()
  
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  
  try {
    const projects = await prisma.project.findMany({
      where: {
        userId: session.user.id
      },
      orderBy: {
        updatedAt: 'desc'
      },
      select: {
        id: true,
        name: true,
        percentComplete: true,
        updatedAt: true,
        createdAt: true,
        totalDice: true,
        completedDice: true
      }
    })
    
    return NextResponse.json(projects)
  } catch (error) {
    console.error('Error fetching projects:', error)
    return NextResponse.json({ error: 'Failed to fetch projects' }, { status: 500 })
  }
}

// POST /api/projects - Create new project
export async function POST(request: NextRequest) {
  const session = await auth()
  
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  
  try {
    // Check if user already has 5 projects
    const projectCount = await prisma.project.count({
      where: {
        userId: session.user.id
      }
    })
    
    if (projectCount >= 5) {
      return NextResponse.json({ 
        error: 'Project limit reached. Maximum 5 projects allowed. Please delete a project to create a new one.' 
      }, { status: 403 })
    }
    
    const body = await request.json()
    const { name = 'Untitled Project' } = body
    
    const project = await prisma.project.create({
      data: {
        name,
        userId: session.user.id
      }
    })
    
    return NextResponse.json(project)
  } catch (error) {
    console.error('Error creating project:', error)
    return NextResponse.json({ error: 'Failed to create project' }, { status: 500 })
  }
}