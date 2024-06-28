/*
  Warnings:

  - A unique constraint covering the columns `[code]` on the table `currencies` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "currencies_code_key" ON "currencies"("code");
