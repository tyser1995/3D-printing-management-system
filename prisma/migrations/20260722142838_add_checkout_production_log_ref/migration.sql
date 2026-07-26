-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_production_checkouts" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "product" TEXT NOT NULL,
    "type" TEXT,
    "item" TEXT,
    "filamentId" TEXT,
    "productionLogId" TEXT,
    "quantity" INTEGER NOT NULL,
    "unitPrice" DECIMAL NOT NULL,
    "totalAmount" DECIMAL NOT NULL,
    "checkedOutAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "checkedOutBy" TEXT,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "production_checkouts_filamentId_fkey" FOREIGN KEY ("filamentId") REFERENCES "filaments" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "production_checkouts_productionLogId_fkey" FOREIGN KEY ("productionLogId") REFERENCES "production_logs" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_production_checkouts" ("checkedOutAt", "checkedOutBy", "createdAt", "filamentId", "id", "item", "notes", "product", "quantity", "totalAmount", "type", "unitPrice", "updatedAt") SELECT "checkedOutAt", "checkedOutBy", "createdAt", "filamentId", "id", "item", "notes", "product", "quantity", "totalAmount", "type", "unitPrice", "updatedAt" FROM "production_checkouts";
DROP TABLE "production_checkouts";
ALTER TABLE "new_production_checkouts" RENAME TO "production_checkouts";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
