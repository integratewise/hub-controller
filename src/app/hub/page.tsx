'use client';

import { AIChat } from '@/components/hub/AIChat';

export default function HubHome() {
  return (
    <div className="h-[calc(100vh-64px)] flex flex-col">
      <AIChat className="flex-1" />
    </div>
  );
}
