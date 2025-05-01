import { DashboardDataList } from "../Entities/DashboardDataList";
import { LastFileProcess } from "../Entities/LastFileProcess";
import { MasterBrand } from "../Entities/master_brand";
import { MasterState } from "../Entities/master_state";
import { VehicleData } from "../Entities/vehicle_data"; 
import { MESSAGES } from "../helpers/constants"; 
// import { correctedData } from "../helpers/DashBoardHelpers";
import { createResponse } from "../helpers/response";

export const DashboardSummaryVIN = async (req: any, res: any) => {
  try {
    const { page = 1, limit = 9, alertType, ...filters } = req.query;
    const numericLimit = Number(limit);
    const numericPage = Number(page);
    const offset = (numericPage - 1) * numericLimit;

    const queryBuilder = DashboardDataList.createQueryBuilder("vehicle")
      .distinctOn(["vehicle.vin"])
      .select(["vehicle.*"])
      .orderBy("vehicle.vin", "ASC")
      .limit(numericLimit)
      .offset(offset);

    // Apply alertType using template literals
    if (["Title", "Brand", "JSI"].includes(alertType)) {
      queryBuilder.andWhere(`vehicle."${alertType}" = true`);
    }

    // Dynamic filters
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== "") {
        queryBuilder.andWhere(`LOWER(vehicle."${key}") LIKE LOWER(:${key})`, {
          [key]: `%${value}%`,
        });
      }
    });

    const distinctVINs = await queryBuilder.getRawMany();

    // Count total distinct VINs for pagination
    const totalQueryBuilder = DashboardDataList.createQueryBuilder("vehicle")
      .select("COUNT(DISTINCT vehicle.vin)", "total");

    if (["Title", "Brand", "JSI"].includes(alertType)) {
      totalQueryBuilder.andWhere(`vehicle."${alertType}" = true`);
    }

    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== "") {
        totalQueryBuilder.andWhere(`LOWER(vehicle."${key}") LIKE LOWER(:${key})`, {
          [key]: `%${value}%`,
        });
      }
    });

    const totalResult = await totalQueryBuilder.getRawOne();
    const totalDistinctVINs = parseInt(totalResult?.total || "0", 10);
    const totalPages = Math.ceil(totalDistinctVINs / numericLimit);

    return createResponse(res, 200, MESSAGES?.DATA_FETCH_SUCCESS, {
      currentPage: numericPage,
      totalPages,
      totalRecords: totalDistinctVINs,
      items: distinctVINs,
    });
  } catch (error: any) {
    console.error(MESSAGES?.INTERNAL_SERVER_ERROR, error);
    return createResponse(res, 500, MESSAGES?.INTERNAL_SERVER_ERROR, [], false, true);
  }
};

 
export const DashboardSummaryVINUpdated = async (req: any, res: any) => {
  try {
    const { page = 1, limit = 9, alertType, ...filters } = req.query;
    const numericLimit = Number(limit);
    const numericPage = Number(page);
    const offset = (numericPage - 1) * numericLimit;

    const queryBuilder = DashboardDataList.createQueryBuilder("vd")
      .select(["vd.*"])
      .distinctOn(["vd.vin"])
      .where("vd.isOld = :isOld", { isOld: false })
      .orderBy("vd.vin", "ASC")
      .limit(numericLimit)
      .offset(offset);

    // Use template literals for alertType condition
    if (alertType === "Title" || alertType === "Brand" || alertType === "JSI") {
      queryBuilder.andWhere(`vd."${alertType}" = true`);
    }

    // Dynamic filters with template literals
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== "") {
        queryBuilder.andWhere(`LOWER(vd."${key}") ILIKE LOWER(:${key})`, {
          [key]: `%${value}%`,
        });
      }
    });

    const distinctVINs = await queryBuilder.getRawMany();

    // Total count builder
    const totalQueryBuilder = DashboardDataList.createQueryBuilder("vd")
      .select("COUNT(DISTINCT vd.vin)", "total")
      .where("vd.isOld = :isOld", { isOld: false });

    if (alertType === "Title" || alertType === "Brand" || alertType === "JSI") {
      totalQueryBuilder.andWhere(`vd."${alertType}" = true`);
    }

    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== "") {
        totalQueryBuilder.andWhere(`LOWER(vd."${key}") ILIKE LOWER(:${key})`, {
          [key]: `%${value}%`,
        });
      }
    });

    const totalResult = await totalQueryBuilder.getRawOne();
    const totalDistinctVINs = parseInt(totalResult?.total || "0", 10);
    const totalPages = Math.ceil(totalDistinctVINs / numericLimit);

    return createResponse(res, 200, MESSAGES?.DATA_FETCH_SUCCESS, {
      currentPage: numericPage,
      limit: numericLimit,
      totalPages,
      totalRecords: totalDistinctVINs,
      items: distinctVINs,
    });
  } catch (error: any) {
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

    // Exact VIN Search using oldVin
    if (oldVin) {
      queryBuilder.andWhere("vd.vin = :oldVin", { oldVin });
    }

    // Apply filters
    Object.entries(filters).forEach(([key, value]) => {
      if (value && key !== "page" && key !== "limit") {
        if (key === "vin") {
          // Exact VIN match if key is 'vin'
          queryBuilder.andWhere(`vd.${key} = :${key}`, { [key]: value });
        } else if (key === "isRead") {
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
    const items = await queryBuilder.limit(Number(limit)).offset(Number(offset)).getRawMany();

    // Count total records
    const totalQueryBuilder = VehicleData.createQueryBuilder("vd")
      .leftJoin(MasterBrand, "masterbrand", "vd.brand = masterbrand.code")
      .leftJoin(MasterState, "masterstate", "vd.state = masterstate.code");

    if (oldVin) {
      totalQueryBuilder.andWhere("vd.vin = :oldVin", { oldVin });
    }

    Object.entries(filters).forEach(([key, value]) => {
      if (value && key !== "page" && key !== "limit") {
        if (key === "vin") {
          totalQueryBuilder.andWhere(`vd.${key} = :${key}`, { [key]: value });
        } else if (key === "isRead") {
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

    // Count of title changes
    const titletitleChangeCount = await VehicleData.createQueryBuilder("vehicle")
      .where("vehicle.isOld = :isOld", { isOld: false })
      .andWhere("vehicle.vin = :vin", { vin: filters.vin })
      .getCount();

    // Latest title change date
    const lastTitleChangeRecord: any = await LastFileProcess.find();
    const titletitleChangeLastUpdated = lastTitleChangeRecord[0]?.createdAt || null;

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

      const queryBuilder = DashboardDataList.createQueryBuilder("vehicle")
        .select(["vehicle.*",])
        .addOrderBy("vehicle.vin", "ASC") 
        .where("vehicle.id IN (:...vins)", { vins });

        data = await queryBuilder.getRawMany(); 
      // data = await correctedData(items);  
    } else if (type === "all") {
      // Fetch all data with status "Current" 
      const queryBuilder = DashboardDataList.createQueryBuilder("vehicle")
        .distinctOn(["vehicle.vin"]) // DISTINCT ON
        .select(["vehicle.*"])
        .orderBy("vehicle.vin", "ASC")  
        data = await queryBuilder.getRawMany(); 

    } else if (type === "updated") {
      // Handle invalid parameters
      const queryBuilder = DashboardDataList.createQueryBuilder("vehicle")
        .distinctOn(["vehicle.vin"]) // DISTINCT ON
        .select(["vehicle.*"])
        .orderBy("vehicle.vin", "ASC") 
        .where("vehicle.isOld = :isOld", { isOld: false });
        data = await queryBuilder.getRawMany(); 
    }
    // Return the fetched data

    return createResponse(res, 200, MESSAGES?.DATA_FETCH_SUCCESS, { items: data });
  } catch (error: any) {
    // tslint:disable-next-line:no-console  
    console.error(MESSAGES?.INTERNAL_SERVER_ERROR, error);

    return createResponse(res, 500, MESSAGES?.INTERNAL_SERVER_ERROR, [], false, true);
  }
}; 
export const NavigateSidebarFirstItem = async (req: any, res: any) => {
  try {
    const { page = 1, } = req.query;
    // Build main query with DISTINCT ON vehicle.vin
    // Try to fetch records with isOld = false first
    let queryBuilder = VehicleData.createQueryBuilder("vehicle")
      .select(["vehicle.*"])
      .where("vehicle.isOld = :isOld", { isOld: false })
      .orderBy("vehicle.titleBrandDate", "DESC") 
      .limit(8);

    let data = await queryBuilder.getRawMany();

    // If no records found, fallback to isOld = true
    if (data.length === 0) {
      queryBuilder = VehicleData.createQueryBuilder("vehicle")
        .select(["vehicle.*"])
        .where("vehicle.isOld = :isOld", { isOld: true })
        .orderBy("vehicle.titleBrandDate", "DESC") 
        .limit(8);

      data = await queryBuilder.getRawMany();
    } 

    return createResponse(res, 200, MESSAGES?.DATA_FETCH_SUCCESS, {
      currentPage: page,
      totalPages: 1,
      totalRecords: 1,
      items: data,
    });
  } catch (error: any) {
    console.error(MESSAGES?.INTERNAL_SERVER_ERROR, error);

    return createResponse(res, 500, MESSAGES?.INTERNAL_SERVER_ERROR, [], false, true);
  }
};
