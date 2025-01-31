
import https from 'https';
import axios from 'axios';
import fs from 'fs';
import { createResponse } from "../helpers/response";


export const SoapToken = async (req: any, res: any) => {
     try {
        const soapUrl = "https://authentication-rest-cert.aamva.org/Authentication/authenticate"; // Replace with the actual SOAP service URL
       

        const httpsAgent = new https.Agent({
            cert: fs.readFileSync("./certificates/TAAMVAcert-file.pem"),
            key: fs.readFileSync("./certificates/TAAAMVA.pem"),
            rejectUnauthorized: true, // Set to false for self-signed certificates (not recommended for production)
        });

        // Make the SOAP request
        const response = await axios.get(soapUrl, {
            headers: {
                "Content-Type": "text/xml;charset=UTF-8",
                "SOAPAction": "https://authentication-rest-cert.aamva.org/Authentication/authenticate", // Replace with the appropriate SOAPAction if needed
            },
            httpsAgent,
        });

        // Check if the response contains the expected token data
        if (!response.data) {
            return response.data;
        }

        return createResponse(res, 200, "Token fetched successfully.", response.data, true, false);
    } catch (error: any) {
          
        return createResponse(res, 400, "Token fetched unsuccessful.", error.message, true, false);
    }
};





export const ValidateVinData = async (req: any, res: any) => {
    try {
        console.log("test",req.body);
        const token = req.body.token;
        const vin = req.body.vin;
        const gapCode = req.body.gap;
       const soapUrl = "https://vehiclesystems-cert.aamva.org/Vehicles/ConsumerAccess/2.0/GetData.svc"; // Replace with the actual SOAP service URL
       const soapRequestXml = ` <soap:Envelope xmlns:soap="http://www.w3.org/2003/05/soap-envelope" xmlns:ns="http://aamva.org/nmvtis/ews/3.1.0" xmlns:ns1="http://niem.gov/niem/niem-core/2.0" xmlns:ns2="http://aamva.org/xsd/aamva/extensionsExt/1.0">
                                    <soap:Header/>
                                    <soap:Body>
                                        <ns:GetConsumerVehicleData>
                                            <ns:token>${token}</ns:token>
                                            <ns:GetConsumerVehicleDataRequest>
                                                <ns1:VehicleIdentification>
                                                <ns1:IdentificationID>${vin}</ns1:IdentificationID>
                                                </ns1:VehicleIdentification>
                                                <ns2:ConsumerIdentification>
                                                <ns1:IdentificationID></ns1:IdentificationID>
                                                </ns2:ConsumerIdentification>
                                                <ns2:MessageOriginatorID>${gapCode}</ns2:MessageOriginatorID>
                                            </ns:GetConsumerVehicleDataRequest>
                                        </ns:GetConsumerVehicleData>
                                    </soap:Body>
                                    </soap:Envelope>`; 

      
       // Make the SOAP request
       const response = await axios.post(soapUrl,soapRequestXml, {
           headers: {
               "Content-Type": "application/soap+xml",
               "SOAPAction": "https://vehiclesystems-cert.aamva.org/Vehicles/ConsumerAccess/2.0/GetData.svc", // Replace with the appropriate SOAPAction if needed
            },
          
       });

       // Check if the response contains the expected token data
       if (!response.data) {
           return response.data;
       }

       return createResponse(res, 200, "Data fetched successfully.", response.data, true, false);
   } catch (error: any) {
         
       return createResponse(res, 400, "Data fetched unsuccessful.", error, true, false);
   }
};



export const NewValidateVinData = async (req: any, res: any) => {
    try {
        console.log("test", req.body);
        const { token, vin, gap } = req.body;
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
                <MessageOriginatorID xmlns="http://aamva.org/xsd/aamva/extensionsExt/1.0">${gap}</MessageOriginatorID>
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
            return response.data;
        }

        return createResponse(res, 200, "Data fetched successfully.", response.data, true, false);
    } catch (error: any) {
        return createResponse(res, 400, "Data fetched unsuccessful.", error, true, false);
    }
};