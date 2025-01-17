
import https from 'https';
import axios from 'axios';
import fs from 'fs';
import { createResponse } from "../helpers/response";


export const SoapToken = async (req: any, res: any) => {
     try {
        const soapUrl = "https://authentication-rest-cert.aamva.org/Authentication/authenticate"; // Replace with the actual SOAP service URL
       /* const soapRequestXml = `
        <soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:web="https://authentication-rest-cert.aamva.org/Authentication/authenticate">
            <soapenv:Header/>
            <soapenv:Body>
                <web:GetTokenRequest/>
            </soapenv:Body>
        </soapenv:Envelope>`; */

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
       const soapUrl = "https://vehiclesystems-cert.aamva.org/Vehicles/NMVTIS/ConsumerAccess/search"; // Replace with the actual SOAP service URL
       const soapRequestXml = `<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:ca="http://schemas.aamva.org/Vehicles/NMVTIS/ConsumerAccess">
                                <soapenv:Header>
                                    <ca:AuthenticationToken>
                                        <ca:Token>${token}</ca:Token>
                                    </ca:AuthenticationToken>
                                </soapenv:Header>
                                <soapenv:Body>
                                    <ca:Search>
                                        <ca:SearchRequest>
                                            <ca:VehicleIdentification>${vin}</ca:VehicleIdentification>
                                        </ca:SearchRequest>
                                    </ca:Search>
                                </soapenv:Body>
                                </soapenv:Envelope>`; 

      
       // Make the SOAP request
       const response = await axios.post(soapUrl,soapRequestXml, {
           headers: {
               "Content-Type": "text/xml;charset=UTF-8",
               "SOAPAction": "https://vehiclesystems-cert.aamva.org/Vehicles/NMVTIS/ConsumerAccess/search", // Replace with the appropriate SOAPAction if needed
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