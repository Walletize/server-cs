/*
  Warnings:

  - You are about to drop the column `subtype_id` on the `financial_accounts` table. All the data in the column will be lost.
  - You are about to drop the `account_subtypes` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `category_id` to the `financial_accounts` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "account_subtypes" DROP CONSTRAINT "account_subtypes_type_id_fkey";

-- DropForeignKey
ALTER TABLE "financial_accounts" DROP CONSTRAINT "financial_accounts_subtype_id_fkey";

-- AlterTable
ALTER TABLE "financial_accounts" DROP COLUMN "subtype_id",
ADD COLUMN     "category_id" TEXT NOT NULL;

-- DropTable
DROP TABLE "account_subtypes";

-- CreateTable
CREATE TABLE "account_categories" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type_id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "account_categories_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "financial_accounts" ADD CONSTRAINT "financial_accounts_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "account_categories"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "account_categories" ADD CONSTRAINT "account_categories_type_id_fkey" FOREIGN KEY ("type_id") REFERENCES "account_types"("id") ON DELETE CASCADE ON UPDATE CASCADE;
