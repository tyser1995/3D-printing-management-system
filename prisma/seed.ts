import 'dotenv/config'
import { PrismaClient } from '../app/generated/prisma'
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3'

const adapter = new PrismaBetterSqlite3({ url: process.env.DATABASE_URL! })
const prisma = new PrismaClient({ adapter })

async function main() {
  console.log('🌱 Seeding database...')

  // ─── Categories ────────────────────────────────────────────────────────────
  const categories = await Promise.all([
    prisma.category.upsert({
      where: { slug: 'keychains' },
      update: {},
      create: {
        name: 'Keychains',
        slug: 'keychains',
        description: 'Custom 3D-printed keychains',
        sortOrder: 1,
      },
    }),
    prisma.category.upsert({
      where: { slug: 'figurines' },
      update: {},
      create: {
        name: 'Figurines',
        slug: 'figurines',
        description: 'Detailed figurines and collectibles',
        sortOrder: 2,
      },
    }),
    prisma.category.upsert({
      where: { slug: 'accessories' },
      update: {},
      create: {
        name: 'Accessories',
        slug: 'accessories',
        description: 'Desk accessories and organizers',
        sortOrder: 3,
      },
    }),
    prisma.category.upsert({
      where: { slug: 'nameplates' },
      update: {},
      create: {
        name: 'Nameplates',
        slug: 'nameplates',
        description: 'Custom nameplates and signs',
        sortOrder: 4,
      },
    }),
  ])
  console.log(`✓ ${categories.length} categories`)

  // ─── Products ──────────────────────────────────────────────────────────────
  const products = await Promise.all([
    prisma.product.upsert({
      where: { slug: 'custom-name-keychain' },
      update: {},
      create: {
        name: 'Custom Name Keychain',
        slug: 'custom-name-keychain',
        description: 'Personalized keychain with your name or message. Printed in durable PLA+.',
        categoryId: categories[0].id,
        basePrice: 89,
        sku: 'KCH-001',
        stockQuantity: 50,
        isFeatured: true,
        tags: 'keychain, custom, name',
        images: {
          create: [
            {
              url: 'https://placehold.co/600x600?text=Keychain',
              isPrimary: true,
              altText: 'Custom Name Keychain',
            },
          ],
        },
        costConfig: {
          create: {
            filamentGrams: 15,
            filamentCostPerG: 1.2,
            printHours: 1.5,
            electricityKwh: 0.15,
            electricityCost: 12,
            laborHours: 0.25,
            laborRatePerHour: 80,
            packagingCost: 10,
            shippingCost: 0,
            profitMargin: 0.35,
          },
        },
      },
    }),
    prisma.product.upsert({
      where: { slug: 'anime-figurine-standard' },
      update: {},
      create: {
        name: 'Anime Figurine Standard',
        slug: 'anime-figurine-standard',
        description: 'High-detail anime figurine, 15cm tall. Available in PLA or PETG.',
        categoryId: categories[1].id,
        basePrice: 299,
        sku: 'FIG-001',
        stockQuantity: 20,
        isFeatured: true,
        tags: 'figurine, anime, collectible',
        images: {
          create: [
            {
              url: 'https://placehold.co/600x600?text=Figurine',
              isPrimary: true,
              altText: 'Anime Figurine',
            },
          ],
        },
        costConfig: {
          create: {
            filamentGrams: 80,
            filamentCostPerG: 1.2,
            printHours: 8,
            electricityKwh: 0.8,
            electricityCost: 12,
            laborHours: 1,
            laborRatePerHour: 80,
            packagingCost: 25,
            shippingCost: 0,
            profitMargin: 0.4,
          },
        },
      },
    }),
    prisma.product.upsert({
      where: { slug: 'mechanical-clicker-pro' },
      update: {},
      create: {
        name: 'Mechanical Clicker Pro',
        slug: 'mechanical-clicker-pro',
        description: 'Satisfying desk clicker with mechanical switch. Stress reliever.',
        categoryId: categories[2].id,
        basePrice: 199,
        sku: 'CLK-001',
        stockQuantity: 35,
        isFeatured: false,
        tags: 'clicker, desk, fidget',
        images: {
          create: [
            {
              url: 'https://placehold.co/600x600?text=Clicker',
              isPrimary: true,
              altText: 'Mechanical Clicker',
            },
          ],
        },
        costConfig: {
          create: {
            filamentGrams: 40,
            filamentCostPerG: 1.2,
            printHours: 3,
            electricityKwh: 0.3,
            electricityCost: 12,
            laborHours: 0.5,
            laborRatePerHour: 80,
            packagingCost: 15,
            shippingCost: 0,
            profitMargin: 0.3,
          },
        },
      },
    }),
    prisma.product.upsert({
      where: { slug: 'desk-name-plate' },
      update: {},
      create: {
        name: 'Desk Name Plate',
        slug: 'desk-name-plate',
        description: 'Professional desk nameplate. Custom text, choice of color.',
        categoryId: categories[3].id,
        basePrice: 150,
        sku: 'NPL-001',
        stockQuantity: 40,
        tags: 'nameplate, desk, custom',
        images: {
          create: [
            {
              url: 'https://placehold.co/600x600?text=Nameplate',
              isPrimary: true,
              altText: 'Desk Name Plate',
            },
          ],
        },
        costConfig: {
          create: {
            filamentGrams: 50,
            filamentCostPerG: 1.0,
            printHours: 2.5,
            electricityKwh: 0.25,
            electricityCost: 12,
            laborHours: 0.3,
            laborRatePerHour: 80,
            packagingCost: 12,
            shippingCost: 0,
            profitMargin: 0.3,
          },
        },
      },
    }),
    prisma.product.upsert({
      where: { slug: 'business-logo-keychain' },
      update: {},
      create: {
        name: 'Business Logo Keychain',
        slug: 'business-logo-keychain',
        description: 'Custom keychain with your business logo. Great for corporate giveaways.',
        categoryId: categories[0].id,
        basePrice: 99,
        salePrice: 79,
        sku: 'KCH-002',
        stockQuantity: 100,
        tags: 'keychain, business, logo, giveaway',
        images: {
          create: [
            {
              url: 'https://placehold.co/600x600?text=Logo+Keychain',
              isPrimary: true,
              altText: 'Business Logo Keychain',
            },
          ],
        },
      },
    }),
  ])
  console.log(`✓ ${products.length} products`)

  // ─── Filament Materials ────────────────────────────────────────────────────
  const materials = await Promise.all([
    prisma.filamentMaterial.upsert({
      where: { name: 'PLA' },
      update: {},
      create: { name: 'PLA', description: 'Polylactic Acid — easy to print, biodegradable' },
    }),
    prisma.filamentMaterial.upsert({
      where: { name: 'PLA+' },
      update: {},
      create: { name: 'PLA+', description: 'Enhanced PLA with better layer adhesion' },
    }),
    prisma.filamentMaterial.upsert({
      where: { name: 'PETG' },
      update: {},
      create: {
        name: 'PETG',
        description: 'Polyethylene Terephthalate Glycol — strong and flexible',
      },
    }),
    prisma.filamentMaterial.upsert({
      where: { name: 'ABS' },
      update: {},
      create: { name: 'ABS', description: 'Acrylonitrile Butadiene Styrene — heat resistant' },
    }),
    prisma.filamentMaterial.upsert({
      where: { name: 'TPU' },
      update: {},
      create: { name: 'TPU', description: 'Thermoplastic Polyurethane — flexible rubber-like' },
    }),
  ])
  console.log(`✓ ${materials.length} materials`)

  // ─── Suppliers ─────────────────────────────────────────────────────────────
  const suppliers = await Promise.all([
    prisma.supplier.upsert({
      where: { id: 'sup_bambu' },
      update: {},
      create: {
        id: 'sup_bambu',
        name: 'Bambu Lab',
        email: 'supplies@bambulab.com',
        contact: 'Bambu Sales',
      },
    }),
    prisma.supplier.upsert({
      where: { id: 'sup_esun' },
      update: {},
      create: { id: 'sup_esun', name: 'eSUN', email: 'info@esun3d.com', contact: 'eSUN PH' },
    }),
    prisma.supplier.upsert({
      where: { id: 'sup_polymaker' },
      update: {},
      create: {
        id: 'sup_polymaker',
        name: 'Polymaker',
        email: 'contact@polymaker.com',
        contact: 'Polymaker Sales',
      },
    }),
  ])
  console.log(`✓ ${suppliers.length} suppliers`)

  // ─── Filaments ─────────────────────────────────────────────────────────────
  const filaments = await Promise.all([
    prisma.filament.upsert({
      where: { id: 'fil_pla_orange' },
      update: {},
      create: {
        id: 'fil_pla_orange',
        name: 'PLA+ Orange',
        materialId: materials[1].id,
        supplierId: suppliers[0].id,
        color: 'Orange',
        colorHex: '#f97316',
        weightGrams: 1000,
        pricePerKg: 1200,
        stockGrams: 750,
        lowStockAlertG: 200,
      },
    }),
    prisma.filament.upsert({
      where: { id: 'fil_pla_black' },
      update: {},
      create: {
        id: 'fil_pla_black',
        name: 'PLA Black',
        materialId: materials[0].id,
        supplierId: suppliers[1].id,
        color: 'Black',
        colorHex: '#1e293b',
        weightGrams: 1000,
        pricePerKg: 850,
        stockGrams: 95,
        lowStockAlertG: 200,
      },
    }),
    prisma.filament.upsert({
      where: { id: 'fil_petg_clear' },
      update: {},
      create: {
        id: 'fil_petg_clear',
        name: 'PETG Clear',
        materialId: materials[2].id,
        supplierId: suppliers[0].id,
        color: 'Clear',
        colorHex: '#e2e8f0',
        weightGrams: 750,
        pricePerKg: 1400,
        stockGrams: 50,
        lowStockAlertG: 150,
      },
    }),
    prisma.filament.upsert({
      where: { id: 'fil_pla_white' },
      update: {},
      create: {
        id: 'fil_pla_white',
        name: 'PLA White',
        materialId: materials[0].id,
        supplierId: suppliers[1].id,
        color: 'White',
        colorHex: '#f8fafc',
        weightGrams: 1000,
        pricePerKg: 850,
        stockGrams: 920,
        lowStockAlertG: 200,
      },
    }),
    prisma.filament.upsert({
      where: { id: 'fil_abs_red' },
      update: {},
      create: {
        id: 'fil_abs_red',
        name: 'ABS Red',
        materialId: materials[3].id,
        supplierId: suppliers[2].id,
        color: 'Red',
        colorHex: '#ef4444',
        weightGrams: 1000,
        pricePerKg: 1100,
        stockGrams: 450,
        lowStockAlertG: 200,
      },
    }),
    prisma.filament.upsert({
      where: { id: 'fil_tpu_blue' },
      update: {},
      create: {
        id: 'fil_tpu_blue',
        name: 'TPU Blue Flex',
        materialId: materials[4].id,
        supplierId: suppliers[0].id,
        color: 'Blue',
        colorHex: '#3b82f6',
        weightGrams: 500,
        pricePerKg: 1800,
        stockGrams: 320,
        lowStockAlertG: 100,
      },
    }),
  ])
  console.log(`✓ ${filaments.length} filaments`)

  // ─── Test User (for dev only) ──────────────────────────────────────────────
  await prisma.user.upsert({
    where: { email: 'admin@kai3d.test' },
    update: {},
    create: {
      id: 'user_admin_seed',
      email: 'admin@kai3d.test',
      name: 'Admin Kai3D',
      role: 'ADMIN',
    },
  })
  const customerUser = await prisma.user.upsert({
    where: { email: 'customer@kai3d.test' },
    update: {},
    create: {
      id: 'user_customer_seed',
      email: 'customer@kai3d.test',
      name: 'Maria Santos',
      role: 'CUSTOMER',
    },
  })
  console.log(`✓ 2 seed users (admin@kai3d.test, customer@kai3d.test)`)

  // ─── Sample Orders ─────────────────────────────────────────────────────────
  await prisma.order.upsert({
    where: { orderNumber: 'KAI-SEED-001' },
    update: {},
    create: {
      orderNumber: 'KAI-SEED-001',
      userId: customerUser.id,
      status: 'DELIVERED',
      subtotal: 388,
      shippingFee: 100,
      total: 488,
      items: {
        create: [
          { productId: products[0].id, quantity: 2, unitPrice: 89, totalPrice: 178 },
          { productId: products[3].id, quantity: 1, unitPrice: 150, totalPrice: 150 },
          { productId: products[4].id, quantity: 1, unitPrice: 79, totalPrice: 79 },
        ],
      },
      statusLogs: {
        create: [
          { status: 'PENDING', notes: 'Order placed', createdAt: new Date('2025-07-01') },
          { status: 'CONFIRMED', notes: 'Payment verified', createdAt: new Date('2025-07-01') },
          { status: 'PRINTING', notes: 'Printing started', createdAt: new Date('2025-07-02') },
          { status: 'SHIPPED', notes: 'Dispatched via J&T', createdAt: new Date('2025-07-03') },
          { status: 'DELIVERED', notes: 'Delivered', createdAt: new Date('2025-07-04') },
        ],
      },
    },
  })

  await prisma.order.upsert({
    where: { orderNumber: 'KAI-SEED-002' },
    update: {},
    create: {
      orderNumber: 'KAI-SEED-002',
      userId: customerUser.id,
      status: 'PRINTING',
      subtotal: 299,
      total: 399,
      shippingFee: 100,
      items: {
        create: [{ productId: products[1].id, quantity: 1, unitPrice: 299, totalPrice: 299 }],
      },
      statusLogs: {
        create: [
          { status: 'PENDING', notes: 'Order placed' },
          { status: 'CONFIRMED', notes: 'Payment verified' },
          { status: 'IN_PRINT_QUEUE', notes: 'Added to print queue' },
          { status: 'PRINTING', notes: 'Now printing on Bambu X1 Carbon' },
        ],
      },
    },
  })
  console.log(`✓ 2 sample orders`)

  console.log('\n✅ Seed complete!')
}

main()
  .catch((e) => {
    console.error('Seed failed:', e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
