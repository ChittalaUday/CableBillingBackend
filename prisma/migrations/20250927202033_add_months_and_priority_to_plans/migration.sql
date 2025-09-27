-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_plans" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "type" TEXT NOT NULL DEFAULT 'BASIC',
    "price" REAL NOT NULL,
    "channels" TEXT,
    "packageDetails" TEXT,
    "months" INTEGER NOT NULL DEFAULT 1,
    "isPriority" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_plans" ("channels", "createdAt", "description", "id", "isActive", "name", "packageDetails", "price", "type", "updatedAt") SELECT "channels", "createdAt", "description", "id", "isActive", "name", "packageDetails", "price", "type", "updatedAt" FROM "plans";
DROP TABLE "plans";
ALTER TABLE "new_plans" RENAME TO "plans";
CREATE UNIQUE INDEX "plans_name_key" ON "plans"("name");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
