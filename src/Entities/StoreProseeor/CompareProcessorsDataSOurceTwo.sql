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
    AND vdt."Lienholder" = vd."Lienholder"
    AND vdt."LienDate" = vd."LienDate"
    AND vdt."alertType" = vd."alertType"
    AND vdt."alertType" = 'Lien';
END;
$$;

DROP PROCEDURE IF EXISTS "isDel_update_compare_Lien";

CREATE OR REPLACE PROCEDURE "isDel_update_compare_Lien"()
LANGUAGE plpgsql
AS $$
BEGIN
  INSERT INTO "VinDataTemp" (
    "vin", "Lienholder", "LienDate", "alertType",
    "createdBy", "updatedBy",
    "isRead", "isOld", "isDel", "createdAt", "updatedAt"
  )
  SELECT 
    vd."vin", vd."Lienholder", vd."LienDate", vd."alertType",
    'system', 'system',
    vd."isRead", false, true, vd."createdAt", vd."updatedAt"
  FROM "VinData" vd
  WHERE vd."alertType" = 'Lien'
    AND vd."vin" IN (
      SELECT DISTINCT temp."vin" FROM "VinDataTemp" temp WHERE temp."alertType" = 'Lien'
    )
    AND NOT EXISTS (
      SELECT 1 FROM "VinDataTemp" temp
      WHERE 
        vd."vin" = temp."vin"
        AND vd."Lienholder" = temp."Lienholder"
        AND vd."LienDate" = temp."LienDate"
        AND vd."alertType" = temp."alertType"
    );
END;
$$;


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
    AND vdt."ImpoundDate" = vd."ImpoundDate"
    AND vdt."State" = vd."State"
    AND vdt."alertType" = 'Impound';
END;
$$;

DROP PROCEDURE IF EXISTS "isDel_update_compare_Impound";

CREATE OR REPLACE PROCEDURE "isDel_update_compare_Impound"()
LANGUAGE plpgsql
AS $$
BEGIN
  INSERT INTO "VinDataTemp" ("vin", "ImpoundDate", "State", "alertType", "createdBy", "updatedBy",
    "isRead", "isOld", "isDel", "createdAt", "updatedAt")
  SELECT vd."vin", vd."ImpoundDate", vd."State", vd."alertType",
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
        AND vd."ImpoundDate" = temp."ImpoundDate"
        AND vd."State" = temp."State"
        AND vd."alertType" = temp."alertType"
    );
END;
$$;


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
    AND vdt."ExportDate" = vd."ExportDate"
    AND vdt."State" = vd."State"
    AND vdt."alertType" = 'Export';
END;
$$;

DROP PROCEDURE IF EXISTS "isDel_update_compare_Export";

CREATE OR REPLACE PROCEDURE "isDel_update_compare_Export"()
LANGUAGE plpgsql
AS $$
BEGIN
  INSERT INTO "VinDataTemp" ("vin", "ExportDate", "State", "alertType", "createdBy", "updatedBy",
    "isRead", "isOld", "isDel", "createdAt", "updatedAt")
  SELECT vd."vin", vd."ExportDate", vd."State", vd."alertType",
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
        AND vd."ExportDate" = temp."ExportDate"
        AND vd."State" = temp."State"
        AND vd."alertType" = temp."alertType"
    );
END;
$$;


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
    AND vdt."ExportDate" = vd."ExportDate"
    AND vdt."State" = vd."State"
    AND vdt."alertType" = 'Export';
END;
$$;

DROP PROCEDURE IF EXISTS "isDel_update_compare_Export";

CREATE OR REPLACE PROCEDURE "isDel_update_compare_Export"()
LANGUAGE plpgsql
AS $$
BEGIN
  INSERT INTO "VinDataTemp" ("vin", "ExportDate", "State", "alertType", "createdBy", "updatedBy",
    "isRead", "isOld", "isDel", "createdAt", "updatedAt")
  SELECT vd."vin", vd."ExportDate", vd."State", vd."alertType",
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
        AND vd."ExportDate" = temp."ExportDate"
        AND vd."State" = temp."State"
        AND vd."alertType" = temp."alertType"
    );
END;
$$;

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
    AND vdt."Status" = vd."Status"
    AND vdt."LastEventDate" = vd."LastEventDate"
    AND vdt."State" = vd."State"
    AND vdt."alertType" = 'StolenSummary';
END;
$$;

