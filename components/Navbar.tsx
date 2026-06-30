"use client";

import { useEffect, useState } from "react";
import { Sun, Moon, ShieldCheck } from "lucide-react";

export default function Navbar() {
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    // Check initial local storage or preferences
    const isDark =
      localStorage.getItem("theme") === "dark" ||
      (!("theme" in localStorage) &&
        window.matchMedia("(prefers-color-scheme: dark)").matches);
    
    if (isDark) {
      document.documentElement.classList.add("dark");
      setIsDarkMode(true);
    } else {
      document.documentElement.classList.remove("dark");
      setIsDarkMode(false);
    }
  }, []);

  const toggleTheme = () => {
    if (isDarkMode) {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
      setIsDarkMode(false);
    } else {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
      setIsDarkMode(true);
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/80 backdrop-blur-md transition-all duration-300">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
            {/* ShieldCheck icon representing verification and registration portal */}
            <ShieldCheck className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-saffron">MSME</span>
              <span className="text-[10px] text-muted-foreground">|</span>
              <span className="text-[10px] font-medium text-muted-foreground uppercase">Government of India</span>
            </div>
            <h1 className="text-base font-bold tracking-tight text-foreground sm:text-lg">
              Udyam Registration Portal
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <button
            onClick={toggleTheme}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-card text-foreground shadow-sm hover:bg-accent transition-colors cursor-pointer"
            aria-label="Toggle Theme"
          >
            {isDarkMode ? (
              <Sun className="h-4 w-4 text-saffron" />
            ) : (
              <Moon className="h-4 w-4 text-primary" />
            )}
          </button>
        </div>
      </div>
    </header>
  );
}
