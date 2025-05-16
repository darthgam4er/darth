"use client";
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { format, subDays, eachDayOfInterval, startOfDay } from 'date-fns';
import { useEffect, useMemo, useState } from 'react';
import { Zap, Award, Flame } from 'lucide-react';

export default function StreaksPage() {
  const [currentStreak] = useLocalStorage<number>('focusflow-streak', 0);
  const [longestStreak, setLongestStreak] = useLocalStorage<number>('focusflow-longest-streak', 0);
  const [studyLog] = useLocalStorage<any[]>('focusflow-study-log', []);
  const [calendarData, setCalendarData] = useState<Record<string, boolean>>({});

  // Calculate streaks and update longest streak
  useEffect(() => {
    let streak = 0;
    let maxStreak = 0;
    let lastDate: Date | null = null;
    const days = studyLog
      .filter(log => log.type === 'study' && log.completed)
      .map(log => startOfDay(new Date(log.startTime)))
      .sort((a, b) => b.getTime() - a.getTime());
    for (let i = 0; i < days.length; i++) {
      if (i === 0 || (lastDate && subDays(lastDate, 1).getTime() === days[i].getTime())) {
        streak++;
      } else if (lastDate && lastDate.getTime() !== days[i].getTime()) {
        break;
      }
      lastDate = days[i];
    }
    for (let i = 0, s = 1; i < days.length - 1; i++, s = 1) {
      let d = days[i];
      while (i + s < days.length && subDays(d, s).getTime() === days[i + s].getTime()) s++;
      if (s > maxStreak) maxStreak = s;
    }
    if (maxStreak > longestStreak) setLongestStreak(maxStreak);
  }, [studyLog, longestStreak, setLongestStreak]);

  // Calendar heatmap data
  useEffect(() => {
    const data: Record<string, boolean> = {};
    studyLog.forEach(log => {
      if (log.type === 'study' && log.completed) {
        const dateStr = format(new Date(log.startTime), 'yyyy-MM-dd');
        data[dateStr] = true;
      }
    });
    setCalendarData(data);
  }, [studyLog]);

  // Progress to next milestone
  const nextMilestone = useMemo(() => {
    if (currentStreak < 3) return 3;
    if (currentStreak < 7) return 7;
    if (currentStreak < 14) return 14;
    if (currentStreak < 30) return 30;
    return null;
  }, [currentStreak]);
  const progress = nextMilestone ? (currentStreak / nextMilestone) * 100 : 100;

  // Motivational quotes
  const quotes = [
    "Small steps every day lead to big results.",
    "Consistency is the key to success!",
    "Keep your streak alive!",
    "Every day counts. You got this!",
    "Discipline is choosing between what you want now and what you want most."
  ];
  const quote = quotes[new Date().getDate() % quotes.length];

  return (
    <div className="max-w-3xl mx-auto py-8 space-y-8">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-2xl">
            <Flame className="text-orange-500" />
            Current Streak
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-4xl font-bold mb-2">{currentStreak} days</div>
          <Progress value={progress} className="h-3 mb-2" />
          {nextMilestone && (
            <div className="text-sm text-muted-foreground mb-2">
              {currentStreak}/{nextMilestone} days to next milestone
            </div>
          )}
          <div className="text-xs text-muted-foreground italic">{quote}</div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Award className="text-yellow-400" />
            Longest Streak
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold mb-2">{longestStreak} days</div>
        </CardContent>
      </Card>
    </div>
  );
}
