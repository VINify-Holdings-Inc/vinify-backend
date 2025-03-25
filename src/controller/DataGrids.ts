import { MasterBrand } from "../Entities/master_brand";
import { MasterState } from "../Entities/master_state";
import { VehicleData } from "../Entities/vehicle_data";
import { VehicleDataTemp } from "../Entities/vehicle_data_temp";
import { MESSAGES } from "../helpers/constants";
// import { correctedData } from "../helpers/DashBoardHelpers";
import { createResponse } from "../helpers/response";

export const DashboardSummaryVIN = async (req: any, res: any) => {
  try {
    const { page = 1, limit = 9, ...filters } = req.query;
    const offset = (page - 1) * limit;

    const queryBuilder = VehicleDataTemp.createQueryBuilder("vehicle")
      .select([
        "vehicle.*",
        "masterstate.name AS state",
        "masterbrand.name AS brand"
      ])
      .leftJoin(MasterState, "masterstate", "vehicle.state = masterstate.code")
      .leftJoin(MasterBrand, "masterbrand", "vehicle.brand = masterbrand.code")
      .orderBy("vehicle.titleBrandDate", "DESC")
      .addOrderBy("vehicle.vin", "ASC")
      .addOrderBy("vehicle.alertType", "DESC")
      .limit(limit)
      .offset(offset);

    Object.entries(filters).forEach(([key, value]) => {
      if (value) {
        queryBuilder.andWhere(`LOWER(vehicle."${key}") LIKE LOWER(:${key})`, { [key]: `%${value}%` });
      }
    });

    const distinctVINs = await queryBuilder.getRawMany();
    // const distinctVINs = await correctedData(items);
    const totalQueryBuilder = VehicleData.createQueryBuilder("vehicle")
      .select("COUNT(DISTINCT vehicle.vin)", "total")
      .leftJoin(MasterState, "masterstate", "vehicle.state = masterstate.code");
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
     // tslint:disable-next-line:no-console
    console.error(MESSAGES?.INTERNAL_SERVER_ERROR, error);

    return createResponse(res, 500, MESSAGES?.INTERNAL_SERVER_ERROR, [], false, true);
  }
};
export const DashboardSummaryVINUpdated = async (req: any, res: any) => {
  try {
    const { page = 1, limit = 9, ...filters } = req.query;
    const offset = (page - 1) * limit;

    const queryBuilder = VehicleDataTemp.createQueryBuilder("vehicle")
      .select([
        "vehicle.*",
        "masterstate.name AS state",
        "masterbrand.name AS brand"
      ])
      .leftJoin(MasterState, "masterstate", "vehicle.state = masterstate.code")
      .leftJoin(MasterBrand, "masterbrand", "vehicle.brand = masterbrand.code")
      .orderBy("vehicle.titleBrandDate", "DESC")
      .addOrderBy("vehicle.vin", "ASC")
      .addOrderBy("vehicle.alertType", "DESC")
      .where("vehicle.isOld = :isOld", { isOld: false })
      .limit(limit)
      .offset(offset);

    Object.entries(filters).forEach(([key, value]) => {
      if (value) {
        queryBuilder.andWhere(`LOWER(vehicle."${key}") LIKE LOWER(:${key})`, { [key]: `%${value}%` });
      }
    });

    const distinctVINs = await queryBuilder.getRawMany();
    // const distinctVINs = await correctedData(items);
    const totalQueryBuilder = VehicleData.createQueryBuilder("vehicle")
      .select("COUNT(DISTINCT vehicle.vin)", "total")
      .leftJoin(MasterState, "masterstate", "vehicle.state = masterstate.code")
      .where("vehicle.isOld = :isOld", { isOld: false });
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
     // tslint:disable-next-line:no-console
    console.error(MESSAGES?.INTERNAL_SERVER_ERROR, error);

    return createResponse(res, 500, MESSAGES?.INTERNAL_SERVER_ERROR, [], false, true);
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
      .where("vd.isOld = :isOld", { isOld: false })
      .orderBy("vd.titleBrandDate", "DESC")
      .addOrderBy("vd.alertType", "DESC")
      // .addOrderBy("vd.alertType", "DESC")
      .limit(Number(limit))
      .offset(offset);

    // Apply filters
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        if (key === "isRead") {
          // Ensure boolean comparison instead of LIKE
          queryBuilder.andWhere(`vd."${key}" = :${key}`, {
            [key]: value === "true",
          });
        } else {
          queryBuilder.andWhere(`vd."${key}" ILIKE :${key}`, {
            [key]: `%${value}%`,
          });
        }
      }
    });
    const vinRecords = await queryBuilder.getRawMany();
    // const vinRecords = await correctedData(temp);

    // Query to count total VINs
    const totalQueryBuilder = VehicleData.createQueryBuilder("vd")
      .select("COUNT(vd.vin) AS total")
      .where("vd.isOld = :isOld", { isOld: false });

    // Apply filters to total count query
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        if (key === "isRead") {
          totalQueryBuilder.andWhere(`vd."${key}" = :${key}`, {
            [key]: value === "true",
          });
        } else {
          totalQueryBuilder.andWhere(`vd."${key}" ILIKE :${key}`, {
            [key]: `%${value}%`,
          });
        }
      }
    });

    const totalResult = await totalQueryBuilder.getRawOne();
    const totalVINs = parseInt(totalResult?.total || "0", 10);
    const totalPages = Math.ceil(totalVINs / Number(limit));

    // Create response
    return createResponse(res, 200, MESSAGES?.DATA_FETCH_SUCCESS, {
      currentPage: Number(page),
      limit: Number(limit),
      totalPages,
      totalRecords: totalVINs,
      items: vinRecords,
    });
  } catch (error: any) {
    // tslint:disable-next-line:no-console
    console.error(MESSAGES?.INTERNAL_SERVER_ERROR, error);

    return createResponse(res, 500, MESSAGES?.INTERNAL_SERVER_ERROR, [], false, true);
  }
};

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
      .orderBy("vehicle.titleBrandDate", "DESC")
      .addOrderBy("vehicle.alertType", "DESC")
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

    const vehicles = await queryBuilder.getRawMany();
    // const vehicles = await correctedData(temp);
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

