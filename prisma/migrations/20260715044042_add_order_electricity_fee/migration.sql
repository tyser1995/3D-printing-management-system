-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_orders" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "orderNumber" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "addressId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "subtotal" DECIMAL NOT NULL,
    "shippingFee" DECIMAL NOT NULL DEFAULT 0,
    "electricityFee" DECIMAL NOT NULL DEFAULT 0,
    "discount" DECIMAL NOT NULL DEFAULT 0,
    "total" DECIMAL NOT NULL,
    "notes" TEXT,
    "trackingNumber" TEXT,
    "printedPhotoUrl" TEXT,
    "deletedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "orders_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "orders_addressId_fkey" FOREIGN KEY ("addressId") REFERENCES "addresses" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_orders" ("addressId", "createdAt", "deletedAt", "discount", "id", "notes", "orderNumber", "printedPhotoUrl", "shippingFee", "status", "subtotal", "total", "trackingNumber", "updatedAt", "userId") SELECT "addressId", "createdAt", "deletedAt", "discount", "id", "notes", "orderNumber", "printedPhotoUrl", "shippingFee", "status", "subtotal", "total", "trackingNumber", "updatedAt", "userId" FROM "orders";
DROP TABLE "orders";
ALTER TABLE "new_orders" RENAME TO "orders";
CREATE UNIQUE INDEX "orders_orderNumber_key" ON "orders"("orderNumber");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
