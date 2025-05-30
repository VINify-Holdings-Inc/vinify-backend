import { MasterBrand } from "../Entities/master_brand";
import { MasterState } from "../Entities/master_state";
import { VehicleData } from "../Entities/vehicle_data";
import { MESSAGES } from "../helpers/constants";
import { createResponse } from "../helpers/response";
import { isChangeInThePreviousVin } from "../helpers/utils";
// import { isChangeInThePreviousVin } from "../helpers/utils";

export const CompareHistoryTitalDetails = async (req: any, res: any) => {
  try {
      // Extract the VIN from query parameters
      const { vin } = req.query;

      // Function to fetch current and historical records from VehicleData
      const fetchVehicleData = async (isOld: any, alertType: any) => {
          return VehicleData.createQueryBuilder("vehicle")
              .select([
                  "vehicle.*",
                  "masterstate.name AS state",
                  "masterbrand.name AS brand",
              ])
              .where("vehicle.isOld = :isOld", { isOld }) // Filter by old or new records
              .andWhere("vehicle.vin = :vin", { vin }) // Filter by VIN
              .andWhere("vehicle.alertType = :alertType", { alertType }) // Filter by alert type
              .leftJoin(MasterState, "masterstate", "vehicle.state = masterstate.code") // Join MasterState to get state name
              .leftJoin(MasterBrand, "masterbrand", "vehicle.brand = masterbrand.code") // Join MasterBrand to get brand name
              .orderBy("vehicle.vin") // Order by VIN
              .addOrderBy("vehicle.titleBrandDate", "DESC") // Add order by title brand date
              .getRawMany(); // Fetch the raw data
      };

      // Fetch Title, Brand, and JSI data (both current and historical)
      const [
          TitleCurrent,
          TitleHistory,
          BrandCurrent,
          BrandHistory,
          JSICurrent,
          JSIHistory,
      ] = await Promise.all([
          fetchVehicleData(false, "Title"), // Fetch current title data
          fetchVehicleData(true, "Title"), // Fetch historical title data
          fetchVehicleData(false, "Brand"), // Fetch current brand data
          fetchVehicleData(true, "Brand"), // Fetch historical brand data
          fetchVehicleData(false, "JSI"), // Fetch current JSI data
          fetchVehicleData(true, "JSI"), // Fetch historical JSI data
      ]);

      // Check if there is a change in the previous VIN for Title, Brand, and JSI
      const titlechanged = await isChangeInThePreviousVin(TitleCurrent[0], TitleHistory[0]);
      const brandchanged = await isChangeInThePreviousVin(BrandCurrent[0], BrandHistory[0]);
      const jsichanged = await isChangeInThePreviousVin(JSICurrent[0], JSIHistory[0]);

      // Modify the current data arrays to include the change status
      const TitleCurrentFinal = TitleCurrent;
      if (TitleCurrent?.length > 0) {
          TitleCurrentFinal?.shift(); // Remove the first item from the current array
          TitleCurrentFinal?.unshift(titlechanged); // Add the change status to the beginning
      }
      
      const brandCurrentFinal = BrandCurrent;
      if (BrandCurrent?.length > 0) {
          brandCurrentFinal?.shift(); // Remove the first item from the current array
          brandCurrentFinal?.unshift(brandchanged); // Add the change status to the beginning
      }
      
      const JSICurrentFinal = JSICurrent;
      if (JSICurrent?.length > 0) {
          JSICurrentFinal?.shift(); // Remove the first item from the current array
          JSICurrentFinal?.unshift(jsichanged); // Add the change status to the beginning
      }

      // Return response with the fetched data, including change statuses
      return createResponse(res, 200, MESSAGES?.DATA_FETCH_SUCCESS, {
          title: { current: TitleCurrentFinal, history: TitleHistory },
          brand: { current: brandCurrentFinal, history: BrandHistory },
          jsi: { current: JSICurrentFinal, history: JSIHistory },
      });
  } catch (error: any) {
      // tslint:disable-next-line:no-console
      console.error(MESSAGES?.INTERNAL_SERVER_ERROR, error);

      // Send a response with an internal server error if an exception occurs
      return createResponse(res, 500, MESSAGES?.INTERNAL_SERVER_ERROR, [], false, true);
  }
};
