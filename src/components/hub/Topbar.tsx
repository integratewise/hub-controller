'use client';
import { CommandBar } from './CommandBar';

export function Topbar() {
  return (
    <header className="border-b border-neutral-800 bg-neutral-900">
      <div className="flex items-center justify-between px-4 py-3">
        <div className="text-sm text-neutral-400">Universal Controller</div>
        <CommandBar />
      </div>
    </header>
  );
}

