
"use client";

import React, { useEffect, useState, useMemo } from 'react'; // Added React and useMemo
import { BarChart3, Clock, Zap, Target, CheckCircle, TrendingUp, ChevronLeft, ChevronRight } from 'lucide-react'; // Added ChevronLeft, ChevronRight
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { TimerSettings, StudySession } from '@/lib/types';
import { Progress } from '@/components/ui/progress';
import { Calendar } from '@/components/ui/calendar'; // Added
import type { DayContentProps } from 'react-day-picker'; // Added
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'; // Added
import { format } from 'date-fns'; // Added
import { Button } from '@/components/ui/button'; // Added
import { cn } from '@/lib/utils'; // Added

const DEFAULT_TIMER_SETTINGS: TimerSettings = {
  studyDuration: 60, shortBreakDuration: 10, longBreakDuration: 30, cyclesPerSuperBlock: 4,
  dailyGoalType: 'blocks', dailyGoalValue: 8, enableNotifications: true, strictMode: false,
};

interface AggregatedStats {
  totalStudyTimeToday: number;
  completedBlocksToday: number;
  weeklyStudyTime: number;
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
      try {
        const logDate = new Date(log.startTime);
         if (isNaN(logDate.getTime())) {
            console.warn("Invalid date in studyLog for aggregation:", log.startTime);
            return;
          }
        if (logDate.toDateString() === today) {
          totalStudyTimeToday += log.durationMinutes;
          completedBlocksToday++;
        }
        if (logDate >= oneWeekAgo) {
          weeklyStudyTime += log.durationMinutes;
          weeklyCompletedBlocks++;
        }
      } catch (e) {
        console.warn("Error processing date from studyLog for aggregation:", log.startTime, e);
      }
    }
  });
  return { totalStudyTimeToday, completedBlocksToday, weeklyStudyTime, weeklyCompletedBlocks };
};


export default function DashboardPage() {
  const [settings] = useLocalStorage<TimerSettings>('focusflow-settings', DEFAULT_TIMER_SETTINGS);
  const [currentStreak] = useLocalStorage<number>('focusflow-streak', 0);
  const [studyLog] = useLocalStorage<StudySession[]>('focusflow-study-log', []);
  
  const [stats, setStats] = useState<AggregatedStats>({
    totalStudyTimeToday: 0,
    completedBlocksToday: 0,
    weeklyStudyTime: 0,
    weeklyCompletedBlocks: 0,
  });

  const [dailyFocusData, setDailyFocusData] = useState<Record<string, number>>({});
  const [currentCalendarYear, setCurrentCalendarYear] = useState(new Date().getFullYear());

  useEffect(() => {
    setStats(aggregateStudyData(studyLog));
  }, [studyLog]);

  useEffect(() => {
    const data: Record<string, number> = {};
    studyLog.forEach(log => {
      if (log.type === 'study' && log.completed) {
        try {
          const date = new Date(log.startTime);
          if (isNaN(date.getTime())) {
            console.warn("Invalid date in studyLog for calendar:", log.startTime);
            return;
          }
          const dateStr = format(date, 'yyyy-MM-dd');
          data[dateStr] = (data[dateStr] || 0) + log.durationMinutes;
        } catch (e) {
          console.warn("Error processing date from studyLog for calendar:", log.startTime, e);
        }
      }
    });
    setDailyFocusData(data);
  }, [studyLog]);

  const focusedDaysModifier = useMemo(() => {
    return Object.keys(dailyFocusData)
      .filter(dateStr => dailyFocusData[dateStr] > 0)
      .map(dateStr => {
        const [year, month, day] = dateStr.split('-').map(Number);
        return new Date(year, month - 1, day); // month is 0-indexed
      });
  }, [dailyFocusData]);

  function CustomDayContent({ date, displayMonth }: DayContentProps) {
    const dateStr = format(date, 'yyyy-MM-dd');
    const focusTimeMinutes = dailyFocusData[dateStr];

    // Render plain day number for days not in the currently displayed month
    if (date.getMonth() !== displayMonth.getMonth()) {
      return <>{format(date, 'd')}</>;
    }

    const dayNumber = format(date, 'd');

    if (focusTimeMinutes && focusTimeMinutes > 0) {
      return (
        <TooltipProvider delayDuration={100}>
          <Tooltip>
            <TooltipTrigger asChild>
              <span>{dayNumber}</span>
            </TooltipTrigger>
            <TooltipContent>
              <p>Focused for {focusTimeMinutes} min.</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );
    }
    return <>{dayNumber}</>;
  }

  const dailyGoalProgress = settings.dailyGoalType === 'blocks' 
    ? (settings.dailyGoalValue > 0 ? (stats.completedBlocksToday / settings.dailyGoalValue) * 100 : 0)
    : (settings.dailyGoalValue > 0 ? (stats.totalStudyTimeToday / (settings.dailyGoalValue * 60)) * 100 : 0);

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
          </CardContent>
        </Card>
      </div>

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

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Focus Calendar ({currentCalendarYear})</span>
            <div className="space-x-2">
              <Button variant="outline" size="icon" onClick={() => setCurrentCalendarYear(y => y - 1)} aria-label="Previous year">
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="icon" onClick={() => setCurrentCalendarYear(y => y + 1)} aria-label="Next year">
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </CardTitle>
          <CardDescription>Hover over a day to see your total focus time. Days with focused time are highlighted.</CardDescription>
        </CardHeader>
        <CardContent className="pt-0">
          <Calendar
            key={currentCalendarYear}
            mode="single" 
            month={new Date(currentCalendarYear, 0, 1)}
            numberOfMonths={12}
            showOutsideDays
            fixedWeeks
            components={{ DayContent: CustomDayContent }}
            modifiers={{ focused: focusedDaysModifier }}
            modifiersClassNames={{ focused: 'bg-primary/20 rounded-sm font-semibold' }}
            className="p-0 [&_button[name=previous-month]]:hidden [&_button[name=next-month]]:hidden [&_.rdp-caption_label]:text-lg [&_.rdp-caption_label]:font-medium"
          />
        </CardContent>
      </Card>
    </div>
  );
}
