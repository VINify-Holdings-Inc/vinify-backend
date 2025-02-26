import { MasterBrand } from "../Entities/master_brand";
import { MasterState } from "../Entities/master_state";
import { VehicleData } from "../Entities/vehicle_data";
import { VinCreateList } from "../Entities/VinCreateList";
import { MESSAGES } from "../helpers/constants";
import { correctedData } from "../helpers/DashBoardHelpers";
import { createResponse } from "../helpers/response";
import { sortByTitleBrandDateDesc } from "../helpers/SortArray";


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
