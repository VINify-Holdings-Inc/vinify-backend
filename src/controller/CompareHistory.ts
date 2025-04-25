import { MasterBrand } from "../Entities/master_brand";
import { MasterState } from "../Entities/master_state";
import { VehicleData } from "../Entities/vehicle_data";
import { MESSAGES } from "../helpers/constants";
import { createResponse } from "../helpers/response";
import { isChangeInThePreviousVin } from "../helpers/utils";
// import { isChangeInThePreviousVin } from "../helpers/utils";

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
        .getRawMany();
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

    const titlechanged = await isChangeInThePreviousVin(TitleCurrent[0], TitleHistory[0])
    const brandchanged = await isChangeInThePreviousVin(BrandCurrent[0], BrandHistory[0])
    const jsichanged = await isChangeInThePreviousVin(JSICurrent[0], JSIHistory[0])

    let TitleCurrentFinal = TitleCurrent;
    if (TitleCurrent?.length > 0) {
      TitleCurrentFinal?.shift()
      TitleCurrentFinal?.unshift(titlechanged)
    }
    let brandCurrentFinal = BrandCurrent;
    if (BrandCurrent?.length > 0) {
      brandCurrentFinal?.shift()
      brandCurrentFinal?.unshift(brandchanged)
    }
    let JSICurrentFinal = JSICurrent;
    if (JSICurrent?.length > 0) {
      JSICurrentFinal?.shift()
      JSICurrentFinal?.unshift(jsichanged)
    }
    // Return response
    return createResponse(res, 200, MESSAGES?.DATA_FETCH_SUCCESS, {
      title: { current: TitleCurrentFinal, history: TitleHistory },
      brand: { current: brandCurrentFinal, history: BrandHistory },
      jsi: { current: JSICurrentFinal, history: JSIHistory },
    });
  } catch (error: any) {
    // tslint:disable-next-line:no-console
    console.error(MESSAGES?.INTERNAL_SERVER_ERROR, error);

    return createResponse(res, 500, MESSAGES?.INTERNAL_SERVER_ERROR, [], false, true);
  }
};
