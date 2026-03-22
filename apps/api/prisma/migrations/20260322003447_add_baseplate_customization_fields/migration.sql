-- AlterTable
ALTER TABLE "pump_configuration" ADD COLUMN     "baseplate_domestic" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "baseplate_frame_type" VARCHAR(30),
ADD COLUMN     "baseplate_grout_type" VARCHAR(30),
ADD COLUMN     "baseplate_has_drain" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "baseplate_has_drip_rim" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "baseplate_material" VARCHAR(50);
