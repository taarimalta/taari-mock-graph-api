-- CreateTable
CREATE TABLE "User" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "username" TEXT NOT NULL UNIQUE,
    "email" TEXT NOT NULL UNIQUE,
    "firstName" TEXT,
    "lastName" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "modifiedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
-- CreateTable
CREATE TABLE "Country" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "continent" TEXT NOT NULL,
    "area" REAL,
    "capital" TEXT,
    "currency" TEXT,
    "population" INTEGER,
    "createdAt" DATETIME,
    "modifiedAt" DATETIME,
    "createdBy" INTEGER,
    "modifiedBy" INTEGER,
    FOREIGN KEY ("createdBy") REFERENCES "User"("id"),
    FOREIGN KEY ("modifiedBy") REFERENCES "User"("id")
);

-- CreateTable
CREATE TABLE "Animal" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "species" TEXT,
    "habitat" TEXT,
    "diet" TEXT,
    "conservation_status" TEXT,
    "category" TEXT NOT NULL,
    "createdAt" DATETIME,
    "modifiedAt" DATETIME,
    "createdBy" INTEGER,
    "modifiedBy" INTEGER,
    FOREIGN KEY ("createdBy") REFERENCES "User"("id"),
    FOREIGN KEY ("modifiedBy") REFERENCES "User"("id")
);
