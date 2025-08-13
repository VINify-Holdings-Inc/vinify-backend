-- 🔁 Drop All Procedures in 'public' schema
DO $$
DECLARE
  proc RECORD;
BEGIN
  FOR proc IN
    SELECT
      n.nspname AS schema_name,
      p.proname AS procedure_name,
      pg_get_function_identity_arguments(p.oid) AS args
    FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE p.prokind = 'p'  -- 'p' means procedure
      AND n.nspname = 'public'  -- adjust schema as needed
  LOOP
    EXECUTE format('DROP PROCEDURE IF EXISTS %I.%I(%s);', proc.schema_name, proc.procedure_name, proc.args);
  END LOOP;
END $$;

-- 🔁 Title Data Update Procedure
DROP PROCEDURE IF EXISTS "update_isOld_vehicle_data_temp_Title";

CREATE OR REPLACE PROCEDURE "update_isOld_vehicle_data_temp_Title"()
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE "VehicleDataTemp" AS vdt
  SET 
    "isOld" = true,
    "isRead" = vd."isRead",
    "createdAt" = vd."createdAt",
    "updatedAt" = vd."updatedAt"
  FROM "VehicleData" AS vd
  WHERE 
    vdt."vin" = vd."vin"
    AND vdt."titleUnique" = vd."titleUnique"
    AND vdt."alertType" = vd."alertType"
    AND vdt."alertType" = 'Title';
END;
$$;

-- ➕ Title Data Insert (isDel)
DROP PROCEDURE IF EXISTS "isDel_update_compare_title";

CREATE OR REPLACE PROCEDURE "isDel_update_compare_title"()
LANGUAGE plpgsql
AS $$ 
BEGIN
  INSERT INTO "VehicleDataTemp" (
    "vin", "titleUnique", "status", "vinId", 
    "state", "titleBrandDate",  "alertType",
    "createdBy", "updatedBy",  
    "isRead", "isOld", "isDel", "createdAt", "updatedAt"
  )
  SELECT
    vd."vin", vd."titleUnique", vd."status", vd."vinId",  
    vd."state", vd."titleBrandDate",  vd."alertType",
    'system', 'system',  
    vd."isRead", false, true, vd."createdAt", vd."updatedAt"
  FROM "VehicleData" vd
  WHERE vd."alertType" = 'Title'
    AND vd."vin" IN (
      SELECT DISTINCT temp."vin"
      FROM "VehicleDataTemp" temp
      WHERE temp."alertType" = 'Title'
    )
    AND NOT EXISTS (
      SELECT 1
      FROM "VehicleDataTemp" temp
      WHERE 
        vd."vin" = temp."vin"
        AND vd."titleUnique" = temp."titleUnique"
        AND vd."alertType" = temp."alertType"
    );
END;
$$;

-- 🔁 Brand Data Update Procedure
DROP PROCEDURE IF EXISTS "update_isOld_vehicle_data_temp_Brand";

CREATE OR REPLACE PROCEDURE "update_isOld_vehicle_data_temp_Brand"()
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE "VehicleDataTemp" AS vdt
  SET 
    "isOld" = true,
    "isRead" = vd."isRead",
    "createdAt" = vd."createdAt",
    "updatedAt" = vd."updatedAt"
  FROM "VehicleData" AS vd
  WHERE 
    vdt."vin" = vd."vin"
    AND vdt."titleBrandDate" = vd."titleBrandDate"
    AND vdt."brand" = vd."brand"
    AND vdt."state" = vd."state"
    AND vdt."alertType" = vd."alertType"
    AND vdt."alertType" = 'Brand';
END;
$$;

-- ➕ Brand Data Insert (isDel)
DROP PROCEDURE IF EXISTS "isDel_update_compare_Brand";

