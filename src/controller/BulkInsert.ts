import { MESSAGES } from "../helpers/constants";
import { createResponse } from "../helpers/response";
import { VehicleInfo } from "../Entities/vehicle_info";
import { VehicleData } from "../Entities/vehicle_data";

export const insertBulkSheetData = async (req: any, res: any) => {
  try {
    const { sheet1, sheet2 } = req.body;

    // Validate input
    if (!sheet1 || !Array.isArray(sheet1) || sheet1.length === 0) {
      return createResponse(res, 400, "No data provided for insertion in sheet1", [], false, true);
    }

    if (!sheet2 || !Array.isArray(sheet2) || sheet2.length === 0) {
      return createResponse(res, 400, "No data provided for insertion in sheet2", [], false, true);
    }

    // Format data for VehicleData entity
    const formattedSheet1 :any= sheet1.map(item => ({
      vin: item?.vin || null,
      titleStatus: item?.titleStatus || null,
      brand: item?.brand || null,
      insurance: item?.insurance || null,
      junkSalvage: item?.junkSalvage || null,
    }));

    // Format data for VehicleInfo entity
    const formattedSheet2:any = sheet2.map(item => ({
      vin: item?.vin || null,
      vinId: item?.vinId || null,
      status: item?.status || null,
      state: item?.state || null,
      brand: item?.brand || null,
      model: item?.model || null,
      modelYear: item?.modelYear  || null,
      alertDate: item?.titleBrandDate ?  item?.titleBrandDate : null,
      member: item?.member || null,
    })); 
    // Insert data into the respective tables
    const result1 = await VehicleData.save(formattedSheet2); 

    const result2 = await VehicleInfo.save(formattedSheet1); 

    return createResponse(res, 201, MESSAGES.DATA_SAVED, { result1, result2 });
  } catch (error) {
    // Log specific error details
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

    // Validate that data exists and is an array
    if (!sheet1 || !Array.isArray(sheet1) || sheet1.length === 0) {

      return createResponse(res, 400, "No data provided for insertion sheet1", [], false, true);
    }

    if (!shhet2 || !Array.isArray(shhet2) || shhet2.length === 0) {

      return createResponse(res, 400, "No data provided for insertion sheet2", [], false, true);
    }
    // Format the incoming data to match the entity fields
     
    // Insert the formatted entities into the database
    const result = await VehicleData.insert(sheet1);
    const result2 = await VehicleInfo.insert(sheet1);

    return createResponse(res, 201, MESSAGES?.CONTACT_SAVED, {result2, result});
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

    return createResponse(  res,  200,
      MESSAGES?.DATA_FETCH_SUCCESS,
      {
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
        totalItems,
        totalPages,
        items,
      }  );
  } catch (error) {
     // tslint:disable-next-line:no-console
    console.error(MESSAGES?.INTERNAL_SERVER_ERROR, error);

    return createResponse(res, 500, MESSAGES?.INTERNAL_SERVER_ERROR, [], false, true);
  }
};
