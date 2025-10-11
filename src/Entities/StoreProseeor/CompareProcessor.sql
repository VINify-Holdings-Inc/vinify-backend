
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
 
 -- 🧩 For Lien
DROP PROCEDURE IF EXISTS "update_isOld_vehicle_data_temp_Lien";
CREATE OR REPLACE PROCEDURE "update_isOld_vehicle_data_temp_Lien"()
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE "VinDataTemp" AS vdt
  SET 
    "isOld" = true,
    "isRead" = vd."isRead",
    "createdAt" = vd."createdAt",
    "updatedAt" = vd."updatedAt"
  FROM "VinData" AS vd
  WHERE 
    vdt."vin" = vd."vin"
    AND vdt."lienholder" = vd."lienholder"
    AND vdt."titleBrandDate" = vd."titleBrandDate"
    AND vdt."alertType" = 'Lien';
END;
$$;

DROP PROCEDURE IF EXISTS "isDel_update_compare_Lien";
CREATE OR REPLACE PROCEDURE "isDel_update_compare_Lien"()
LANGUAGE plpgsql
AS $$
BEGIN
  INSERT INTO "VinDataTemp" (
    "vin", "lienholder", "titleBrandDate", "alertType",
    "createdBy", "updatedBy",
    "isRead", "isOld", "isDel", "createdAt", "updatedAt"
  )
  SELECT 
    vd."vin", vd."lienholder", vd."titleBrandDate", vd."alertType",
    'system', 'system',
    vd."isRead", false, true, vd."createdAt", vd."updatedAt"
  FROM "VinData" vd
  WHERE vd."alertType" = 'Lien'
    AND vd."vin" IN (
      SELECT DISTINCT temp."vin" FROM "VinDataTemp" temp WHERE temp."alertType" = 'Lien'
    )
    AND NOT EXISTS (
      SELECT 1 FROM "VinDataTemp" temp
      WHERE vd."vin" = temp."vin"
        AND vd."lienholder" = temp."lienholder"
        AND vd."titleBrandDate" = temp."titleBrandDate"
        AND vd."alertType" = temp."alertType"
    );
END;
$$;


-- 🧩 For Impound
DROP PROCEDURE IF EXISTS "update_isOld_vehicle_data_temp_Impound";
CREATE OR REPLACE PROCEDURE "update_isOld_vehicle_data_temp_Impound"()
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE "VinDataTemp" AS vdt
  SET "isOld" = true, "isRead" = vd."isRead", "createdAt" = vd."createdAt", "updatedAt" = vd."updatedAt"
  FROM "VinData" AS vd
  WHERE 
    vdt."vin" = vd."vin"
    AND vdt."state" = vd."state"
    AND vdt."titleBrandDate" = vd."titleBrandDate"
    AND vdt."alertType" = 'Impound';
END;
$$;

DROP PROCEDURE IF EXISTS "isDel_update_compare_Impound";
CREATE OR REPLACE PROCEDURE "isDel_update_compare_Impound"()
LANGUAGE plpgsql
AS $$
BEGIN
  INSERT INTO "VinDataTemp" ("vin", "state", "titleBrandDate", "alertType",
    "createdBy", "updatedBy",
    "isRead", "isOld", "isDel", "createdAt", "updatedAt")
  SELECT vd."vin", vd."state", vd."titleBrandDate", vd."alertType",
    'system', 'system',
    vd."isRead", false, true, vd."createdAt", vd."updatedAt"
  FROM "VinData" vd
  WHERE vd."alertType" = 'Impound'
    AND vd."vin" IN (
      SELECT DISTINCT temp."vin" FROM "VinDataTemp" temp WHERE temp."alertType" = 'Impound'
    )
    AND NOT EXISTS (
      SELECT 1 FROM "VinDataTemp" temp
      WHERE vd."vin" = temp."vin"
        AND vd."state" = temp."state"
        AND vd."titleBrandDate" = temp."titleBrandDate"
        AND vd."alertType" = temp."alertType"
    );
END;
$$;


-- 🧩 For Export
DROP PROCEDURE IF EXISTS "update_isOld_vehicle_data_temp_Export";
CREATE OR REPLACE PROCEDURE "update_isOld_vehicle_data_temp_Export"()
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE "VinDataTemp" AS vdt
  SET "isOld" = true, "isRead" = vd."isRead", "createdAt" = vd."createdAt", "updatedAt" = vd."updatedAt"
  FROM "VinData" AS vd
  WHERE 
    vdt."vin" = vd."vin"
    AND vdt."state" = vd."state"
    AND vdt."titleBrandDate" = vd."titleBrandDate"
    AND vdt."alertType" = 'Export';
END;
$$;

