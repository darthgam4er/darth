"use client";

import { useState, useEffect, useCallback } from 'react';
import { TimerSettings, BreakActivity } from '@/lib/types';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { AlertCircle, Play, Pause, SkipForward, RotateCcw, Zap, Lightbulb, ChevronDown, ChevronUp } from 'lucide-react';
import WhyAmIStuckDialog from '@/components/features/WhyAmIStuckDialog';
import { useToast } from '@/hooks/use-toast';
import { Separator } from '@/components/ui/separator';

const DEFAULT_TIMER_SETTINGS: TimerSettings = {
  studyDuration: 60,
  shortBreakDuration: 10,
  longBreakDuration: 30,
  cyclesPerSuperBlock: 4,
  dailyGoalType: 'blocks',
  dailyGoalValue: 8,
  enableNotifications: true,
  strictMode: false,
};

export default function StudyPage() {
  const [settings] = useLocalStorage<TimerSettings>('focusflow-settings', DEFAULT_TIMER_SETTINGS);
  const [breakActivities] = useLocalStorage<BreakActivity[]>('focusflow-break-activities', []);
  
  const [timeLeft, setTimeLeft] = useState(settings.studyDuration * 60);
  const [isActive, setIsActive] = useState(false);
  const [mode, setMode] = useState<'study' | 'short_break' | 'long_break'>('study');
  const [cyclesCompleted, setCyclesCompleted] = useState(0);
  const [currentBreakActivity, setCurrentBreakActivity] = useState<BreakActivity | null>(null);
  const [showWhyStuckDialog, setShowWhyStuckDialog] = useState(false);
  const [currentStreak, setCurrentStreak] = useLocalStorage<number>('focusflow-streak', 0);
  const [showAdvancedControls, setShowAdvancedControls] = useState(false);

  const { toast } = useToast();

  const playNotificationSound = () => {
    // Simple beep, replace with better sound if needed
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    if (!audioContext) return;
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(440, audioContext.currentTime); // A4 note
    gainNode.gain.setValueAtTime(0.5, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.00001, audioContext.currentTime + 1);
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 1);
  };
  
  const handleTimerEnd = useCallback(() => {
    setIsActive(false);
    if (settings.enableNotifications) {
      toast({
        title: `${mode === 'study' ? 'Study' : 'Break'} session ended!`,
        description: mode === 'study' ? "Time for a break!" : "Time to get back to work!",
      });
      playNotificationSound();
    }

    if (mode === 'study') {
      setCurrentStreak(prev => prev + 1);
      const newCyclesCompleted = cyclesCompleted + 1;
      setCyclesCompleted(newCyclesCompleted);
      if (newCyclesCompleted % settings.cyclesPerSuperBlock === 0) {
        setMode('long_break');
        setTimeLeft(settings.longBreakDuration * 60);
      } else {
        setMode('short_break');
        setTimeLeft(settings.shortBreakDuration * 60);
      }
      if (breakActivities.length > 0) {
        setCurrentBreakActivity(breakActivities[Math.floor(Math.random() * breakActivities.length)]);
      }
    } else {
      setMode('study');
      setTimeLeft(settings.studyDuration * 60);
      setCurrentBreakActivity(null);
    }
  }, [mode, cyclesCompleted, settings, breakActivities, toast, setCurrentStreak]);

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prevTime) => prevTime - 1);
      }, 1000);
    } else if (isActive && timeLeft === 0) {
      handleTimerEnd();
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isActive, timeLeft, handleTimerEnd]);

  useEffect(() => {
    // Update timer if settings change and timer is not active
    if (!isActive) {
        if (mode === 'study') setTimeLeft(settings.studyDuration * 60);
        else if (mode === 'short_break') setTimeLeft(settings.shortBreakDuration * 60);
        else if (mode === 'long_break') setTimeLeft(settings.longBreakDuration * 60);
    }
  }, [settings, mode, isActive]);


  const toggleTimer = () => setIsActive(!isActive);

  const resetTimer = () => {
    setIsActive(false);
    setMode('study');
    setTimeLeft(settings.studyDuration * 60);
    setCyclesCompleted(0);
    setCurrentBreakActivity(null);
    setCurrentStreak(0); 
    toast({ title: "Timer Reset", description: "Ready for a fresh start!"});
  };

  const skipToNext = () => {
    if (settings.strictMode && mode === 'study' && isActive) {
      toast({ variant: "destructive", title: "Strict Mode On", description: "Cannot skip study session."});
      return;
    }
    handleTimerEnd();
    // Start the next phase immediately if not already started by handleTimerEnd
    setTimeout(() => setIsActive(true) ,100);
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const currentDuration = mode === 'study' ? settings.studyDuration * 60 :
                          mode === 'short_break' ? settings.shortBreakDuration * 60 :
                          settings.longBreakDuration * 60;
  const progressPercentage = ((currentDuration - timeLeft) / currentDuration) * 100;

  const getQuickIntervention = () => {
    const interventions = [
      "Stand up and do 10 jumping jacks.",
      "Splash water on your face (if possible).",
      "Take 5 deep breaths, focusing on your exhale.",
      "Quick Brain Dump: Type out frustrations for 60 seconds on a piece of paper.",
      "Stretch your arms and neck for 30 seconds."
    ];
    return interventions[Math.floor(Math.random() * interventions.length)];
  };

  const handlePatternInterrupt = () => {
    const intervention = getQuickIntervention();
    toast({
      title: "Pattern Interrupt!",
      description: intervention,
      duration: 7000, 
    });
    if (isActive) setIsActive(false); // Pause timer during interrupt
  };
  
  const startTwoMinuteRule = () => {
    setMode('study');
    setTimeLeft(2 * 60); // 2 minutes
    setIsActive(true);
    toast({ title: "2-Minute Rule Activated!", description: "Just focus for 2 minutes." });
  };


  return (
    <div className="container mx-auto py-8 flex flex-col items-center">
      <Card className="w-full max-w-2xl shadow-xl">
        <CardHeader className="text-center">
          <CardTitle className="text-4xl font-bold">
            {mode === 'study' ? 'Study Time' : mode === 'short_break' ? 'Short Break' : 'Long Break'}
          </CardTitle>
          <CardDescription className="text-lg">
            Cycle {Math.floor(cyclesCompleted / settings.cyclesPerSuperBlock)} - Block {cyclesCompleted % settings.cyclesPerSuperBlock + 1}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center space-y-8">
          <div className="text-8xl font-mono font-bold text-primary tabular-nums">
            {formatTime(timeLeft)}
          </div>
          <Progress value={progressPercentage} className="w-full h-4" />

          <div className="flex space-x-4">
            <Button onClick={toggleTimer} size="lg" className="w-32">
              {isActive ? <Pause className="mr-2 h-5 w-5" /> : <Play className="mr-2 h-5 w-5" />}
              {isActive ? 'Pause' : 'Start'}
            </Button>
            <Button onClick={skipToNext} variant="outline" size="lg">
              <SkipForward className="mr-2 h-5 w-5" /> Skip
            </Button>
          </div>
          
          {mode !== 'study' && currentBreakActivity && (
            <Card className="w-full bg-accent/20 border-accent">
              <CardHeader>
                <CardTitle className="text-xl text-accent-foreground">Break Activity: {currentBreakActivity.name}</CardTitle>
              </CardHeader>
              <CardContent>
                {currentBreakActivity.url ? (
                  <a href={currentBreakActivity.url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                    Open Activity Link
                  </a>
                ) : (
                  <p className="text-muted-foreground">{currentBreakActivity.category || "Enjoy your break!"}</p>
                )}
              </CardContent>
            </Card>
          )}

          <div className="w-full pt-4">
            <Button 
              variant="ghost" 
              onClick={() => setShowAdvancedControls(!showAdvancedControls)} 
              className="w-full justify-center text-muted-foreground hover:text-foreground"
            >
              {showAdvancedControls ? <ChevronUp className="mr-2 h-4 w-4" /> : <ChevronDown className="mr-2 h-4 w-4" />}
              Advanced & Brain Stop Kit
            </Button>
          </div>

          {showAdvancedControls && (
            <div className="w-full space-y-6 pt-4">
              <Separator />
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Button onClick={handlePatternInterrupt} variant="secondary" className="w-full">
                  <AlertCircle className="mr-2 h-5 w-5" /> Pattern Interrupt
                </Button>
                <Button onClick={() => setShowWhyStuckDialog(true)} variant="secondary" className="w-full">
                  <Lightbulb className="mr-2 h-5 w-5" /> Why Am I Stuck?
                </Button>
                 <Button onClick={startTwoMinuteRule} variant="secondary" className="w-full">
                  <Play className="mr-2 h-5 w-5" /> 2-Min Rule
                </Button>
              </div>
              <div className="flex justify-center">
                 <Button onClick={resetTimer} variant="destructive" size="lg" className="w-auto">
                    <RotateCcw className="mr-2 h-5 w-5" /> Reset All
                 </Button>
              </div>
              <Separator />
            </div>
          )}


          <div className="flex items-center space-x-2 text-lg">
            <Zap className="h-6 w-6 text-yellow-500" />
            <span>Current Streak: {currentStreak} Blocks</span>
          </div>
        </CardContent>
      </Card>

      {showWhyStuckDialog && (
        <WhyAmIStuckDialog
          isOpen={showWhyStuckDialog}
          onClose={() => setShowWhyStuckDialog(false)}
        />
      )}
    </div>
  );
}
