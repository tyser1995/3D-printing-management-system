-- CreateTable
CREATE TABLE "production_bases" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "production_types" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "baseId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "production_types_baseId_fkey" FOREIGN KEY ("baseId") REFERENCES "production_bases" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "production_colors" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "colorHex" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "production_logs" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "baseId" TEXT NOT NULL,
    "typeId" TEXT,
    "colorId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "producedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "notes" TEXT,
    "producedBy" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "production_logs_baseId_fkey" FOREIGN KEY ("baseId") REFERENCES "production_bases" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "production_logs_typeId_fkey" FOREIGN KEY ("typeId") REFERENCES "production_types" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "production_logs_colorId_fkey" FOREIGN KEY ("colorId") REFERENCES "production_colors" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "production_bases_name_key" ON "production_bases"("name");

-- CreateIndex
CREATE UNIQUE INDEX "production_types_baseId_name_key" ON "production_types"("baseId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "production_colors_name_key" ON "production_colors"("name");
