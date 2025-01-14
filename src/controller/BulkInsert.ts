import { VehicleInfo } from "../Entities/vehicle_info";
import { MESSAGES } from "../helpers/constants";
import { createResponse } from "../helpers/response";
import { VehicleData } from "../Entities/vehicle_data";
 
export const ExportPdfVINData = async (req: any, res: any) => {
  try {
    const { type = "all" } = req.query;  
    const { vins = [] } = req.body;  
    let data; 
    if (type === "single" && vins.length > 0) { 
      const filters = vins.map(({ vin, alertDate }: { vin: string; alertDate: string }) => ({ vin, alertDate }));

      data = await VehicleData.createQueryBuilder("vehicle")
        .where( 
          filters
            .map(
              (_: any, index: any) =>
                `(vehicle.vin = :vin${index} AND vehicle.alertDate = :alertDate${index} AND vehicle.status = :status)`
            )
            .join(" OR "),
          {  ...Object.fromEntries(filters.flatMap(({ vin, alertDate }: any, index: any) => [
              [`vin${index}`, vin],
              [`alertDate${index}`, alertDate],
            ])),
            status: "Current",
          }
        )
        .orderBy("vehicle.vin")
        .getMany();
    } else if (type === "all") {
      // Fetch all data with status "Current"
      data = await VehicleData.createQueryBuilder("vehicle")
        .where("vehicle.status = :status", { status: "Current" })
        .orderBy("vehicle.vin")
        .getMany();
    } else {
      
      return createResponse(res, 400, "Invalid parameters", [], false, true);
    }

    return createResponse(res, 200, MESSAGES?.DATA_FETCH_SUCCESS, { items: data });
  } catch (error: any) {
      // tslint:disable-next-line:no-console
    console.error(MESSAGES?.INTERNAL_SERVER_ERROR, error);

    return createResponse(res, 500, MESSAGES?.INTERNAL_SERVER_ERROR, [], false, true);
  }
}; 
export const DashboardSummaryVIN = async (req: any, res: any) => {
  try {
    const { page = 1, limit = 10, ...filters } = req.query;
    const offset = (page - 1) * limit; 
    const queryBuilder = VehicleData.createQueryBuilder("vehicle")
      .select("vehicle.*")
      .orderBy("vehicle.vin")
      .where("vehicle.status = :status", { status: "Current" })   
      .addOrderBy("vehicle.createdAt", "DESC")
      .limit(limit)
      .offset(offset);

    Object.entries(filters).forEach(([key, value]) => {
      if (value) {
        queryBuilder.andWhere(`LOWER(vehicle.${key}) LIKE LOWER(:${key})`, {
          [key]: `%${value}%`,
        });
      }
    });

    const distinctVINs = await queryBuilder.getRawMany(); 
    const totalQueryBuilder = VehicleData.createQueryBuilder("vehicle")
      .where("vehicle.status = :status", { status: "Current" });

    Object.entries(filters).forEach(([key, value]) => {
      if (value) {
        totalQueryBuilder.andWhere(`LOWER(vehicle.${key}) LIKE LOWER(:${key})`, {
          [key]: `%${value}%`,
        });
      }
    });

    const totalDistinctVINs = await totalQueryBuilder.getCount();  
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
export const insertBulkSheetData = async (req: any, res: any) => {
  try {
    const { sheet1, sheet2 } = req.body;
 
    if (!sheet1 || !Array.isArray(sheet1) || sheet1.length === 0) {
      return createResponse(res, 400, "No data provided for insertion in sheet1", [], false, true);
    }

    if (!sheet2 || !Array.isArray(sheet2) || sheet2.length === 0) {
      return createResponse(res, 400, "No data provided for insertion in sheet2", [], false, true);
    }
 
    const formattedSheet1: any = sheet1.map(item => ({
      vin: item?.vin || null,
      titleStatus: item?.titleStatus || null,
      brand: item?.brand || null,
      insurance: item?.insurance || null,
      junkSalvage: item?.junkSalvage || null,
    })); 
    const formattedSheet2: any = sheet2.map(item => ({
      vin: item?.vin || null,
      vinId: item?.vinId || null,
      status: item?.status || null,
      state: item?.state || null,
      brand: item?.brand || null,
      model: item?.model || null,
      modelYear: item?.modelYear || null,
      alertDate: item?.titleBrandDate ? item?.titleBrandDate : null,
      member: item?.member || null,
    }));
    // Insert data into the respective tables
    const result1 = await VehicleData.save(formattedSheet2);

    const result2 = await VehicleInfo.save(formattedSheet1);

    return createResponse(res, 201, MESSAGES.DATA_SAVED, { result1, result2 });
  } catch (error) {
       // tslint:disable-next-line:no-console
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
export const getSearchVinPop = async (req: any, res: any) => {
  try {
    const { page = 1, limit = 10, ...filters } = req.query;
    const queryBuilder = VehicleData.createQueryBuilder("VehicleData");
    Object.entries(filters).forEach(([key, value]) => {
      if (value && key !== "page" && key !== "limit") {
        queryBuilder.andWhere(`LOWER(VehicleData.${key}) LIKE LOWER(:${key})`, {
          [key]: `%${value}%`,
        });
      }
    });

    const offset = (parseInt(page, 10) - 1) * parseInt(limit, 10);

    const [items, totalItems] = await queryBuilder
      .skip(offset)
      .take(parseInt(limit, 10))
      .getManyAndCount();

    const totalPages = Math.ceil(totalItems / parseInt(limit, 10));
    if (items.length === 0) {

      return createResponse(res, 404, MESSAGES?.VIN_NOT_FOUND, [], false, true);
    }

    return createResponse(res, 200,
      MESSAGES?.DATA_FETCH_SUCCESS,
      {
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
        totalItems,
        totalPages,
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
    
    const totalKpiData = await VehicleData.createQueryBuilder("vehicleData")
      .select("COUNT(DISTINCT vehicleData.vin)", "uniqueVinCount")
      .getRawOne();
 
    if (!totalKpiData || !totalKpiData.uniqueVinCount) {
      return createResponse(
        res,
        404,
        MESSAGES?.VIN_NOT_FOUND,
        [],
        false,
        true
      );
    }
 
    return createResponse(
      res,
      200,
      MESSAGES?.DATA_FETCH_SUCCESS,
      { uniqueVinCount: totalKpiData.uniqueVinCount },
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
