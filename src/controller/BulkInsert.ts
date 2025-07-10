
import { MESSAGES } from "../helpers/constants";
import { createResponse } from "../helpers/response";
import { VehicleData } from "../Entities/vehicle_data";
import { MasterState } from "../Entities/master_state";
import { MasterBrand } from "../Entities/master_brand";
import { LastFileProcess } from "../Entities/LastFileProcess";
import { DashboardDataList } from "../Entities/DashboardDataList";
// import { VehicleDataTemp } from "../Entities/vehicle_data_temp";
import { MasterWebUrl } from "../Entities/master_url";

export const getTotalKpiesData = async (req: any, res: any) => {
    try {
        // Query to count the unique VINs (Vehicle Identification Numbers) in the database
        const query1 = DashboardDataList.createQueryBuilder("vehicleData")
            .select("COUNT(vehicleData.vin)", "uniqueVinCount");
        const totalKpiData = await query1.getRawOne();

        // Query to count the unique VINs where 'isOld' is false (updated vehicles)
        const queryUpdated = DashboardDataList.createQueryBuilder("vehicleData")
            .select("COUNT(vehicleData.vin)", "uniqueVinCount")
            .where("vehicleData.isOld = :isOld", { isOld: false });
        const totalUpdatedData = await queryUpdated.getRawOne();

        // Query to get the most recent vehicle alerts, joining with master state and master brand data
        const currentQueryBuilder = VehicleData.createQueryBuilder("vehicle")
            .select([
                "vehicle.*", // Select all columns from the 'vehicle' table
                "masterstate.code AS state", // Get state name from 'masterstate'
                "masterbrand.name AS brand",
                "masterstate.name AS fullstate",
                "masterurl.name AS weburl",   // Get the brand name from the masterbrand table
            ])
            .leftJoin(MasterWebUrl, "masterurl", "vehicle.state = masterurl.code")
            .leftJoin(MasterState, "masterstate", "vehicle.state = masterstate.code") // Join 'vehicle' with 'masterstate'
            .leftJoin(MasterBrand, "masterbrand", "vehicle.brand = masterbrand.code") // Join 'vehicle' with 'masterbrand'
            .orderBy("vehicle.isOld", "ASC") // Order by 'isOld' column
            .addOrderBy("vehicle.titleBrandDate", "DESC") // Secondary order by 'titleBrandDate'
            .limit(3); // Limit the results to 3 vehicles

        // Fetch the recent alerts based on the constructed query
        const RecentAlert = await currentQueryBuilder.getRawMany();

        // Return the response with the gathered data
        return createResponse(
            res,
            200,
            MESSAGES?.DATA_FETCH_SUCCESS,
            {
                uniqueVinCount: totalKpiData?.uniqueVinCount, // Total unique VINs count
                totalUpdatedData: totalUpdatedData?.uniqueVinCount, // Total updated VINs count
                RecentAlert, // The most recent 3 vehicle alerts
            },
            true,
            false
        );
    } catch (error) {
        // tslint:disable-next-line:no-console 
        console.log(MESSAGES?.INTERNAL_SERVER_ERROR, error);

        // Return an error response in case of failure
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

export const TotalUnreadAlerts = async (req: any, res: any) => {
    try {
        // Query to count the total number of unread vehicle alerts
        const totalNotificationCount = await VehicleData.createQueryBuilder("vehicle")
            .leftJoin(MasterState, "masterstate", "vehicle.state = masterstate.code") // Join with masterstate to get state info
            .leftJoin(MasterBrand, "masterbrand", "vehicle.brand = masterbrand.code") // Join with masterbrand to get brand info
            .where("vehicle.isRead = :isRead", { isRead: false }) // Filter only unread alerts
            .select("COUNT(vehicle.vin)", "count") // Removed DISTINCT
            .getRawOne(); // Fetch the raw count of unread VINs

        // Query to get the last file process details (createdAt)
        const lastFileProcess = await LastFileProcess.createQueryBuilder("lastFileProcess")
            .select() // Select all columns from 'LastFileProcess' table
            .getOne(); // Fetch the last record

        // Create and return the response with the total unread notification count and last updated date
        return createResponse(res, 200, MESSAGES?.DATA_FETCH_SUCCESS, {
            totalNotificationCount: totalNotificationCount?.count, // Total count of unread vehicle alerts
            lastUpdatedDate: lastFileProcess?.createdAt // Last file process update date
        });
    } catch (error: any) {
        // tslint:disable-next-line:no-console 
        console.log(MESSAGES?.INTERNAL_SERVER_ERROR, error);

        // Return an error response in case of failure
        return createResponse(res, 500, MESSAGES?.INTERNAL_SERVER_ERROR, [], false, true);
    }
};

export const ExportPdfVINDataList = async (req: any, res: any) => {
    try {
        // Extract query parameters
        const { page = 1, limit = 1000, vin } = req.query;
        const numericLimit = Number(limit);   // Convert limit to number
        const numericPage = Number(page);     // Convert page to number
        const offset = (numericPage - 1) * numericLimit;

        // Main query to get distinct VINs and their IDs with pagination
        const query = DashboardDataList.createQueryBuilder("vehicle")
            .select("DISTINCT vehicle.vin", "vin")     // Select distinct VINs
            .addSelect("vehicle.id", "id")             // Also select the ID
            .orderBy("vehicle.vin", "ASC")             // Optional: Order VINs
            .limit(numericLimit)                       // Pagination: limit
            .offset(offset);                           // Pagination: offset

        // VIN filtering if query param is present
        if (vin) {
            query.where("vehicle.vin LIKE :vin", { vin: `%${vin}%` });
        }

        const data = await query.getRawMany();

        // Count query for total distinct VINs for pagination info
        const countQuery = DashboardDataList.createQueryBuilder("vehicle")
            .select("COUNT(DISTINCT vehicle.vin)", "total");

        if (vin) {
            countQuery.where("vehicle.vin LIKE :vin", { vin: `%${vin}%` });
        }

        const totalResult = await countQuery.getRawOne();
        const totalRecords = parseInt(totalResult?.total || "0", 10);
        const totalPages = Math.ceil(totalRecords / numericLimit);

        // Return paginated data
        return createResponse(res, 200, MESSAGES?.DATA_FETCH_SUCCESS, {
            currentPage: numericPage,
            totalPages,
            totalRecords,
            items: data,
        });
    } catch (error: any) {
        // tslint:disable-next-line:no-console 
        console.log("Error fetching vehicle data:", error);

        // Return an error response
        return createResponse(res, 500, MESSAGES?.INTERNAL_SERVER_ERROR || "Internal Server Error", [], false, true);
    }
};

