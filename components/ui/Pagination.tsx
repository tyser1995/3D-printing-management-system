'use client'

import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils/cn'

interface Props {
  page: number
  pageCount: number
  total: number
  pageSize: number
  onPageChange: (page: number) => void
  className?: string
}

export default function Pagination({
  page,
  pageCount,
  total,
  pageSize,
  onPageChange,
  className,
}: Props) {
  if (total === 0) return null

  const start = (page - 1) * pageSize + 1
  const end = Math.min(page * pageSize, total)

  const pages = Array.from({ length: pageCount }, (_, i) => i + 1).filter(
    (p) => p === 1 || p === pageCount || Math.abs(p - page) <= 1
  )

  return (
    <div
      className={cn(
        'flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 px-6 py-3',
        className
      )}
    >
      <p className="text-sm text-slate-500">
        Showing <span className="font-medium text-slate-700">{start}</span>&ndash;
        <span className="font-medium text-slate-700">{end}</span> of{' '}
        <span className="font-medium text-slate-700">{total}</span>
      </p>

      {pageCount > 1 && (
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => onPageChange(page - 1)}
            disabled={page === 1}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 disabled:pointer-events-none disabled:opacity-40"
            aria-label="Previous page"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>

          {pages.map((p, i) => (
            <span key={p} className="flex items-center">
              {i > 0 && pages[i - 1] !== p - 1 && (
                <span className="px-1 text-sm text-slate-400">&hellip;</span>
              )}
              <button
                type="button"
                onClick={() => onPageChange(p)}
                className={cn(
                  'flex h-8 min-w-8 items-center justify-center rounded-lg px-2 text-sm font-medium',
                  p === page ? 'bg-orange-500 text-white' : 'text-slate-600 hover:bg-slate-100'
                )}
              >
                {p}
              </button>
            </span>
          ))}

          <button
            type="button"
            onClick={() => onPageChange(page + 1)}
            disabled={page === pageCount}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 disabled:pointer-events-none disabled:opacity-40"
            aria-label="Next page"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  )
}
