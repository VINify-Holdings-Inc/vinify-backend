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