DROP PROCEDURE IF EXISTS "isDel_update_compare_Export";
CREATE OR REPLACE PROCEDURE "isDel_update_compare_Export"()
LANGUAGE plpgsql
AS $$
BEGIN
  INSERT INTO "VinDataTemp" ("vin", "state", "titleBrandDate", "alertType",
    "createdBy", "updatedBy",
    "isRead", "isOld", "isDel", "createdAt", "updatedAt")
  SELECT vd."vin", vd."state", vd."titleBrandDate", vd."alertType",
    'system', 'system',
    vd."isRead", false, true, vd."createdAt", vd."updatedAt"
  FROM "VinData" vd
  WHERE vd."alertType" = 'Export'
    AND vd."vin" IN (
      SELECT DISTINCT temp."vin" FROM "VinDataTemp" temp WHERE temp."alertType" = 'Export'
    )
    AND NOT EXISTS (
      SELECT 1 FROM "VinDataTemp" temp
      WHERE vd."vin" = temp."vin"
        AND vd."state" = temp."state"
        AND vd."titleBrandDate" = temp."titleBrandDate"
        AND vd."alertType" = temp."alertType"
    );
END;
$$;


-- 🧩 For StolenSummary
DROP PROCEDURE IF EXISTS "update_isOld_vehicle_data_temp_StolenSummary";
CREATE OR REPLACE PROCEDURE "update_isOld_vehicle_data_temp_StolenSummary"()
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE "VinDataTemp" AS vdt
  SET "isOld" = true, "isRead" = vd."isRead", "createdAt" = vd."createdAt", "updatedAt" = vd."updatedAt"
  FROM "VinData" AS vd
  WHERE 
    vdt."vin" = vd."vin"
    AND vdt."status" = vd."status"
    AND vdt."state" = vd."state"
    AND vdt."titleBrandDate" = vd."titleBrandDate"
    AND vdt."alertType" = 'StolenSummary';
END;
$$;

DROP PROCEDURE IF EXISTS "isDel_update_compare_StolenSummary";
CREATE OR REPLACE PROCEDURE "isDel_update_compare_StolenSummary"()
LANGUAGE plpgsql
AS $$
BEGIN
  INSERT INTO "VinDataTemp" ("vin", "status", "state", "titleBrandDate", "alertType", "createdBy", "updatedBy",
    "isRead", "isOld", "isDel", "createdAt", "updatedAt")
  SELECT vd."vin", vd."status", vd."state", vd."titleBrandDate", vd."alertType",
    'system', 'system',
    vd."isRead", false, true, vd."createdAt", vd."updatedAt"
  FROM "VinData" vd
  WHERE vd."alertType" = 'StolenSummary'
    AND vd."vin" IN (
      SELECT DISTINCT temp."vin" FROM "VinDataTemp" temp WHERE temp."alertType" = 'StolenSummary'
    )
    AND NOT EXISTS (
      SELECT 1 FROM "VinDataTemp" temp
      WHERE vd."vin" = temp."vin"
        AND vd."status" = temp."status"
        AND vd."state" = temp."state"
        AND vd."titleBrandDate" = temp."titleBrandDate"
        AND vd."alertType" = temp."alertType"
    );
END;
$$;


-- 🧩 For EbayAuction
DROP PROCEDURE IF EXISTS "update_isOld_vehicle_data_temp_EbayAuction";
CREATE OR REPLACE PROCEDURE "update_isOld_vehicle_data_temp_EbayAuction"()
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE "VinDataTemp" AS vdt
  SET "isOld" = true, "isRead" = vd."isRead", "createdAt" = vd."createdAt", "updatedAt" = vd."updatedAt"
  FROM "VinData" AS vd
  WHERE 
    vdt."vin" = vd."vin"
    AND vdt."itemNumber" = vd."itemNumber"
    AND vdt."titleBrandDate" = vd."titleBrandDate"
    AND vdt."alertType" = 'EbayAuction';
END;
$$;

DROP PROCEDURE IF EXISTS "isDel_update_compare_EbayAuction";
CREATE OR REPLACE PROCEDURE "isDel_update_compare_EbayAuction"()
LANGUAGE plpgsql
AS $$
BEGIN
  INSERT INTO "VinDataTemp" ("vin", "itemNumber", "titleBrandDate", "alertType", "createdBy", "updatedBy",
    "isRead", "isOld", "isDel", "createdAt", "updatedAt")
  SELECT vd."vin", vd."itemNumber", vd."titleBrandDate", vd."alertType",
    'system', 'system',
    vd."isRead", false, true, vd."createdAt", vd."updatedAt"
  FROM "VinData" vd
  WHERE vd."alertType" = 'EbayAuction'
    AND vd."vin" IN (
      SELECT DISTINCT temp."vin" FROM "VinDataTemp" temp WHERE temp."alertType" = 'EbayAuction'
    )
    AND NOT EXISTS (
      SELECT 1 FROM "VinDataTemp" temp
      WHERE vd."vin" = temp."vin"
        AND vd."itemNumber" = temp."itemNumber"
        AND vd."titleBrandDate" = temp."titleBrandDate"
        AND vd."alertType" = temp."alertType"
    );
