import { VehicleData } from "../Entities/vehicle_data";
import { VehicleDataTemp } from "../Entities/vehicle_data_temp";
import { MESSAGES } from "../helpers/constants";
import { createResponse } from "../helpers/response";

export const UpdateSeenUpdateAlert = async (req: any, res: any) => {
  try {
    const { type = "all" } = req.query;
    const { vins = [] } = req.body;

    if (type === "all") {
      // Update all records without alias
      const updateResult = await VehicleData.createQueryBuilder()
        .update(VehicleData) // No alias here
        .set({ isRead: true })
        .execute();

        await VehicleDataTemp.createQueryBuilder()
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

          await VehicleDataTemp.createQueryBuilder()
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