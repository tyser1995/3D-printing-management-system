-- Recreate production_logs with product/type/item as free text (drop baseId/typeId FKs)
CREATE TABLE "new_production_logs" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "product" TEXT NOT NULL,
    "type" TEXT,
    "item" TEXT,
    "colorId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "producedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "notes" TEXT,
    "producedBy" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "new_production_logs_colorId_fkey" FOREIGN KEY ("colorId") REFERENCES "production_colors" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

INSERT INTO "new_production_logs" ("id", "product", "type", "item", "colorId", "quantity", "producedAt", "notes", "producedBy", "createdAt", "updatedAt")
SELECT
    pl."id",
    COALESCE(pb."name", pl."baseId") AS "product",
    pt."name" AS "type",
    NULL AS "item",
    pl."colorId",
    pl."quantity",
    pl."producedAt",
    pl."notes",
    pl."producedBy",
    pl."createdAt",
    pl."updatedAt"
FROM "production_logs" pl
LEFT JOIN "production_bases" pb ON pl."baseId" = pb."id"
LEFT JOIN "production_types" pt ON pl."typeId" = pt."id";

DROP TABLE "production_logs";
ALTER TABLE "new_production_logs" RENAME TO "production_logs";
