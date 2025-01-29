import { MasterState } from "../Entities/master_state";
import { VehicleData } from "../Entities/vehicle_data";
import { MESSAGES } from "../helpers/constants";
import { createResponse } from "../helpers/response";

export const DashboardSummaryVIN = async (req: any, res: any) => {
  try {
    const { page = 1, limit = 9, ...filters } = req.query;
    const offset = (page - 1) * limit;

    // Query to fetch distinct VINs with pagination and include masterstate.name
    const queryBuilder = VehicleData.createQueryBuilder("vehicle")
      .select([
        "vehicle.*",
        "masterstate.name AS state"
      ])
      .leftJoin(MasterState, "masterstate", "vehicle.state = masterstate.code")
      .distinctOn(["vehicle.vin"])
      .where("vehicle.status = :status", { status: "Current" })
      .orderBy("vehicle.vin")
      .addOrderBy("vehicle.titleBrandDate", "DESC")
      .limit(limit)
      .offset(offset);

    // Apply exact search filters
    Object.entries(filters).forEach(([key, value]) => {
      if (value) {
        queryBuilder.andWhere(`vehicle.${key} = :${key}`, {
          [key]: value,
        });
      }
    });

    const distinctVINs = await queryBuilder.getRawMany();

    // Query to count total distinct VINs
    const totalQueryBuilder = VehicleData.createQueryBuilder("vehicle")
      .select("COUNT(DISTINCT vehicle.vin)", "total")
      .leftJoin(MasterState, "masterstate", "vehicle.state = masterstate.code")
      .where("vehicle.status = :status", { status: "Current" });

    // Apply exact search filters for total count
    Object.entries(filters).forEach(([key, value]) => {
      if (value) {
        totalQueryBuilder.andWhere(`vehicle.${key} = :${key}`, {
          [key]: value,
        });
      }
    });

    const totalResult = await totalQueryBuilder.getRawOne();
    const totalDistinctVINs = totalResult?.total || 0;

    // Calculate total pages
    const totalPages = Math.ceil(totalDistinctVINs / limit);

    // Create response
    return createResponse(res, 200, MESSAGES?.DATA_FETCH_SUCCESS, {
      currentPage: page,
      totalPages,
      totalRecords: totalDistinctVINs,
      items: distinctVINs,
    });
  } catch (error: any) {
    console.error(MESSAGES?.INTERNAL_SERVER_ERROR, error);

    return createResponse(res, 500, MESSAGES?.INTERNAL_SERVER_ERROR, [], false, true);
  }
};