CREATE OR REPLACE PROCEDURE "isDel_update_compare_Brand"()
LANGUAGE plpgsql
AS $$ 
BEGIN
  INSERT INTO "VehicleDataTemp" (
    "vin", "titleBrandDate", "brand", "state", "alertType",
    "createdBy", "updatedBy", 
    "isRead", "isOld", "isDel", "createdAt", "updatedAt"
  )
  SELECT
    vd."vin", vd."titleBrandDate", vd."brand", vd."state", vd."alertType",
    'system', 'system',  
    vd."isRead", false, true, vd."createdAt", vd."updatedAt"
  FROM "VehicleData" vd
  WHERE vd."alertType" = 'Brand'
    AND vd."vin" IN (
      SELECT DISTINCT temp."vin"
      FROM "VehicleDataTemp" temp
      WHERE temp."alertType" = 'Brand'
    )
    AND NOT EXISTS (
      SELECT 1
      FROM "VehicleDataTemp" temp
      WHERE 
        vd."vin" = temp."vin"
        AND vd."titleBrandDate" = temp."titleBrandDate"
        AND vd."brand" = temp."brand"
        AND vd."state" = temp."state"
        AND vd."alertType" = temp."alertType"
    );
END;
$$;

-- 🔁 JSI Data Update Procedure
DROP PROCEDURE IF EXISTS "update_isOld_vehicle_data_temp_jsi";

CREATE OR REPLACE PROCEDURE "update_isOld_vehicle_data_temp_jsi"()
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE "VehicleDataTemp" AS vdt
  SET 
    "isOld" = true,
    "isRead" = vd."isRead",
    "createdAt" = vd."createdAt",
    "updatedAt" = vd."updatedAt"
  FROM "VehicleData" AS vd
  WHERE 
    vdt."vin" = vd."vin"
    AND vdt."titleBrandDate" = vd."titleBrandDate"
    AND vdt."email" = vd."email"
    AND vdt."mobile" = vd."mobile"
    AND vdt."export" = vd."export"
    AND vdt."state" = vd."state"
    AND vdt."description" = vd."description"
    AND vdt."city" = vd."city"
    AND vdt."rptgEntity" = vd."rptgEntity"
    AND vdt."alertType" = vd."alertType"
    AND vdt."alertType" = 'JSI';
END;
$$;

-- ➕ JSI Data Insert (isDel)
DROP PROCEDURE IF EXISTS "isDel_update_compare_JSI";

CREATE OR REPLACE PROCEDURE "isDel_update_compare_JSI"()
LANGUAGE plpgsql
AS $$ 
BEGIN
  INSERT INTO "VehicleDataTemp" (
    "vin", "titleBrandDate", "description", "export", "rptgEntity",
    "city", "state", "mobile", "email", "alertType",
    "createdBy", "updatedBy", 
    "isRead", "isOld", "isDel", "createdAt", "updatedAt"
  )
  SELECT
    vd."vin", vd."titleBrandDate", vd."description", vd."export", vd."rptgEntity",
    vd."city", vd."state", vd."mobile", vd."email", vd."alertType",
    'system', 'system',  
    vd."isRead", false, true, vd."createdAt", vd."updatedAt"
  FROM "VehicleData" vd
  WHERE vd."alertType" = 'JSI'
    AND vd."vin" IN (
      SELECT DISTINCT temp."vin"
      FROM "VehicleDataTemp" temp
      WHERE temp."alertType" = 'JSI'
    )
    AND NOT EXISTS (
      SELECT 1
      FROM "VehicleDataTemp" temp
      WHERE 
        vd."vin" = temp."vin"
        AND vd."titleBrandDate" = temp."titleBrandDate"
        AND vd."email" = temp."email"
        AND vd."mobile" = temp."mobile"
        AND vd."export" = temp."export"
        AND vd."state" = temp."state"
        AND vd."description" = temp."description"
        AND vd."city" = temp."city"
        AND vd."rptgEntity" = temp."rptgEntity"
        AND vd."alertType" = temp."alertType"
    );
END;
$$;

-- ⬇️ Copy All From Temp to Main Table
DROP PROCEDURE IF EXISTS "copy_data_from_vehicle_data_temp";

