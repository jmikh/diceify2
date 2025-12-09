'use client'

import ProjectSelectionModal from '@/components/ProjectSelectionModal'
import { useState } from 'react'
import '../globals.css'

export default function TestDashboardPage() {
    const [isOpen, setIsOpen] = useState(true)
    const [projects, setProjects] = useState([
        {
            id: '1',
            name: 'Mona Lisa',
            updatedAt: new Date().toISOString(),
            percentComplete: 75,
            originalImage: '/public/images/monalisa.jpg'
        },
        {
            id: '2',
            name: 'Starry Night',
            updatedAt: new Date(Date.now() - 86400000).toISOString(),
            percentComplete: 30
        }
    ])

    const handleCreate = (name: string) => {
        console.log('Create Project:', name)
        const newProject = {
            id: Math.random().toString(),
            name: name,
            updatedAt: new Date().toISOString(),
            percentComplete: 0
        }
        setProjects([...projects, newProject])
    }

    const handleDelete = (id: string) => {
        console.log('Delete Project:', id)
        setProjects(projects.filter(p => p.id !== id))
    }

    return (
        <div className="min-h-screen bg-black flex items-center justify-center">
            <h1 className="text-white">Dashboard Test Page</h1>
            <ProjectSelectionModal
                isOpen={isOpen}
                onClose={() => setIsOpen(false)}
                onCreateFromCurrent={() => console.log('Create from current')}
                onCreateNew={handleCreate}
                onSelectProject={(id) => console.log('Select', id)}
                onDeleteProject={handleDelete}
                projects={projects}
                hasCurrentState={false}
                maxProjects={3}
            />
        </div>
    )
}
