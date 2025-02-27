/*
  Warnings:

  - Added the required column `area` to the `User` table without a default value. This is not possible if the table is not empty.
  - Added the required column `gender` to the `User` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "User" ADD COLUMN     "area" "Area" NOT NULL,
ADD COLUMN     "gender" "Gender" NOT NULL;
