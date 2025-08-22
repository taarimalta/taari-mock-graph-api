-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Animal" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "species" TEXT,
    "habitat" TEXT,
    "diet" TEXT,
    "conservation_status" TEXT,
    "category" TEXT NOT NULL,
    "domainId" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "modifiedAt" DATETIME,
    "createdBy" INTEGER,
    "modifiedBy" INTEGER,
    CONSTRAINT "Animal_domainId_fkey" FOREIGN KEY ("domainId") REFERENCES "Domain" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Animal_modifiedBy_fkey" FOREIGN KEY ("modifiedBy") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Animal_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Animal" ("category", "conservation_status", "createdAt", "createdBy", "diet", "habitat", "id", "modifiedAt", "modifiedBy", "name", "species") SELECT "category", "conservation_status", "createdAt", "createdBy", "diet", "habitat", "id", "modifiedAt", "modifiedBy", "name", "species" FROM "Animal";
DROP TABLE "Animal";
ALTER TABLE "new_Animal" RENAME TO "Animal";
CREATE TABLE "new_Country" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "capital" TEXT,
    "population" INTEGER,
    "area" REAL,
    "currency" TEXT,
    "continent" TEXT NOT NULL,
    "domainId" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "modifiedAt" DATETIME,
    "createdBy" INTEGER,
    "modifiedBy" INTEGER,
    CONSTRAINT "Country_domainId_fkey" FOREIGN KEY ("domainId") REFERENCES "Domain" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Country_modifiedBy_fkey" FOREIGN KEY ("modifiedBy") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Country_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Country" ("area", "capital", "continent", "createdAt", "createdBy", "currency", "id", "modifiedAt", "modifiedBy", "name", "population") SELECT "area", "capital", "continent", "createdAt", "createdBy", "currency", "id", "modifiedAt", "modifiedBy", "name", "population" FROM "Country";
DROP TABLE "Country";
ALTER TABLE "new_Country" RENAME TO "Country";
CREATE TABLE "new_User" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "username" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "firstName" TEXT,
    "lastName" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "modifiedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" INTEGER,
    "modifiedBy" INTEGER,
    "domainId" INTEGER,
    CONSTRAINT "User_domainId_fkey" FOREIGN KEY ("domainId") REFERENCES "Domain" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "User_modifiedBy_fkey" FOREIGN KEY ("modifiedBy") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "User_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_User" ("createdAt", "createdBy", "email", "firstName", "id", "lastName", "modifiedAt", "modifiedBy", "username") SELECT "createdAt", "createdBy", "email", "firstName", "id", "lastName", "modifiedAt", "modifiedBy", "username" FROM "User";
DROP TABLE "User";
ALTER TABLE "new_User" RENAME TO "User";
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
