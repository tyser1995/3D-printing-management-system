-- CreateTable
CREATE TABLE "production_checkouts" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "product" TEXT NOT NULL,
    "type" TEXT,
    "item" TEXT,
    "filamentId" TEXT,
    "quantity" INTEGER NOT NULL,
    "unitPrice" DECIMAL NOT NULL,
    "totalAmount" DECIMAL NOT NULL,
    "checkedOutAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "checkedOutBy" TEXT,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "production_checkouts_filamentId_fkey" FOREIGN KEY ("filamentId") REFERENCES "filaments" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_production_logs" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "product" TEXT NOT NULL,
    "type" TEXT,
    "item" TEXT,
    "filamentId" TEXT,
    "quantity" INTEGER NOT NULL,
    "amount" DECIMAL NOT NULL DEFAULT 0,
    "producedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "notes" TEXT,
    "producedBy" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "production_logs_filamentId_fkey" FOREIGN KEY ("filamentId") REFERENCES "filaments" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_production_logs" ("createdAt", "filamentId", "id", "item", "notes", "producedAt", "producedBy", "product", "quantity", "type", "updatedAt") SELECT "createdAt", "filamentId", "id", "item", "notes", "producedAt", "producedBy", "product", "quantity", "type", "updatedAt" FROM "production_logs";
DROP TABLE "production_logs";
ALTER TABLE "new_production_logs" RENAME TO "production_logs";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
