-- AlterTable: component_part_number — add lubrication_types and certifications
ALTER TABLE "component_part_number" ADD COLUMN "lubrication_types" JSONB;
ALTER TABLE "component_part_number" ADD COLUMN "certifications" JSONB;
