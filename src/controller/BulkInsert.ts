
import { MESSAGES } from "../helpers/constants";
import { createResponse } from "../helpers/response";
import { VehicleData } from "../Entities/vehicle_data";
import { MasterState } from "../Entities/master_state";
import { MasterBrand } from "../Entities/master_brand";
import { correctedData } from "../helpers/DashBoardHelpers";
import { sortByTitleBrandDateDesc } from "../helpers/SortArray";

export const ExportPdfVINData = async (req: any, res: any) => {
  try {
    const { type = "all" } = req.query;
    const { vins = ["b664c7db-be90-4678-a88f-55cebfeeb9eb"] } = req.body;
    let data;
    
    if (type === "single" && vins.length > 0) {
      // Create filters for single type request
      const subQuery = VehicleData.createQueryBuilder("vd")
        .select("vd.*")
        .distinctOn(["vd.id"]) // Ensure distinct by id, not just VIN
        .orderBy("vd.id", "ASC")
        .orderBy("vd.titleBrandDate", "DESC");
    
      // Main query to get vehicle data with additional details
      const queryBuilder = VehicleData.createQueryBuilder()
        .select([
          "latest_vd.*",
          "masterstate.name AS state",
          "masterbrand.name AS brand",
        ])
        .from(`(${subQuery.getQuery()})`, "latest_vd")
        .leftJoin(MasterState, "masterstate", "latest_vd.state = masterstate.code")
        .leftJoin(MasterBrand, "masterbrand", "latest_vd.brand = masterbrand.code")
        .distinctOn(["latest_vd.vin"])
        .where("latest_vd.id IN (:...vins)", { vins }) // Apply strict filtering on ID
        .setParameters(subQuery.getParameters());
    
      const temp = await queryBuilder.getRawMany();
      const sortByTitle=await sortByTitleBrandDateDesc(temp);
      data = await correctedData(sortByTitle);
     
    } else if (type === "all") {
      // Fetch all data with status "Current" 
      const queryBuilder = VehicleData.createQueryBuilder("vehicle")
        .select([
          "vehicle.*",
          "masterstate.name AS state",
          "masterbrand.name AS brand"
        ])
        .leftJoin(MasterState, "masterstate", "vehicle.state = masterstate.code")
        .leftJoin(MasterBrand, "masterbrand", "vehicle.brand = masterbrand.code")
        .distinctOn(["vehicle.vin"])
        .orderBy("vehicle.vin", "ASC") // Ensure vin is the first ORDER BY field
        .addOrderBy("vehicle.titleBrandDate", "DESC")
        // .addOrderBy("vehicle.createdAt", "DESC")
        // .addOrderBy("vehicle.alertType", "DESC");
      const temp = await queryBuilder.getRawMany();
      const sortByTitle=await sortByTitleBrandDateDesc(temp);
      data = await correctedData(sortByTitle)

    } else if (type === "updated") {
      // Handle invalid parameters
      const subQuery = VehicleData.createQueryBuilder("vd")
        .select("vd.*")
        .distinctOn(["vd.vin"])
        .orderBy("vd.vin", "ASC")
        .addOrderBy("vd.titleBrandDate", "DESC");

      // Main query to get vehicle data with additional details
      const queryBuilder = VehicleData.createQueryBuilder()
        .select([
          "latest_vd.*",
          "masterstate.name AS state",
          "masterbrand.name AS brand",
        ])
        .from(`(${subQuery.getQuery()})`, "latest_vd")
        .leftJoin(MasterState, "masterstate", "latest_vd.state = masterstate.code")
        .leftJoin(MasterBrand, "masterbrand", "latest_vd.brand = masterbrand.code")
        .distinctOn(["latest_vd.vin"])
        .where(`latest_vd."isOld" = :isOld`, { isOld: false }) // Fix case sensitivity
        .setParameters(subQuery.getParameters())
      const temp = await queryBuilder.getRawMany();
      const sortByTitle=await sortByTitleBrandDateDesc(temp);
      data = await correctedData(sortByTitle);
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

    // Subquery to get the latest vehicle data per VIN
    const subQuery = VehicleData.createQueryBuilder("vd")
      .select("vd.*")
      .distinctOn(["vd.vin"])
      .orderBy("vd.vin", "ASC")
      .addOrderBy("vd.titleBrandDate", "DESC");

    // Main query to get vehicle data with additional details
    const queryBuilder = VehicleData.createQueryBuilder()
      .select([
        "latest_vd.*",
        "masterstate.name AS state",
        "masterbrand.name AS brand",
      ])
      .from(`(${subQuery.getQuery()})`, "latest_vd")
      .leftJoin(MasterState, "masterstate", "latest_vd.state = masterstate.code")
      .leftJoin(MasterBrand, "masterbrand", "latest_vd.brand = masterbrand.code")
      .distinctOn(["latest_vd.vin"])
      .where(`latest_vd."isOld" = :isOld`, { isOld: false }) // Fix case sensitivity
      .setParameters(subQuery.getParameters())
      .limit(Number(limit))
      .offset(offset);

    // Apply filters dynamically
    Object.entries(filters).forEach(([key, value]) => {
      if (value) {
        queryBuilder.andWhere(`LOWER(latest_vd."${key}") ILIKE LOWER(:${key})`, { [key]: `%${value}%` });
      }
    });

    const temp = await queryBuilder.getRawMany();
    const sortByTitle=await sortByTitleBrandDateDesc(temp)
    const distinctVINs = await correctedData(sortByTitle);

    // Query to count total distinct VINs
    const totalQueryBuilder = VehicleData.createQueryBuilder("vd")
      .select("COUNT(DISTINCT vd.vin)", "total")
      .where(`vd."isOld" = :isOld`, { isOld: false });

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
      .distinctOn(["vehicle.vin"])// Ensure vin is the first ORDER BY field
       .orderBy("vehicle.vin", "ASC") 
       .addOrderBy("vehicle.titleBrandDate", "DESC") 
      // .addOrderBy("vehicle.createdAt", "DESC")
      // .addOrderBy("vehicle.alertType", "DESC")
      .limit(limit)
      .offset(offset);

    Object.entries(filters).forEach(([key, value]) => {
      if (value) {
        queryBuilder.andWhere(`LOWER(vehicle."${key}") LIKE LOWER(:${key})`, { [key]: `%${value}%` });
      }
    });

    const temp = await queryBuilder.getRawMany();
    const sortByTitle=await sortByTitleBrandDateDesc(temp);
    const distinctVINs = await correctedData(sortByTitle);
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
      // .addOrderBy("vd.createdAt", "DESC")
      // .addOrderBy("vd.alertType", "DESC");
    // Apply VIN search
    if (oldVin) {
      queryBuilder.andWhere("LOWER(vd.vin) LIKE LOWER(:oldVin)", {
        oldVin: `%${oldVin}%`,
      });
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

    // Add ordering
    queryBuilder.addOrderBy("vd.titleBrandDate", "DESC");

    // Pagination
    const temp = await queryBuilder.limit(limit).offset(offset).getRawMany(); 
    const sortByTitle=await sortByTitleBrandDateDesc(temp);
    const items =  await correctedData(sortByTitle);
    // Count total records
    const totalQueryBuilder = VehicleData.createQueryBuilder("vd")
      .leftJoin(MasterBrand, "masterbrand", "vd.brand = masterbrand.code")
      .leftJoin(MasterState, "masterstate", "vd.state = masterstate.code");

    if (oldVin) {
      totalQueryBuilder.andWhere("LOWER(vd.vin) LIKE LOWER(:oldVin)", {
        oldVin: `%${oldVin}%`,
      });
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
    const queryBuilder = VehicleData.createQueryBuilder("vehicle")
      .select([
        "vehicle.*",
      ])
      .distinctOn(["vehicle.vin"])
      .orderBy("vehicle.vin", "ASC") // Ensure vin is the first ORDER BY field
      .addOrderBy("vehicle.titleBrandDate", "DESC")
      // .addOrderBy("vehicle.createdAt", "DESC")
      // .addOrderBy("vehicle.alertType", "DESC");
    let rawUpdated = await queryBuilder.getRawMany();
    // // Apply filtering correctly and store the filtered array
    const filteredData = rawUpdated?.filter((item: any) => !item.isOld);
    const totalUpdatedData = filteredData?.length;

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

    let RecentAlert = await currentQueryBuilder.getRawMany();



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
      .where("vd.isOld = :isOld", { isOld: false })
      .orderBy("vd.vin")
      .addOrderBy("vd.titleBrandDate", "DESC")
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
    const temp = await queryBuilder.getRawMany(); 
    const sortByTitle=await sortByTitleBrandDateDesc(temp); 
    const vinRecords =  await correctedData(sortByTitle);
      
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

export const TotalUnreadAlerts = async (req: any, res: any) => {
  try {
    const totalNotificationCount = await VehicleData.createQueryBuilder("vehicle")
      .leftJoin(MasterState, "masterstate", "vehicle.state = masterstate.code")
      .leftJoin(MasterBrand, "masterbrand", "vehicle.brand = masterbrand.code")
      .where("vehicle.isRead = :isRead", { isRead: false })
      .select("COUNT(vehicle.vin)", "count") // Removed DISTINCT
      .getRawOne();

    const lastUpdatedDate = await VehicleData.createQueryBuilder("vehicle")
      .orderBy("vehicle.createdAt", "DESC")
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