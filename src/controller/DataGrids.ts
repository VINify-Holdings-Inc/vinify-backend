import { DashboardDataList } from "../Entities/DashboardDataList";
import { LastFileProcess } from "../Entities/LastFileProcess";
import { MasterBrand } from "../Entities/master_brand";
import { MasterState } from "../Entities/master_state";
import { MasterWebUrl } from "../Entities/master_url";
import { VehicleData } from "../Entities/vehicle_data";
import { MESSAGES } from "../helpers/constants";
import { createResponse } from "../helpers/response";

export const DashboardSummaryVIN = async (req: any, res: any) => {
    try {
        // Extract query parameters (page, limit, alertType, and filters) from the request
        const { page = 1, limit = 9, alertType, ...filters } = req.query;
        const numericLimit = Number(limit); // Convert limit to a number
        const numericPage = Number(page); // Convert page to a number
        const offset = (numericPage - 1) * numericLimit; // Calculate offset for pagination

        // Build the query to fetch distinct VINs with pagination
        const queryBuilder = DashboardDataList.createQueryBuilder("vehicle")
            .distinctOn(["vehicle.vin"]) // Select distinct VINs
            .select(["vehicle.*"]) // Select all fields from the vehicle table
            .orderBy("vehicle.vin", "ASC") // Order by VIN in ascending order
            .limit(numericLimit) // Limit the number of records to the numericLimit
            .offset(offset); // Apply pagination offset

        // Apply the alertType filter if specified
        if (["Title", "Brand", "JSI"].includes(alertType)) {
            queryBuilder.andWhere(`vehicle."${alertType}" = true`); // Filter based on alertType
        }

        // Apply dynamic filters (if any) based on the query parameters
        Object.entries(filters).forEach(([key, value]) => {
            if (value !== undefined && value !== "") {
                queryBuilder.andWhere(`LOWER(vehicle."${key}") LIKE LOWER(:${key})`, {
                    [key]: `%${value}%`, // Apply LIKE filtering on the vehicle fields
                });
            }
        });

        // Fetch the distinct VINs based on the query
        const distinctVINs = await queryBuilder.getRawMany();

        // Build a separate query to count the total number of distinct VINs for pagination
        const totalQueryBuilder = DashboardDataList.createQueryBuilder("vehicle")
            .select("COUNT(DISTINCT vehicle.vin)", "total"); // Count distinct VINs

        // Apply the same alertType filter as in the first query
        if (["Title", "Brand", "JSI"].includes(alertType)) {
            totalQueryBuilder.andWhere(`vehicle."${alertType}" = true`);
        }

        // Apply the same dynamic filters as in the first query
        Object.entries(filters).forEach(([key, value]) => {
            if (value !== undefined && value !== "") {
                totalQueryBuilder.andWhere(`LOWER(vehicle."${key}") LIKE LOWER(:${key})`, {
                    [key]: `%${value}%`,
                });
            }
        });

        // Fetch the total count of distinct VINs
        const totalResult = await totalQueryBuilder.getRawOne();
        const totalDistinctVINs = parseInt(totalResult?.total || "0", 10); // Parse the total count
        const totalPages = Math.ceil(totalDistinctVINs / numericLimit); // Calculate the total number of pages

        // Return the response with the current page, total pages, total records, and fetched items
        return createResponse(res, 200, MESSAGES?.DATA_FETCH_SUCCESS, {
            currentPage: numericPage, // Current page number
            totalPages, // Total number of pages
            totalRecords: totalDistinctVINs, // Total number of distinct VIN records
            items: distinctVINs, // Fetched items (distinct VINs)
        });
    } catch (error: any) {
        // tslint:disable-next-line:no-console 
        console.log(MESSAGES?.INTERNAL_SERVER_ERROR, error);

        // Return an error response if something goes wrong
        return createResponse(res, 500, MESSAGES?.INTERNAL_SERVER_ERROR, [], false, true);
    }
};

