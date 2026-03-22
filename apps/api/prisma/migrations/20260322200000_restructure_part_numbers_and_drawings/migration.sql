-- DropForeignKey
ALTER TABLE "component_drawing" DROP CONSTRAINT "component_drawing_component_def_id_fkey";

-- DropIndex
DROP INDEX "component_drawing_component_def_id_drawing_number_key";

-- AlterTable
ALTER TABLE "component_definition" DROP COLUMN "part_number";

-- AlterTable
ALTER TABLE "component_drawing" DROP COLUMN "component_def_id",
ADD COLUMN     "part_number_id" TEXT NOT NULL;

-- CreateTable
CREATE TABLE "component_part_number" (
    "id" TEXT NOT NULL,
    "component_def_id" TEXT NOT NULL,
    "model_id" TEXT,
    "part_number" VARCHAR(100) NOT NULL,
    "notes" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "component_part_number_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "idx_part_number_model" ON "component_part_number"("model_id");

-- CreateIndex
CREATE UNIQUE INDEX "component_part_number_component_def_id_part_number_key" ON "component_part_number"("component_def_id", "part_number");

-- CreateIndex
CREATE UNIQUE INDEX "component_drawing_part_number_id_drawing_number_key" ON "component_drawing"("part_number_id", "drawing_number");

-- AddForeignKey
ALTER TABLE "component_part_number" ADD CONSTRAINT "component_part_number_component_def_id_fkey" FOREIGN KEY ("component_def_id") REFERENCES "component_definition"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "component_part_number" ADD CONSTRAINT "component_part_number_model_id_fkey" FOREIGN KEY ("model_id") REFERENCES "pump_model"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "component_drawing" ADD CONSTRAINT "component_drawing_part_number_id_fkey" FOREIGN KEY ("part_number_id") REFERENCES "component_part_number"("id") ON DELETE CASCADE ON UPDATE CASCADE;
