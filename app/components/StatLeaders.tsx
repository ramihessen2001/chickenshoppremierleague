/**
 * Leaderboards for goals, assists and saves.
 * Displays top 5 leaders in goals, assists, and saves
 */

import { LeaderboardEntry } from '@/types/statistic'

interface StatLeadersProps {
  goals: LeaderboardEntry[]
  assists: LeaderboardEntry[]
  saves: LeaderboardEntry[]
}

export function StatLeaders({ goals, assists, saves }: StatLeadersProps) {
  return (
    <section className="py-12 px-4 sm:px-6" aria-labelledby="stat-leaders-title">
      <div className="max-w-7xl mx-auto">
        {/* Gold divider */}
        <div className="h-px bg-gradient-to-r from-transparent via-[#B8860B] to-transparent mb-12" />
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12">
          <LeaderColumn title="GOALS LEADERS" leaders={goals} />
          <LeaderColumn title="ASSISTS LEADERS" leaders={assists} />
          <LeaderColumn title="SAVES LEADERS" leaders={saves} />
        </div>
      </div>
    </section>
  )
}

interface LeaderColumnProps {
  title: string
  leaders: LeaderboardEntry[]
}

function LeaderColumn({ title, leaders }: LeaderColumnProps) {
  if (leaders.length === 0) {
    return (
      <div>
        <h3 className="text-xl sm:text-2xl font-bold uppercase mb-6 text-white">
          {title}
        </h3>
        <p className="text-gray-400 text-sm">Statistics available after games begin</p>
      </div>
    )
  }
  
  // Group players by count (for ties)
  const groupedByCount = leaders.reduce((acc, entry) => {
    if (!acc[entry.count]) {
      acc[entry.count] = []
    }
    acc[entry.count].push(entry.player)
    return acc
  }, {} as Record<number, typeof leaders[number]['player'][]>)
  
  // Sort counts descending
  const sortedCounts = Object.keys(groupedByCount)
    .map(Number)
    .sort((a, b) => b - a)
    .slice(0, 5)
  
  // Rank each score group up front. Mutating a counter while mapping works
  // until React re-renders the list without re-running this function.
  let running = 1
  const rankByCount = new Map<number, number>()
  for (const count of sortedCounts) {
    rankByCount.set(count, running)
    running += groupedByCount[count].length
  }

  return (
    <div>
      <h3 className="text-xl sm:text-2xl font-bold uppercase mb-6 text-black">
        {title}
      </h3>
      <ol className="space-y-3">
        {sortedCounts.map(count => {
          const players = groupedByCount[count]
          const currentRank = rankByCount.get(count)!

          return (
            <li key={count} className="flex justify-between items-start text-base sm:text-lg">
              <span className="flex-1">
                <span className="text-black mr-3">{currentRank}.</span>
                <span className="text-black">
                  {players.length > 1
                    ? players.map(p => p.name).join(', ')
                    : players[0].name}
                </span>
              </span>
              <span className="font-bold text-black ml-4">{count}</span>
            </li>
          )
        })}
      </ol>
    </div>
  )
}