export const DashboardSummaryVINUpdated = async (req: any, res: any) => {
    try {
        // Destructure the request query parameters: page, limit, alertType, and filters
        const { page = 1, limit = 9, alertType, ...filters } = req.query;
        const numericLimit = Number(limit); // Convert the limit to a numeric value
        const numericPage = Number(page); // Convert the page number to a numeric value
        const offset = (numericPage - 1) * numericLimit; // Calculate the offset for pagination

        // Initialize the query builder to fetch distinct VINs
        const queryBuilder = DashboardDataList.createQueryBuilder("vd")
            .select(["vd.*"]) // Select all columns of the vehicle data
            .distinctOn(["vd.vin"]) // Select only distinct VINs
            .where("vd.isOld = :isOld", { isOld: false }) // Filter to select only non-old records
            .orderBy("vd.vin", "ASC") // Order the results by VIN in ascending order
            .limit(numericLimit) // Limit the number of records to the specified limit
            .offset(offset); // Apply pagination offset

        // Use template literals to check if the alertType is one of the expected values
        if (alertType === "Title" || alertType === "Brand" || alertType === "JSI") {
            queryBuilder.andWhere(`vd."${alertType}" = true`); // Apply the alertType condition
        }

        // Apply dynamic filters based on query parameters
        Object.entries(filters).forEach(([key, value]) => {
            if (value !== undefined && value !== "") {
                queryBuilder.andWhere(`LOWER(vd."${key}") ILIKE LOWER(:${key})`, {
                    [key]: `%${value}%`, // Use ILIKE for case-insensitive filtering
                });
            }
        });

        // Execute the query and fetch the distinct VINs
        const distinctVINs = await queryBuilder.getRawMany();

        // Build the total count query to calculate the total number of distinct VINs
        const totalQueryBuilder = DashboardDataList.createQueryBuilder("vd")
            .select("COUNT(DISTINCT vd.vin)", "total") // Count the distinct VINs
            .where("vd.isOld = :isOld", { isOld: false }); // Filter to select only non-old records

        // Apply the alertType filter for the total count query
        if (alertType === "Title" || alertType === "Brand" || alertType === "JSI") {
            totalQueryBuilder.andWhere(`vd."${alertType}" = true`);
        }

        // Apply the same dynamic filters to the total count query
        Object.entries(filters).forEach(([key, value]) => {
            if (value !== undefined && value !== "") {
                totalQueryBuilder.andWhere(`LOWER(vd."${key}") ILIKE LOWER(:${key})`, {
                    [key]: `%${value}%`, // Use ILIKE for case-insensitive filtering
                });
            }
        });

        // Execute the total count query to get the total number of distinct VINs
        const totalResult = await totalQueryBuilder.getRawOne();
        const totalDistinctVINs = parseInt(totalResult?.total || "0", 10); // Parse the total count of VINs
        const totalPages = Math.ceil(totalDistinctVINs / numericLimit); // Calculate total pages for pagination

        // Return the response with pagination data and fetched results
        return createResponse(res, 200, MESSAGES?.DATA_FETCH_SUCCESS, {
            currentPage: numericPage, // Current page number
            limit: numericLimit, // Limit of records per page
            totalPages, // Total number of pages
            totalRecords: totalDistinctVINs, // Total number of distinct VIN records
            items: distinctVINs, // The actual fetched distinct VIN items
        });
    } catch (error: any) {
        // tslint:disable-next-line:no-console 
        console.log(MESSAGES?.INTERNAL_SERVER_ERROR, error);

        // Return an error response with an internal server error message
        return createResponse(res, 500, MESSAGES?.INTERNAL_SERVER_ERROR, [], false, true);
    }
};

