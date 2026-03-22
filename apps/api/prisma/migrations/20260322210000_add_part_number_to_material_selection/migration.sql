-- AlterTable
ALTER TABLE "component_material_selection" ADD COLUMN "part_number_id" TEXT;

-- AddForeignKey
ALTER TABLE "component_material_selection" ADD CONSTRAINT "component_material_selection_part_number_id_fkey" FOREIGN KEY ("part_number_id") REFERENCES "component_part_number"("id") ON DELETE SET NULL ON UPDATE CASCADE;
