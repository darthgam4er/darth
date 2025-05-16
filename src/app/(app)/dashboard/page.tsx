"use client";

import { useEffect, useState } from 'react';
import { BarChart3, Clock, Zap, Target, CheckCircle, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { TimerSettings, StudySession } from '@/lib/types'; // Assuming StudySession type is defined for logs
import { Progress } from '@/components/ui/progress';

const DEFAULT_TIMER_SETTINGS: TimerSettings = {
  studyDuration: 60, shortBreakDuration: 10, longBreakDuration: 30, cyclesPerSuperBlock: 4,
  dailyGoalType: 'blocks', dailyGoalValue: 8, enableNotifications: true, strictMode: false,
};

// Helper to aggregate study data - this would ideally be more sophisticated
// For now, let's assume study logs are simple [{ type: 'study', duration: number, date: string }]
interface AggregatedStats {
  totalStudyTimeToday: number; // minutes
  completedBlocksToday: number;
  weeklyStudyTime: number; // minutes
  weeklyCompletedBlocks: number;
}

const aggregateStudyData = (logs: StudySession[]): AggregatedStats => {
  const today = new Date().toDateString();
  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

  let totalStudyTimeToday = 0;
  let completedBlocksToday = 0;
  let weeklyStudyTime = 0;
  let weeklyCompletedBlocks = 0;

  logs.forEach(log => {
    if (log.type === 'study' && log.completed) {
      const logDate = new Date(log.startTime);
      if (logDate.toDateString() === today) {
        totalStudyTimeToday += log.durationMinutes;
        completedBlocksToday++;
      }
      if (logDate >= oneWeekAgo) {
        weeklyStudyTime += log.durationMinutes;
        weeklyCompletedBlocks++;
      }
    }
  });
  return { totalStudyTimeToday, completedBlocksToday, weeklyStudyTime, weeklyCompletedBlocks };
};


export default function DashboardPage() {
  const [settings] = useLocalStorage<TimerSettings>('focusflow-settings', DEFAULT_TIMER_SETTINGS);
  const [currentStreak] = useLocalStorage<number>('focusflow-streak', 0);
  const [studyLog] = useLocalStorage<StudySession[]>('focusflow-study-log', []); // Assuming study logs are stored
  
  const [stats, setStats] = useState<AggregatedStats>({
    totalStudyTimeToday: 0,
    completedBlocksToday: 0,
    weeklyStudyTime: 0,
    weeklyCompletedBlocks: 0,
  });

  useEffect(() => {
    setStats(aggregateStudyData(studyLog));
  }, [studyLog]);

  const dailyGoalProgress = settings.dailyGoalType === 'blocks' 
    ? (stats.completedBlocksToday / settings.dailyGoalValue) * 100
    : (stats.totalStudyTimeToday / (settings.dailyGoalValue * 60)) * 100;

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold flex items-center"><BarChart3 className="mr-2 h-8 w-8 text-primary" />Dashboard</h1>
      
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today's Study Time</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalStudyTimeToday} min</div>
            <p className="text-xs text-muted-foreground">
              {stats.completedBlocksToday} blocks completed today
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Current Streak</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{currentStreak} Blocks</div>
            <p className="text-xs text-muted-foreground">Keep the momentum going!</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Daily Goal Progress</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{Math.min(100, Math.round(dailyGoalProgress))}%</div>
            <Progress value={Math.min(100, dailyGoalProgress)} className="h-2 mt-1" />
            <p className="text-xs text-muted-foreground">
              Target: {settings.dailyGoalValue} {settings.dailyGoalType}
            </p>
          </CardContent>
        </Card>

        <Card className="md:col-span-2 lg:col-span-1">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Weekly Study Time</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.weeklyStudyTime} min</div>
            <p className="text-xs text-muted-foreground">
              {stats.weeklyCompletedBlocks} blocks completed this week
            </p>
          </CardContent>
        </Card>
         <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center">
              <CheckCircle className="mr-2 h-5 w-5 text-green-500" />
              Recent Achievements
            </CardTitle>
            <CardDescription>Milestones and badges earned (Coming Soon).</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">No achievements unlocked yet. Keep studying!</p>
            {/* Placeholder for badges */}
          </CardContent>
        </Card>
      </div>

      {/* Placeholder for graphs. Recharts could be used here. */}
      <Card>
        <CardHeader>
          <CardTitle>Productivity Trends (Coming Soon)</CardTitle>
          <CardDescription>Visual representation of your study patterns over time.</CardDescription>
        </CardHeader>
        <CardContent className="h-64 flex items-center justify-center">
          <p className="text-muted-foreground">Chart will be displayed here.</p>
          <img data-ai-hint="productivity graph" src="https://placehold.co/600x300.png" alt="Placeholder graph" className="opacity-50" />
        </CardContent>
      </Card>
    </div>
  );
}
