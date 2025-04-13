/*
  Warnings:

  - You are about to drop the column `name` on the `User` table. All the data in the column will be lost.
  - Added the required column `chesscom_username` to the `User` table without a default value. This is not possible if the table is not empty.
  - Added the required column `lichess_username` to the `User` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "User" DROP COLUMN "name",
ADD COLUMN     "chesscom_username" TEXT NOT NULL,
ADD COLUMN     "lichess_username" TEXT NOT NULL;