export const NewAlertVIN = async (req: any, res: any) => {
    try {
        // Destructure page, limit, and filters from the request query parameters
        const { page = 1, limit = 9, ...filters } = req.query;
        const offset = (Number(page) - 1) * Number(limit); // Calculate pagination offset

        // Initialize the query builder to fetch VIN records from the vehicle_data table
        const queryBuilder = VehicleData.createQueryBuilder("vd")
            .select([
                "vd.*", // Select all fields from the vehicle_data table
                "masterstate.name AS state", // Get the state name from the masterstate table
                "masterbrand.name AS brand",
                "masterurl.name AS weburl",   // Get the brand name from the masterbrand table
            ])
            .leftJoin(MasterWebUrl, "masterurl", "vd.state = masterurl.code")
            .leftJoin(MasterState, "masterstate", "vd.state = masterstate.code") // Join masterstate for state names
            .leftJoin(MasterBrand, "masterbrand", "vd.brand = masterbrand.code")
            .where("vd.isOld = :isOld", { isOld: false }) // Filter only non-old records
            .orderBy("vd.titleBrandDate", "DESC") // Order by titleBrandDate in descending order
            .addOrderBy("vd.alertType", "DESC") // Add secondary ordering by alertType in descending order
            .limit(Number(limit)) // Limit the number of records based on the passed limit
            .offset(offset); // Apply pagination offset

        // Apply dynamic filters from the request query
        Object.entries(filters).forEach(([key, value]) => {
            if (value !== undefined && value !== null) {
                if (key === "isRead") {
                    // Handle boolean fields like 'isRead' with proper comparison (no LIKE)
                    queryBuilder.andWhere(`vd."${key}" = :${key}`, {
                        [key]: value === "true", // Convert string 'true' to actual boolean true
                    });
                } else {
                    // Apply LIKE condition for other string fields (case-insensitive search)
                    queryBuilder.andWhere(`vd."${key}" ILIKE :${key}`, {
                        [key]: `%${value}%`, // Use ILIKE for case-insensitive matching
                    });
                }
            }
        });

        // Execute the query to fetch VIN records based on the provided filters and pagination
        const vinRecords = await queryBuilder.getRawMany();

        // Query builder for counting the total number of VINs based on filters
        const totalQueryBuilder = VehicleData.createQueryBuilder("vd")
            .select("COUNT(vd.vin) AS total") // Count distinct VINs
            .where("vd.isOld = :isOld", { isOld: false }); // Only consider non-old records

        // Apply the same filters to the total count query
        Object.entries(filters).forEach(([key, value]) => {
            if (value !== undefined && value !== null) {
                if (key === "isRead") {
                    totalQueryBuilder.andWhere(`vd."${key}" = :${key}`, {
                        [key]: value === "true", // Ensure correct boolean comparison
                    });
                } else {
                    totalQueryBuilder.andWhere(`vd."${key}" ILIKE :${key}`, {
                        [key]: `%${value}%`, // Apply ILIKE for case-insensitive filtering
                    });
                }
            }
        });

        // Execute the total count query to get the number of VIN records
        const totalResult = await totalQueryBuilder.getRawOne();
        const totalVINs = parseInt(totalResult?.total || "0", 10); // Parse the total VINs count
        const totalPages = Math.ceil(totalVINs / Number(limit)); // Calculate total pages for pagination

        // Return the response with pagination info and fetched VIN records
        return createResponse(res, 200, MESSAGES?.DATA_FETCH_SUCCESS, {
            currentPage: Number(page), // Current page number
            limit: Number(limit), // Number of records per page
            totalPages, // Total number of pages
            totalRecords: totalVINs, // Total number of VIN records
            items: vinRecords, // The fetched VIN records
        });
    } catch (error: any) {
        // tslint:disable-next-line:no-console 
        console.log(MESSAGES?.INTERNAL_SERVER_ERROR, error);

        // Return an error response in case of failure
        return createResponse(res, 500, MESSAGES?.INTERNAL_SERVER_ERROR, [], false, true);
    }
};

