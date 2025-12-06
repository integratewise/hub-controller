export function EmptyState({ message, action }: { message: string; action?: React.ReactNode }) {
  return (
    <div className="rounded border border-neutral-800 bg-neutral-900 p-8 text-center">
      <div className="text-sm text-neutral-400 mb-2">{message}</div>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

