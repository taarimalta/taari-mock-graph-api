-- CreateTable
CREATE TABLE "Country" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "continent" TEXT NOT NULL,
    "area" REAL,
    "capital" TEXT,
    "currency" TEXT,
    "population" INTEGER
);

-- CreateTable
CREATE TABLE "Animal" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "species" TEXT,
    "habitat" TEXT,
    "diet" TEXT,
    "conservation_status" TEXT,
    "category" TEXT NOT NULL
);