CREATE OR REPLACE PROCEDURE "copy_data_from_vehicle_data_temp"()
LANGUAGE plpgsql
AS $$ 
BEGIN
  INSERT INTO "VehicleData" (
    "vin", "vinId", "brand", "state", "alertType",
    "titleBrandDate", "status", "titleUnique", "description",
    "export", "city", "rptgEntity", "email", "mobile",
    "isRead", "isOld", "isDel", "createdAt", "updatedAt", "createdBy",
    "updatedBy"
  )
  SELECT
    "vin", "vinId", "brand", "state", "alertType",
    "titleBrandDate", "status", "titleUnique", "description",
    "export", "city", "rptgEntity", "email", "mobile",
    "isRead", "isOld", "isDel", "createdAt", "updatedAt", "createdBy",
    "updatedBy"
  FROM "VehicleDataTemp";
END;
$$;

-- Insert Dashboard Data into DashboardDataList
CREATE OR REPLACE PROCEDURE insert_dashboard_data_list_data()
LANGUAGE plpgsql
AS $$ 
BEGIN
  -- Optional: Clear old data if required
  -- TRUNCATE TABLE "DashboardDataList";

  WITH distinct_vins AS (
    SELECT DISTINCT "vin"
    FROM "VehicleData"
  ),
  latest_alerts AS (
    SELECT DISTINCT ON ("vin", "alertType") 
      "vin",
      "alertType",
      "isDel"
    FROM "VehicleData"
    WHERE "isOld" = false 
      AND "alertType" IN ('Title', 'Brand', 'JSI')
    ORDER BY "vin", "alertType", "titleBrandDate" DESC, "createdAt" DESC
  )
  INSERT INTO "DashboardDataList" (
    "vin", "Title", "Brand", "JSI", "isOld", "isTitleDel", "isBrandDel", "isJSIDel"
  )
  SELECT 
    dv."vin",
    MAX(CASE WHEN la."alertType" = 'Title' THEN 1 ELSE 0 END)::boolean AS "Title",
    MAX(CASE WHEN la."alertType" = 'Brand' THEN 1 ELSE 0 END)::boolean AS "Brand",
    MAX(CASE WHEN la."alertType" = 'JSI' THEN 1 ELSE 0 END)::boolean AS "JSI",
    NOT (
      MAX(CASE WHEN la."alertType" = 'Title' THEN 1 ELSE 0 END) > 0 OR
      MAX(CASE WHEN la."alertType" = 'Brand' THEN 1 ELSE 0 END) > 0 OR
      MAX(CASE WHEN la."alertType" = 'JSI' THEN 1 ELSE 0 END) > 0
    ) AS "isOld",
    MAX(CASE WHEN la."alertType" = 'Title' THEN la."isDel"::int ELSE 0 END)::boolean AS "isTitleDel",
    MAX(CASE WHEN la."alertType" = 'Brand' THEN la."isDel"::int ELSE 0 END)::boolean AS "isBrandDel",
    MAX(CASE WHEN la."alertType" = 'JSI' THEN la."isDel"::int ELSE 0 END)::boolean AS "isJSIDel"
  FROM distinct_vins dv
  LEFT JOIN latest_alerts la ON dv."vin" = la."vin"
  GROUP BY dv."vin"
  ORDER BY dv."vin";
END;
$$;

-- Function to Retrieve Paginated Data
CREATE OR REPLACE FUNCTION get_vin_data_response(
  p_limit INT,
  p_offset INT,
  p_vin TEXT
)
RETURNS JSON AS
$$
DECLARE
  result JSON;
  total_count INT;
  vin_filter TEXT := '%' || p_vin || '%';
BEGIN
  -- Count total matching records
  SELECT COUNT(*) INTO total_count
  FROM "DashboardDataList"
  WHERE p_vin IS NULL OR vin ILIKE vin_filter;

  -- Build JSON result
  SELECT json_build_object(
    'currentPage', (p_offset / p_limit) + 1,
    'totalPages', CEIL(total_count::DECIMAL / p_limit),
    'totalRecords', total_count,
    'items', COALESCE(json_agg(t), '[]'::JSON)
  )
  INTO result
  FROM (
    SELECT vin, "isOld", id
    FROM "DashboardDataList"
    WHERE p_vin IS NULL OR vin ILIKE vin_filter
    ORDER BY id
    LIMIT p_limit OFFSET p_offset
  ) t;

  RETURN result;
END;
$$ LANGUAGE plpgsql;
