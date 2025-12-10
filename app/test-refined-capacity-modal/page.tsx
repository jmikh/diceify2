'use client'

import ProjectSelectionModal from '@/components/ProjectSelectionModal'
import { useState } from 'react'
import '../globals.css'

export default function TestRefinedCapacityPage() {
    const [isOpen, setIsOpen] = useState(true)

    const projects = [
        {
            id: '1',
            name: 'Mona Lisa Mosaic',
            updatedAt: new Date().toISOString(),
            percentComplete: 75,
            // Using a placeholder image or empty string if not available
            originalImage: '/public/images/monalisa.jpg'
        },
        {
            id: '2',
            name: 'Starry Night Build',
            updatedAt: new Date(Date.now() - 86400000).toISOString(),
            percentComplete: 30
        },
        {
            id: '3',
            name: 'Dice Portrait',
            updatedAt: new Date(Date.now() - 172800000).toISOString(),
            percentComplete: 100
        }
    ]

    return (
        <div className="min-h-screen bg-black flex items-center justify-center">
            <h1 className="text-white">Test Page Background</h1>
            <ProjectSelectionModal
                isOpen={isOpen}
                onClose={() => setIsOpen(false)}

                onCreateNew={() => console.log('Create new')}
                onSelectProject={(id) => console.log('Select', id)}
                onDeleteProject={(id) => console.log('Delete', id)}
                projects={projects}
                hasCurrentState={true}
                maxProjects={3}
            />
        </div>
    )
}
