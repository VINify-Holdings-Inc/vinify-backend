
import { createResponse } from "../helpers/response";
import { VehicleData } from "../Entities/vehicle_data";
import { MasterBrand } from "../Entities/master_brand";
import { MasterState } from "../Entities/master_state";
import { MESSAGES } from "../helpers/constants";
import https from "https";
import axios from "axios";
import fs from "fs";
import { Parser } from "xml2js";
import { transformVehicleDataToJson } from "../helpers/SoapHelper";
import { SingleSoapDataToPdf } from "../Entities/SingleSoapDataToPdf";
import { categorizeDataSIngleSearch } from "../helpers/SortCollection";

export const SoapToken = async (req: any, res: any) => {
     try {
        const soapUrl = "https://authentication-rest-cert.aamva.org/Authentication/authenticate";  
       
        const httpsAgent = new https.Agent({
            cert: fs.readFileSync("./certificates/TAAMVAcert-file.pem"),
            key: fs.readFileSync("./certificates/TAAAMVA.pem"),
            rejectUnauthorized: true, // Set to false for self-signed certificates (not recommended for production)
        });

        // Make the SOAP request
        const response = await axios.get(soapUrl, {
            headers: {
                "Content-Type": "text/xml;charset=UTF-8",
                "SOAPAction": "https://authentication-rest-cert.aamva.org/Authentication/authenticate",  
            },
            httpsAgent,
        });

        // Check if the response contains the expected token data
        if (!response.data) {
            return createResponse(res, 400, "Token fetched unsuccessful.", "", false, true);
        }

        return createResponse(res, 200, "Token fetched successfully.", response.data, true, false);
    } catch (error: any) {
          
        return createResponse(res, 400, "Token fetched unsuccessful.", error.message, false, true);
    }
};

// const convertXmlToJson = async (data:any) => {
//     const parser = new Parser({ explicitArray: false });
  
//     try {
//       const result = await parser.parseStringPromise(data);
//       return JSON.stringify(result, null, 2);
//     } catch (err) {
//       console.error("Error parsing XML:", err);
//       return null;
//     }
//   };  

//   const convertXmlToJson = async (data: string): Promise<any> => {
//     const parser = new Parser({ explicitArray: false });
    
//     try {
//       const result = await parser.parseStringPromise(data);
      
//       // Extracting the specific part you want from the result
//       const jsonData = result['s:Envelope']['s:Body']
// ['GetConsumerVehicleDataResponse']
// ['GetConsumerVehicleDataResult'];
  
//       return JSON.stringify(jsonData, null, 2);
//     } catch (err) {
//       console.error("Error parsing XML:", err);
//       return null;
//     }
//   };

const convertXmlToJson = async (data: string): Promise<any> => {
    const parser = new Parser({ 
        explicitArray: false,  // Prevents wrapping single elements in arrays
        ignoreAttrs: true      // Ignores attributes (e.g., namespace prefixes)
    });

    try {
        const result = await parser.parseStringPromise(data);
         // tslint:disable-next-line:no-console
        console.log("Parsed JSON:", JSON.stringify(result, null, 2)); // Debugging

        // Dynamically find the correct response path
        const envelope = result?.Envelope || result?.["s:Envelope"];
        const body = envelope?.Body || envelope?.["s:Body"];
        const response = body?.GetConsumerVehicleDataResponse || body.GetConsumerVehicleDataResponse;
        const resultData = response?.GetConsumerVehicleDataResult || response.GetConsumerVehicleDataResult;

        return resultData ? JSON.stringify(resultData, null, 2) : null;
    } catch (err) {
       // tslint:disable-next-line:no-console
        console.error("Error parsing XML:", err);

        return null;
    }
};

