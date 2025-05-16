"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Brain, Home, BarChart3, Settings, Zap, Sun, Moon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuLabel
} from '@/components/ui/dropdown-menu';

interface NavItemProps {
  href: string;
  icon: React.ReactNode;
  label: string;
  disabled?: boolean;
}

const NavItem = ({ href, icon, label, disabled }: NavItemProps) => {
  const pathname = usePathname();
  const isActive = pathname === href;

  if (disabled) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-muted-foreground opacity-50 cursor-not-allowed">
        {icon}
        <span>{label}</span>
      </div>
    );
  }

  return (
    <Link href={href} legacyBehavior passHref>
      <a
        className={cn(
          "flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-md hover:bg-accent hover:text-accent-foreground transition-colors",
          isActive ? "bg-accent text-accent-foreground" : "text-foreground/70"
        )}
      >
        {icon}
        <span>{label}</span>
      </a>
    </Link>
  );
};

export default function TopNavBar() {
  const [mounted, setMounted] = useState(false);
  const { theme, setTheme } = useTheme();
  const { toast } = useToast();

  useEffect(() => setMounted(true), []);

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
    toast({
      title: `Theme changed`,
      description: `Switched to ${theme === "dark" ? "light" : "dark"} mode.`,
    });
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 flex h-16 items-center justify-between border-b bg-background/95 px-4 backdrop-blur-md sm:px-6">
      <div className="flex items-center gap-4">
        <Link href="/study" className="flex items-center gap-2">
          <Brain className="h-7 w-7 text-primary" />
          <h1 className="text-xl font-bold text-foreground">FocusFlow</h1>
        </Link>
      </div>

      <nav className="hidden md:flex items-center gap-2">
        <NavItem href="/study" icon={<Home className="h-4 w-4" />} label="Study Timer" />
        <NavItem href="/dashboard" icon={<BarChart3 className="h-4 w-4" />} label="Dashboard" />
        <NavItem href="/settings" icon={<Settings className="h-4 w-4" />} label="Settings" />
        <NavItem href="/streaks" icon={<Zap className="h-4 w-4" />} label="Streaks" />
      </nav>
      
      <div className="flex items-center gap-2">
        {mounted ? (
          <Button variant="ghost" size="icon" onClick={toggleTheme} aria-label="Toggle theme">
            <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          </Button>
        ) : (
          <div className="h-10 w-10" /> // Placeholder to prevent layout shift
        )}
      </div>
    </header>
  );
}
