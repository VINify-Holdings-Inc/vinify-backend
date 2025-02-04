import { VehicleData } from "../Entities/vehicle_data";
import { VehicleDataTemp } from "../Entities/vehicle_data_temp";
import { VehicleInfo } from "../Entities/vehicle_info";
import { changedDataToComapreData, findDifferencesFromTemData, truncateTable } from "../helpers/CompareHelpers";
import { MESSAGES } from "../helpers/constants";
import { createResponse } from "../helpers/response";

export const insertBulkSheetData = async (req: any, res: any) => {
  try {
    const { sheet1, sheet2 } = req.body;
    if (!sheet1 || !Array.isArray(sheet1) || sheet1.length === 0) {
      return createResponse(res, 400, "No data provided for insertion in sheet1", [], false, true);
    }
    if (!sheet2 || !Array.isArray(sheet2) || sheet2.length === 0) {
      return createResponse(res, 400, "No data provided for insertion in sheet2", [], false, true);
    }

    const vehicleTemData = await VehicleDataTemp.find();

    const formattedSheet1 = sheet1.map(item => ({
      vin: item?.vin || null,
      titleStatus: item?.titleStatus || null,
      brand: item?.brand || null,
      insurance: item?.insurance || null,
      junkSalvage: item?.junkSalvage || null,
    }));

    const formattedSheet2 = sheet2
      .filter(item => item?.vin)
      .map(item => ({
        vin: item.vin,
        vinId: item?.vinId || null,
        status: item?.status || null,
        state: item?.state || null,
        brand: item?.brand || null,
        model: item?.model || null,
        modelYear: item?.modelYear || null,
        titleBrandDate: item?.titleBrandDate || null,
        member: item?.member || null,
      }));
      
 const changedDataToComapre=await changedDataToComapreData(vehicleTemData, formattedSheet2)
 const NewData = await findDifferencesFromTemData(changedDataToComapre, formattedSheet2);

    await truncateTable(VehicleData);
    await truncateTable(VehicleDataTemp);

    const newDataToInsert = NewData.length > 0 ? NewData.map((item: any) => ({
      vin: item?.vin || null,
      vinId: item?.vinId || null,
      status: item?.status || null,
      state: item?.state || null,
      brand: item?.brand || null,
      model: item?.model || null,
      modelYear: item?.modelYear || null,
      titleBrandDate: item?.titleBrandDate || null,
      member: item?.member || null,
      isOld: false
    })) : [];
    const updatedOldData = changedDataToComapre.map((item: any) => ({
      ...item,
      isOld: true,
      createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),  
    }));
    
    const finalData = [...updatedOldData, ...newDataToInsert];
    let result1;
    let result2;
    if (finalData.length > 0) {
      result1 = await VehicleDataTemp.save(finalData);
      await VehicleData.save(finalData);
    }

    if (formattedSheet1.length > 0) {
      result2 = await VehicleInfo.save(formattedSheet1);
    } 

    return createResponse(res, 201, MESSAGES.DATA_SAVED, { newDataToInsert,finalData,result1,result2 });
  } catch (error) {
    console.error("Error during data insertion:", error);
    return createResponse(res, 500, MESSAGES.INTERNAL_SERVER_ERROR, [], false, true);
  }
}; 
