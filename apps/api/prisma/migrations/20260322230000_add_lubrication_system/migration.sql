-- AlterTable: component_definition — add lubrication columns
ALTER TABLE "component_definition" ADD COLUMN "lubrication_types" JSONB;
ALTER TABLE "component_definition" ADD COLUMN "lubrication_added" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable: component_material_option — add lubrication filter
ALTER TABLE "component_material_option" ADD COLUMN "lubrication_types" JSONB;

-- AlterTable: pump_configuration — add global lubrication type
ALTER TABLE "pump_configuration" ADD COLUMN "lubrication_type" VARCHAR(30);

-- CreateTable: configuration_bearing_lubrication — per-bearing-group for VS types
CREATE TABLE "configuration_bearing_lubrication" (
    "id" TEXT NOT NULL,
    "configuration_id" TEXT NOT NULL,
    "bearing_group" VARCHAR(30) NOT NULL,
    "lubrication_type" VARCHAR(30) NOT NULL,

    CONSTRAINT "configuration_bearing_lubrication_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "configuration_bearing_lubrication_configuration_id_bearing__key" ON "configuration_bearing_lubrication"("configuration_id", "bearing_group");

-- AddForeignKey
ALTER TABLE "configuration_bearing_lubrication" ADD CONSTRAINT "configuration_bearing_lubrication_configuration_id_fkey" FOREIGN KEY ("configuration_id") REFERENCES "pump_configuration"("id") ON DELETE CASCADE ON UPDATE CASCADE;
