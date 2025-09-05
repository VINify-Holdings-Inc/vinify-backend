import { createResponse } from "../helpers/response";
import axios from "axios";
import { parseStringPromise } from "xml2js";

const convertXmlToJson = async (data: string): Promise<any> => {
    try {
        const result = await parseStringPromise(data, {
            explicitArray: false, // Prevents wrapping single elements in arrays
            ignoreAttrs: true     // Ignores attributes
        });

        const envelope = result?.Envelope || result?.["s:Envelope"];
        const body = envelope?.Body || envelope?.["s:Body"];
        const response =
            body?.GetConsumerVehicleDataResponse ||
            body?.["GetConsumerVehicleDataResponse"];
        const resultData =
            response?.GetConsumerVehicleDataResult ||
            response?.["GetConsumerVehicleDataResult"];

        return resultData ? JSON.stringify(resultData, null, 2) : null;
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

            const soapUrl = "https://www.locatortechnologies.com/eventsearchservice/EventSearchService";
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
                "Content-Type": "text/xml;charset=UTF-8",
                "SOAPAction": "http://locatortechnologies.com/schemas/ess/VinSearchRequest"
            },
            timeout: 15000,
        });


        if (!response.data) {
            return createResponse(res, 400, "Something went wrong!", null, false, true);
        }

        console.log(response.data, "SOAP Raw Response");

        const JsonData = await convertXmlToJson(response.data);

        console.log(JsonData, "Parsed JSON Data");

        return createResponse(res, 200, "Data fetched successfully.", JsonData, true, false);
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
