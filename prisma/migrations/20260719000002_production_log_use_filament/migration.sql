-- Replace colorId (-> production_colors) with filamentId (-> filaments)
CREATE TABLE "new_production_logs" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "product" TEXT NOT NULL,
    "type" TEXT,
    "item" TEXT,
    "filamentId" TEXT,
    "quantity" INTEGER NOT NULL,
    "producedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "notes" TEXT,
    "producedBy" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "new_production_logs_filamentId_fkey" FOREIGN KEY ("filamentId") REFERENCES "filaments" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

INSERT INTO "new_production_logs" ("id", "product", "type", "item", "filamentId", "quantity", "producedAt", "notes", "producedBy", "createdAt", "updatedAt")
SELECT "id", "product", "type", "item", NULL, "quantity", "producedAt", "notes", "producedBy", "createdAt", "updatedAt"
FROM "production_logs";

DROP TABLE "production_logs";
ALTER TABLE "new_production_logs" RENAME TO "production_logs";
