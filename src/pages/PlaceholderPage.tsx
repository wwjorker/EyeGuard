interface PlaceholderProps {
  title: string;
  hint?: string;
}

export function PlaceholderPage({ title, hint }: PlaceholderProps) {
  return (
    <section className="flex-1 flex flex-col items-center justify-center page-enter px-6">
      <div className="brand mb-3">{title}</div>
      <div className="tag-label text-center max-w-xs">
        {hint ?? "coming up in the next phase"}
      </div>
    </section>
  );
}