export const UnreadNotificationsAlert = async (req: any, res: any) => {
    try {
        // Extract page and limit from query parameters, with default values for pagination
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 8;
        const offset = (page - 1) * limit;

        // Exclude pagination (page and limit) from the filters
        const { page: _, limit: __, ...filters } = req.query;

        // Query to fetch VIN records with pagination, including the state and brand information
        const queryBuilder = VehicleData.createQueryBuilder("vehicle")
            .select([
                "vehicle.*", // Select all fields from the vehicle table
                "masterstate.name AS state", // Select the state name from masterstate table
                "masterbrand.name AS brand",
                "masterurl.name AS weburl",   // Get the brand name from the masterbrand table
            ])
            .leftJoin(MasterWebUrl, "masterurl", "vehicle.state = masterurl.code")
            .leftJoin(MasterState, "masterstate", "vehicle.state = masterstate.code") // Join with masterstate table for state information
            .leftJoin(MasterBrand, "masterbrand", "vehicle.brand = masterbrand.code") // Join with masterbrand table for brand information
            .orderBy("vehicle.titleBrandDate", "DESC") // Order by titleBrandDate in descending order
            .addOrderBy("vehicle.alertType", "DESC") // Add secondary ordering by alertType in descending order
            .distinct(true) // Ensure distinct results to avoid duplicate records
            .limit(limit) // Set the limit for records based on the query parameter
            .offset(offset); // Apply pagination offset based on the current page

        // Apply dynamic filters from request query to the query builder
        Object.entries(filters).forEach(([key, value]) => {
            if (value !== undefined && value !== null) {
                if (key === "isRead") {
                    // Handle isRead as a boolean field for filtering
                    queryBuilder.andWhere(`vehicle.${key} = :${key}`, { [key]: value === "true" });
                } else {
                    // Apply ILIKE for case-insensitive partial matching for string fields
                    queryBuilder.andWhere(`vehicle.${key} ILIKE :${key}`, { [key]: `%${value}%` });
                }
            }
        });

        // Execute the query to fetch the filtered VIN records
        const vehicles = await queryBuilder.getRawMany();

        // Query to count the total number of distinct VIN records matching the filters
        const totalQueryBuilder = VehicleData.createQueryBuilder("vehicle")
            .select("COUNT(DISTINCT vehicle.id) AS total") // Corrected to count distinct vehicle IDs
            .leftJoin(MasterState, "masterstate", "vehicle.state = masterstate.code"); // Join masterstate to count filtered vehicles

        // Apply the same filters to the total count query
        Object.entries(filters).forEach(([key, value]) => {
            if (value !== undefined && value !== null) {
                if (key === "isRead") {
                    totalQueryBuilder.andWhere(`vehicle.${key} = :${key}`, { [key]: value === "true" });
                } else {
                    totalQueryBuilder.andWhere(`vehicle.${key} ILIKE :${key}`, { [key]: `%${value}%` });
                }
            }
        });

        // Execute the total count query
        const totalResult = await totalQueryBuilder.getRawOne();
        const totalRecords = parseInt(totalResult?.total) || 0; // Ensure totalRecords is an integer value

        // Calculate the total number of pages based on total records and limit per page
        const totalPages = Math.ceil(totalRecords / limit);

        // Create and return the response with pagination info and fetched vehicles
        return createResponse(res, 200, MESSAGES?.DATA_FETCH_SUCCESS, {
            currentPage: page, // Current page number
            totalPages, // Total number of pages
            totalRecords, // Total number of records that match the filters
            items: vehicles, // The fetched VIN records
        });
    } catch (error: any) {
        // tslint:disable-next-line:no-console 
        console.log(MESSAGES?.INTERNAL_SERVER_ERROR, error);

        // Return a response indicating an internal server error
        return createResponse(res, 500, MESSAGES?.INTERNAL_SERVER_ERROR, [], false, true);
    }
};

