'use client'

import ProjectSelectionModal from '@/components/ProjectSelectionModal'
import { useState } from 'react'
import '../globals.css'

export default function TestDashboardFixPage() {
    const [isOpen, setIsOpen] = useState(true)
    const [projects, setProjects] = useState([
        {
            id: '1',
            name: 'Project One',
            updatedAt: new Date().toISOString(),
            percentComplete: 75,
        },
        {
            id: '2',
            name: 'Project Two',
            updatedAt: new Date(Date.now() - 86400000).toISOString(),
            percentComplete: 30
        },
        {
            id: '3',
            name: 'Project Three',
            updatedAt: new Date(Date.now() - 90000000).toISOString(),
            percentComplete: 10
        }
    ])

    const handleDelete = (id: string) => {
        console.log('Delete Project:', id)
        // IMPORTANT: logic in useProjectManager does NOT set isOpen to false anymore.
        // In this test harness, we just update the list.
        setProjects(projects.filter(p => p.id !== id))
    }

    return (
        <div className="min-h-screen bg-black flex items-center justify-center">
            <h1 className="text-white">Dashboard Test Page</h1>
            <ProjectSelectionModal
                isOpen={isOpen}
                onClose={() => setIsOpen(false)}
                onCreateFromCurrent={() => console.log('Create from current')}
                onCreateNew={(name) => console.log('Create:', name)}
                onSelectProject={(id) => console.log('Select', id)}
                onDeleteProject={handleDelete}
                projects={projects}
                hasCurrentState={false}
                maxProjects={3}
            />
        </div>
    )
}