export const getSearchVinPop = async (req: any, res: any) => {
  try {
    const { page = 1, limit = 9, oldVin, ...filters } = req.query;
    const offset = (page - 1) * limit;

    const queryBuilder = VehicleData.createQueryBuilder("vd")
      .select([
        "vd.*",
        "masterbrand.name AS brand",
        "masterstate.name AS state"
      ])
      .leftJoin(MasterBrand, "masterbrand", "vd.brand = masterbrand.code")
      .leftJoin(MasterState, "masterstate", "vd.state = masterstate.code")
      .orderBy("vd.titleBrandDate", "DESC")
      .addOrderBy("vd.alertType", "DESC");

    // **Exact VIN Search**
    if (oldVin) {
      queryBuilder.andWhere("vd.vin = :oldVin", { oldVin });
    }

    // Apply other filters
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

    // Pagination
    const items = await queryBuilder.limit(limit).offset(offset).getRawMany();

    // Count total records
    const totalQueryBuilder = VehicleData.createQueryBuilder("vd")
      .leftJoin(MasterBrand, "masterbrand", "vd.brand = masterbrand.code")
      .leftJoin(MasterState, "masterstate", "vd.state = masterstate.code");

    if (oldVin) {
      totalQueryBuilder.andWhere("vd.vin = :oldVin", { oldVin });
    }

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

    // Get count of title changes
    const titletitleChangeCount = await VehicleData.createQueryBuilder("vehicle")
      .where("vehicle.isOld = :isOld", { isOld: false })
      .andWhere("vehicle.vin = :vin", { vin: filters.vin })
      .getCount();

    // Get latest title change date
    const lastTitleChangeRecord = await VehicleData.createQueryBuilder("vehicle")
      .where("vehicle.isOld = :isOld", { isOld: false })
      .orderBy("vehicle.titleBrandDate", "DESC")
      .addOrderBy("vehicle.alertType", "DESC")
      .select(["vehicle.titleBrandDate"])
      .getOne();

    const titletitleChangeLastUpdated = lastTitleChangeRecord?.titleBrandDate || null;

    if (items.length === 0) {
      return createResponse(
        res,
        200,
        MESSAGES?.VIN_NOT_FOUND,
        {
          page,
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
      page,
      limit,
      totalPages,
      totalItems: totalCount,
      items,
      titletitleChangeCount,
      titletitleChangeLastUpdated
    });
  } catch (error) {
     // tslint:disable-next-line:no-console
    console.error(MESSAGES?.INTERNAL_SERVER_ERROR, error);

    return createResponse(res, 500, MESSAGES?.INTERNAL_SERVER_ERROR, [], false, true);
  }
};

export const ExportPdfVINData = async (req: any, res: any) => {
  try {
    const { type = "all" } = req.query;
    const { vins = ["b664c7db-be90-4678-a88f-55cebfeeb9eb"] } = req.body;
    let data;

    if (type === "single" && vins.length > 0) {

      const queryBuilder = VehicleDataTemp.createQueryBuilder("vehicle")
      .select([
        "vehicle.*",
        "masterstate.name AS state",
        "masterbrand.name AS brand"
      ])
      .leftJoin(MasterState, "masterstate", "vehicle.state = masterstate.code")
      .leftJoin(MasterBrand, "masterbrand", "vehicle.brand = masterbrand.code")
      .orderBy("vehicle.titleBrandDate", "DESC")
      .addOrderBy("vehicle.vin", "ASC")
      .addOrderBy("vehicle.alertType", "DESC")
      .where("vehicle.id IN (:...vins)", { vins }); 

      data = await queryBuilder.getRawMany();
    // data = await correctedData(items);  
    } else if (type === "all") {
      // Fetch all data with status "Current" 
      const queryBuilder = VehicleDataTemp.createQueryBuilder("vehicle")
        .select([
          "vehicle.*",
          "masterstate.name AS state",
          "masterbrand.name AS brand"
        ])
        .leftJoin(MasterState, "masterstate", "vehicle.state = masterstate.code")
        .leftJoin(MasterBrand, "masterbrand", "vehicle.brand = masterbrand.code")
        .orderBy("vehicle.titleBrandDate", "DESC")
        .addOrderBy("vehicle.vin", "ASC")
        .addOrderBy("vehicle.alertType", "DESC");

        data = await queryBuilder.getRawMany();
      // data = await correctedData(items);

    } else if (type === "updated") {
      // Handle invalid parameters
      const queryBuilder = VehicleDataTemp.createQueryBuilder("vehicle")
      .select([
        "vehicle.*",
        "masterstate.name AS state",
        "masterbrand.name AS brand"
      ])
      .leftJoin(MasterState, "masterstate", "vehicle.state = masterstate.code")
      .leftJoin(MasterBrand, "masterbrand", "vehicle.brand = masterbrand.code")
      .orderBy("vehicle.titleBrandDate", "DESC")
      .addOrderBy("vehicle.vin", "ASC")
      .addOrderBy("vehicle.alertType", "DESC")
      .where("vehicle.isOld = :isOld", { isOld: false }); 
   data = await queryBuilder.getRawMany();
    // data = await correctedData(items);
    } 
    // Return the fetched data
    
    return createResponse(res, 200, MESSAGES?.DATA_FETCH_SUCCESS, { items: data });
  } catch (error: any) {
    // tslint:disable-next-line:no-console  
    console.error(MESSAGES?.INTERNAL_SERVER_ERROR, error);

    return createResponse(res, 500, MESSAGES?.INTERNAL_SERVER_ERROR, [], false, true);
  }
};
