
import { MESSAGES } from "../helpers/constants";
import { createResponse } from "../helpers/response";
import { VehicleData } from "../Entities/vehicle_data";
import { MasterState } from "../Entities/master_state";
import { MasterBrand } from "../Entities/master_brand";
import { LastFileProcess } from "../Entities/LastFileProcess"; 
import { DashboardDataList } from "../Entities/DashboardDataList";

export const getTotalKpiesData = async (req: any, res: any) => {
  try {
    const query1 = VehicleData.createQueryBuilder("vehicleData")
      .select("COUNT(DISTINCT vehicleData.vin)", "uniqueVinCount");
    const totalKpiData = await query1.getRawOne();

    const queryUpdated = VehicleData.createQueryBuilder("vehicleData")
      .select("COUNT(DISTINCT vehicleData.vin)", "uniqueVinCount")
      .where("vehicleData.isOld = :isOld", { isOld: false });

    const totalUpdatedData = await queryUpdated.getRawOne();


    const currentQueryBuilder = VehicleData.createQueryBuilder("vehicle")
      .select([
        "vehicle.*",
        "masterstate.name AS state",
        "masterbrand.name AS brand",
      ])
      .leftJoin(MasterState, "masterstate", "vehicle.state = masterstate.code")
      .leftJoin(MasterBrand, "masterbrand", "vehicle.brand = masterbrand.code")
      .orderBy("vehicle.vin")
      .addOrderBy("vehicle.isOld", "ASC")
      .limit(3);

    const RecentAlert = await currentQueryBuilder.getRawMany();

    return createResponse(
      res,
      200,
      MESSAGES?.DATA_FETCH_SUCCESS,
      {
        uniqueVinCount: totalKpiData?.uniqueVinCount,
        totalUpdatedData: totalUpdatedData?.uniqueVinCount,
        RecentAlert,
      },
      true,
      false
    );
  } catch (error) {
    // tslint:disable-next-line:no-console
    console.error(MESSAGES?.INTERNAL_SERVER_ERROR, error);

    return createResponse(
      res,
      500,
      MESSAGES?.INTERNAL_SERVER_ERROR,
      [],
      false,
      true
    );
  }
};

export const TotalUnreadAlerts = async (req: any, res: any) => {
  try {
    const totalNotificationCount = await VehicleData.createQueryBuilder("vehicle")
      .leftJoin(MasterState, "masterstate", "vehicle.state = masterstate.code")
      .leftJoin(MasterBrand, "masterbrand", "vehicle.brand = masterbrand.code")
      .where("vehicle.isRead = :isRead", { isRead: false })
      .select("COUNT(vehicle.vin)", "count") // Removed DISTINCT
      .getRawOne();

    const lastFileProcess = await LastFileProcess.createQueryBuilder("lastFileProcess")
      .select()
      .getOne();
    // Create response

    return createResponse(res, 200, MESSAGES?.DATA_FETCH_SUCCESS, {
      totalNotificationCount: totalNotificationCount?.count,
      lastUpdatedDate: lastFileProcess?.createdAt
    });
  } catch (error: any) {
    // tslint:disable-next-line:no-console
    console.error(MESSAGES?.INTERNAL_SERVER_ERROR, error);

    return createResponse(res, 500, MESSAGES?.INTERNAL_SERVER_ERROR, [], false, true);
  }
};  // ExportPdfVINDataList

export const ExportPdfVINDataList = async (req: any, res: any) => {
  try {
    const query = DashboardDataList.createQueryBuilder("vehicle")
      .select("DISTINCT vehicle.vin", "vin")
      .addSelect("vehicle.id", "id");

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