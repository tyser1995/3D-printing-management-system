'use client'

const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest' },
  { value: 'featured', label: 'Featured' },
  { value: 'price-asc', label: 'Price: Low to High' },
  { value: 'price-desc', label: 'Price: High to Low' },
]

interface Props {
  sort: string
  category?: string
  q?: string
}

export default function SortSelect({ sort, category, q }: Props) {
  return (
    <form method="GET" action="/products" className="flex items-center gap-2">
      {category && <input type="hidden" name="category" value={category} />}
      {q && <input type="hidden" name="q" value={q} />}
      <select
        name="sort"
        defaultValue={sort}
        onChange={(e) => (e.target.form as HTMLFormElement).submit()}
        className="h-9 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-600 focus:border-orange-400 focus:outline-none"
      >
        {SORT_OPTIONS.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </form>
  )
}
