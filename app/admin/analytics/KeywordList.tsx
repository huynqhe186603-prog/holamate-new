interface KeywordListProps {
  keywords: { query: string; count: number }[]
}

export function KeywordList({ keywords }: KeywordListProps) {
  if (keywords.length === 0) {
    return <p className="text-sm text-neutral-400 py-4 text-center">Chưa có tìm kiếm nào.</p>
  }
  return (
    <ol className="space-y-2">
      {keywords.map((kw, i) => (
        <li key={kw.query} className="flex items-center gap-3">
          <span className="text-xs font-bold text-neutral-300 w-5 text-right shrink-0">{i + 1}</span>
          <span className="flex-1 text-sm text-neutral-700 truncate">{kw.query}</span>
          <span className="shrink-0 px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-semibold tabular-nums">
            {kw.count}
          </span>
        </li>
      ))}
    </ol>
  )
}
