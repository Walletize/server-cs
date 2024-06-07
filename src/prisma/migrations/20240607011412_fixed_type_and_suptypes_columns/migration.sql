/*
  Warnings:

  - The primary key for the `account_types` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `currentBalance` on the `account_types` table. All the data in the column will be lost.
  - You are about to drop the column `initialBalance` on the `account_types` table. All the data in the column will be lost.
  - You are about to drop the column `type_id` on the `financial_accounts` table. All the data in the column will be lost.
  - Added the required column `currentBalance` to the `financial_accounts` table without a default value. This is not possible if the table is not empty.
  - Added the required column `initialBalance` to the `financial_accounts` table without a default value. This is not possible if the table is not empty.
  - Added the required column `subtype_id` to the `financial_accounts` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "financial_accounts" DROP CONSTRAINT "financial_accounts_type_id_fkey";

-- AlterTable
ALTER TABLE "account_types" DROP CONSTRAINT "account_types_pkey",
DROP COLUMN "currentBalance",
DROP COLUMN "initialBalance",
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ADD CONSTRAINT "account_types_pkey" PRIMARY KEY ("id");
DROP SEQUENCE "account_types_id_seq";

-- AlterTable
ALTER TABLE "financial_accounts" DROP COLUMN "type_id",
ADD COLUMN     "currentBalance" BIGINT NOT NULL,
ADD COLUMN     "initialBalance" BIGINT NOT NULL,
ADD COLUMN     "subtype_id" TEXT NOT NULL;

-- CreateTable
CREATE TABLE "account_subtypes" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type_id" TEXT NOT NULL,

    CONSTRAINT "account_subtypes_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "financial_accounts" ADD CONSTRAINT "financial_accounts_subtype_id_fkey" FOREIGN KEY ("subtype_id") REFERENCES "account_subtypes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "account_subtypes" ADD CONSTRAINT "account_subtypes_type_id_fkey" FOREIGN KEY ("type_id") REFERENCES "account_types"("id") ON DELETE CASCADE ON UPDATE CASCADE;
