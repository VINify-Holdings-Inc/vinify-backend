
import { MESSAGES } from "../helpers/constants";
import { createResponse } from "../helpers/response";
import { VehicleData } from "../Entities/vehicle_data";
import { MasterState } from "../Entities/master_state";
import { MasterBrand } from "../Entities/master_brand";

export const ExportPdfVINData = async (req: any, res: any) => {
  try {
    const { type = "all" } = req.query;
    const { vins = [] } = req.body;
    let data;

    if (type === "single" && vins.length > 0) {
      // Create filters for single type request
      const filters = vins.map(({ vin, titleBrandDate }: { vin: string; titleBrandDate: string }) => ({
        vin,
        titleBrandDate,
      }));

      // Build dynamic query conditions and parameters
      const conditions = filters
        .map(
          (_: any, index: number) =>
            `(vehicle.vin = :vin${index} AND vehicle.titleBrandDate = :titleBrandDate${index} AND vehicle.status = :status)`
        )
        .join(" OR ");

      const parameters = {
        ...Object.fromEntries(
          filters.flatMap(({ vin, titleBrandDate }: any, index: number) => [
            [`vin${index}`, vin],
            [`titleBrandDate${index}`, titleBrandDate],
          ])
        ),
        status: "Current",
      };

      // Fetch filtered data
      data = await VehicleData.createQueryBuilder("vehicle")
        .where(conditions, parameters)
        .select([
          "vehicle.*",                // Correct column selection for VehicleData
          "masterstate.name AS state",
          "masterstate.name AS brand" // Add state from MasterState
        ])
        .leftJoin(MasterState, "masterstate", "vehicle.state = masterstate.code")
        .leftJoin(MasterBrand, "masterbrand", "vehicle.brand = masterbrand.code")
        .orderBy("vehicle.vin")
        .distinctOn(["vehicle.vin"])
        .getRawMany();
    } else if (type === "all") {
      // Fetch all data with status "Current"
      data = await VehicleData.createQueryBuilder("vehicle")
        .where("vehicle.status = :status", { status: "Current" })
        .select([
          "vehicle.*",                // Correct column selection for VehicleData
          "masterstate.name AS state",
          "masterstate.name AS brand"  // Add state from MasterState
        ])
        .leftJoin(MasterState, "masterstate", "vehicle.state = masterstate.code")
        .leftJoin(MasterBrand, "masterbrand", "vehicle.brand = masterbrand.code")
        .orderBy("vehicle.vin")
        .distinctOn(["vehicle.vin"])
        .addOrderBy("vehicle.titleBrandDate", "DESC")
        .getRawMany();
    } else if (type === "updated") {
      // Handle invalid parameters
      data = await VehicleData.createQueryBuilder("vehicle")
        .where("vehicle.status = :status", { status: "Current" })
        .where("vehicle.isOld = :isOld", { isOld: false })
        .select([
          "vehicle.*",                // Correct column selection for VehicleData
          "masterstate.name AS state",
          "masterstate.name AS brand" // Add state from MasterState
        ])
        .leftJoin(MasterState, "masterstate", "vehicle.state = masterstate.code")
        .leftJoin(MasterBrand, "masterbrand", "vehicle.brand = masterbrand.code")
        .orderBy("vehicle.vin")
        .distinctOn(["vehicle.vin"])
        .addOrderBy("vehicle.titleBrandDate", "DESC")
        .getRawMany();
    }

    // Return the fetched data
    return createResponse(res, 200, MESSAGES?.DATA_FETCH_SUCCESS, { items: data });
  } catch (error: any) {
    // tslint:disable-next-line:no-console
    console.error(MESSAGES?.INTERNAL_SERVER_ERROR, error);

    return createResponse(res, 500, MESSAGES?.INTERNAL_SERVER_ERROR, [], false, true);
  }
};
export const DashboardSummaryVINUpdated = async (req: any, res: any) => {
  try {
    const { page = 1, limit = 9, ...filters } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    const queryBuilder = VehicleData.createQueryBuilder("vd")
      .select([
        "vd.*",
        "masterstate.name AS state",
        "masterbrand.name AS brand"
      ])
      .leftJoin(MasterState, "masterstate", "vd.state = masterstate.code")
      .leftJoin(MasterBrand, "masterbrand", "vd.brand = masterbrand.code")
      .distinctOn(["vd.vin"])
      .where("LOWER(vd.status) = LOWER(:status)", { status: "Current" })
      .andWhere("vd.isOld = :isOld", { isOld: false })
      .orderBy("vd.vin")
      .addOrderBy("vd.titleBrandDate", "DESC")
      .limit(Number(limit))
      .offset(offset);

    Object.entries(filters).forEach(([key, value]) => {
      if (value) {
        queryBuilder.andWhere(`LOWER(vd."${key}") ILIKE LOWER(:${key})`, { [key]: `%${value}%` });
      }
    });

    const distinctVINs = await queryBuilder.getRawMany();

    const totalQueryBuilder = VehicleData.createQueryBuilder("vd")
      .select("COUNT(DISTINCT vd.vin)", "total")
      .where("LOWER(vd.status) = LOWER(:status)", { status: "Current" })
      .andWhere("vd.isOld = :isOld", { isOld: false });

    Object.entries(filters).forEach(([key, value]) => {
      if (value) {
        totalQueryBuilder.andWhere(`LOWER(vd."${key}") ILIKE LOWER(:${key})`, { [key]: `%${value}%` });
      }
    });

    const totalResult = await totalQueryBuilder.getRawOne();
    const totalDistinctVINs = parseInt(totalResult?.total || "0", 10);
    const totalPages = Math.ceil(totalDistinctVINs / Number(limit));

    return createResponse(res, 200, MESSAGES?.DATA_FETCH_SUCCESS, {
      currentPage: Number(page),
      limit,
      totalPages,
      totalRecords: totalDistinctVINs,
      items: distinctVINs,
    });
  } catch (error: any) {
    console.error(MESSAGES?.INTERNAL_SERVER_ERROR, error);
    return createResponse(res, 500, MESSAGES?.INTERNAL_SERVER_ERROR, [], false, true);
  }
};