DROP PROCEDURE IF EXISTS "isDel_update_compare_StolenSummary";

CREATE OR REPLACE PROCEDURE "isDel_update_compare_StolenSummary"()
LANGUAGE plpgsql
AS $$
BEGIN
  INSERT INTO "VinDataTemp" ("vin", "Status", "LastEventDate", "State", "alertType", "createdBy", "updatedBy",
    "isRead", "isOld", "isDel", "createdAt", "updatedAt")
  SELECT vd."vin", vd."Status", vd."LastEventDate", vd."State", vd."alertType",
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
        AND vd."Status" = temp."Status"
        AND vd."LastEventDate" = temp."LastEventDate"
        AND vd."State" = temp."State"
        AND vd."alertType" = temp."alertType"
    );
END;
$$;

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
    AND vdt."ItemNumber" = vd."ItemNumber"
    AND vdt."AuctionDate" = vd."AuctionDate"
    AND vdt."alertType" = 'EbayAuction';
END;
$$;

DROP PROCEDURE IF EXISTS "isDel_update_compare_EbayAuction";

CREATE OR REPLACE PROCEDURE "isDel_update_compare_EbayAuction"()
LANGUAGE plpgsql
AS $$
BEGIN
  INSERT INTO "VinDataTemp" ("vin", "ItemNumber", "AuctionDate", "alertType", "createdBy", "updatedBy",
    "isRead", "isOld", "isDel", "createdAt", "updatedAt")
  SELECT vd."vin", vd."ItemNumber", vd."AuctionDate", vd."alertType",
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
        AND vd."ItemNumber" = temp."ItemNumber"
        AND vd."AuctionDate" = temp."AuctionDate"
        AND vd."alertType" = temp."alertType"
    );
END;
$$;

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
    AND vdt."Reason" = vd."Reason"
    AND vdt."alertType" = 'Recall';
END;
$$;

DROP PROCEDURE IF EXISTS "isDel_update_compare_Recall";

CREATE OR REPLACE PROCEDURE "isDel_update_compare_Recall"()
LANGUAGE plpgsql
AS $$
BEGIN
  INSERT INTO "VinDataTemp" ("vin", "Reason", "alertType", "createdBy", "updatedBy",
    "isRead", "isOld", "isDel", "createdAt", "updatedAt")
  SELECT vd."vin", vd."Reason", vd."alertType",
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
        AND vd."Reason" = temp."Reason"
        AND vd."alertType" = temp."alertType"
    );
END;
$$;

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
    AND vdt."ExportDate" = vd."ExportDate" -- 🟡 use this for SearchDate field if added
    AND vdt."alertType" = 'CustomsInquiry';
END;
$$;

DROP PROCEDURE IF EXISTS "isDel_update_compare_CustomsInquiry";

CREATE OR REPLACE PROCEDURE "isDel_update_compare_CustomsInquiry"()
LANGUAGE plpgsql
AS $$
BEGIN
  INSERT INTO "VinDataTemp" ("vin", "ExportDate", "alertType", "createdBy", "updatedBy",
    "isRead", "isOld", "isDel", "createdAt", "updatedAt")
  SELECT vd."vin", vd."ExportDate", vd."alertType",
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
        AND vd."ExportDate" = temp."ExportDate"
        AND vd."alertType" = temp."alertType"
    );
END;
$$;


DROP PROCEDURE IF EXISTS copy_data_from_vin_data_temp;

CREATE OR REPLACE PROCEDURE copy_data_from_vin_data_temp()
LANGUAGE plpgsql
AS $$
BEGIN
  INSERT INTO "VinData" (
    "vin", "alertType",
    "Lienholder", "LienDate", "ImpoundDate", "State", "ExportDate",
    "Status", "LastEventDate", "ItemNumber", "AuctionDate", "Reason",
    "isRead", "isOld", "isDel",
    "createdAt", "updatedAt", "createdBy", "updatedBy"
  )
  SELECT
    "vin", "alertType",
    "Lienholder", "LienDate", "ImpoundDate", "State", "ExportDate",
    "Status", "LastEventDate", "ItemNumber", "AuctionDate", "Reason",
    "isRead", "isOld", "isDel",
    "createdAt", "updatedAt", "createdBy", "updatedBy"
  FROM "VinDataTemp";

  RAISE NOTICE '✅ Data copied successfully from VinDataTemp to VinData';
END;
$$;
 