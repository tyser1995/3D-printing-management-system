import { z } from 'zod'

export const productSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  slug: z
    .string()
    .min(2)
    .regex(/^[a-z0-9-]+$/, 'Slug must be lowercase alphanumeric with hyphens'),
  description: z.string().optional(),
  categoryId: z.string().min(1, 'Category is required'),
  basePrice: z.coerce.number().positive('Price must be positive'),
  salePrice: z.coerce.number().positive().optional(),
  sku: z.string().optional(),
  stockQuantity: z.coerce.number().int().min(0),
  isActive: z.boolean().default(true),
  isFeatured: z.boolean().default(false),
  tags: z.array(z.string()).default([]),
})

export type ProductInput = z.infer<typeof productSchema>