export const DashboardSummaryVIN = async (req: any, res: any) => {
  try {
    const { page = 1, limit = 9, ...filters } = req.query;
    const offset = (page - 1) * limit;

    const queryBuilder = VehicleData.createQueryBuilder("vehicle")
      .select([
        "vehicle.*",
        "masterstate.name AS state",
        "masterbrand.name AS brand"
      ])
      .leftJoin(MasterState, "masterstate", "vehicle.state = masterstate.code")
      .leftJoin(MasterBrand, "masterbrand", "vehicle.brand = masterbrand.code")
      .distinctOn(["vehicle.vin"])
      .where("LOWER(vehicle.status) = LOWER(:status)", { status: "Current" })
      .orderBy("vehicle.vin")
      .addOrderBy("vehicle.titleBrandDate", "DESC")
      .limit(limit)
      .offset(offset);

    Object.entries(filters).forEach(([key, value]) => {
      if (value) {
        queryBuilder.andWhere(`LOWER(vehicle."${key}") LIKE LOWER(:${key})`, { [key]: `%${value}%` });
      }
    });

    const distinctVINs = await queryBuilder.getRawMany();

    const totalQueryBuilder = VehicleData.createQueryBuilder("vehicle")
      .select("COUNT(DISTINCT vehicle.vin)", "total")
      .leftJoin(MasterState, "masterstate", "vehicle.state = masterstate.code")
      .where("LOWER(vehicle.status) = LOWER(:status)", { status: "Current" });

    Object.entries(filters).forEach(([key, value]) => {
      if (value) {
        totalQueryBuilder.andWhere(`LOWER(vehicle."${key}") LIKE LOWER(:${key})`, { [key]: `%${value}%` });
      }
    });

    const totalResult = await totalQueryBuilder.getRawOne();
    const totalDistinctVINs = totalResult?.total || 0;
    const totalPages = Math.ceil(totalDistinctVINs / limit);

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


export const getSearchVinPop = async (req: any, res: any) => {
  try {
    const { page = 1, limit = 9, ...filters } = req.query;
    const offset = (page - 1) * limit;
    const queryBuilder = VehicleData.createQueryBuilder("vd")
      .select([
        "vd.*",
        "masterbrand.name AS brand",
        "masterstate.name AS state"
      ])
      .leftJoin(MasterBrand, "masterbrand", "vd.brand = masterbrand.code")
      .leftJoin(MasterState, "masterstate", "vd.state = masterstate.code");

    Object.entries(filters).forEach(([key, value]) => {
      if (value && key !== "page" && key !== "limit") {
        if (key === "isRead") {
          queryBuilder.andWhere(`vd.${key} = :${key}`, {
            [key]: value === "true" ? true : value === "false" ? false : value
          });
        } else {
          queryBuilder.andWhere(`LOWER(vd.${key}) LIKE LOWER(:${key})`, {
            [key]: `%${value}%`,
          });
        }
      }
    });

    const items = await queryBuilder.limit(limit).offset(offset).getRawMany();

    const totalQueryBuilder = VehicleData.createQueryBuilder("vd")
      .leftJoin(MasterBrand, "masterbrand", "vd.brand = masterbrand.code")
      .leftJoin(MasterState, "masterstate", "vd.state = masterstate.code");

    Object.entries(filters).forEach(([key, value]) => {
      if (value && key !== "page" && key !== "limit") {
        if (key === "isRead") {
          totalQueryBuilder.andWhere(`vd.${key} = :${key}`, {
            [key]: value === "true" ? true : value === "false" ? false : value
          });
        } else {
          totalQueryBuilder.andWhere(`LOWER(vd.${key}) LIKE LOWER(:${key})`, {
            [key]: `%${value}%`,
          });
        }
      }
    });

    const totalCount = await totalQueryBuilder.getCount();
    const totalPages = Math.ceil(totalCount / limit);
    if (items?.length === 0) {
      return createResponse(
        res,
        200,
        MESSAGES?.VIN_NOT_FOUND,
        {
          page: page,
          limit,
          totalPages,
          totalItems: totalCount,
          items,
        },
        false,
        true
      );
    }

    return createResponse(res, 200, MESSAGES?.DATA_FETCH_SUCCESS, {
      page: page,
      limit,
      totalPages,
      totalItems: totalCount,
      items,
    });
  } catch (error) {
     // tslint:disable-next-line:no-console
    console.error(MESSAGES?.INTERNAL_SERVER_ERROR, error);

    return createResponse(res, 500, MESSAGES?.INTERNAL_SERVER_ERROR, [], false, true);
  }
};  
export const getTotalKpiesData = async (req: any, res: any) => {
  try {
    const query1 = VehicleData.createQueryBuilder("vehicleData")
      .select("COUNT(DISTINCT vehicleData.vin)", "uniqueVinCount");
    const totalKpiData = await query1.getRawOne();
    const queryBuilder = VehicleData.createQueryBuilder("vehicleData")
      .select([
        "vehicleData.id",
        "vehicleData.vin",
      ])
      .distinctOn(["vehicleData.vin"])
      .where("vehicleData.isOld = :isOld", { isOld: false })
      .orderBy("vehicleData.vin", "ASC")
      .addOrderBy("vehicleData.titleBrandDate", "DESC");

    const rawUpdated = await queryBuilder.getMany();
    const totalUpdatedData = rawUpdated?.length;

    const currentQueryBuilder = VehicleData.createQueryBuilder("vehicle")
      .select([
        "vehicle.*",
        "masterstate.name AS state",
        "masterbrand.name AS brand",
      ])
      .leftJoin(MasterState, "masterstate", "vehicle.state = masterstate.code")
      .leftJoin(MasterBrand, "masterbrand", "vehicle.brand = masterbrand.code")
      .orderBy("vehicle.vin")
      .where("vehicle.isOld = :isOld", { isOld: false })
      .andWhere("vehicle.isRead = :isRead", { isRead: false })
      .addOrderBy("vehicle.titleBrandDate", "DESC")
      .addOrderBy("vehicle.modelYear", "DESC")
      .limit(3);  // Limit the result to 3

    const RecentAlert = await currentQueryBuilder.getRawMany();

    return createResponse(
      res,
      200,
      MESSAGES?.DATA_FETCH_SUCCESS,
      {
        uniqueVinCount: totalKpiData?.uniqueVinCount,
        totalUpdatedData: totalUpdatedData,
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
export const NewAlertVIN = async (req: any, res: any) => {
  try {
    const { page = 1, limit = 9, ...filters } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    // Ensure the correct table name (lowercase "vehicle_data")
    const queryBuilder = VehicleData.createQueryBuilder("vd")
      .select([
        "vd.*",                   
        "masterstate.name AS state",
        "masterbrand.name AS brand"
      ])
      .leftJoin(MasterState, "masterstate", "vd.state = masterstate.code")
      .leftJoin(MasterBrand, "masterbrand", "vd.brand = masterbrand.code")
      .where("vd.status = :status", { status: "Current" })
      .andWhere("vd.isOld = :isOld", { isOld: false })
      .distinctOn(["vd.vin"])  
      .orderBy("vd.vin")
      .addOrderBy("vd.titleBrandDate", "DESC")
      .limit(Number(limit))
      .offset(offset);

    // Apply LIKE search filters
    Object.entries(filters).forEach(([key, value]) => {
      if (value) {
        queryBuilder.andWhere(`vd."${key}" ILIKE :${key}`, { [key]: `%${value}%` });
      }
    });

    const distinctVINs = await queryBuilder.getRawMany();

    // Query to count total distinct VINs
    const totalQueryBuilder = VehicleData.createQueryBuilder("vd")
      .select("COUNT(DISTINCT vd.vin) AS total")
      .where("vd.status = :status", { status: "Current" })
      .andWhere("vd.isOld = :isOld", { isOld: false });

    // Apply filters to total count query
    Object.entries(filters).forEach(([key, value]) => {
      if (value) {
        totalQueryBuilder.andWhere(`vd."${key}" ILIKE :${key}`, { [key]: `%${value}%` });
      }
    });

    const totalResult = await totalQueryBuilder.getRawOne();
    const totalDistinctVINs = parseInt(totalResult?.total || "0", 10);
    const totalPages = Math.ceil(totalDistinctVINs / Number(limit));

    // Create response
    return createResponse(res, 200, MESSAGES?.DATA_FETCH_SUCCESS, {
      currentPage: Number(page),
      limit: Number(limit),
      totalPages,
      totalRecords: totalDistinctVINs,
      items: distinctVINs,
    });
  } catch (error: any) {
    console.error(MESSAGES?.INTERNAL_SERVER_ERROR, error);
    return createResponse(res, 500, MESSAGES?.INTERNAL_SERVER_ERROR, [], false, true);
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

    const lastUpdatedDate = await VehicleData.createQueryBuilder("vehicle")
      .orderBy("vehicle.titleBrandDate", "DESC")
      .getRawOne();

    // Create response
    return createResponse(res, 200, MESSAGES?.DATA_FETCH_SUCCESS, {
      totalNotificationCount: totalNotificationCount?.count,
      lastUpdatedDate: lastUpdatedDate?.vehicle_createdAt
    });
  } catch (error: any) {
    // tslint:disable-next-line:no-console
    console.error(MESSAGES?.INTERNAL_SERVER_ERROR, error);

    return createResponse(res, 500, MESSAGES?.INTERNAL_SERVER_ERROR, [], false, true);
  }
};