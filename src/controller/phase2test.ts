import { createResponse } from "../helpers/response";
import axios from "axios";
import path from "path";
import fs from "fs";
import { parseStringPromise } from "xml2js";
// import { VinData } from "../Entities/VinData";
import { VinDataTemp } from "../Entities/VinDataTemp";
import { copyDataFromVinDataTemp, CustomsInquiryDataCompare, EbayAuctionDataCompare, ExportDataCompare, ImpoundDataCompare, LienDataCompare, RecallDataCompare, StolenSummaryDataCompare } from "../helpers/CompareAndStoreData";
import { VinData } from "../Entities/VinData";
import { truncateTable } from "../helpers/CompareHelpers";
import { VehicleData } from "../Entities/vehicle_data";
import { mergeDataOfAlerts } from "../helpers/MergeData";
import { MasterBrand } from "../Entities/master_brand";
import { MasterState } from "../Entities/master_state";

const convertXmlToJson = async (data: string): Promise<any> => {
    try {
        const result = await parseStringPromise(data, {
            explicitArray: false,
            ignoreAttrs: true,
            tagNameProcessors: [(name) =>
                name.replace("ess:", "").replace("SOAP-ENV:", "")
            ]
        });

        const envelope = result?.Envelope;
        const body = envelope?.Body;
        const response = body?.VinSearchResponse;

        if (!response) return null;

        // Flatten response into cleaner structure
        return {
            version: response.BaseResponse?.Version || null,
            events: response.EventResponse || []
        };
    } catch (err) {
        console.error("Error parsing XML:", err);
        return null;
    }
};

export const NewValidateVinData2 = async (req: any, res: any) => {
    try {
        const { vin } = req.body;

        if (!vin) {
            return createResponse(res, 400, "VIN is required.", null, false, true);
        }

        const soapUrl =
            "https://www.locatortechnologies.com/eventsearchservice/EventSearchService";

        const soapRequestXml = `
      <soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:ess="http://locatortechnologies.com/schemas/ess">
        <soapenv:Header/>
        <soapenv:Body>
          <ess:VinSearchRequest>
            <ess:BaseRequest>
              <ess:AuthInfo>
                <ess:Username>titlealarm</ess:Username>
                <ess:Password>AdkE8y2p</ess:Password>
              </ess:AuthInfo>
              <ess:Version>115</ess:Version>
              <ess:Mode>Test</ess:Mode>
            </ess:BaseRequest>
            <ess:VinSearch>
              <ess:Vin>${vin}</ess:Vin>
            </ess:VinSearch>
          </ess:VinSearchRequest>
        </soapenv:Body>
      </soapenv:Envelope>
    `;

        const response = await axios.post(soapUrl, soapRequestXml, {
            headers: {
                "Content-Type": "text/xml; charset=utf-8",
                "Accept": "text/xml",
                "SOAPAction": "" // 🔹 Try empty first — many SOAP servers require this
            },
            timeout: 15000,
        });

        console.log("SOAP Raw Response:", response.data);

        if (!response.data) {
            return createResponse(res, 400, "Something went wrong!", null, false, true);
        }

        const JsonData = await convertXmlToJson(response.data);
        console.log("Parsed JSON Data:", JsonData);

        return createResponse(res, 200, "Data fetched successfully.", JsonData, true, false);

    } catch (error: any) {
        console.error("Error in NewValidateVinData2:", error);
        return createResponse(
            res,
            400,
            "Data fetched unsuccessful.",
            {
                message: error.message || "Unknown Error",
                name: error.name || "Error",
                stack: error.stack || null,
                code: error.code || null,
                status: error.response?.status || null,
                soapResponse: error.response?.data || null, // 🔹 capture SOAP fault
            },
            false,
            true
        );
    }
};

