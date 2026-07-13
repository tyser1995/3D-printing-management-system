import { useMemo, useState } from 'react'

const DEFAULT_PAGE_SIZE = 10

export function usePagination<T>(items: T[], pageSize = DEFAULT_PAGE_SIZE) {
  const [page, setPage] = useState(1)

  const pageCount = Math.max(1, Math.ceil(items.length / pageSize))
  const safePage = Math.min(page, pageCount)

  const pageItems = useMemo(
    () => items.slice((safePage - 1) * pageSize, safePage * pageSize),
    [items, safePage, pageSize]
  )

  const setPageClamped = (p: number) => setPage(Math.min(Math.max(1, p), pageCount))

  return {
    page: safePage,
    pageCount,
    pageSize,
    total: items.length,
    pageItems,
    setPage: setPageClamped,
    resetPage: () => setPage(1),
  }
}
