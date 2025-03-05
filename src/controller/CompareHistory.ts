import { MasterBrand } from "../Entities/master_brand";
import { MasterState } from "../Entities/master_state";
import { VehicleData } from "../Entities/vehicle_data";
import { MESSAGES } from "../helpers/constants";
import { createResponse } from "../helpers/response";
import { isChangeInThePreviousVin } from "../helpers/utils";

export const CompareHistoryTitalDetails = async (req: any, res: any) => {
  try {
    const { vin } = req.query;

    // Function to fetch current and history records
    const fetchVehicleData = async (isOld: any, alertType: any) => {
      return VehicleData.createQueryBuilder("vehicle")
        .select([
          "vehicle.*",
          "masterstate.name AS state",
          "masterbrand.name AS brand",
        ])
        .where("vehicle.isOld = :isOld", { isOld })
        .andWhere("vehicle.vin = :vin", { vin })
        .andWhere("vehicle.alertType = :alertType", { alertType })
        .leftJoin(MasterState, "masterstate", "vehicle.state = masterstate.code")
        .leftJoin(MasterBrand, "masterbrand", "vehicle.brand = masterbrand.code")
        .orderBy("vehicle.vin")
        .addOrderBy("vehicle.titleBrandDate", "DESC")
        .getRawOne();
    };

    // Fetch Title, Brand, and JSI data
    const [
      TitleCurrent,
      TitleHistory,
      BrandCurrent,
      BrandHistory,
      JSICurrent,
      JSIHistory,
    ] = await Promise.all([
      fetchVehicleData(false, "Title"),
      fetchVehicleData(true, "Title"),
      fetchVehicleData(false, "Brand"),
      fetchVehicleData(true, "Brand"),
      fetchVehicleData(false, "JSI"),
      fetchVehicleData(true, "JSI"),
    ]);

    // Compare data changes
    const [
      TitleChangeData,
      BrandChangeData,
      JSIChangeData
    ] = await Promise.all([
      isChangeInThePreviousVin(TitleCurrent, TitleHistory),
      isChangeInThePreviousVin(BrandCurrent, BrandHistory),
      isChangeInThePreviousVin(JSICurrent, JSIHistory),
    ]);

    // Return response
    return createResponse(res, 200, MESSAGES?.DATA_FETCH_SUCCESS, {
      title: { current: TitleChangeData ?? {}, history: TitleHistory ?? {} },
      brand: { current: BrandChangeData ?? {}, history: BrandHistory ?? {} },
      jsi: { current: JSIChangeData ?? {}, history: JSIHistory ?? {} },
    });
  } catch (error: any) {
    console.error(MESSAGES?.INTERNAL_SERVER_ERROR, error);
    return createResponse(res, 500, MESSAGES?.INTERNAL_SERVER_ERROR, [], false, true);
  }
};


