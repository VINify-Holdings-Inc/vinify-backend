import { DashboardDataList } from "../Entities/DashboardDataList";
import { VehicleData } from "../Entities/vehicle_data";
import { VehicleDataTemp } from "../Entities/vehicle_data_temp";
import {
  brandChangedDataToCompareData,
  changedDataToComapreData,
  findIsDeletedItems,
  findIsDeletedItemsBrand,
  findIsDeletedItemsJSI,
  JsiChangedDataToCompareData,
  truncateTable
} from "../helpers/CompareHelpers";
import { correctedData } from "../helpers/DashBoardHelpers";
import { getLatesttitleBrandDate, sortBytitleBrandDateDesc } from "../helpers/SortCollection";
import { updateLastFileProcess } from "../helpers/UpdateLastRecord";
import { deletedExtraVinData } from "../helpers/utils";

export const insertBulkSheetData = async (title: any, brand: any, JsiContent: any) => {
  try {
    const titleData = await titleInsertData(title);
    const brandData = await BrandInsertData(brand);
    const JsiData = await JsiInsertData(JsiContent);

    const finalDataStore = [titleData, brandData, JsiData]
      .filter(arr => arr.length > 0) // Filter out empty arrays
      .flat();

    const SortedfinalDataStore = await sortBytitleBrandDateDesc(finalDataStore);
    const TempSortedfinalDataStore = await getLatesttitleBrandDate(SortedfinalDataStore);
    await truncateTable(VehicleData);
    await truncateTable(VehicleDataTemp);
    await truncateTable(DashboardDataList);
    await updateLastFileProcess();

    await VehicleData.save(SortedfinalDataStore); //
    await VehicleDataTemp.save(TempSortedfinalDataStore);
    const dasboardFinalData: any = await correctedData(TempSortedfinalDataStore);
    await DashboardDataList.save(dasboardFinalData);

    return;
  } catch (error) {
    // tslint:disable-next-line:no-console
    console.error("Error during data insertion:", error);

    return;
  }
};

export const titleInsertData = async (title: any) => {
  const vehicleTemData = await VehicleData.find({ where: { alertType: "Title" } }) || [];
  const deletedExtraVin: any = await deletedExtraVinData(title, vehicleTemData);
  const changedDataToComapre: any = await changedDataToComapreData(deletedExtraVin, title) || [];
  const isDeletedItems: any = await findIsDeletedItems(deletedExtraVin, changedDataToComapre) || [];
  const finalData = [
    ...(Array.isArray(changedDataToComapre) ? changedDataToComapre : []),
    ...(Array.isArray(isDeletedItems) ? isDeletedItems : [])
  ];

  return finalData;
};

export const BrandInsertData = async (title: any) => {
  const vehicleTemData = await VehicleData.find({ where: { alertType: "Brand" } });
  const deletedExtraVin: any = await deletedExtraVinData(title, vehicleTemData);
  const changedDataToComapre = await brandChangedDataToCompareData(deletedExtraVin, title);
  const isDeletedItems = await findIsDeletedItemsBrand(deletedExtraVin, changedDataToComapre);
  const finalData = [
    ...(Array.isArray(changedDataToComapre) ? changedDataToComapre : []),
    ...(Array.isArray(isDeletedItems) ? isDeletedItems : [])
  ];

  return finalData;
};

export const JsiInsertData = async (title: any) => {
  const vehicleTemData = await VehicleData.find({ where: { alertType: "JSI" } });
  const deletedExtraVin: any = await deletedExtraVinData(title, vehicleTemData);
  const changedDataToComapre = await JsiChangedDataToCompareData(deletedExtraVin, title);
  const isDeletedItems = await findIsDeletedItemsJSI(deletedExtraVin, changedDataToComapre);
  const finalData = [
    ...(Array.isArray(changedDataToComapre) ? changedDataToComapre : []),
    ...(Array.isArray(isDeletedItems) ? isDeletedItems : [])
  ];

  return finalData;
};