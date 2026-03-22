-- AlterTable
ALTER TABLE "component_definition" ADD COLUMN     "part_number" VARCHAR(100);

-- CreateTable
CREATE TABLE "component_drawing" (
    "id" TEXT NOT NULL,
    "component_def_id" TEXT NOT NULL,
    "drawing_number" VARCHAR(100) NOT NULL,
    "drawing_url" VARCHAR(1000) NOT NULL,
    "title" VARCHAR(200),
    "display_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "component_drawing_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "component_drawing_component_def_id_drawing_number_key" ON "component_drawing"("component_def_id", "drawing_number");

-- AddForeignKey
ALTER TABLE "component_drawing" ADD CONSTRAINT "component_drawing_component_def_id_fkey" FOREIGN KEY ("component_def_id") REFERENCES "component_definition"("id") ON DELETE CASCADE ON UPDATE CASCADE;
