import { VehicleInfo } from "../Entities/vehicle_info";
import { MESSAGES } from "../helpers/constants";
import { createResponse } from "../helpers/response";
import { VehicleData } from "../Entities/vehicle_data";
import { findDifferencesFromTemData, truncateTable } from "../helpers/Compare";
import { VehicleDataTemp } from "../Entities/vehicle_data_temp";
import { MasterState } from "../Entities/master_state";
import { MasterBrand } from "../Entities/master_brand";
export const insertBulkSheetData = async (req: any, res: any) => {
  try {
    const { sheet1, sheet2 } = req.body;
    if (!sheet1 || !Array.isArray(sheet1) || sheet1.length === 0) {
      return createResponse(res, 400, "No data provided for insertion in sheet1", [], false, true);
    }
    if (!sheet2 || !Array.isArray(sheet2) || sheet2.length === 0) {
      return createResponse(res, 400, "No data provided for insertion in sheet2", [], false, true);
    }

    const vehicleTemData = await VehicleDataTemp.find();

    const formattedSheet1 = sheet1.map(item => ({
      vin: item?.vin || null,
      titleStatus: item?.titleStatus || null,
      brand: item?.brand || null,
      insurance: item?.insurance || null,
      junkSalvage: item?.junkSalvage || null,
    }));

    const formattedSheet2 = sheet2
      .filter(item => item?.vin)
      .map(item => ({
        vin: item.vin,
        vinId: item?.vinId || null,
        status: item?.status || null,
        state: item?.state || null,
        brand: item?.brand || null,
        model: item?.model || null,
        modelYear: item?.modelYear || null,
        titleBrandDate: item?.titleBrandDate || null,
        member: item?.member || null,
      }));

    const NewData = await findDifferencesFromTemData(vehicleTemData, formattedSheet2);

    await truncateTable(VehicleData);
    await truncateTable(VehicleDataTemp);

    const newDataToInsert = NewData.length > 0 ? NewData.map((item: any) => ({
      vin: item?.vin || null,
      vinId: item?.vinId || null,
      status: item?.status || null,
      state: item?.state || null,
      brand: item?.brand || null,
      model: item?.model || null,
      modelYear: item?.modelYear || null,
      titleBrandDate: item?.titleBrandDate || null,
      member: item?.member || null,
      isOld: false
    })) : [];
    const updatedOldData = vehicleTemData.map(item => ({
      ...item,
      isOld: true
    }));
    const finalData = [...updatedOldData, ...newDataToInsert];
    let result1;
    let result2;
    if (finalData.length > 0) {
      result1 = await VehicleDataTemp.save(finalData);
      await VehicleData.save(finalData);
    }

    if (formattedSheet1.length > 0) {
      result2 = await VehicleInfo.save(formattedSheet1);
    }
console.log(result2);

    return createResponse(res, 201, MESSAGES.DATA_SAVED, { newDataToInsert,finalData,result1 });
  } catch (error) {
    console.error("Error during data insertion:", error);
    return createResponse(res, 500, MESSAGES.INTERNAL_SERVER_ERROR, [], false, true);
  }
};