export const NewValidateVinData = async (req: any, res: any) => {
    try {
       
        const { token, vin } = req.body;
        const soapUrl = "https://vehiclesystems-cert.aamva.org/Vehicles/ConsumerAccess/2.0/GetData.svc";
        
        const soapRequestXml = `<?xml version="1.0" encoding="UTF-8"?>
                                <s:Envelope xmlns:a="http://www.w3.org/2005/08/addressing" xmlns:s="http://www.w3.org/2003/05/soap-envelope">
                                    <s:Header>
                                        <a:Action>http://aamva.org/nmvtis/ews/3.1.0/IConsumerAccessService/GetConsumerVehicleData</a:Action>
                                        <a:To>${soapUrl}</a:To>
                                    </s:Header>
                                    <s:Body xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema">
                                        <GetConsumerVehicleData xmlns="http://aamva.org/nmvtis/ews/3.1.0">
                                            <token>${token}</token>
                                            <GetConsumerVehicleDataRequest>
                                                <VehicleIdentification xmlns="http://niem.gov/niem/niem-core/2.0">
                                                    <IdentificationID>${vin}</IdentificationID>
                                                </VehicleIdentification>
                                                <MessageOriginatorID xmlns="http://aamva.org/xsd/aamva/extensionsExt/1.0">MY</MessageOriginatorID>
                                            </GetConsumerVehicleDataRequest>
                                        </GetConsumerVehicleData>
                                    </s:Body>
                                </s:Envelope>`;
        
        // Make the SOAP request
        const response = await axios.post(soapUrl, soapRequestXml, {
            headers: {
                "Content-Type": "application/soap+xml;charset=UTF-8",
                "action": "http://aamva.org/nmvtis/ews/3.1.0/IConsumerAccessService/GetConsumerVehicleData"
            }
        });

        if (!response.data) {
            return createResponse(res, 400, "No data received from SOAP service.", null, false, true);
        }
            const JsonData = await convertXmlToJson(response.data); 
           const jsonDataToInsert = transformVehicleDataToJson(JSON.parse(JsonData));
         const insertRow =  await SingleSoapDataToPdf.save(jsonDataToInsert);
         const queryBuilder = SingleSoapDataToPdf.createQueryBuilder("vehicle")
         .select([
           "vehicle.*", 
           "masterstate.name AS state",
           "masterbrand.name AS brand"
         ]) 
         .leftJoin(MasterState, "masterstate", "vehicle.IdentificationID = masterstate.code")
         .leftJoin(MasterBrand, "masterbrand", "vehicle.brand = masterbrand.code")  
         .where("vehicle.vin = :vin", { vin: insertRow[0]?.vin })  
         .orderBy("vehicle.titleBrandDate", "DESC"); 
       
       const distinctVINs = await queryBuilder.getRawMany();
       
       // Delete the record based on VIN
       await  SingleSoapDataToPdf.delete({ vin: insertRow[0]?.vin });
       
      const reportData= await categorizeDataSIngleSearch(distinctVINs)
        return createResponse(res, 200, "Data fetched successfully.", {generatePdf: distinctVINs,reportData}, true, false);
    } catch (error: any) {
        return createResponse(res, 400, "Data fetched unsuccessful.", error, false, true);
    }

};

export const TrackVinPopController = async (req: any, res: any) => {
    try {
      const { page = 1, limit = 9, ...filters } = req.query;
      const offset = (page - 1) * limit;
      const queryBuilder = VehicleData.createQueryBuilder("vd")
        .select([
          "vd.*",
          "masterbrand.name AS brand",
          "masterstate.name AS state"
        ])
        .leftJoin(MasterBrand, "masterbrand", "vd.brand = masterbrand.code")
        .leftJoin(MasterState, "masterstate", "vd.state = masterstate.code");
  
      Object.entries(filters).forEach(([key, value]) => {
        if (value && key !== "page" && key !== "limit") {
          if (key === "vin") {
            // Exact match for VIN
            queryBuilder.andWhere(`vd.vin = :vin`, { vin: value });
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
  
      const items = await queryBuilder.limit(limit).offset(offset).getRawMany();
  
      const totalQueryBuilder = VehicleData.createQueryBuilder("vd")
        .leftJoin(MasterBrand, "masterbrand", "vd.brand = masterbrand.code")
        .leftJoin(MasterState, "masterstate", "vd.state = masterstate.code");
  
      Object.entries(filters).forEach(([key, value]) => {
        if (value && key !== "page" && key !== "limit") {
          if (key === "vin") {
            totalQueryBuilder.andWhere(`vd.vin = :vin`, { vin: value });
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
  
      if (items?.length === 0) {
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