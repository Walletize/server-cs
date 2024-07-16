/*
  Warnings:

  - You are about to drop the column `expires` on the `sessions` table. All the data in the column will be lost.
  - You are about to drop the column `session_token` on the `sessions` table. All the data in the column will be lost.
  - Added the required column `expiresAt` to the `sessions` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "sessions_session_token_key";

-- AlterTable
ALTER TABLE "sessions" DROP COLUMN "expires",
DROP COLUMN "session_token",
ADD COLUMN     "expiresAt" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "password_hash" TEXT;