export const getBulkSheetData = async (req: any, res: any) => {
  try {
    const { page = 1, limit = 10, ...filters } = req.query;
    const queryBuilder = VehicleInfo.createQueryBuilder("VehicleInfo");
    Object.entries(filters).forEach(([key, value]) => {
      if (value && key !== "page" && key !== "limit") {
        queryBuilder.andWhere(`LOWER(VehicleInfo.${key}) LIKE LOWER(:${key})`, {
          [key]: `%${value}%`
        });
      }
    });

    const offset = (parseInt(page as string) - 1) * parseInt(limit as string);
    const [items, totalItems] = await queryBuilder
      .skip(offset)
      .take(parseInt(limit as string))
      .getManyAndCount();

    const totalPages = Math.ceil(totalItems / parseInt(limit as string));

    return createResponse(res, 200, MESSAGES?.DATA_FETCH_SUCCESS, {
      currentPage: parseInt(page as string),
      totalPages,
      totalItems,
      items,
    }, true, false);

  } catch (error: any) {
    // tslint:disable-next-line:no-console
    console.error(MESSAGES?.INTERNAL_SERVER_ERROR, error);

    return createResponse(res, 500, MESSAGES?.INTERNAL_SERVER_ERROR, [], false, true);
  }
};
export const insertBulkSheetDatSheet2 = async (req: any, res: any) => {
  try {
    const { sheet1, shhet2 } = req.body;
    if (!sheet1 || !Array.isArray(sheet1) || sheet1.length === 0) {

      return createResponse(res, 400, "No data provided for insertion sheet1", [], false, true);
    }

    if (!shhet2 || !Array.isArray(shhet2) || shhet2.length === 0) {

      return createResponse(res, 400, "No data provided for insertion sheet2", [], false, true);
    }

    const result = await VehicleData.insert(sheet1);
    const result2 = await VehicleInfo.insert(sheet1);

    return createResponse(res, 201, MESSAGES?.CONTACT_SAVED, { result2, result });
  } catch (error) {
    // tslint:disable-next-line:no-console
    console.error(MESSAGES?.INTERNAL_SERVER_ERROR, error);

    return createResponse(res, 500, MESSAGES?.INTERNAL_SERVER_ERROR, [], false, true);
  }
};
export const getBulkSheetDataSheet2 = async (req: any, res: any) => {
  try {
    const { page = 1, limit = 10, ...filters } = req.query;
    const queryBuilder = VehicleData.createQueryBuilder("VehicleData");
    Object.entries(filters).forEach(([key, value]) => {
      if (value && key !== "page" && key !== "limit") {
        queryBuilder.andWhere(`LOWER(VehicleData.${key}) LIKE LOWER(:${key})`, {
          [key]: `%${value}%`
        });
      }
    });

    const offset = (parseInt(page as string) - 1) * parseInt(limit as string);
    const [items, totalItems] = await queryBuilder.skip(offset).take(parseInt(limit as string)).getManyAndCount();
    const totalPages = Math.ceil(totalItems / parseInt(limit as string));

    return createResponse(res, 200, MESSAGES?.DATA_FETCH_SUCCESS, {
      currentPage: parseInt(page as string),
      totalPages,
      totalItems,
      items,
    }, true, false);

  } catch (error: any) {
    // tslint:disable-next-line:no-console
    console.error(MESSAGES?.INTERNAL_SERVER_ERROR, error);

    return createResponse(res, 500, MESSAGES?.INTERNAL_SERVER_ERROR, [], false, true);
  }
}; 
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
          "masterstate.name AS state"  // Add state from MasterState
        ])
        .leftJoin(MasterState, "masterstate", "vehicle.state = masterstate.code")
        .orderBy("vehicle.vin")
        .distinctOn(["vehicle.vin"])
        .getRawMany();
    } else if (type === "all") {
      // Fetch all data with status "Current"
      data = await VehicleData.createQueryBuilder("vehicle")
        .where("vehicle.status = :status", { status: "Current" })
        .select([
          "vehicle.*",                // Correct column selection for VehicleData
          "masterstate.name AS state"  // Add state from MasterState
        ])
        .leftJoin(MasterState, "masterstate", "vehicle.state = masterstate.code")
        .orderBy("vehicle.vin")
        .distinctOn(["vehicle.vin"])
        .addOrderBy("vehicle.titleBrandDate", "DESC")
        .getRawMany();
    } else if(type === "updated") {
      // Handle invalid parameters
      data = await VehicleData.createQueryBuilder("vehicle")
        .where("vehicle.status = :status", { status: "Current" })
        .where("vehicle.isOld = :isOld", { isOld: false })
        .select([
          "vehicle.*",                // Correct column selection for VehicleData
          "masterstate.name AS state"  // Add state from MasterState
        ])
        .leftJoin(MasterState, "masterstate", "vehicle.state = masterstate.code")
        .orderBy("vehicle.vin")
        .distinctOn(["vehicle.vin"])
        .addOrderBy("vehicle.titleBrandDate", "DESC")
        .getRawMany();
    }

    // Return the fetched data
    return createResponse(res, 200, MESSAGES?.DATA_FETCH_SUCCESS, { items: data });
  } catch (error: any) {
    console.error(MESSAGES?.INTERNAL_SERVER_ERROR, error);
    return createResponse(res, 500, MESSAGES?.INTERNAL_SERVER_ERROR, [], false, true);
  }
};
export const DashboardSummaryVINUpdated = async (req: any, res: any) => {
  try {
    const { page = 1, limit = 9, ...filters } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    // Ensure the correct table name (lowercase "vehicle_data")
    const queryBuilder = VehicleData.createQueryBuilder("vd")
      .select([
        "vd.*",                // Correct column selection for VehicleData
        "masterstate.name AS state"  // Add state from MasterState
      ])
      .leftJoin(MasterState, "masterstate", "vd.state = masterstate.code")  // Correct the join condition
      .distinctOn(["vd.vin"])  // Only use distinctOn once, with "vd.vin"
      .where("vd.status = :status", { status: "Current" })
      .andWhere("vd.isOld = :isOld", { isOld: false })
      .orderBy("vd.vin")
      .addOrderBy("vd.titleBrandDate", "DESC")
      .limit(Number(limit))
      .offset(offset);

    // Apply exact search filters
    Object.entries(filters).forEach(([key, value]) => {
      if (value) {
        queryBuilder.andWhere(`vd."${key}" = :${key}`, { [key]: value });
      }
    });

    const distinctVINs = await queryBuilder.getRawMany();

    // Query to count total distinct VINs
    const totalQueryBuilder = VehicleData.createQueryBuilder("vd")
      .select("COUNT(*)", "total")
      .where("vd.status = :status", { status: "Current" })
      .andWhere("vd.isOld = :isOld", { isOld: false });  // Fixed isOld condition to match the main query

    // Apply filters to total count query
    Object.entries(filters).forEach(([key, value]) => {
      if (value) {
        totalQueryBuilder.andWhere(`vd."${key}" = :${key}`, { [key]: value });
      }
    });

    const totalResult = await totalQueryBuilder.getRawOne();
    const totalDistinctVINs = parseInt(totalResult?.total || "0", 10);
    const totalPages = Math.ceil(totalDistinctVINs / Number(limit));

    // Create response
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
export const getSearchVinPop = async (req: any, res: any) => {
  try {
    // Parse page and limit from query and set default values if they are not provided
    const { page = 1, limit = 9, ...filters } = req.query;
    const offset = (page - 1) * limit; // Ensure limit is a number

    // Define the base query builder
    const queryBuilder = VehicleData.createQueryBuilder("vd")  // Use alias "vd" for VehicleData
      .select([
        "vd.*",
        "masterbrand.name AS brand",
        "masterstate.name AS state"
      ])
      .leftJoin(MasterBrand, "masterbrand", "vd.brand = masterbrand.code")  // Fix the alias for VehicleData in the join
      .leftJoin(MasterState, "masterstate", "vd.state = masterstate.code");  // Corrected alias here

    // Apply filters for specific fields (exact or partial match)
    Object.entries(filters).forEach(([key, value]) => {
      if (value && key !== "page" && key !== "limit") {
        // Check if the key requires exact matching
        if (["vin", "titleBrandDate"].includes(key)) {
          queryBuilder.andWhere(`vd.${key} = :${key}`, { [key]: value });  // Use "vd" as the alias
        } else {
          // Apply partial match for other fields
          queryBuilder.andWhere(`LOWER(vd.${key}) LIKE LOWER(:${key})`, {
            [key]: `%${value}%`,
          });
        }
      }
    });

    // Fetch filtered items with pagination
    const items = await queryBuilder
      .limit(limit)
      .offset(offset)
      .getRawMany();

    // Fetch total count of records matching the filters (this is important for pagination)
    const totalQueryBuilder = VehicleData.createQueryBuilder("vd")
      .leftJoin(MasterBrand, "masterbrand", "vd.brand = masterbrand.code")
      .leftJoin(MasterState, "masterstate", "vd.state = masterstate.code");

    // Apply filters to total count query
    Object.entries(filters).forEach(([key, value]) => {
      if (value && key !== "page" && key !== "limit") {
        if (["vin", "titleBrandDate"].includes(key)) {
          totalQueryBuilder.andWhere(`vd.${key} = :${key}`, { [key]: value });
        } else {
          totalQueryBuilder.andWhere(`LOWER(vd.${key}) LIKE LOWER(:${key})`, {
            [key]: `%${value}%`,
          });
        }
      }
    });

    // This will fetch the count of records that match the filters
    const totalCount = await totalQueryBuilder.getCount();

    // Calculate total pages
    const totalPages = Math.ceil(totalCount / limit);
    if (items?.length == 0) {
      return createResponse(res, 200, MESSAGES?.VIN_NOT_FOUND, {
        page: page,
        limit,
        totalPages,
        totalItems: totalCount,
        items,
      }, false, true)
    }
    // Create response
    return createResponse(res, 200, MESSAGES?.DATA_FETCH_SUCCESS, {
      page: page,
      limit,
      totalPages,
      totalItems: totalCount,
      items,
    });

  } catch (error) {
    console.error(MESSAGES?.INTERNAL_SERVER_ERROR, error);
    return createResponse(res, 500, MESSAGES?.INTERNAL_SERVER_ERROR, [], false, true);
  }
}; 
export const getTotalKpiesData = async (req: any, res: any) => {
  try {
    // total vins
    const query1 = VehicleData.createQueryBuilder("vehicleData")
      .select("COUNT(DISTINCT vehicleData.vin)", "uniqueVinCount");
    const totalKpiData = await query1.getRawOne();
    // total updated
    const queryBuilder = VehicleData.createQueryBuilder("vehicleData")
    .select("vehicleData.vin")  // Select the VIN to apply distinct
    .distinct(true)
    .where("vehicleData.isOld = :isOld", { isOld: false })
    .orderBy("vehicleData.vin", "ASC")
    .addOrderBy("vehicleData.titleBrandDate", "DESC");
    const totalUpdatedData = await queryBuilder.getCount(); 

   // 3 top most vin data
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
    .andWhere("vehicle.isRead = :isRead", { isRead: true })  // Use andWhere instead of chaining where again
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
        totalUpdatedData: totalUpdatedData , 
        RecentAlert, 
      },
      true,
      false
    );
  } catch (error) {
    // Log the error
    console.error(MESSAGES?.INTERNAL_SERVER_ERROR, error);

    // Return error response
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
        "vd.*",                // Correct column selection for VehicleData
        "masterstate.name AS state"  // Add state from MasterState
      ])
      .leftJoin(MasterState, "masterstate", "vd.state = masterstate.code")  // Correct the join condition
      .distinctOn(["vd.vin"])  // Only use distinctOn once, with "vd.vin"
      .where("vd.status = :status", { status: "Current" })
      .andWhere("vd.isOld = :isOld", { isOld: false })
      .orderBy("vd.vin")
      .addOrderBy("vd.titleBrandDate", "DESC")
      .limit(Number(limit))
      .offset(offset);

    // Apply exact search filters
    Object.entries(filters).forEach(([key, value]) => {
      if (value) {
        queryBuilder.andWhere(`vd."${key}" = :${key}`, { [key]: value });
      }
    });

    const distinctVINs = await queryBuilder.getRawMany();

    // Query to count total distinct VINs
    const totalQueryBuilder = VehicleData.createQueryBuilder("vd")
      .select("COUNT(*)", "total")
      .where("vd.status = :status", { status: "Current" })
      .andWhere("vd.isOld = :isOld", { isOld: false });  // Fixed isOld condition to match the main query

    // Apply filters to total count query
    Object.entries(filters).forEach(([key, value]) => {
      if (value) {
        totalQueryBuilder.andWhere(`vd."${key}" = :${key}`, { [key]: value });
      }
    });

    const totalResult = await totalQueryBuilder.getRawOne();
    const totalDistinctVINs = parseInt(totalResult?.total || "0", 10);
    const totalPages = Math.ceil(totalDistinctVINs / Number(limit));

    // Create response
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

export const TotalUnreadAlerts=async (req: any, res: any) => {
  try {
    const totalNotificationCount = await VehicleData.createQueryBuilder("vehicle")
    .leftJoin(MasterState, "masterstate", "vehicle.state = masterstate.code")
    .leftJoin(MasterBrand, "masterbrand", "vehicle.brand = masterbrand.code")
    .where("vehicle.isRead = :isRead", { isRead: false })
    .distinct(true)
    .select("COUNT(DISTINCT vehicle.vin)", "count")
    .getRawOne();

    // Create response
    return createResponse(res, 200, MESSAGES?.DATA_FETCH_SUCCESS, {
        totalNotificationCount :totalNotificationCount?.count,
    });
  } catch (error: any) {
    console.error(MESSAGES?.INTERNAL_SERVER_ERROR, error);

    return createResponse(res, 500, MESSAGES?.INTERNAL_SERVER_ERROR, [], false, true);
  }
};