export const getSearchVinPop = async (req: any, res: any) => {
    try {
        // Extract pagination parameters and filters from the request query
        const { page = 1, limit = 9, oldVin, isDel = false, ...filters } = req.query;
        const offset = (page - 1) * limit; // Calculate offset for pagination

        // Query to fetch VIN records with related state and brand names
        const queryBuilder = VehicleData.createQueryBuilder("vd")
            .select([
                "vd.*", // Select all vehicle data columns
                "masterbrand.name AS brand", // Select brand name from masterbrand
                "masterstate.name AS state",
                "masterurl.name AS weburl",   // Get the brand name from the masterbrand table
            ])
            .leftJoin(MasterWebUrl, "masterurl", "vd.state = masterurl.code")
            .leftJoin(MasterBrand, "masterbrand", "vd.brand = masterbrand.code") // Join with masterbrand
            .leftJoin(MasterState, "masterstate", "vd.state = masterstate.code") // Join with masterstate
            .where("vd.isDel = :isDel", { isDel }) // Apply isDel filter
            .orderBy("vd.titleBrandDate", "DESC") // Order by titleBrandDate in descending order
            .addOrderBy("vd.alertType", "DESC"); // Secondary order by alertType in descending order

        // Exact VIN Search using oldVin (if provided)
        if (oldVin) {
            queryBuilder.andWhere("vd.vin = :oldVin", { oldVin });
        }

        // Apply dynamic filters from the request query
        Object.entries(filters).forEach(([key, value]) => {
            if (value && key !== "page" && key !== "limit") {
                if (key === "vin") {
                    // Exact VIN match
                    queryBuilder.andWhere(`vd.${key} = :${key}`, { [key]: value });
                } else if (key === "isRead") {
                    // Boolean handling for isRead filter
                    queryBuilder.andWhere(`vd.${key} = :${key}`, {
                        [key]: value === "true" ? true : value === "false" ? false : value
                    });
                } else {
                    // Apply ILIKE for case-insensitive partial matching for other fields
                    queryBuilder.andWhere(`LOWER(vd.${key}) LIKE LOWER(:${key})`, {
                        [key]: `%${value}%`,
                    });
                }
            }
        });

        // Apply pagination and execute the query to fetch data
        const items = await queryBuilder.limit(Number(limit)).offset(Number(offset)).getRawMany();

        // Query to count total records based on applied filters
        const totalQueryBuilder = VehicleData.createQueryBuilder("vd")
            .leftJoin(MasterBrand, "masterbrand", "vd.brand = masterbrand.code")
            .leftJoin(MasterState, "masterstate", "vd.state = masterstate.code")
            .where("vd.isDel = :isDel", { isDel });

        // Apply oldVin filter for count query
        if (oldVin) {
            totalQueryBuilder.andWhere("vd.vin = :oldVin", { oldVin });
        }

        // Apply filters to the total count query
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

        // Execute the total count query
        const totalCount = await totalQueryBuilder.getCount();
        const totalPages = Math.ceil(totalCount / limit); // Calculate total pages

        // Count of title changes for the specific VIN
        const titletitleChangeCount = await VehicleData.createQueryBuilder("vehicle")
            .where("vehicle.isOld = :isOld", { isOld: false })
            .andWhere("vehicle.vin = :vin", { vin: filters.vin })
            .andWhere("vehicle.isDel = :isDel", { isDel })
            .getCount();

        // Fetch the latest title change date
        const lastTitleChangeRecord: any = await LastFileProcess.find();
        const titletitleChangeLastUpdated = lastTitleChangeRecord[0]?.createdAt || null;

        // If no records found, return a not found response
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

        // Successful response with fetched data and pagination info
        return createResponse(res, 200, MESSAGES?.DATA_FETCH_SUCCESS, {
            page, // Current page
            limit, // Limit per page
            totalPages, // Total pages
            totalItems: totalCount, // Total records found
            items, // Fetched VIN records
            titletitleChangeCount, // Count of title changes for the specified VIN
            titletitleChangeLastUpdated // Latest title change date
        });
    } catch (error) {
        // tslint:disable-next-line:no-console 
        console.log(MESSAGES?.INTERNAL_SERVER_ERROR, error);

        // Return a response indicating an internal server error
        return createResponse(res, 500, MESSAGES?.INTERNAL_SERVER_ERROR, [], false, true);
    }
};

