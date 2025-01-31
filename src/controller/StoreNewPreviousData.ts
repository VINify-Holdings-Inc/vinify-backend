import { VehicleData } from "../Entities/vehicle_data"; 
import { changedDataToComapreData, findDifferencesFromTemData, formatSheetData, truncateTable } from "../helpers/CompareHelpers";
import { MESSAGES } from "../helpers/constants";
import { createResponse } from "../helpers/response";

export const insertBulkSheetData = async (req: any, res: any) => {
  try {
    const {  sheet2 } = req.body; 
    if (!sheet2 || !Array.isArray(sheet2) || sheet2.length === 0) {
      return createResponse(res, 400, "No data provided for Compare", [], false, true);
    } 
 const formattedSheet2=await formatSheetData(sheet2)
 const VehicleDataToUse = await VehicleData.find(); 
 const changedDataToComapre=await changedDataToComapreData(VehicleDataToUse, formattedSheet2)
 const NewData = await findDifferencesFromTemData(changedDataToComapre, formattedSheet2); 

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
    const updatedOldData =changedDataToComapre.length > 0 ?  changedDataToComapre?.map((item:any) => ({
      ...item,
      isOld: true
    })): [] ; 
    const finalData = [...updatedOldData, ...newDataToInsert];
    
    if (finalData.length > 0) { 
      await truncateTable(VehicleData); 
      await VehicleData.save(finalData);
      return createResponse(res, 201, MESSAGES.DATA_SAVED, { newDataToInsert,updatedOldData,finalData });
    } 
   
  } catch (error) {
    console.error("Error during data insertion:", error);
    return createResponse(res, 500, MESSAGES.INTERNAL_SERVER_ERROR, [], false, true);
  }
}; 

//     TRUNCATE TABLE public."VehicleData" RESTART IDENTITY CASCADE;