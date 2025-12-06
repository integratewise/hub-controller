export function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="text-lg font-semibold mb-3 text-neutral-100">{title}</h2>
      {children}
    </section>
  );
}