export const ExportPdfVINData = async (req: any, res: any) => {
    try {
        // Extract type from query parameters, default to "all"
        const { type = "all" } = req.query;

        // Extract vins array from request body, default to specific VIN
        const { vins = ["b664c7db-be90-4678-a88f-55cebfeeb9eb"] } = req.body;

        let data; // Variable to store the fetched data

        // Handle single type - Fetch specific VIN records
        if (type === "single" && vins.length > 0) {

            // Query to fetch specific VIN records
            const queryBuilder = DashboardDataList.createQueryBuilder("vehicle")
                .select(["vehicle.*"]) // Select all vehicle data columns
                .addOrderBy("vehicle.vin", "ASC") // Order by VIN in ascending order
                .where("vehicle.id IN (:...vins)", { vins }); // Filter by VINs

            // Execute the query and store the data
            data = await queryBuilder.getRawMany();
            // data = await correctedData(items); // Uncomment if needed

        }
        // Handle "all" type - Fetch all VIN records
        else if (type === "all") {

            // Query to fetch all unique VIN records
            const queryBuilder = DashboardDataList.createQueryBuilder("vehicle")
                .distinctOn(["vehicle.vin"]) // DISTINCT ON VIN
                .select(["vehicle.*"]) // Select all vehicle data columns
                .orderBy("vehicle.vin", "ASC"); // Order by VIN in ascending order

            // Execute the query and store the data
            data = await queryBuilder.getRawMany();

        }
        // Handle "updated" type - Fetch updated VIN records
        else if (type === "updated") {

            // Query to fetch updated VIN records (isOld = false)
            const queryBuilder = DashboardDataList.createQueryBuilder("vehicle")
                .distinctOn(["vehicle.vin"]) // DISTINCT ON VIN
                .select(["vehicle.*"]) // Select all vehicle data columns
                .orderBy("vehicle.vin", "ASC") // Order by VIN in ascending order
                .where("vehicle.isOld = :isOld", { isOld: false }); // Filter by isOld flag

            // Execute the query and store the data
            data = await queryBuilder.getRawMany();
        }

        // Return the fetched data with a successful response
        return createResponse(res, 200, MESSAGES?.DATA_FETCH_SUCCESS, { items: data });

    } catch (error: any) {
        // tslint:disable-next-line:no-console  
        console.log(MESSAGES?.INTERNAL_SERVER_ERROR, error);

        // Return an internal server error response
        return createResponse(res, 500, MESSAGES?.INTERNAL_SERVER_ERROR, [], false, true);
    }
};

export const NavigateSidebarFirstItem = async (req: any, res: any) => {
    try {
        // Extract page from query parameters, default to 1
        const { page = 1 } = req.query;

        // Initial query: Fetch latest records where isOld is false
        let queryBuilder = VehicleData.createQueryBuilder("vehicle")
            .select(["vehicle.*"]) // Select all vehicle columns
            .where("vehicle.isOld = :isOld", { isOld: false }) // Filter by isOld = false
            .orderBy("vehicle.titleBrandDate", "DESC") // Order by titleBrandDate in descending order
            .limit(8); // Limit to 8 records

        // Execute the query and store the data
        let data = await queryBuilder.getRawMany();

        // If no records found, fallback to isOld = true
        if (data.length === 0) {

            // Update query to fetch records where isOld is true
            queryBuilder = VehicleData.createQueryBuilder("vehicle")
                .select(["vehicle.*"]) // Select all vehicle columns
                .where("vehicle.isOld = :isOld", { isOld: true }) // Filter by isOld = true
                .orderBy("vehicle.titleBrandDate", "DESC") // Order by titleBrandDate in descending order
                .limit(8); // Limit to 8 records

            // Execute the query and update the data
            data = await queryBuilder.getRawMany();
        }

        // Create response with data
        return createResponse(res, 200, MESSAGES?.DATA_FETCH_SUCCESS, {
            currentPage: page, // Current page is always 1
            totalPages: 1, // Only one page of data is returned
            totalRecords: 1, // Total records is hardcoded as 1
            items: data, // Data fetched from the query
        });

    } catch (error: any) {
        // tslint:disable-next-line:no-console 
        console.log(MESSAGES?.INTERNAL_SERVER_ERROR, error);

        // Return internal server error response
        return createResponse(res, 500, MESSAGES?.INTERNAL_SERVER_ERROR, [], false, true);
    }
};