END;
$$;


-- 🧩 For Recall
DROP PROCEDURE IF EXISTS "update_isOld_vehicle_data_temp_Recall";
CREATE OR REPLACE PROCEDURE "update_isOld_vehicle_data_temp_Recall"()
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE "VinDataTemp" AS vdt
  SET "isOld" = true, "isRead" = vd."isRead", "createdAt" = vd."createdAt", "updatedAt" = vd."updatedAt"
  FROM "VinData" AS vd
  WHERE 
    vdt."vin" = vd."vin"
    AND vdt."reason" = vd."reason"
    AND vdt."alertType" = 'Recall';
END;
$$;

DROP PROCEDURE IF EXISTS "isDel_update_compare_Recall";
CREATE OR REPLACE PROCEDURE "isDel_update_compare_Recall"()
LANGUAGE plpgsql
AS $$
BEGIN
  INSERT INTO "VinDataTemp" ("vin", "reason", "alertType", "createdBy", "updatedBy",
    "isRead", "isOld", "isDel", "createdAt", "updatedAt")
  SELECT vd."vin", vd."reason", vd."alertType",
    'system', 'system',
    vd."isRead", false, true, vd."createdAt", vd."updatedAt"
  FROM "VinData" vd
  WHERE vd."alertType" = 'Recall'
    AND vd."vin" IN (
      SELECT DISTINCT temp."vin" FROM "VinDataTemp" temp WHERE temp."alertType" = 'Recall'
    )
    AND NOT EXISTS (
      SELECT 1 FROM "VinDataTemp" temp
      WHERE vd."vin" = temp."vin"
        AND vd."reason" = temp."reason"
        AND vd."alertType" = temp."alertType"
    );
END;
$$;


-- 🧩 For CustomsInquiry
DROP PROCEDURE IF EXISTS "update_isOld_vehicle_data_temp_CustomsInquiry";
CREATE OR REPLACE PROCEDURE "update_isOld_vehicle_data_temp_CustomsInquiry"()
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE "VinDataTemp" AS vdt
  SET "isOld" = true, "isRead" = vd."isRead", "createdAt" = vd."createdAt", "updatedAt" = vd."updatedAt"
  FROM "VinData" AS vd
  WHERE 
    vdt."vin" = vd."vin"
    AND vdt."titleBrandDate" = vd."titleBrandDate"
    AND vdt."alertType" = 'CustomsInquiry';
END;
$$;

DROP PROCEDURE IF EXISTS "isDel_update_compare_CustomsInquiry";
CREATE OR REPLACE PROCEDURE "isDel_update_compare_CustomsInquiry"()
LANGUAGE plpgsql
AS $$
BEGIN
  INSERT INTO "VinDataTemp" ("vin", "titleBrandDate", "alertType", "createdBy", "updatedBy",
    "isRead", "isOld", "isDel", "createdAt", "updatedAt")
  SELECT vd."vin", vd."titleBrandDate", vd."alertType",
    'system', 'system',
    vd."isRead", false, true, vd."createdAt", vd."updatedAt"
  FROM "VinData" vd
  WHERE vd."alertType" = 'CustomsInquiry'
    AND vd."vin" IN (
      SELECT DISTINCT temp."vin" FROM "VinDataTemp" temp WHERE temp."alertType" = 'CustomsInquiry'
    )
    AND NOT EXISTS (
      SELECT 1 FROM "VinDataTemp" temp
      WHERE vd."vin" = temp."vin"
        AND vd."titleBrandDate" = temp."titleBrandDate"
        AND vd."alertType" = temp."alertType"
    );
END;
$$;


-- 🧩 Final Procedure - Copy Temp to Main
DROP PROCEDURE IF EXISTS copy_data_from_vin_data_temp;
CREATE OR REPLACE PROCEDURE copy_data_from_vin_data_temp()
LANGUAGE plpgsql
AS $$
BEGIN
  INSERT INTO "VinData" (
    "vin", "alertType", "titleBrandDate",
    "lienholder", "state", "status", "itemNumber", "reason",
    "isRead", "isOld", "isDel",
    "createdAt", "updatedAt", "createdBy", "updatedBy"
  )
  SELECT
    "vin", "alertType", "titleBrandDate",
    "lienholder", "state", "status", "itemNumber", "reason",
    "isRead", "isOld", "isDel",
    "createdAt", "updatedAt", "createdBy", "updatedBy"
  FROM "VinDataTemp";

  RAISE NOTICE '✅ Data copied successfully from VinDataTemp to VinData';
END;
$$;
