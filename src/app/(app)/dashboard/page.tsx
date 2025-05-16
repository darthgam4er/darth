
"use client";

import React, { useEffect, useState, useMemo } from 'react';
import { BarChart3, Clock, Zap, Target, CheckCircle, TrendingUp, ChevronLeft, ChevronRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { TimerSettings, StudySession } from '@/lib/types';
import { Progress } from '@/components/ui/progress';
import { Calendar } from '@/components/ui/calendar';
import type { DayContentProps } from 'react-day-picker';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { format, subDays, eachDayOfInterval, startOfDay } from 'date-fns';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { BarChart as RechartsBarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltipComponent } from 'recharts';
import { ChartContainer, ChartTooltipContent, ChartStyle } from "@/components/ui/chart"; // Added ChartStyle for consistency


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
  const todayString = new Date().toDateString();
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
        if (logDate.toDateString() === todayString) {
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
  const [productivityChartData, setProductivityChartData] = useState<Array<{ date: string, studyTime: number }>>([]);

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
  
  useEffect(() => {
    const today = startOfDay(new Date());
    const referenceDayForInterval = subDays(today, 6); 
    const lastSevenDaysInterval = eachDayOfInterval({
      start: referenceDayForInterval,
      end: today,
    });

    const dateEntries = lastSevenDaysInterval.slice(-7).map(day => ({
      date: format(day, 'EEE'), 
      studyTime: 0,
      fullDate: format(day, 'yyyy-MM-dd') 
    }));


    studyLog.forEach(log => {
      if (log.type === 'study' && log.completed) {
        try {
          const logDate = startOfDay(new Date(log.startTime));
          const logDateStr = format(logDate, 'yyyy-MM-dd');
          
          const dayData = dateEntries.find(d => d.fullDate === logDateStr);
          if (dayData) {
            dayData.studyTime += log.durationMinutes;
          }
        } catch (e) {
          console.warn("Error processing date from studyLog for chart:", log.startTime, e);
        }
      }
    });
    
    setProductivityChartData(dateEntries.map(({date, studyTime}) => ({date, studyTime})));
  }, [studyLog]);


  const focusedDaysModifier = useMemo(() => {
    return Object.keys(dailyFocusData)
      .filter(dateStr => dailyFocusData[dateStr] > 0)
      .map(dateStr => {
        const [year, month, day] = dateStr.split('-').map(Number);
        return new Date(year, month - 1, day); 
      });
  }, [dailyFocusData]);

  function CustomDayContent({ date, displayMonth }: DayContentProps) {
    const dateStr = format(date, 'yyyy-MM-dd');
    const focusTimeMinutes = dailyFocusData[dateStr];
    const dayNumber = format(date, 'd');

    const content = <div className="flex items-center justify-center h-full w-full">{dayNumber}</div>;

    if (date.getMonth() !== displayMonth.getMonth()) {
      return content; // Render only day number for outside days
    }

    if (focusTimeMinutes && focusTimeMinutes > 0) {
      return (
        <TooltipProvider delayDuration={100}>
          <Tooltip>
            <TooltipTrigger asChild>
              {content}
            </TooltipTrigger>
            <TooltipContent>
              <p>Focused for {focusTimeMinutes} min.</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );
    }
    return content;
  }

  const dailyGoalProgress = settings.dailyGoalType === 'blocks' 
    ? (settings.dailyGoalValue > 0 ? (stats.completedBlocksToday / settings.dailyGoalValue) * 100 : 0)
    : (settings.dailyGoalValue > 0 ? (stats.totalStudyTimeToday / (settings.dailyGoalValue * 60)) * 100 : 0);

  const showProductivityChart = productivityChartData.some(d => d.studyTime > 0);
  const chartConfig = { studyTime: { label: "Study Time (min)", color: "hsl(var(--primary))" } };


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
          <CardTitle>Productivity Trends (Last 7 Days)</CardTitle>
          <CardDescription>Visual representation of your study patterns over time.</CardDescription>
        </CardHeader>
        <CardContent className="pt-6 h-[350px]">
          {showProductivityChart ? (
            <ChartContainer config={chartConfig} className="h-full w-full">
              <RechartsBarChart data={productivityChartData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }} accessibilityLayer>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis
                  dataKey="date"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                />
                <YAxis
                  dataKey="studyTime"
                  tickFormatter={(value) => `${value}m`}
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  width={40}
                />
                <RechartsTooltipComponent
                  cursor={{ fill: 'hsl(var(--muted))', radius: 'var(--radius)' }}
                  content={<ChartTooltipContent indicator="bar" nameKey="date" />}
                />
                <Bar dataKey="studyTime" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} barSize={40} />
              </RechartsBarChart>
            </ChartContainer>
          ) : (
            <div className="flex items-center justify-center h-full">
              <p className="text-muted-foreground text-center">Not enough data to display productivity trends yet. <br/>Log some completed study sessions!</p>
            </div>
          )}
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
            modifiersClassNames={{ focused: 'bg-primary/20 rounded-md font-semibold' }}
            className="p-0 [&_button[name=previous-month]]:hidden [&_button[name=next-month]]:hidden"
            classNames={{
              months: "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 p-3",
              month: "rounded-lg border bg-card p-3 shadow-sm space-y-3",
              caption: "flex justify-center pt-1.5 pb-1 relative items-center text-lg font-medium",
              caption_label: "", // Handled by caption style
              head_row: "flex w-full justify-around",
              head_cell: "text-muted-foreground rounded-md w-8 font-normal text-[0.8rem]",
              row: "flex w-full mt-2 justify-around",
              cell: "h-8 w-8 text-center text-sm p-0 relative first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20",
              day: cn(buttonVariants({ variant: "ghost" }), "h-8 w-8 p-0 font-normal rounded-md"),
              day_selected: "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
              day_today: "bg-accent text-accent-foreground font-bold rounded-md",
              day_outside: "day-outside text-muted-foreground opacity-50 aria-selected:bg-accent/50 aria-selected:text-muted-foreground",
            }}
          />
        </CardContent>
      </Card>
    </div>
  );
}

    