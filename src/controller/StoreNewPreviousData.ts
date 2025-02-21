import { VehicleData } from "../Entities/vehicle_data"; 
import { brandChangedDataToCompareData, brandFindDifferencesFromTempData, changedDataToComapreData, findDifferencesFromTemData, JsiChangedDataToCompareData, JsiFindDifferencesFromTempData, truncateTable } from "../helpers/CompareHelpers";
 
export const insertBulkSheetData = async (title: any, brand: any, JsiContent: any) => {
  try {  
  const titleData = await titleInsertData(title); 
  const brandData = await BrandInsertData(brand); 
  const JsiData = await JsiInsertData(JsiContent); 
  
  const finalDataStore = [titleData, brandData, JsiData]
  .filter(arr => arr.length > 0) // Filter out empty arrays
  .flat();  
  
    await truncateTable(VehicleData); 
      await VehicleData.save(finalDataStore); 
      return ;
  } catch (error) {
     // tslint:disable-next-line:no-console
    console.error("Error during data insertion:", error);

    return ;
  }
}; 

export const titleInsertData = async(title: any) => {
  const vehicleTemData = await VehicleData.find({where: {alertType: "Title"}}); 
  const changedDataToComapre = await changedDataToComapreData(vehicleTemData, title);
  const NewData = await findDifferencesFromTemData(changedDataToComapre, title); 
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

export const BrandInsertData = async(title: any) => {
  const vehicleTemData = await VehicleData.find({where: {alertType: "Brand"}}); 
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

export const JsiInsertData = async(title: any) => {
  const vehicleTemData = await VehicleData.find({where: {alertType: "JSI"}}); 
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