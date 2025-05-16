"use client";

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea'; // Changed from Input for multi-line
import { useToast } from '@/hooks/use-toast';
import { getBrainStopSuggestions, type BrainStopSuggestionsInput, type BrainStopSuggestionsOutput } from '@/ai/flows/brain-stop-suggestions';
import { Loader2 } from 'lucide-react';

interface WhyAmIStuckDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function WhyAmIStuckDialog({ isOpen, onClose }: WhyAmIStuckDialogProps) {
  const [isTaskTooBig, setIsTaskTooBig] = useState(false);
  const [isFeelingBored, setIsFeelingBored] = useState(false);
  const [isFeelingTired, setIsFeelingTired] = useState(false);
  const [isDistractedByThoughts, setIsDistractedByThoughts] = useState(false);
  const [userDefinedMethods, setUserDefinedMethods] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<string[] | null>(null);
  const { toast } = useToast();

  const handleSubmit = async () => {
    setIsLoading(true);
    setSuggestions(null);
    const input: BrainStopSuggestionsInput = {
      isTaskTooBig,
      isFeelingBored,
      isFeelingTired,
      isDistractedByThoughts,
      userDefinedMethods,
    };

    try {
      const result: BrainStopSuggestionsOutput = await getBrainStopSuggestions(input);
      if (result && result.suggestions) {
        setSuggestions(result.suggestions);
      } else {
        toast({ variant: "destructive", title: "Error", description: "Could not get suggestions." });
      }
    } catch (error) {
      console.error("Error getting suggestions:", error);
      toast({ variant: "destructive", title: "Error", description: "Failed to fetch suggestions. Please try again." });
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setIsTaskTooBig(false);
    setIsFeelingBored(false);
    setIsFeelingTired(false);
    setIsDistractedByThoughts(false);
    setUserDefinedMethods('');
    setSuggestions(null);
  }

  const handleDialogClose = () => {
    resetForm();
    onClose();
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleDialogClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Why Am I Stuck?</DialogTitle>
          <DialogDescription>
            Answer these questions to get personalized suggestions.
          </DialogDescription>
        </DialogHeader>
        
        {!suggestions ? (
          <div className="space-y-4 py-4">
            <div className="flex items-center space-x-2">
              <Checkbox id="isTaskTooBig" checked={isTaskTooBig} onCheckedChange={(checked) => setIsTaskTooBig(Boolean(checked))} />
              <Label htmlFor="isTaskTooBig">Is the task too big?</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox id="isFeelingBored" checked={isFeelingBored} onCheckedChange={(checked) => setIsFeelingBored(Boolean(checked))} />
              <Label htmlFor="isFeelingBored">Feeling bored?</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox id="isFeelingTired" checked={isFeelingTired} onCheckedChange={(checked) => setIsFeelingTired(Boolean(checked))} />
              <Label htmlFor="isFeelingTired">Feeling tired?</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox id="isDistractedByThoughts" checked={isDistractedByThoughts} onCheckedChange={(checked) => setIsDistractedByThoughts(Boolean(checked))} />
              <Label htmlFor="isDistractedByThoughts">Distracted by thoughts?</Label>
            </div>
            <div>
              <Label htmlFor="userDefinedMethods">Any study methods you like? (Optional)</Label>
              <Textarea
                id="userDefinedMethods"
                value={userDefinedMethods}
                onChange={(e) => setUserDefinedMethods(e.target.value)}
                placeholder="e.g., Pomodoro, Feynman technique, Mind mapping"
                className="mt-1"
              />
            </div>
          </div>
        ) : (
          <div className="py-4">
            <h3 className="font-semibold mb-2 text-lg">Here are some suggestions:</h3>
            <ul className="list-disc space-y-2 pl-5">
              {suggestions.map((suggestion, index) => (
                <li key={index}>{suggestion}</li>
              ))}
            </ul>
          </div>
        )}

        <DialogFooter>
          {!suggestions ? (
             <Button onClick={handleSubmit} disabled={isLoading} className="w-full">
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Get Suggestions
            </Button>
          ) : (
            <Button onClick={resetForm} variant="outline" className="w-full">
              Ask Again
            </Button>
          )}
          <Button onClick={handleDialogClose} variant="ghost" className="w-full mt-2 sm:mt-0">Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
