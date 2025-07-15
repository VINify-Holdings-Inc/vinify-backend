import { MasterBrand } from "../Entities/master_brand";
import { MasterState } from "../Entities/master_state";
import { VehicleData } from "../Entities/vehicle_data";
import { VinCreateList } from "../Entities/VinCreateList";
import { MESSAGES } from "../helpers/constants"; 
import { createResponse } from "../helpers/response"; 

export const UnreadNotificationsTopTenData = async (req: any, res: any) => {
  try {
      const limit = 11; // Set the limit for the number of records to fetch

      // Create a query builder to fetch unread vehicle notifications with joined state and brand data
      const queryBuilder = VehicleData.createQueryBuilder("vehicle")
          .select([
              "vehicle.*", // Select all vehicle fields
              "masterstate.code AS state",
              "masterstate.name AS fullstate", // Select state name from MasterState
              "masterbrand.name AS brand" // Select brand name from MasterBrand
          ])
          .leftJoin(MasterState, "masterstate", "vehicle.state = masterstate.code") // Join with MasterState based on state code
          .leftJoin(MasterBrand, "masterbrand", "vehicle.brand = masterbrand.code") // Join with MasterBrand based on brand code
          .orderBy("vehicle.isRead", "ASC") // Order by 'isRead' field to prioritize unread notifications
          .addOrderBy("vehicle.alertType", "DESC") // Order by alertType in descending order
          .addOrderBy("vehicle.createdAt", "DESC") // Order by createdAt field in descending order to get latest alerts
          .limit(limit); // Limit the result to the top 8 vehicles

      // Execute the query and get the raw vehicle data
      const vehicles = await queryBuilder.getRawMany();

      // Count the total number of records that match the filter (optional)
      const totalRecords = await VehicleData.count();

      // Create and send the response with total record count and vehicle data
      return createResponse(res, 200, MESSAGES?.DATA_FETCH_SUCCESS, {
          totalRecords, // Total count of records
          items: vehicles, // Fetched vehicle data
      });
  } catch (error: any) {
      // tslint:disable-next-line:no-console
      console.error("Error fetching unread notifications:", error);

      // Send a 500 response if an error occurs
      return createResponse(res, 500, MESSAGES?.INTERNAL_SERVER_ERROR || "Internal Server Error", [], false, true);
  }
};

export const VinListAutomateFileCreatetion = async (req: any, res: any) => {
  try {
      // Create a query to fetch distinct VIN numbers from the VinCreateList table
      const query = VinCreateList.createQueryBuilder("vehicle")
          .select("DISTINCT vehicle.vin", "vin"); // Selecting distinct VIN values

      // Check if vin query parameter exists in the request and apply filtering if present
      if (req.query.vin) {
          query.where("vehicle.vin LIKE :vin", { vin: `%${req.query.vin}%` }); // Filter VIN based on query parameter
      }

      // Execute the query and get the raw data (distinct VIN numbers)
      const data = await query.getRawMany();

      // Create and send the response with the fetched data
      return createResponse(res, 200, MESSAGES?.DATA_FETCH_SUCCESS, data);
  } catch (error: any) {
      // tslint:disable-next-line:no-console
      console.error("Error fetching vehicle data:", error);

      // Send a 500 response if an error occurs
      return createResponse(res, 500, MESSAGES?.INTERNAL_SERVER_ERROR || "Internal Server Error", [], false, true);
  }
};
