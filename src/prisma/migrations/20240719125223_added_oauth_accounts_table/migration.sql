/*
  Warnings:

  - You are about to drop the column `provider_id` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `provider_user_id` on the `users` table. All the data in the column will be lost.
  - The `email_verified` column on the `users` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - You are about to drop the `accounts` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `verification_tokens` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "accounts" DROP CONSTRAINT "accounts_user_id_fkey";

-- DropIndex
DROP INDEX "users_provider_user_id_key";

-- AlterTable
ALTER TABLE "users" DROP COLUMN "provider_id",
DROP COLUMN "provider_user_id",
DROP COLUMN "email_verified",
ADD COLUMN     "email_verified" BOOLEAN NOT NULL DEFAULT false;

-- DropTable
DROP TABLE "accounts";

-- DropTable
DROP TABLE "verification_tokens";

-- CreateTable
CREATE TABLE "oauth_accounts" (
    "id" TEXT NOT NULL,
    "user_id" TEXT,
    "provider_id" TEXT,
    "provider_user_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "oauth_accounts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "oauth_accounts_provider_user_id_key" ON "oauth_accounts"("provider_user_id");

-- AddForeignKey
ALTER TABLE "oauth_accounts" ADD CONSTRAINT "oauth_accounts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
