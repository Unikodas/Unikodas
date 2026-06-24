'use client';

import { useEffect, useState } from 'react';
import { lt } from '@/lib/i18n/lt';

const STORAGE_KEY = 'unikodas-theme';

type Theme = 'light' | 'dark';

function applyTheme(theme: Theme) {
  document.documentElement.classList.toggle('dark', theme === 'dark');
}

export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>('light');

  useEffect(() => {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    const initialTheme = saved === 'dark' ? 'dark' : 'light';
    setTheme(initialTheme);
    applyTheme(initialTheme);
  }, []);

  const nextTheme = theme === 'dark' ? 'light' : 'dark';
  const label = theme === 'dark' ? lt.home.theme.dark : lt.home.theme.light;

  return (
    <button
      type="button"
      className="theme-toggle"
      data-theme={theme}
      aria-label={lt.home.theme.toggle}
      aria-pressed={theme === 'dark'}
      onClick={() => {
        setTheme(nextTheme);
        applyTheme(nextTheme);
        window.localStorage.setItem(STORAGE_KEY, nextTheme);
      }}
    >
      <span className="theme-toggle__track" aria-hidden="true">
        <span className="theme-toggle__knob" />
      </span>
      <span className="hidden sm:inline">{label}</span>
    </button>
  );
}
