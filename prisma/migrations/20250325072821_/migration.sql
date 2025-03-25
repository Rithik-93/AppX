/*
  Warnings:

  - Changed the type of `zone` on the `ExamAttempt` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `area` on the `User` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateEnum
CREATE TYPE "Zone" AS ENUM ('JAMMU_SRINAGAR', 'KOLKATA', 'MALDA', 'MUMBAI', 'MUZAFFARPUR', 'PATNA', 'PRAYAGRAJ', 'RANCHI', 'SECUNDERABAD', 'SILIGURI', 'THIRUVANANTHAPURAM', 'AHMEDABAD', 'AJMER', 'BANGALORE', 'BHOPAL', 'BHUBANESWAR', 'BILASPUR', 'CHANDIGARH', 'CHENNAI', 'GORAKHPUR', 'GUWAHATI');

-- AlterTable
ALTER TABLE "ExamAttempt" DROP COLUMN "zone",
ADD COLUMN     "zone" "Zone" NOT NULL;

-- AlterTable
ALTER TABLE "User" DROP COLUMN "area",
ADD COLUMN     "area" "Zone" NOT NULL;

-- DropEnum
DROP TYPE "Area";
