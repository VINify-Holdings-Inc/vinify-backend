import { MasterBrand } from "../Entities/master_brand";
import { MasterState } from "../Entities/master_state";
import { VehicleData } from "../Entities/vehicle_data";
import { MESSAGES } from "../helpers/constants";
import { createResponse } from "../helpers/response";
import { isChangeInThePreviousVin } from "../helpers/utils";

export const CompareHistoryTitalDetails = async (req: any, res: any) => {
    try {
      const { ...filters } = req.query;
  
      // Query to fetch current data where isOld = false
      const currentQueryBuilder = VehicleData.createQueryBuilder("vehicle")
        .select([
          "vehicle.*",
          "masterstate.name AS state",
          "masterbrand.name AS brand",
        ])
        .where("vehicle.isOld = :isOld", { isOld: false })
        .leftJoin(MasterState, "masterstate", "vehicle.state = masterstate.code")
        .leftJoin(MasterBrand, "masterbrand", "vehicle.brand = masterbrand.code") 
        .orderBy("vehicle.vin")
        .addOrderBy("vehicle.titleBrandDate", "DESC");
  
      // Apply exact search filters to current data query
      Object.entries(filters).forEach(([key, value]) => {
        if (value) {
          currentQueryBuilder.andWhere(`vehicle.${key} = :${key}`, {
            [key]: value,
          });
        }
      });
  
      const currentData = await currentQueryBuilder.getRawMany();
  
      // Query to count total VINs for current data
      const totalCurrentQueryBuilder = VehicleData.createQueryBuilder("vehicle")
      .where("vehicle.isOld = :isOld", { isOld: false })
        .select("COUNT(vehicle.vin)", "total")
        .leftJoin(MasterState, "masterstate", "vehicle.state = masterstate.code") ;
  
      Object.entries(filters).forEach(([key, value]) => {
        if (value) {
          totalCurrentQueryBuilder.andWhere(`vehicle.${key} = :${key}`, {
            [key]: value,
          });
        }
      });
  
      const totalCurrentResult = await totalCurrentQueryBuilder.getRawOne();
      const totalCurrentRecords = totalCurrentResult?.total || 0;
  
      // Query to fetch history data where isOld = true
      const historyQueryBuilder = VehicleData.createQueryBuilder("vehicle")
        .select([
          "vehicle.*",
          "masterstate.name AS state",
          "masterbrand.name AS brand",
        ])
        .leftJoin(MasterState, "masterstate", "vehicle.state = masterstate.code")
        .leftJoin(MasterBrand, "masterbrand", "vehicle.brand = masterbrand.code")
        .where("vehicle.isOld = :isOld", { isOld: true })
        .orderBy("vehicle.vin")
        .addOrderBy("vehicle.titleBrandDate", "DESC");
  
      // Apply exact search filters to history data query
      Object.entries(filters).forEach(([key, value]) => {
        if (value) {
          historyQueryBuilder.andWhere(`vehicle.${key} = :${key}`, {
            [key]: value,
          });
        }
      });
  
      const historyData = await historyQueryBuilder.getRawMany();
  
      // Query to count total VINs for history data
      const totalHistoryQueryBuilder = VehicleData.createQueryBuilder("vehicle")
        .select("COUNT(vehicle.vin)", "total")
        .leftJoin(MasterState, "masterstate", "vehicle.state = masterstate.code")
        .where("vehicle.isOld = :isOld", { isOld: true });
  
      Object.entries(filters).forEach(([key, value]) => {
        if (value) {
          totalHistoryQueryBuilder.andWhere(`vehicle.${key} = :${key}`, {
            [key]: value,
          });
        }
      });
  
      const totalHistoryResult = await totalHistoryQueryBuilder.getRawOne();
      const totalHistoryRecords = totalHistoryResult?.total || 0; 
      const changeData = await isChangeInThePreviousVin(currentData[0], historyData[0]); 
      if (currentData?.length > 0) {
        currentData.shift();
      currentData.unshift(changeData);
      }

      // Create response with current and history data
      return createResponse(res, 200, MESSAGES?.DATA_FETCH_SUCCESS, {
        current: { 
          totalRecords: totalCurrentRecords,
          items: currentData,
        },
        history: {
          totalRecords: totalHistoryRecords,
          items: historyData,
        },
      });
    } catch (error: any) {
        // tslint:disable-next-line:no-console
      console.error(MESSAGES?.INTERNAL_SERVER_ERROR, error);
  
      return createResponse(res, 500, MESSAGES?.INTERNAL_SERVER_ERROR, [], false, true);
    }
  }; 
  export const SeenUpdateAlert = async (req: any, res: any) => {
    try {
      const { type = "all" } = req.query;
      const { vins = [] } = req.body;
  
      if (type === "all") {
        // Update all records without alias
        const updateResult = await VehicleData.createQueryBuilder()
          .update(VehicleData) // No alias here
          .set({ isRead: true })
          .execute();
  
        // Get count of unread notifications with alias
        const totalNotificationCount = await VehicleData.createQueryBuilder("vehicle")
          .where("vehicle.isRead = :isRead", { isRead: false })
          .getCount();
  
        return createResponse(
          res,
          200,
          MESSAGES?.DATA_FETCH_SUCCESS,
          { updated: updateResult?.affected, totalNotificationCount },
          true,
          false
        );
      } else if (type === "specific" && vins?.length > 0) {
        // Update specific records based on VINs array without alias
        const updateResult = await VehicleData.createQueryBuilder()
          .update(VehicleData) // No alias here
          .set({ isRead: true })
          .where("id IN (:...ids)", { ids: vins }) // Corrected reference
          .execute();
  
        // Get count of unread notifications with alias
        const totalNotificationCount = await VehicleData.createQueryBuilder("vehicle")
          .where("vehicle.isRead = :isRead", { isRead: false })
          .getCount();
  
        if (updateResult.affected === 0) {
          return createResponse(
            res,
            404,
            MESSAGES?.NOT_UPDATED,
            { updated: false, totalNotificationCount },
            false,
            true
          );
        }
  
        return createResponse(
          res,
          200,
          MESSAGES?.DATA_FETCH_SUCCESS,
          { updated: true, totalNotificationCount }
        );
      } else {
        return createResponse(res, 400, MESSAGES?.NOT_UPDATED, [], false, true);
      }
    } catch (error) {
       // tslint:disable-next-line:no-console
      console.error(MESSAGES?.INTERNAL_SERVER_ERROR, error);

      return createResponse(res, 500, MESSAGES?.INTERNAL_SERVER_ERROR, [], false, true);
    }
  };
  