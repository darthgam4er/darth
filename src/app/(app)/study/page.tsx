
"use client";

import { useState, useEffect, useCallback } from 'react';
import { TimerSettings, BreakActivity, StudySession } from '@/lib/types'; // Added StudySession
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { AlertCircle, Play, Pause, SkipForward, RotateCcw, Zap, Lightbulb, ChevronDown, ChevronUp } from 'lucide-react';
import WhyAmIStuckDialog from '@/components/features/WhyAmIStuckDialog';
import CoinFlipGame from '@/components/features/CoinFlipGame'; // Import CoinFlipGame
import { useToast } from '@/hooks/use-toast';
import { Separator } from '@/components/ui/separator';
import { v4 as uuidv4 } from 'uuid'; // For StudySession ID

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
  const [studyLog, setStudyLog] = useLocalStorage<StudySession[]>('focusflow-study-log', []);
  
  const [timeLeft, setTimeLeft] = useState(settings.studyDuration * 60);
  const [isActive, setIsActive] = useState(false);
  const [mode, setMode] = useState<'study' | 'short_break' | 'long_break'>('study');
  const [currentSessionStartTime, setCurrentSessionStartTime] = useState<string | null>(null);
  const [cyclesCompleted, setCyclesCompleted] = useState(0);
  const [currentBreakActivity, setCurrentBreakActivity] = useState<BreakActivity | null>(null);
  const [showWhyStuckDialog, setShowWhyStuckDialog] = useState(false);
  const [showCoinFlipDialog, setShowCoinFlipDialog] = useState(false); // State for coin flip dialog
  const [currentStreak, setCurrentStreak] = useLocalStorage<number>('focusflow-streak', 0);
  const [showAdvancedControls, setShowAdvancedControls] = useState(false);

  const { toast } = useToast();

  const playNotificationSound = () => {
    if (typeof window !== 'undefined' && settings.enableNotifications) {
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        if (!audioContext) return;
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(440, audioContext.currentTime); 
        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime); // Reduced volume slightly
        gainNode.gain.exponentialRampToValueAtTime(0.00001, audioContext.currentTime + 0.8); // Shorter sound
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.8);
    }
  };

  const logSession = useCallback((completed: boolean, sessionType: typeof mode, duration: number, startTime: string | null) => {
    if (!startTime) return;
    const session: StudySession = {
      id: uuidv4(),
      startTime,
      endTime: new Date().toISOString(),
      durationMinutes: Math.round(duration / 60),
      type: sessionType,
      completed,
    };
    setStudyLog(prevLog => [...prevLog, session]);
  }, [setStudyLog]);
  
  const handleTimerEnd = useCallback(() => {
    setIsActive(false); // Stop the timer first

    if (currentSessionStartTime) {
        const durationSeconds = (mode === 'study' ? settings.studyDuration * 60 :
                                mode === 'short_break' ? settings.shortBreakDuration * 60 :
                                settings.longBreakDuration * 60) - timeLeft; // actual elapsed time
        logSession(timeLeft === 0, mode, durationSeconds, currentSessionStartTime);
    }
    setCurrentSessionStartTime(null); // Reset for next session

    if (settings.enableNotifications) {
      toast({
        title: `${mode.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())} Session Ended!`,
        description: mode === 'study' ? "Time for a break!" : "Time to get back to work!",
      });
      playNotificationSound();
    }
    
    // Show coin flip dialog
    setShowCoinFlipDialog(true);

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
  }, [mode, cyclesCompleted, settings, breakActivities, toast, setCurrentStreak, currentSessionStartTime, timeLeft, logSession]);

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
    if (!isActive) {
        if (mode === 'study') setTimeLeft(settings.studyDuration * 60);
        else if (mode === 'short_break') setTimeLeft(settings.shortBreakDuration * 60);
        else if (mode === 'long_break') setTimeLeft(settings.longBreakDuration * 60);
    }
  }, [settings.studyDuration, settings.shortBreakDuration, settings.longBreakDuration, mode, isActive]);


  const toggleTimer = () => {
    setIsActive(!isActive);
    if (!isActive && !currentSessionStartTime) { // Starting timer
        setCurrentSessionStartTime(new Date().toISOString());
    } else if (isActive && currentSessionStartTime) { // Pausing timer
        const durationSeconds = (mode === 'study' ? settings.studyDuration * 60 :
                                mode === 'short_break' ? settings.shortBreakDuration * 60 :
                                settings.longBreakDuration * 60) - timeLeft;
        logSession(false, mode, durationSeconds, currentSessionStartTime); // Log paused session as incomplete
        setCurrentSessionStartTime(null); // Reset, will be set again if resumed
    }
  };

  const resetTimer = () => {
    if (isActive && currentSessionStartTime) { // Log if active timer is reset
        const durationSeconds = (mode === 'study' ? settings.studyDuration * 60 :
                                mode === 'short_break' ? settings.shortBreakDuration * 60 :
                                settings.longBreakDuration * 60) - timeLeft;
        logSession(false, mode, durationSeconds, currentSessionStartTime);
    }
    setIsActive(false);
    setMode('study');
    setTimeLeft(settings.studyDuration * 60);
    setCyclesCompleted(0);
    setCurrentBreakActivity(null);
    setCurrentStreak(0); 
    setCurrentSessionStartTime(null);
    toast({ title: "Timer Reset", description: "Ready for a fresh start!"});
  };

  const skipToNext = () => {
    if (settings.strictMode && mode === 'study' && isActive) {
      toast({ variant: "destructive", title: "Strict Mode On", description: "Cannot skip study session."});
      return;
    }
    if (isActive && currentSessionStartTime) { // Log skipped session (partially or fully)
        const durationSeconds = (mode === 'study' ? settings.studyDuration * 60 :
                                mode === 'short_break' ? settings.shortBreakDuration * 60 :
                                settings.longBreakDuration * 60) - timeLeft;
        logSession(false, mode, durationSeconds, currentSessionStartTime); // Log as incomplete if skipped early
    }
    
    // Immediately call handleTimerEnd logic, but make sure timeLeft is 0 so it logs full duration if skipped at end
    const wasActive = isActive;
    setTimeLeft(0); // Force timeLeft to 0 to signify end for logging in handleTimerEnd
    handleTimerEnd();
    
    // Start the next phase immediately if it was active or if user wants to auto-start after skip
     if (wasActive || (!settings.strictMode && !showCoinFlipDialog)) { // Auto-start if it was running or not strict and dialog not up
        setTimeout(() => {
             if (!showCoinFlipDialog) { // Only auto-start if coin flip isn't showing
                setIsActive(true);
                setCurrentSessionStartTime(new Date().toISOString());
             }
        } ,100);
    }
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const currentDuration = mode === 'study' ? settings.studyDuration * 60 :
                          mode === 'short_break' ? settings.shortBreakDuration * 60 :
                          settings.longBreakDuration * 60;
  const progressPercentage = currentDuration > 0 ? ((currentDuration - timeLeft) / currentDuration) * 100 : 0;


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
    if (isActive) { // If timer is active, pause it and log partial
        if (currentSessionStartTime) {
            const durationSeconds = (mode === 'study' ? settings.studyDuration * 60 :
                                mode === 'short_break' ? settings.shortBreakDuration * 60 :
                                settings.longBreakDuration * 60) - timeLeft;
            logSession(false, mode, durationSeconds, currentSessionStartTime);
            setCurrentSessionStartTime(null);
        }
        setIsActive(false);
    }
  };
  
  const startTwoMinuteRule = () => {
    if (isActive && currentSessionStartTime) { // Log any currently active session before switching
         const durationSeconds = (mode === 'study' ? settings.studyDuration * 60 :
                                mode === 'short_break' ? settings.shortBreakDuration * 60 :
                                settings.longBreakDuration * 60) - timeLeft;
        logSession(false, mode, durationSeconds, currentSessionStartTime);
    }
    setMode('study');
    setTimeLeft(2 * 60); 
    setCurrentSessionStartTime(new Date().toISOString());
    setIsActive(true);
    setCurrentBreakActivity(null);
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
            {cyclesCompleted >= settings.cyclesPerSuperBlock ? 
             `Super-Block ${Math.floor(cyclesCompleted / settings.cyclesPerSuperBlock)} - Block ${cyclesCompleted % settings.cyclesPerSuperBlock + 1}` :
             `Block ${cyclesCompleted + 1}`
            }
            {settings.cyclesPerSuperBlock > 0 && ` of ${settings.cyclesPerSuperBlock}`}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center space-y-8">
          <div className="text-8xl font-mono font-bold text-primary tabular-nums">
            {formatTime(timeLeft)}
          </div>
          <Progress value={progressPercentage} className="w-full h-4" />

          <div className="flex space-x-4">
            <Button onClick={toggleTimer} size="lg" className="w-32" disabled={showCoinFlipDialog}>
              {isActive ? <Pause className="mr-2 h-5 w-5" /> : <Play className="mr-2 h-5 w-5" />}
              {isActive ? 'Pause' : 'Start'}
            </Button>
            <Button onClick={skipToNext} variant="outline" size="lg" disabled={showCoinFlipDialog}>
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
              disabled={showCoinFlipDialog}
            >
              {showAdvancedControls ? <ChevronUp className="mr-2 h-4 w-4" /> : <ChevronDown className="mr-2 h-4 w-4" />}
              Advanced & Brain Stop Kit
            </Button>
          </div>

          {showAdvancedControls && (
            <div className="w-full space-y-6 pt-4">
              <Separator />
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Button onClick={handlePatternInterrupt} variant="secondary" className="w-full" disabled={showCoinFlipDialog}>
                  <AlertCircle className="mr-2 h-5 w-5" /> Pattern Interrupt
                </Button>
                <Button onClick={() => setShowWhyStuckDialog(true)} variant="secondary" className="w-full" disabled={showCoinFlipDialog || isActive}>
                  <Lightbulb className="mr-2 h-5 w-5" /> Why Am I Stuck?
                </Button>
                 <Button onClick={startTwoMinuteRule} variant="secondary" className="w-full" disabled={showCoinFlipDialog}>
                  <Play className="mr-2 h-5 w-5" /> 2-Min Rule
                </Button>
              </div>
              <div className="flex justify-center">
                 <Button onClick={resetTimer} variant="destructive" size="lg" className="w-auto" disabled={showCoinFlipDialog}>
                    <RotateCcw className="mr-2 h-5 w-5" /> Reset All
                 </Button>
              </div>
              <Separator />
            </div>
          )}


          <div className="flex items-center space-x-2 text-lg">
            <Zap className="h-6 w-6 text-yellow-500" /> {/* Consider making color dynamic based on theme */}
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
      {showCoinFlipDialog && (
        <CoinFlipGame
            isOpen={showCoinFlipDialog}
            onClose={() => {
                setShowCoinFlipDialog(false);
                // Optionally auto-start next timer if desired, or leave it for manual start
                // For now, user manually starts next session.
                // If you want to auto-start:
                // if (timeLeft > 0) { // Ensure there's a next session set up
                //   setIsActive(true);
                //   setCurrentSessionStartTime(new Date().toISOString());
                // }
            }}
        />
      )}
    </div>
  );
}

