-- CreateTable
CREATE TABLE "component_property_def" (
    "id" TEXT NOT NULL,
    "component_def_id" TEXT NOT NULL,
    "property_key" VARCHAR(50) NOT NULL,
    "display_name" VARCHAR(100) NOT NULL,
    "unit" VARCHAR(20),
    "data_type" VARCHAR(20) NOT NULL DEFAULT 'number',
    "select_options" JSONB,
    "display_order" INT NOT NULL DEFAULT 0,
    "is_required" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "component_property_def_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "component_property_value" (
    "id" TEXT NOT NULL,
    "configuration_id" TEXT NOT NULL,
    "property_def_id" TEXT NOT NULL,
    "component_key" VARCHAR(50) NOT NULL,
    "value_number" DECIMAL(12,4),
    "value_text" VARCHAR(200),
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "component_property_value_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "component_property_def_component_def_id_property_key_key" ON "component_property_def"("component_def_id", "property_key");

-- CreateIndex
CREATE UNIQUE INDEX "component_property_value_configuration_id_property_def_id_key" ON "component_property_value"("configuration_id", "property_def_id", "component_key");

-- AddForeignKey
ALTER TABLE "component_property_def" ADD CONSTRAINT "component_property_def_component_def_id_fkey" FOREIGN KEY ("component_def_id") REFERENCES "component_definition"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "component_property_value" ADD CONSTRAINT "component_property_value_configuration_id_fkey" FOREIGN KEY ("configuration_id") REFERENCES "pump_configuration"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "component_property_value" ADD CONSTRAINT "component_property_value_property_def_id_fkey" FOREIGN KEY ("property_def_id") REFERENCES "component_property_def"("id") ON DELETE CASCADE ON UPDATE CASCADE;
