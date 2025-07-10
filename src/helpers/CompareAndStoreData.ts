import { AppDataSource } from "../DbConfig/TypeOrm";

const runProcedures = async (procedureNames: string[], label: string) => {
  const queryRunner = AppDataSource.createQueryRunner();
  await queryRunner.connect();

  try {
    await queryRunner.startTransaction();

    for (const procedureName of procedureNames) {
      await queryRunner.query(`CALL "${procedureName}"()`); // case-sensitive safe
    }

    await queryRunner.commitTransaction();
    console.log(`✅ ${label} procedures executed successfully.`);
  } catch (error) {
    await queryRunner.rollbackTransaction();
    console.error(`❌ Error in ${label}:`, error);
    throw error;
  } finally {
    await queryRunner.release();
  }
};

// ---- Compare Procedures ----
export const TitleDataCompare = async () => {
  await runProcedures(
    ["update_isOld_vehicle_data_temp_Title", "isDel_update_compare_title"],
    "TitleDataCompare"
  );
};

export const BrandDataCompare = async () => {
  await runProcedures(
    ["update_isOld_vehicle_data_temp_Brand", "isDel_update_compare_Brand"],
    "BrandDataCompare"
  );
};

export const JSIDataCompare = async () => {
  await runProcedures(
    ["update_isOld_vehicle_data_temp_jsi", "isDel_update_compare_JSI"],
    "JSIDataCompare"
  );
};

// ---- Copy Data Procedure ----
export const copyDataFromVehicleDataTemp = async () => {
  await runProcedures(
    ["copy_data_from_vehicle_data_temp"],
    "CopyDataFromVehicleDataTemp"
  );
};

// ---- Dashboard Insert Procedure ----
export const insertDashboardDataList = async () => {
  await runProcedures(
    ["insert_dashboard_data_list_data"],
    "InsertDashboardDataList"
  );
};
