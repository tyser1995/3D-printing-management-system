export type {
  Role,
  OrderStatus,
  QuotationStatus,
  PrintJobStatus,
  StockMovementType,
} from '@/app/generated/prisma'

export interface ApiResponse<T = unknown> {
  data?: T
  error?: string
  message?: string
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

export interface SelectOption {
  label: string
  value: string
}
