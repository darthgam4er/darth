"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import type { TimerSettings, BreakActivity } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import { Trash2, PlusCircle, SettingsIcon } from "lucide-react";
import { useState, type ChangeEvent, type FormEvent } from "react";
import { v4 as uuidv4 } from 'uuid'; // For generating unique IDs
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

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

export default function SettingsPage() {
  const [settings, setSettings] = useLocalStorage<TimerSettings>('focusflow-settings', DEFAULT_TIMER_SETTINGS);
  const [breakActivities, setBreakActivities] = useLocalStorage<BreakActivity[]>('focusflow-break-activities', []);
  const [newActivity, setNewActivity] = useState<Partial<BreakActivity>>({ name: '', category: '', url: '' });
  const { toast } = useToast();

  const handleSettingsChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setSettings(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : parseInt(value, 10) || 0,
    }));
  };

  const handleGoalTypeChange = (value: 'blocks' | 'hours') => {
    setSettings(prev => ({ ...prev, dailyGoalType: value }));
  };

  const handleNewActivityChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setNewActivity(prev => ({ ...prev, [name]: value }));
  };
  
  const handleAddActivity = (e: FormEvent) => {
    e.preventDefault();
    if (!newActivity.name) {
      toast({ variant: "destructive", title: "Error", description: "Activity name is required." });
      return;
    }
    setBreakActivities(prev => [...prev, { ...newActivity, id: uuidv4() } as BreakActivity]);
    setNewActivity({ name: '', category: '', url: '' });
    toast({ title: "Success", description: "Break activity added." });
  };

  const handleRemoveActivity = (id: string) => {
    setBreakActivities(prev => prev.filter(activity => activity.id !== id));
    toast({ title: "Success", description: "Break activity removed." });
  };

  const handleSaveSettings = () => {
    // useLocalStorage already saves on change, but explicit save can provide feedback
    toast({ title: "Settings Saved", description: "Your preferences have been updated." });
  };

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold flex items-center"><SettingsIcon className="mr-2 h-8 w-8 text-primary"/>Settings</h1>

      <Card>
        <CardHeader>
          <CardTitle>Timer Configuration</CardTitle>
          <CardDescription>Customize your study and break cycle durations.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="studyDuration">Study Duration (minutes)</Label>
              <Input id="studyDuration" name="studyDuration" type="number" value={settings.studyDuration} onChange={handleSettingsChange} />
            </div>
            <div>
              <Label htmlFor="shortBreakDuration">Short Break (minutes)</Label>
              <Input id="shortBreakDuration" name="shortBreakDuration" type="number" value={settings.shortBreakDuration} onChange={handleSettingsChange} />
            </div>
            <div>
              <Label htmlFor="longBreakDuration">Long Break (minutes)</Label>
              <Input id="longBreakDuration" name="longBreakDuration" type="number" value={settings.longBreakDuration} onChange={handleSettingsChange} />
            </div>
            <div>
              <Label htmlFor="cyclesPerSuperBlock">Cycles per Super-Block</Label>
              <Input id="cyclesPerSuperBlock" name="cyclesPerSuperBlock" type="number" value={settings.cyclesPerSuperBlock} onChange={handleSettingsChange} />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
            <div>
                <Label htmlFor="dailyGoalType">Daily Goal Type</Label>
                <Select name="dailyGoalType" value={settings.dailyGoalType} onValueChange={handleGoalTypeChange}>
                    <SelectTrigger id="dailyGoalType">
                        <SelectValue placeholder="Select goal type" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="blocks">Blocks</SelectItem>
                        <SelectItem value="hours">Hours</SelectItem>
                    </SelectContent>
                </Select>
            </div>
            <div>
                <Label htmlFor="dailyGoalValue">Daily Goal Value</Label>
                <Input id="dailyGoalValue" name="dailyGoalValue" type="number" value={settings.dailyGoalValue} onChange={handleSettingsChange} />
            </div>
          </div>
           <div className="flex items-center space-x-2 pt-2">
            <Switch id="enableNotifications" name="enableNotifications" checked={settings.enableNotifications} onCheckedChange={(checked) => setSettings(prev => ({...prev, enableNotifications: checked}))} />
            <Label htmlFor="enableNotifications">Enable Notifications</Label>
          </div>
          <div className="flex items-center space-x-2">
            <Switch id="strictMode" name="strictMode" checked={settings.strictMode} onCheckedChange={(checked) => setSettings(prev => ({...prev, strictMode: checked}))} />
            <Label htmlFor="strictMode">Strict Mode (Prevent skipping study blocks)</Label>
          </div>
        </CardContent>
        <CardFooter>
            <Button onClick={handleSaveSettings}>Save Timer Settings</Button>
        </CardFooter>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Manage Break Activities</CardTitle>
          <CardDescription>Add or remove activities for your break roulette.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAddActivity} className="space-y-4 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="activityName">Activity Name</Label>
                <Input id="activityName" name="name" value={newActivity.name || ''} onChange={handleNewActivityChange} placeholder="e.g., 5-min Walk" />
              </div>
              <div>
                <Label htmlFor="activityCategory">Category (Optional)</Label>
                <Input id="activityCategory" name="category" value={newActivity.category || ''} onChange={handleNewActivityChange} placeholder="e.g., Exercise" />
              </div>
              <div>
                <Label htmlFor="activityUrl">URL (Optional)</Label>
                <Input id="activityUrl" name="url" value={newActivity.url || ''} onChange={handleNewActivityChange} placeholder="https://youtube.com/..." />
              </div>
            </div>
            <Button type="submit" className="w-full md:w-auto"><PlusCircle className="mr-2 h-4 w-4"/>Add Activity</Button>
          </form>
          
          <h3 className="text-lg font-medium mb-2">Your Activities:</h3>
          {breakActivities.length === 0 ? (
            <p className="text-muted-foreground">No break activities added yet.</p>
          ) : (
            <ul className="space-y-2">
              {breakActivities.map(activity => (
                <li key={activity.id} className="flex items-center justify-between p-3 bg-secondary/50 rounded-md">
                  <div>
                    <p className="font-medium">{activity.name}</p>
                    {activity.category && <p className="text-sm text-muted-foreground">{activity.category}</p>}
                    {activity.url && <a href={activity.url} target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline">Link</a>}
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => handleRemoveActivity(activity.id)} aria-label="Remove activity">
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
