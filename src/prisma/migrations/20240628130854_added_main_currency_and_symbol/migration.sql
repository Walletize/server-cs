/*
  Warnings:

  - Added the required column `symbol` to the `currencies` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "currencies" ADD COLUMN     "symbol" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "main_currency_id" TEXT NOT NULL DEFAULT 'b6ecaefd-510d-47cf-83a1-b96494496a84';

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_main_currency_id_fkey" FOREIGN KEY ("main_currency_id") REFERENCES "currencies"("id") ON DELETE CASCADE ON UPDATE CASCADE;
