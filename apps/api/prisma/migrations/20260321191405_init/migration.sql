-- CreateTable
CREATE TABLE "pump_family" (
    "id" TEXT NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "hi_type_code" VARCHAR(10) NOT NULL,
    "flow_regime" VARCHAR(20) NOT NULL,
    "orientation" VARCHAR(20) NOT NULL,
    "staging" VARCHAR(20) NOT NULL,
    "description" TEXT,
    "image_url" VARCHAR(500),
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pump_family_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pump_model" (
    "id" TEXT NOT NULL,
    "family_id" TEXT NOT NULL,
    "model_code" VARCHAR(50) NOT NULL,
    "frame_size" VARCHAR(20),
    "suction_size_mm" INTEGER,
    "discharge_size_mm" INTEGER,
    "max_impeller_mm" DECIMAL(8,2) NOT NULL,
    "min_impeller_mm" DECIMAL(8,2) NOT NULL,
    "rated_speed_rpm" INTEGER NOT NULL,
    "max_stages" INTEGER NOT NULL DEFAULT 1,
    "min_stages" INTEGER NOT NULL DEFAULT 1,
    "max_power_kw" DECIMAL(10,2),
    "max_temperature_c" DECIMAL(6,1),
    "max_pressure_bar" DECIMAL(8,2),
    "weight_kg" DECIMAL(10,2),

    CONSTRAINT "pump_model_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pump_size" (
    "id" TEXT NOT NULL,
    "model_id" TEXT NOT NULL,
    "size_designation" VARCHAR(50) NOT NULL,
    "impeller_diameter_mm" DECIMAL(8,2) NOT NULL,
    "num_stages" INTEGER NOT NULL DEFAULT 1,
    "rated_flow_m3h" DECIMAL(10,2),
    "rated_head_m" DECIMAL(10,2),
    "rated_efficiency" DECIMAL(5,2),
    "rated_power_kw" DECIMAL(10,2),
    "rated_npshr_m" DECIMAL(6,2),
    "specific_speed_us" DECIMAL(10,1),
    "min_flow_m3h" DECIMAL(10,2),
    "max_flow_m3h" DECIMAL(10,2),
    "speed_rpm" INTEGER NOT NULL,

    CONSTRAINT "pump_size_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "performance_curve_set" (
    "id" TEXT NOT NULL,
    "size_id" TEXT NOT NULL,
    "speed_rpm" INTEGER NOT NULL,
    "impeller_diameter_mm" DECIMAL(8,2) NOT NULL,
    "fluid_sg" DECIMAL(6,4) NOT NULL DEFAULT 1.0,
    "viscosity_cst" DECIMAL(10,2) NOT NULL DEFAULT 1.0,
    "test_date" DATE,
    "source" VARCHAR(20) NOT NULL DEFAULT 'catalog',
    "is_reference" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "performance_curve_set_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "curve_data" (
    "id" TEXT NOT NULL,
    "curve_set_id" TEXT NOT NULL,
    "curve_type" VARCHAR(10) NOT NULL,
    "representation" VARCHAR(20) NOT NULL,
    "coefficients" JSONB,
    "degree" INTEGER,
    "knots_x" JSONB,
    "knots_y" JSONB,
    "data_points" JSONB,
    "x_unit" VARCHAR(10) NOT NULL DEFAULT 'm3/h',
    "y_unit" VARCHAR(10),
    "valid_q_min" DECIMAL(10,2),
    "valid_q_max" DECIMAL(10,2),

    CONSTRAINT "curve_data_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "component_definition" (
    "id" TEXT NOT NULL,
    "hi_type_code" VARCHAR(10) NOT NULL,
    "component_key" VARCHAR(50) NOT NULL,
    "display_name" VARCHAR(100) NOT NULL,
    "display_order" INTEGER NOT NULL,
    "is_wetted" BOOLEAN NOT NULL,
    "is_pressure_boundary" BOOLEAN NOT NULL DEFAULT false,
    "is_per_stage" BOOLEAN NOT NULL DEFAULT false,
    "is_required" BOOLEAN NOT NULL DEFAULT true,
    "notes" TEXT,

    CONSTRAINT "component_definition_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "material" (
    "id" TEXT NOT NULL,
    "material_code" VARCHAR(30) NOT NULL,
    "common_name" VARCHAR(100) NOT NULL,
    "specification" VARCHAR(100),
    "uns_number" VARCHAR(10),
    "material_group" VARCHAR(30) NOT NULL,
    "max_temperature_c" DECIMAL(6,1),
    "max_pressure_bar" DECIMAL(8,2),
    "lead_content_pct" DECIMAL(6,4),
    "is_ferrous" BOOLEAN,
    "domestic_source_available" BOOLEAN NOT NULL DEFAULT true,
    "density_kg_m3" DECIMAL(10,2),
    "hardness_min_bhn" DECIMAL(6,1),
    "hardness_max_bhn" DECIMAL(6,1),
    "is_hardenable" BOOLEAN NOT NULL DEFAULT false,
    "hardening_methods" VARCHAR(200),
    "hardened_min_bhn" DECIMAL(6,1),
    "hardened_max_bhn" DECIMAL(6,1),
    "hardened_max_hrc" DECIMAL(4,1),
    "notes" TEXT,

    CONSTRAINT "material_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "component_material_option" (
    "id" TEXT NOT NULL,
    "component_def_id" TEXT NOT NULL,
    "material_id" TEXT NOT NULL,
    "model_id" TEXT,
    "is_default" BOOLEAN NOT NULL DEFAULT false,
    "is_standard" BOOLEAN NOT NULL DEFAULT true,
    "cost_tier" INTEGER NOT NULL DEFAULT 1,
    "notes" TEXT,

    CONSTRAINT "component_material_option_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "certification" (
    "id" TEXT NOT NULL,
    "code" VARCHAR(30) NOT NULL,
    "full_name" VARCHAR(200) NOT NULL,
    "category" VARCHAR(30),
    "description" TEXT,
    "is_material_constraining" BOOLEAN NOT NULL DEFAULT true,
    "is_sourcing_constraining" BOOLEAN NOT NULL DEFAULT false,
    "is_documentation_only" BOOLEAN NOT NULL DEFAULT false,
    "mutual_requirements" VARCHAR(200),

    CONSTRAINT "certification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "material_certification" (
    "id" TEXT NOT NULL,
    "material_id" TEXT NOT NULL,
    "certification_id" TEXT NOT NULL,
    "component_key" VARCHAR(50),
    "is_certified" BOOLEAN NOT NULL DEFAULT true,
    "certification_number" VARCHAR(100),
    "expiration_date" DATE,
    "requires_coating" BOOLEAN NOT NULL DEFAULT false,
    "coating_specification" VARCHAR(100),
    "notes" TEXT,

    CONSTRAINT "material_certification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "certification_motor_constraint" (
    "id" TEXT NOT NULL,
    "certification_id" TEXT NOT NULL,
    "constraint_type" VARCHAR(30) NOT NULL,
    "parameter" VARCHAR(50) NOT NULL,
    "operator" VARCHAR(10) NOT NULL,
    "value" JSONB NOT NULL,
    "description" TEXT,

    CONSTRAINT "certification_motor_constraint_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "certification_baseplate_constraint" (
    "id" TEXT NOT NULL,
    "certification_id" TEXT NOT NULL,
    "constraint_type" VARCHAR(30) NOT NULL,
    "parameter" VARCHAR(50) NOT NULL,
    "operator" VARCHAR(10) NOT NULL,
    "value" JSONB NOT NULL,
    "description" TEXT,

    CONSTRAINT "certification_baseplate_constraint_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "motor_option" (
    "id" TEXT NOT NULL,
    "manufacturer" VARCHAR(100),
    "model_number" VARCHAR(100),
    "power_kw" DECIMAL(10,2) NOT NULL,
    "power_hp" DECIMAL(10,2),
    "speed_rpm" INTEGER NOT NULL,
    "poles" INTEGER NOT NULL,
    "voltage" VARCHAR(20) NOT NULL,
    "phase" INTEGER NOT NULL,
    "frequency_hz" INTEGER NOT NULL,
    "enclosure" VARCHAR(30) NOT NULL,
    "frame" VARCHAR(20) NOT NULL,
    "efficiency_class" VARCHAR(10),
    "full_load_efficiency" DECIMAL(5,2),
    "service_factor" DECIMAL(4,2) NOT NULL DEFAULT 1.15,
    "insulation_class" VARCHAR(2) NOT NULL DEFAULT 'F',
    "is_inverter_duty" BOOLEAN NOT NULL DEFAULT false,
    "mounting" VARCHAR(10),
    "weight_kg" DECIMAL(10,2),
    "is_vertical" BOOLEAN NOT NULL DEFAULT false,
    "is_hollow_shaft" BOOLEAN NOT NULL DEFAULT false,
    "is_submersible" BOOLEAN NOT NULL DEFAULT false,
    "hazardous_class" VARCHAR(30),
    "ul_listed" BOOLEAN NOT NULL DEFAULT false,
    "fm_approved" BOOLEAN NOT NULL DEFAULT false,
    "domestic_manufactured" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "motor_option_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "baseplate_option" (
    "id" TEXT NOT NULL,
    "type" VARCHAR(50) NOT NULL,
    "material" VARCHAR(50) NOT NULL,
    "applicable_hi_types" JSONB,
    "has_drip_rim" BOOLEAN NOT NULL DEFAULT false,
    "has_drain" BOOLEAN NOT NULL DEFAULT false,
    "grout_type" VARCHAR(30),
    "domestic_manufactured" BOOLEAN NOT NULL DEFAULT false,
    "description" TEXT,

    CONSTRAINT "baseplate_option_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pump_model_motor" (
    "model_id" TEXT NOT NULL,
    "motor_option_id" TEXT NOT NULL,
    "is_default" BOOLEAN NOT NULL DEFAULT false,
    "min_impeller_mm" DECIMAL(8,2),
    "max_impeller_mm" DECIMAL(8,2),

    CONSTRAINT "pump_model_motor_pkey" PRIMARY KEY ("model_id","motor_option_id")
);

-- CreateTable
CREATE TABLE "pump_model_baseplate" (
    "model_id" TEXT NOT NULL,
    "baseplate_id" TEXT NOT NULL,
    "is_default" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "pump_model_baseplate_pkey" PRIMARY KEY ("model_id","baseplate_id")
);

-- CreateTable
CREATE TABLE "project" (
    "id" TEXT NOT NULL,
    "name" VARCHAR(200) NOT NULL,
    "description" TEXT,
    "certifications" JSONB NOT NULL DEFAULT '[]',
    "cmtr_level" VARCHAR(10) NOT NULL DEFAULT 'none',
    "default_units" VARCHAR(10) NOT NULL DEFAULT 'metric',
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "project_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pump_configuration" (
    "id" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,
    "tag_number" VARCHAR(50),
    "service" VARCHAR(200),
    "pump_size_id" TEXT NOT NULL,
    "motor_option_id" TEXT,
    "baseplate_id" TEXT,
    "impeller_trim_mm" DECIMAL(8,2),
    "speed_rpm" INTEGER,
    "seal_type" VARCHAR(30),
    "seal_plan" VARCHAR(20),
    "coupling_type" VARCHAR(30),
    "num_stages" INTEGER NOT NULL DEFAULT 1,
    "duty_flow_m3h" DECIMAL(10,2) NOT NULL,
    "duty_head_m" DECIMAL(10,2) NOT NULL,
    "npsha_m" DECIMAL(6,2) NOT NULL,
    "fluid_sg" DECIMAL(6,4) NOT NULL DEFAULT 1.0,
    "fluid_temp_c" DECIMAL(6,1),
    "validation_status" VARCHAR(20) NOT NULL DEFAULT 'pending',
    "validation_messages" JSONB NOT NULL DEFAULT '[]',
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pump_configuration_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "component_material_selection" (
    "id" TEXT NOT NULL,
    "configuration_id" TEXT NOT NULL,
    "component_key" VARCHAR(50) NOT NULL,
    "material_id" TEXT NOT NULL,
    "coating_required" BOOLEAN NOT NULL DEFAULT false,
    "coating_spec" VARCHAR(100),
    "cmtr_required" BOOLEAN NOT NULL DEFAULT false,
    "cmtr_type" VARCHAR(10),
    "baba_compliant" BOOLEAN,
    "nsf61_compliant" BOOLEAN,
    "nsf372_compliant" BOOLEAN,
    "validation_status" VARCHAR(20) NOT NULL DEFAULT 'valid',
    "validation_messages" JSONB NOT NULL DEFAULT '[]',

    CONSTRAINT "component_material_selection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "configuration_rule" (
    "id" TEXT NOT NULL,
    "family_id" TEXT,
    "hi_type_code" VARCHAR(10),
    "rule_type" VARCHAR(30) NOT NULL,
    "parameter_name" VARCHAR(50) NOT NULL,
    "condition" JSONB NOT NULL,
    "action" JSONB NOT NULL,
    "certification_scope" VARCHAR(30),
    "priority" INTEGER NOT NULL DEFAULT 100,
    "description" TEXT,

    CONSTRAINT "configuration_rule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "impeller_geometry" (
    "id" TEXT NOT NULL,
    "model_id" TEXT,
    "pattern_number" VARCHAR(50),
    "revision" VARCHAR(10),
    "D1_mm" DECIMAL(8,2),
    "D_hub_mm" DECIMAL(8,2),
    "beta1_hub_deg" DECIMAL(6,2),
    "beta1_shroud_deg" DECIMAL(6,2),
    "b1_mm" DECIMAL(8,2),
    "Z" INTEGER,
    "Z_split" INTEGER DEFAULT 0,
    "beta2_deg" DECIMAL(6,2),
    "theta_wrap_deg" DECIMAL(6,2),
    "t1_mm" DECIMAL(6,2),
    "t2_mm" DECIMAL(6,2),
    "blade_profile_type" VARCHAR(30),
    "Ra_cast_um" DECIMAL(6,2),
    "Ra_machined_um" DECIMAL(6,2),
    "D2_max_mm" DECIMAL(8,2) NOT NULL,
    "b2_mm" DECIMAL(8,2),
    "A2_total_mm2" DECIMAL(12,2),
    "L_overlap_original_mm" DECIMAL(8,2),
    "shroud_extension_mm" DECIMAL(8,2),
    "shroud_type" VARCHAR(20),
    "D_seal_f_mm" DECIMAL(8,2),
    "D_seal_b_mm" DECIMAL(8,2),
    "has_back_vanes" BOOLEAN NOT NULL DEFAULT false,
    "delta_wr_f_mm" DECIMAL(6,3),
    "delta_wr_b_mm" DECIMAL(6,3),
    "wr_type" VARCHAR(20),
    "blockage_factor" DECIMAL(6,4),
    "slip_factor" DECIMAL(6,4),
    "source" VARCHAR(30),
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "impeller_geometry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "volute_geometry" (
    "id" TEXT NOT NULL,
    "model_id" TEXT,
    "pattern_number" VARCHAR(50),
    "volute_type" VARCHAR(30),
    "A3_mm2" DECIMAL(12,2),
    "b3_mm" DECIMAL(8,2),
    "D3_mm" DECIMAL(8,2),
    "delta_cw_mm" DECIMAL(8,2),
    "theta_cw_deg" DECIMAL(6,2),
    "cw_lip_profile" VARCHAR(20),
    "area_distribution" JSONB,
    "D_bc_mm" DECIMAL(8,2),
    "A_dn_mm2" DECIMAL(12,2),
    "has_splitter" BOOLEAN NOT NULL DEFAULT false,
    "has_diffuser_vanes" BOOLEAN NOT NULL DEFAULT false,
    "Z_d" INTEGER,
    "source" VARCHAR(30),
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "volute_geometry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "geometry_modification" (
    "id" TEXT NOT NULL,
    "target_type" VARCHAR(20) NOT NULL,
    "impeller_geometry_id" TEXT,
    "volute_geometry_id" TEXT,
    "modification_code" VARCHAR(30) NOT NULL,
    "modification_category" VARCHAR(30) NOT NULL,
    "sequence_order" INTEGER NOT NULL,
    "geometry_before" JSONB NOT NULL,
    "geometry_after" JSONB NOT NULL,
    "parameters" JSONB NOT NULL,
    "predicted_effect" JSONB,
    "date_performed" DATE,
    "performed_by" VARCHAR(100),
    "notes" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "geometry_modification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "geometry_test_result" (
    "id" TEXT NOT NULL,
    "impeller_geometry_id" TEXT NOT NULL,
    "volute_geometry_id" TEXT NOT NULL,
    "D2_actual_mm" DECIMAL(8,2) NOT NULL,
    "trim_ratio" DECIMAL(6,4),
    "beta2_effective_deg" DECIMAL(6,2),
    "delta_cw_actual_mm" DECIMAL(8,2),
    "area_ratio_actual" DECIMAL(6,4),
    "B_gap_ratio_actual" DECIMAL(6,4),
    "overlap_ratio" DECIMAL(6,4),
    "Ns_actual" DECIMAL(10,2),
    "speed_rpm" INTEGER NOT NULL,
    "fluid_sg" DECIMAL(6,4) NOT NULL DEFAULT 1.0,
    "Q_bep_m3h" DECIMAL(10,2),
    "H_bep_m" DECIMAL(10,2),
    "eta_bep_pct" DECIMAL(6,2),
    "P_bep_kw" DECIMAL(10,2),
    "NPSHr_at_bep_m" DECIMAL(6,2),
    "H_shutoff_m" DECIMAL(10,2),
    "curve_set_id" TEXT,
    "modifications_applied" JSONB,
    "test_type" VARCHAR(30),
    "test_date" DATE,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "geometry_test_result_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "idx_family_hi_type" ON "pump_family"("hi_type_code", "flow_regime");

-- CreateIndex
CREATE UNIQUE INDEX "pump_model_family_id_model_code_key" ON "pump_model"("family_id", "model_code");

-- CreateIndex
CREATE INDEX "idx_size_operating_envelope" ON "pump_size"("rated_flow_m3h", "rated_head_m", "min_flow_m3h", "max_flow_m3h");

-- CreateIndex
CREATE UNIQUE INDEX "pump_size_model_id_size_designation_key" ON "pump_size"("model_id", "size_designation");

-- CreateIndex
CREATE INDEX "idx_curve_set_lookup" ON "performance_curve_set"("size_id", "is_reference");

-- CreateIndex
CREATE UNIQUE INDEX "performance_curve_set_size_id_speed_rpm_impeller_diameter_m_key" ON "performance_curve_set"("size_id", "speed_rpm", "impeller_diameter_mm");

-- CreateIndex
CREATE UNIQUE INDEX "curve_data_curve_set_id_curve_type_key" ON "curve_data"("curve_set_id", "curve_type");

-- CreateIndex
CREATE INDEX "idx_component_def_type" ON "component_definition"("hi_type_code", "display_order");

-- CreateIndex
CREATE UNIQUE INDEX "component_definition_hi_type_code_component_key_key" ON "component_definition"("hi_type_code", "component_key");

-- CreateIndex
CREATE UNIQUE INDEX "material_material_code_key" ON "material"("material_code");

-- CreateIndex
CREATE INDEX "idx_component_material" ON "component_material_option"("component_def_id", "material_id");

-- CreateIndex
CREATE UNIQUE INDEX "component_material_option_component_def_id_material_id_mode_key" ON "component_material_option"("component_def_id", "material_id", "model_id");

-- CreateIndex
CREATE UNIQUE INDEX "certification_code_key" ON "certification"("code");

-- CreateIndex
CREATE INDEX "idx_material_cert_lookup" ON "material_certification"("certification_id", "component_key", "is_certified");

-- CreateIndex
CREATE UNIQUE INDEX "material_certification_material_id_certification_id_compone_key" ON "material_certification"("material_id", "certification_id", "component_key");

-- CreateIndex
CREATE INDEX "idx_motor_cert" ON "motor_option"("ul_listed", "fm_approved", "hazardous_class", "domestic_manufactured");

-- CreateIndex
CREATE UNIQUE INDEX "component_material_selection_configuration_id_component_key_key" ON "component_material_selection"("configuration_id", "component_key");

-- CreateIndex
CREATE INDEX "idx_geom_test_ns" ON "geometry_test_result"("Ns_actual");

-- CreateIndex
CREATE INDEX "idx_geom_test_area_ratio" ON "geometry_test_result"("area_ratio_actual");

-- CreateIndex
CREATE INDEX "idx_geom_test_trim" ON "geometry_test_result"("trim_ratio");

-- AddForeignKey
ALTER TABLE "pump_model" ADD CONSTRAINT "pump_model_family_id_fkey" FOREIGN KEY ("family_id") REFERENCES "pump_family"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pump_size" ADD CONSTRAINT "pump_size_model_id_fkey" FOREIGN KEY ("model_id") REFERENCES "pump_model"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "performance_curve_set" ADD CONSTRAINT "performance_curve_set_size_id_fkey" FOREIGN KEY ("size_id") REFERENCES "pump_size"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "curve_data" ADD CONSTRAINT "curve_data_curve_set_id_fkey" FOREIGN KEY ("curve_set_id") REFERENCES "performance_curve_set"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "component_material_option" ADD CONSTRAINT "component_material_option_component_def_id_fkey" FOREIGN KEY ("component_def_id") REFERENCES "component_definition"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "component_material_option" ADD CONSTRAINT "component_material_option_material_id_fkey" FOREIGN KEY ("material_id") REFERENCES "material"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "material_certification" ADD CONSTRAINT "material_certification_material_id_fkey" FOREIGN KEY ("material_id") REFERENCES "material"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "material_certification" ADD CONSTRAINT "material_certification_certification_id_fkey" FOREIGN KEY ("certification_id") REFERENCES "certification"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "certification_motor_constraint" ADD CONSTRAINT "certification_motor_constraint_certification_id_fkey" FOREIGN KEY ("certification_id") REFERENCES "certification"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "certification_baseplate_constraint" ADD CONSTRAINT "certification_baseplate_constraint_certification_id_fkey" FOREIGN KEY ("certification_id") REFERENCES "certification"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pump_model_motor" ADD CONSTRAINT "pump_model_motor_model_id_fkey" FOREIGN KEY ("model_id") REFERENCES "pump_model"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pump_model_motor" ADD CONSTRAINT "pump_model_motor_motor_option_id_fkey" FOREIGN KEY ("motor_option_id") REFERENCES "motor_option"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pump_model_baseplate" ADD CONSTRAINT "pump_model_baseplate_model_id_fkey" FOREIGN KEY ("model_id") REFERENCES "pump_model"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pump_model_baseplate" ADD CONSTRAINT "pump_model_baseplate_baseplate_id_fkey" FOREIGN KEY ("baseplate_id") REFERENCES "baseplate_option"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pump_configuration" ADD CONSTRAINT "pump_configuration_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "project"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pump_configuration" ADD CONSTRAINT "pump_configuration_pump_size_id_fkey" FOREIGN KEY ("pump_size_id") REFERENCES "pump_size"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pump_configuration" ADD CONSTRAINT "pump_configuration_motor_option_id_fkey" FOREIGN KEY ("motor_option_id") REFERENCES "motor_option"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pump_configuration" ADD CONSTRAINT "pump_configuration_baseplate_id_fkey" FOREIGN KEY ("baseplate_id") REFERENCES "baseplate_option"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "component_material_selection" ADD CONSTRAINT "component_material_selection_configuration_id_fkey" FOREIGN KEY ("configuration_id") REFERENCES "pump_configuration"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "component_material_selection" ADD CONSTRAINT "component_material_selection_material_id_fkey" FOREIGN KEY ("material_id") REFERENCES "material"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "impeller_geometry" ADD CONSTRAINT "impeller_geometry_model_id_fkey" FOREIGN KEY ("model_id") REFERENCES "pump_model"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "volute_geometry" ADD CONSTRAINT "volute_geometry_model_id_fkey" FOREIGN KEY ("model_id") REFERENCES "pump_model"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "geometry_modification" ADD CONSTRAINT "geometry_modification_impeller_geometry_id_fkey" FOREIGN KEY ("impeller_geometry_id") REFERENCES "impeller_geometry"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "geometry_modification" ADD CONSTRAINT "geometry_modification_volute_geometry_id_fkey" FOREIGN KEY ("volute_geometry_id") REFERENCES "volute_geometry"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "geometry_test_result" ADD CONSTRAINT "geometry_test_result_impeller_geometry_id_fkey" FOREIGN KEY ("impeller_geometry_id") REFERENCES "impeller_geometry"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "geometry_test_result" ADD CONSTRAINT "geometry_test_result_volute_geometry_id_fkey" FOREIGN KEY ("volute_geometry_id") REFERENCES "volute_geometry"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "geometry_test_result" ADD CONSTRAINT "geometry_test_result_curve_set_id_fkey" FOREIGN KEY ("curve_set_id") REFERENCES "performance_curve_set"("id") ON DELETE SET NULL ON UPDATE CASCADE;
