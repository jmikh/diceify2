'use client'

import { DiceStats } from '@/app/editor/page'

interface StatsDisplayProps {
  stats: DiceStats
}

export default function StatsDisplay({ stats }: StatsDisplayProps) {
  const blackPercentage = stats.totalCount > 0 
    ? Math.round((stats.blackCount / stats.totalCount) * 100) 
    : 0
  const whitePercentage = stats.totalCount > 0 
    ? Math.round((stats.whiteCount / stats.totalCount) * 100) 
    : 0

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Dice Statistics</h3>
      
      <div className="space-y-4">
        {/* Total Count */}
        <div className="text-center pb-4 border-b border-gray-200">
          <div className="text-3xl font-bold text-gray-900">
            {stats.totalCount.toLocaleString()}
          </div>
          <div className="text-sm text-gray-500">Total Dice</div>
        </div>

        {/* Dice Distribution Bar */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-gray-700">Distribution</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-6 flex overflow-hidden">
            {/* Black portion */}
            <div
              className="bg-gray-900 h-6 transition-all duration-300 flex items-center justify-center"
              style={{ width: `${blackPercentage}%` }}
            >
              {blackPercentage > 10 && (
                <span className="text-xs text-white font-medium">{blackPercentage}%</span>
              )}
            </div>
            {/* White portion */}
            <div
              className="bg-gray-100 h-6 transition-all duration-300 flex items-center justify-center border-l border-gray-300"
              style={{ width: `${whitePercentage}%` }}
            >
              {whitePercentage > 10 && (
                <span className="text-xs text-gray-700 font-medium">{whitePercentage}%</span>
              )}
            </div>
          </div>
          <div className="mt-2 flex justify-between text-xs">
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-gray-900 rounded"></div>
              <span className="text-gray-600">{stats.blackCount.toLocaleString()}</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-gray-100 border border-gray-300 rounded"></div>
              <span className="text-gray-600">{stats.whiteCount.toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* Physical Dice Info */}
        <div className="pt-4 border-t border-gray-200">
          <h4 className="text-sm font-medium text-gray-700 mb-2">Physical Recreation</h4>
          <div className="text-xs text-gray-500 space-y-1">
            <div>Standard 16mm dice:</div>
            <div>• Black: {stats.blackCount} needed</div>
            <div>• White: {stats.whiteCount} needed</div>
            <div className="pt-1 font-medium">
              Estimated cost: ${((stats.totalCount * 0.15).toFixed(1))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}