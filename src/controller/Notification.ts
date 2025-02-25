import { MasterBrand } from "../Entities/master_brand";
import { MasterState } from "../Entities/master_state";
import { VehicleData } from "../Entities/vehicle_data";
import { VinCreateList } from "../Entities/VinCreateList";
import { MESSAGES } from "../helpers/constants";
import { correctedData } from "../helpers/DashBoardHelpers";
import { createResponse } from "../helpers/response";
import { sortByTitleBrandDateDesc } from "../helpers/SortArray";

export const UnreadNotificationsAlert = async (req: any, res: any) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 8;
    const offset = (page - 1) * limit;
    const { page: _, limit: __, ...filters } = req.query; // Exclude pagination from filters

    // Query to fetch VINs with pagination and include masterstate.name
    const queryBuilder = VehicleData.createQueryBuilder("vehicle")
      .select([
        "vehicle.*",
        "masterstate.name AS state",
        "masterbrand.name AS brand"
      ])
      .leftJoin(MasterState, "masterstate", "vehicle.state = masterstate.code")
      .leftJoin(MasterBrand, "masterbrand", "vehicle.brand = masterbrand.code")
      .orderBy("vehicle.isRead", "ASC")
      .addOrderBy("vehicle.vin", "ASC")
      .distinct(true) // Corrected distinct usage
      .limit(limit)
      .offset(offset);

    // Apply search filters
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        if (key === "isRead") {
          queryBuilder.andWhere(`vehicle.${key} = :${key}`, { [key]: value === "true" });
        } else {
          queryBuilder.andWhere(`vehicle.${key} ILIKE :${key}`, { [key]: `%${value}%` });
        }
      }
    });

    const temp = await queryBuilder.getRawMany(); 
    const sortByTitle=await sortByTitleBrandDateDesc(temp);
    const vehicles =  await correctedData(sortByTitle); 
    // Query to count total records
    const totalQueryBuilder = VehicleData.createQueryBuilder("vehicle")
      .select("COUNT(DISTINCT vehicle.id) AS total") // Corrected count query
      .leftJoin(MasterState, "masterstate", "vehicle.state = masterstate.code");

    // Apply search filters for total count
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        if (key === "isRead") {
          totalQueryBuilder.andWhere(`vehicle.${key} = :${key}`, { [key]: value === "true" });
        } else {
          totalQueryBuilder.andWhere(`vehicle.${key} ILIKE :${key}`, { [key]: `%${value}%` });
        }
      }
    });

    const totalResult = await totalQueryBuilder.getRawOne();
    const totalRecords = parseInt(totalResult?.total) || 0; // Ensure integer value

    // Calculate total pages
    const totalPages = Math.ceil(totalRecords / limit);

    // Create response
    return createResponse(res, 200, MESSAGES?.DATA_FETCH_SUCCESS, {
      currentPage: page,
      totalPages,
      totalRecords,
      items: vehicles,
    });
  } catch (error: any) {
     // tslint:disable-next-line:no-console
    console.error(MESSAGES?.INTERNAL_SERVER_ERROR, error);

    return createResponse(res, 500, MESSAGES?.INTERNAL_SERVER_ERROR, [], false, true);
  }
}; 
export const UnreadNotificationsTopTenData = async (req: any, res: any) => {
  try {
    const limit = 8;

    const queryBuilder = VehicleData.createQueryBuilder("vehicle")
      .select([
        "vehicle.*",
        "masterstate.name AS state",
        "masterbrand.name AS brand"
      ])
      .leftJoin(MasterState, "masterstate", "vehicle.state = masterstate.code")
      .leftJoin(MasterBrand, "masterbrand", "vehicle.brand = masterbrand.code")
      .orderBy("vehicle.isRead", "ASC")
      .addOrderBy("vehicle.createdAt", "DESC")
      .limit(limit); 
    const temp = await queryBuilder.getRawMany();
    const sortByTitle=await sortByTitleBrandDateDesc(temp); 
    const vehicles =  await correctedData(sortByTitle);
    // Count total vehicles with the same filters (optional)
    const totalRecords = await VehicleData.count();

    // Create response
    return createResponse(res, 200, MESSAGES?.DATA_FETCH_SUCCESS, {
      totalRecords,
      items: vehicles,
    });
  } catch (error: any) {
     // tslint:disable-next-line:no-console
    console.error("Error fetching unread notifications:", error);

    return createResponse(res, 500, MESSAGES?.INTERNAL_SERVER_ERROR || "Internal Server Error", [], false, true);
  }
};

export const VinListAutomateFileCreatetion = async (req: any, res: any) => {
  try {
    const query = VinCreateList.createQueryBuilder("vehicle")
      .select("DISTINCT vehicle.vin", "vin");

    // Check if vin query param exists and apply filtering
    if (req.query.vin) {
      query.where("vehicle.vin LIKE :vin", { vin: `%${req.query.vin}%` });
    }

    const data = await query.getRawMany();

    // Create response
    return createResponse(res, 200, MESSAGES?.DATA_FETCH_SUCCESS, data);
  } catch (error: any) {
     // tslint:disable-next-line:no-console
    console.error("Error fetching vehicle data:", error);

    return createResponse(res, 500, MESSAGES?.INTERNAL_SERVER_ERROR || "Internal Server Error", [], false, true);
  }
};
