import { MasterBrand } from "../Entities/master_brand";
import { MasterState } from "../Entities/master_state";
import { VehicleData } from "../Entities/vehicle_data";
import { MESSAGES } from "../helpers/constants";
import { createResponse } from "../helpers/response";

export const UnreadNotificationsAlert = async (req: any, res: any) => {
  try {
    const { page = 1, limit = 9, ...filters } = req.query;
    const offset = (page - 1) * limit;

    // Query to fetch VINs with pagination and include masterstate.name
    const queryBuilder = VehicleData.createQueryBuilder("vehicle")
      .select([
        "vehicle.*",
        "masterstate.name AS state",
        "masterbrand.name AS brand"
      ])
      .leftJoin(MasterState, "masterstate", "vehicle.state = masterstate.code")
      .leftJoin(MasterBrand, "masterbrand", "vehicle.brand = masterbrand.code") 
      .orderBy("vehicle.vin")
      .addOrderBy("vehicle.titleBrandDate", "DESC")
      .limit(limit)
      .offset(offset);

    // Apply LIKE search filters
    Object.entries(filters).forEach(([key, value]) => {
      if (value) {
        queryBuilder.andWhere(`vehicle.${key} ILIKE :${key}`, {
          [key]: `%${value}%`,
        });
      }
    });

    const vehicles = await queryBuilder.getRawMany();

    // Query to count total records 
    const totalQueryBuilder = VehicleData.createQueryBuilder("vehicle")
      .select("COUNT(vehicle.vin)", "total")
      .leftJoin(MasterState, "masterstate", "vehicle.state = masterstate.code"); 

    // Apply LIKE search filters for total count
    Object.entries(filters).forEach(([key, value]) => {
      if (value) {
        totalQueryBuilder.andWhere(`vehicle.${key} ILIKE :${key}`, {
          [key]: `%${value}%`,
        });
      }
    });

    const totalResult = await totalQueryBuilder.getRawOne();
    const totalRecords = totalResult?.total || 0;

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

  export const UnreadNotificationsTopTenData = async (req: any, res: any) => {
    try {
      const { page = 1, limit = 9, ...filters } = req.query;
      const offset = (page - 1) * limit;
  
      // Query to fetch VINs with pagination and include masterstate.name
      const queryBuilder = VehicleData.createQueryBuilder("vehicle")
        .select([
          "vehicle.*",
          "masterstate.name AS state",
          "masterbrand.name AS brand"
        ])
        .leftJoin(MasterState, "masterstate", "vehicle.state = masterstate.code")
        .leftJoin(MasterBrand, "masterbrand", "vehicle.brand = masterbrand.code") 
        .orderBy("vehicle.vin")
        .addOrderBy("vehicle.titleBrandDate", "DESC")
        .where("vehicle.isRead = :isRead", { isRead: false })
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
  
      const vehicles = await queryBuilder.getRawMany();
  
      // Query to count total records 
      const totalQueryBuilder = VehicleData.createQueryBuilder("vehicle")
        .select("COUNT(vehicle.vin)", "total")
        .leftJoin(MasterState, "masterstate", "vehicle.state = masterstate.code")
        .where("vehicle.isRead = :isRead", { isRead: false }); 
      // Apply exact search filters for total count
      Object.entries(filters).forEach(([key, value]) => {
        if (value) {
          totalQueryBuilder.andWhere(`vehicle.${key} = :${key}`, {
            [key]: value,
          });
        }
      });
  
      const totalResult = await totalQueryBuilder.getRawOne();
      const totalRecords = totalResult?.total || 0;
  
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