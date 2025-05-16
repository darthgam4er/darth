
"use client";

import { useState, useEffect }
from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { RefreshCw, Loader2 } from 'lucide-react';

interface CoinFlipGameProps {
  isOpen: boolean;
  onClose: () => void;
}

type CoinDisplayState = 'Heads' | 'Tails' | 'Flipping...' | null;

export default function CoinFlipGame({ isOpen, onClose }: CoinFlipGameProps) {
  const [coinDisplay, setCoinDisplay] = useState<CoinDisplayState>(null);
  const [isFlipping, setIsFlipping] = useState(false);
  const [resultMessage, setResultMessage] = useState<string>('');

  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    if (isFlipping) {
      setCoinDisplay('Flipping...');
      setResultMessage(''); 
      timeoutId = setTimeout(() => {
        const randomSide = Math.random() < 0.5 ? 'Heads' : 'Tails';
        setCoinDisplay(randomSide);
        setResultMessage(`It's ${randomSide}!`);
        setIsFlipping(false);
      }, 1000); // Simulate 1 second flip
    }
    return () => clearTimeout(timeoutId);
  }, [isFlipping]);

  const handleFlipCoin = () => {
    if (isFlipping) return;
    setIsFlipping(true);
  };

  const handleDialogClose = () => {
    // Reset state for next time
    setCoinDisplay(null);
    setIsFlipping(false);
    setResultMessage('');
    onClose();
  };
  
  // Effect to reset internal state if dialog is closed externally (e.g. Esc key or overlay click)
  useEffect(() => {
    if (!isOpen) {
      setCoinDisplay(null);
      setIsFlipping(false);
      setResultMessage('');
    }
  }, [isOpen]);


  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) handleDialogClose(); }}>
      <DialogContent className="sm:max-w-xs">
        <DialogHeader>
          <DialogTitle>Time's Up! Coin Flip Fun!</DialogTitle>
          <DialogDescription>
            Your session ended. Flip a coin for a quick brain teaser!
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col items-center justify-center space-y-4 py-6">
          <div 
            className="w-28 h-28 rounded-full border-4 border-primary flex items-center justify-center text-3xl font-bold bg-card shadow-md"
            aria-live="polite"
          >
            {coinDisplay === 'Flipping...' ? 
              <RefreshCw className="h-12 w-12 animate-spin text-primary" /> : 
              coinDisplay ? <span className="text-primary">{coinDisplay.charAt(0)}</span> : <span className="text-muted-foreground">?</span>}
          </div>
          {resultMessage && <p className="text-lg font-semibold pt-2">{resultMessage}</p>}
        </div>
        <DialogFooter className="flex flex-col gap-2 sm:flex-row sm:gap-0 sm:space-x-2">
          <Button onClick={handleFlipCoin} disabled={isFlipping} className="w-full">
            {isFlipping && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Flip Coin
          </Button>
          <Button onClick={handleDialogClose} variant="outline" className="w-full">
            Done
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