export const TestControllerPhaseTwo = async (req: any, res: any) => {
    try {
        const uploadPath = path.join(__dirname, "..", "uploads");
        console.log("__dirname:", __dirname);
        return createResponse(res, 200, "Data fetched successfully.", { uploadPath, __dirname }, true, false);
    } catch (error: any) {
        console.error("Error in NewValidateVinData2:", error.message || error);
        return createResponse(
            res,
            400,
            "Data fetched unsuccessful.",
            error.message || error,
            false,
            true
        );
    }
};

// ✅ Read VINs from file
const readRequestedVinFile = async () => {
    const uploadPath = path.join(__dirname, "../uploads", "MY.P.CINQ.INPUT.TXT");

    const fileData = await fs.promises.readFile(uploadPath, "utf8");

    const lines = fileData.split(/\r?\n/).filter((line) => line.trim() !== "");

    // Ignore first line and clean up 'D' prefix
    const cleanedVinList = lines.slice(1).map((line) => line.replace(/^D/, "").trim());

    return cleanedVinList;
};

// ✅ Fetch VIN Data from Source 2
export const fetchVinDataFromSourceTwo = async (vin: string) => {
    const soapUrl =
        "https://www.locatortechnologies.com/eventsearchservice/EventSearchService";

    const soapRequestXml = `
    <soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:ess="http://locatortechnologies.com/schemas/ess">
      <soapenv:Header/>
      <soapenv:Body>
        <ess:VinSearchRequest>
          <ess:BaseRequest>
            <ess:AuthInfo>
              <ess:Username>titlealarm</ess:Username>
              <ess:Password>AdkE8y2p</ess:Password>
            </ess:AuthInfo>
            <ess:Version>115</ess:Version>
            <ess:Mode>Test</ess:Mode>
          </ess:BaseRequest>
          <ess:VinSearch>
            <ess:Vin>${vin}</ess:Vin>
          </ess:VinSearch>
        </ess:VinSearchRequest>
      </soapenv:Body>
    </soapenv:Envelope>
  `;

    try {
        const response = await axios.post(soapUrl, soapRequestXml, {
            headers: {
                "Content-Type": "text/xml; charset=utf-8",
                Accept: "text/xml",
                SOAPAction: "",
            },
            timeout: 15000,
        });

        const jsonData = await convertXmlToJson(response.data);
        return jsonData;
    } catch (err: any) {
        console.error("Error fetching VIN data:", err.message);
        return {};
    }
};

// ✅ Format events from SOAP response
export const formatVinEvents = (eventsData: any) => {
    const formattedEvents: any[] = [];

    if (eventsData && typeof eventsData === "object") {
        for (const [eventType, eventData] of Object.entries(eventsData)) {
            const processEvent = (item: any) => {
                const base = {
                    vin: item.Vin || item.vin || "",
                    alertType: eventType,
                    lienholder: null,
                    state: null,
                    status: null,
                    itemNumber: null,
                    reason: null,
                    titleBrandDate: null,
                    isRead: false,
                    isOld: false,
                    isDel: false,
                    createdBy: "system",
                    updatedBy: "system",
                };

                switch (eventType) {
                    case "Lien":
                        base.lienholder = item.Lienholder || null;
                        base.titleBrandDate = item.LienDate || null;
                        break;

                    case "Impound":
                        base.state = item.State || null;
                        base.titleBrandDate = item.ImpoundDate || null;
                        break;

                    case "Export":
                        base.state = item.State || null;
                        base.titleBrandDate = item.ExportDate || null;
                        break;

                    case "StolenSummary":
                        base.state = item.State || null;
                        base.status = item.Status || null;
                        base.titleBrandDate = item.LastEventDate || null;
                        break;

                    case "EbayAuction":
                        base.itemNumber = item.ItemNumber || null;
                        base.titleBrandDate = item.AuctionDate || null;
                        break;

                    case "Recall":
                        base.reason = item.Reason || null;
                        base.titleBrandDate = item.RecallDate || null;
                        break;

                    case "CustomsInquiry":
                        base.titleBrandDate = item.SearchDate || null;
                        break;
                }

                formattedEvents.push(base);
            };

            if (Array.isArray(eventData)) {
                eventData.forEach(processEvent);
            } else if (typeof eventData === "object" && eventData !== null) {
                processEvent(eventData);
            }
        }
    }

    return formattedEvents;
};

