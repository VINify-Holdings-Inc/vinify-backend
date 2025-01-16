
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
       // console.error("Error fetching token:", error);

       
        return createResponse(res, 400, "Token fetched successfully.", error, true, false);
    }
};