import { VehicleData } from "../Entities/vehicle_data";
import { VehicleDataTemp } from "../Entities/vehicle_data_temp";
import {
  brandChangedDataToCompareData,
  brandFindDifferencesFromTempData,
  changedDataToComapreData, 
  JsiChangedDataToCompareData,
  JsiFindDifferencesFromTempData,
  truncateTable
} from "../helpers/CompareHelpers";
import { getLatesttitleBrandDate, sortBytitleBrandDateDesc } from "../helpers/SortCollection";
import { updateLastFileProcess } from "../helpers/UpdateLastRecord";

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
    await updateLastFileProcess();
    await VehicleData.save(SortedfinalDataStore);//
    await VehicleDataTemp.save(TempSortedfinalDataStore);

    return;
  } catch (error) {
    // tslint:disable-next-line:no-console
    console.error("Error during data insertion:", error);

    return;
  }
};

export const titleInsertData = async (title: any) => {
  const vehicleTemData = await VehicleData.find({ where: { alertType: "Title" } });  
  const changedDataToComapre :any= await changedDataToComapreData(vehicleTemData, title); 
  return changedDataToComapre;
};

export const BrandInsertData = async (title: any) => {
  const vehicleTemData = await VehicleData.find({ where: { alertType: "Brand" } });
  const changedDataToComapre = await brandChangedDataToCompareData(vehicleTemData, title);
  const NewData = await brandFindDifferencesFromTempData(changedDataToComapre, title);

  const newDataToInsert = NewData.length > 0 ? NewData.map((item: any) => ({
    ...item,
    isOld: false
  })) : [];
  const updatedOldData = changedDataToComapre.map((item: any) => ({
    ...item,
    isOld: true,
    createdAt: item?.createdAt,
  }));

  const finalData = [...updatedOldData, ...newDataToInsert];

  return finalData;
};

export const JsiInsertData = async (title: any) => {
  const vehicleTemData = await VehicleData.find({ where: { alertType: "JSI" } });
  const changedDataToComapre = await JsiChangedDataToCompareData(vehicleTemData, title);
  const NewData = await JsiFindDifferencesFromTempData(changedDataToComapre, title);
  const newDataToInsert = NewData.length > 0 ? NewData.map((item: any) => ({
    ...item,
    isOld: false
  })) : [];
  const updatedOldData = changedDataToComapre.map((item: any) => ({
    ...item,
    isOld: true,
    createdAt: item?.createdAt,
  }));

  const finalData = [...updatedOldData, ...newDataToInsert];

  return finalData;
};