// ✅ Save formatted events into DB
export const saveVinEventsToDb = async (formattedEvents: any[]) => {
    try {
        const vinRecords = formattedEvents.map((event) =>
            VinDataTemp.create({
                vin: event.vin,
                alertType: event.alertType,
                lienholder: event.lienholder,
                state: event.state,
                status: event.status,
                itemNumber: event.itemNumber,
                reason: event.reason,
                titleBrandDate: event.titleBrandDate,
                isRead: event.isRead,
                isOld: event.isOld,
                isDel: event.isDel,
                createdBy: event.createdBy,
                updatedBy: event.updatedBy,
            })
        );

        await VinDataTemp.save(vinRecords);

        return {
            status: 200,
            message: "VIN event records saved successfully.",
            count: vinRecords.length,
        };
    } catch (error: any) {
        console.error("Error saving VIN events:", error);
        return {
            status: 500,
            message: "Error saving VIN event records.",
            error: error.message,
        };
    }
};

// ✅ Main process to send VIN requests and store data
export const sendVinRequestToDataSourceTwo = async (vinList: string[]) => {
    for (const vin of vinList) {
        const result = await fetchVinDataFromSourceTwo(vin);

        if (result?.events && typeof result.events === "object") {
            const formattedEvents = formatVinEvents(result.events);
            await saveVinEventsToDb(formattedEvents);
        }
    }

    return {
        status: 200,
        message: "All VINs processed successfully.",
    };
};

// ✅ Controller Entry Function
export const getDataFromSourceTwo = async () => {
    try {
        const requestedVinList = await readRequestedVinFile();
        const result = await sendVinRequestToDataSourceTwo(requestedVinList);
        return result;
    } catch (err) {
        console.error("Error reading VIN file:", err);
        return [];
    }
};

///COmpare logic 
export const dataCompareForDataSource2 = async () => {
    await LienDataCompare();
    await ImpoundDataCompare();
    await ExportDataCompare();
    await StolenSummaryDataCompare();
    await EbayAuctionDataCompare();
    await RecallDataCompare();
    await CustomsInquiryDataCompare();
    await truncateTable(VinData);
    await copyDataFromVinDataTemp();
    await truncateTable(VinDataTemp);
}


export const getDataForCsvDownload = async (req: any, res: any) => {
  try {
    // Fetch VehicleData
    const vehicleData = await VehicleData.createQueryBuilder("vd")
      .select([
        "vd.*",                     // select all columns from VehicleData
        "masterbrand.name AS brand", // mapped brand name
        "masterstate.name AS state"  // mapped state code
      ])
      .leftJoin(MasterBrand, "masterbrand", "vd.brand = masterbrand.code")
      .leftJoin(MasterState, "masterstate", "vd.state = masterstate.code")
      .getRawMany();

    // Fetch VinData
    const vinData = await VinData.createQueryBuilder("vd")
      .select([
        "vd.*",                      // select all columns from VinData
        // "masterbrand.name AS brand",  // mapped brand name
        "masterstate.name AS state"   // mapped state code
      ])
      // Replace vd.brand_code with the actual brand column in VinData
    //   .leftJoin(MasterBrand, "masterbrand", "vd.brand = masterbrand.code")
      .leftJoin(MasterState, "masterstate", "vd.state = masterstate.code")
      .getRawMany();

    // Merge VehicleData and VinData
    const result = await mergeDataOfAlerts(vehicleData, vinData);

    return createResponse(res, 200, "Data fetched successfully.", result, true, false);
  } catch (error: any) {
    console.error("Error in getDataForCsvDownload:", error);
    return createResponse(
      res,
      400,
      "Data fetched unsuccessful.",
      { message: error.message || "Unknown Error" },
      false,
      true
    );
  }
};