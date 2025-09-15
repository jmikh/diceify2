import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET /api/projects - Get all projects for current user
export async function GET() {
  const session = await auth()
  
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  
  console.log(`[DB] GET /api/projects - Fetching all projects for user ${session.user.id}`)
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
        lastReachedStep: true,
        percentComplete: true,
        totalDice: true,
        completedDice: true,
        currentX: true,
        currentY: true,
        updatedAt: true,
        createdAt: true
        // Excluded large fields: originalImage, croppedImage, gridData
        // These will be fetched only when loading a specific project
      }
    })
    
    console.log(`[DB] Found ${projects.length} projects for user`)
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
  
  console.log(`[DB] POST /api/projects - Creating new project for user ${session.user.id}`)
  try {
    // Check if user already has 3 projects
    console.log(`[DB] Checking project count for user`)
    const projectCount = await prisma.project.count({
      where: {
        userId: session.user.id
      }
    })
    
    if (projectCount >= 3) {
      return NextResponse.json({ 
        error: 'Project limit reached. Maximum 3 projects allowed. Please delete a project to create a new one.' 
      }, { status: 403 })
    }
    
    const body = await request.json()
    const { 
      name = 'Untitled Project',
      lastReachedStep = 'upload',
      originalImage,
      croppedImage, // This will be stored as originalImage if no originalImage provided
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
      completedDice,
      currentX,
      currentY,
      percentComplete,
      cropX,
      cropY,
      cropWidth,
      cropHeight,
      cropRotation
    } = body
    
    console.log(`[DB] Creating new project with name: ${name}`)
    console.log(`[DB] Has originalImage: ${!!originalImage}, Has croppedImage: ${!!croppedImage}`)
    
    // Use croppedImage as originalImage if originalImage is not provided
    // This happens when user crops before saving
    const imageToSave = originalImage || croppedImage
    
    const project = await prisma.project.create({
      data: {
        name,
        userId: session.user.id,
        lastReachedStep,
        originalImage: imageToSave,
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
        completedDice,
        currentX,
        currentY,
        percentComplete,
        cropX,
        cropY,
        cropWidth,
        cropHeight,
        cropRotation
      }
    })
    
    console.log(`[DB] Created project ${project.id}`)
    return NextResponse.json(project)
  } catch (error) {
    console.error('Error creating project:', error)
    return NextResponse.json({ error: 'Failed to create project' }, { status: 500 })
  }
}