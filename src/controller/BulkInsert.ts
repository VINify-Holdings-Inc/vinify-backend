
import { MESSAGES } from "../helpers/constants";
import { createResponse } from "../helpers/response";
import { VehicleData } from "../Entities/vehicle_data";
import { MasterState } from "../Entities/master_state";
import { MasterBrand } from "../Entities/master_brand";
import { LastFileProcess } from "../Entities/LastFileProcess";
import { DashboardDataList } from "../Entities/DashboardDataList";
import { VehicleDataTemp } from "../Entities/vehicle_data_temp";
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
        const currentQueryBuilder = VehicleDataTemp.createQueryBuilder("vehicle")
            .select([
                "vehicle.*", // Select all columns from the 'vehicle' table
                "masterstate.name AS state", // Get state name from 'masterstate'
                "masterbrand.name AS brand",
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
        // Create a query to fetch distinct vehicle VINs and their corresponding IDs from the 'DashboardDataList' table
        const query = DashboardDataList.createQueryBuilder("vehicle")
            .select("DISTINCT vehicle.vin", "vin") // Select distinct VINs
            .addSelect("vehicle.id", "id"); // Add vehicle ID to the selection

        // Check if a 'vin' query parameter exists, and apply filtering based on that parameter
        if (req.query.vin) {
            query.where("vehicle.vin LIKE :vin", { vin: `%${req.query.vin}%` }); // Filter VINs using LIKE for partial matches
        }

        // Execute the query and fetch the raw data
        const data = await query.getRawMany();

        // Create a response with the fetched data
        return createResponse(res, 200, MESSAGES?.DATA_FETCH_SUCCESS, data); // Return data with success message
    } catch (error: any) {
        // tslint:disable-next-line:no-console 
        console.log("Error fetching vehicle data:", error);

        // Return an error response if an error occurs
        return createResponse(res, 500, MESSAGES?.INTERNAL_SERVER_ERROR || "Internal Server Error", [], false, true); // Error message
    }
};
