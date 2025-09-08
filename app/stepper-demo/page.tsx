'use client'

import { useState } from 'react'
import DiceStepper from '@/components/DiceStepper'

export default function StepperDemo() {
  const [currentStep1, setCurrentStep1] = useState(3)
  const [currentStep2, setCurrentStep2] = useState(2)
  const [currentStep3, setCurrentStep3] = useState(4)

  return (
    <div className="min-h-screen bg-gray-900 p-8">
      <div className="max-w-6xl mx-auto space-y-12">
        <h1 className="text-3xl font-bold text-white mb-8">Dice Stepper Component Demo</h1>
        
        {/* Demo 1: Horizontal with labels */}
        <div className="space-y-4">
          <h2 className="text-xl text-gray-300">Horizontal with Labels (6 steps)</h2>
          <DiceStepper
            steps={6}
            currentStep={currentStep1}
            orientation="horizontal"
            labels={['Upload', 'Process', 'Review', 'Enhance', 'Export', 'Complete']}
            onStepClick={(step) => {
              console.log('Clicked step:', step)
              setCurrentStep1(step)
            }}
          />
          <p className="text-sm text-gray-500">Current step: {currentStep1}</p>
        </div>

        {/* Demo 2: Vertical with labels */}
        <div className="space-y-4">
          <h2 className="text-xl text-gray-300">Vertical with Labels (4 steps)</h2>
          <div className="flex">
            <DiceStepper
              steps={4}
              currentStep={currentStep2}
              orientation="vertical"
              labels={['Start', 'Configure', 'Build', 'Deploy']}
              onStepClick={(step) => {
                console.log('Clicked step:', step)
                setCurrentStep2(step)
              }}
            />
          </div>
          <p className="text-sm text-gray-500">Current step: {currentStep2}</p>
        </div>

        {/* Demo 3: Horizontal without labels */}
        <div className="space-y-4">
          <h2 className="text-xl text-gray-300">Horizontal without Labels (5 steps)</h2>
          <DiceStepper
            steps={5}
            currentStep={currentStep3}
            orientation="horizontal"
            onStepClick={(step) => {
              console.log('Clicked step:', step)
              setCurrentStep3(step)
            }}
          />
          <p className="text-sm text-gray-500">Current step: {currentStep3}</p>
        </div>

        {/* Demo 4: Minimal 3 steps */}
        <div className="space-y-4">
          <h2 className="text-xl text-gray-300">Minimal (3 steps)</h2>
          <DiceStepper
            steps={3}
            currentStep={2}
            orientation="horizontal"
          />
          <p className="text-sm text-gray-500">Static example - no click handler</p>
        </div>

        {/* Instructions */}
        <div className="mt-12 p-6 bg-gray-800 rounded-lg">
          <h3 className="text-lg font-semibold text-white mb-3">Component Features:</h3>
          <ul className="space-y-2 text-gray-300 text-sm">
            <li>• Configurable number of steps (1-6)</li>
            <li>• Horizontal or vertical orientation</li>
            <li>• Optional labels for each step</li>
            <li>• Click handlers for interactivity</li>
            <li>• Previous steps remain highlighted</li>
            <li>• Smooth animations on step change</li>
            <li>• Pulse effect on active step</li>
            <li>• Fully styled and self-contained</li>
          </ul>
        </div>
      </div>
    </div>
  )
}