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
      // Inserting title data into the database
      const titleData = await titleInsertData(title);

      // Inserting brand data into the database
      const brandData = await BrandInsertData(brand);

      // Inserting JSI content data into the database
      const JsiData = await JsiInsertData(JsiContent);

      // Combining all data arrays and filtering out empty arrays
      const finalDataStore = [titleData, brandData, JsiData]
          .filter(arr => arr.length > 0) // Filter out empty arrays
          .flat(); // Flatten the array into a single array

      // Sorting the combined data by title and brand date in descending order
      const SortedfinalDataStore = await sortBytitleBrandDateDesc(finalDataStore);

      // Retrieving the latest title and brand date data
      const TempSortedfinalDataStore = await getLatesttitleBrandDate(SortedfinalDataStore);

      // Truncating previous data in the tables
      await truncateTable(VehicleData);
      await truncateTable(VehicleDataTemp);
      await truncateTable(DashboardDataList);

      // Updating the last file process record
      await updateLastFileProcess();

      // Saving the sorted and processed data into the VehicleData table
      await VehicleData.save(SortedfinalDataStore);

      // Saving the temporary sorted data into the VehicleDataTemp table
      await VehicleDataTemp.save(TempSortedfinalDataStore);

      // Correcting the data for the dashboard
      const dasboardFinalData: any = await correctedData(TempSortedfinalDataStore);

      // Saving the corrected dashboard data into the DashboardDataList table
      await DashboardDataList.save(dasboardFinalData);

      // Return statement if all operations are successful (implicitly returns `undefined`)
      return;
  } catch (error) {
      // tslint:disable-next-line:no-console
      console.error("Error during data insertion:", error);

      // Return statement if an error occurs (implicitly returns `undefined`)
      return;
  }
};

// Function to insert title data
export const titleInsertData = async (title: any) => {
  try {
      // Fetching the vehicle data with alertType "Title"
      const vehicleTemData = await VehicleData.find({ where: { alertType: "Title" } }) || [];

      // Fetching the extra VINs that were deleted
      const deletedExtraVin: any = await deletedExtraVinData(title, vehicleTemData);

      // Fetching data to compare with changed title data
      const changedDataToComapre: any = await changedDataToComapreData(deletedExtraVin, title) || [];

      // Fetching items that are marked as deleted
      const isDeletedItems: any = await findIsDeletedItems(deletedExtraVin, changedDataToComapre) || [];

      // Combining the changed and deleted items into the final data array
      const finalData = [
          ...(Array.isArray(changedDataToComapre) ? changedDataToComapre : []),
          ...(Array.isArray(isDeletedItems) ? isDeletedItems : [])
      ];

      // Returning the final combined data
      return finalData;
  } catch (error) {
      // tslint:disable-next-line:no-console
      console.error("Error during title data insertion:", error);

      // Returning empty array in case of an error
      return [];
  }
};

// Function to insert brand data
export const BrandInsertData = async (title: any) => {
  try {
      // Fetching the vehicle data with alertType "Brand"
      const vehicleTemData = await VehicleData.find({ where: { alertType: "Brand" } });

      // Fetching the extra VINs that were deleted
      const deletedExtraVin: any = await deletedExtraVinData(title, vehicleTemData);

      // Fetching data to compare with changed brand data
      const changedDataToComapre = await brandChangedDataToCompareData(deletedExtraVin, title);

      // Fetching items that are marked as deleted for brand data
      const isDeletedItems = await findIsDeletedItemsBrand(deletedExtraVin, changedDataToComapre);

      // Combining the changed and deleted items into the final data array
      const finalData = [
          ...(Array.isArray(changedDataToComapre) ? changedDataToComapre : []),
          ...(Array.isArray(isDeletedItems) ? isDeletedItems : [])
      ];

      // Returning the final combined data
      return finalData;
  } catch (error) {
      // tslint:disable-next-line:no-console
      console.error("Error during brand data insertion:", error);

      // Returning empty array in case of an error
      return [];
  }
};

// Function to insert JSI data
export const JsiInsertData = async (title: any) => {
  try {
      // Fetching the vehicle data with alertType "JSI"
      const vehicleTemData = await VehicleData.find({ where: { alertType: "JSI" } });

      // Fetching the extra VINs that were deleted
      const deletedExtraVin: any = await deletedExtraVinData(title, vehicleTemData);

      // Fetching data to compare with changed JSI data
      const changedDataToComapre = await JsiChangedDataToCompareData(deletedExtraVin, title);

      // Fetching items that are marked as deleted for JSI data
      const isDeletedItems = await findIsDeletedItemsJSI(deletedExtraVin, changedDataToComapre);

      // Combining the changed and deleted items into the final data array   
      const finalData = [
          ...(Array.isArray(changedDataToComapre) ? changedDataToComapre : []),
          ...(Array.isArray(isDeletedItems) ? isDeletedItems : [])
      ];

      // Returning the final combined data
      return finalData;
  } catch (error) {
      // tslint:disable-next-line:no-console
      console.error("Error during JSI data insertion:", error);

      // Returning empty array in case of an error
      return [];
  }
};
