import { Client } from "basic-ftp";
import path from "path";
import fs from "fs";
import { parseVehicleDataJSI } from "../helpers/ReadTxtFile";
import { parseVehicleDataBrand } from "../helpers/ReadTxtFile";
import { ReadTheTxtFomatJson } from "../helpers/ReadTxtFile";
import { insertBulkSheetData } from "./StoreDataInTable";
import { VehicleData } from "../Entities/vehicle_data";
import { MasterState } from "../Entities/master_state";
import { MasterBrand } from "../Entities/master_brand";
import { correctedData } from "../helpers/DashBoardHelpers";
import { MESSAGES } from "../helpers/constants";
import { createResponse } from "../helpers/response";

const ftpConfig = {
  host: "ftp-cert.aamva.org",
  user: "nmvtis-my-test",
  password: "?a6uk4Zzzm--um3v",
  secure: true,
};

export const uploadToFTP = async (filePath: string, fileName: string) => {
  const client = new Client();
  client.ftp.verbose = true;

  try {
    await client.access(ftpConfig);
    await client.ensureDir("/");
    await client.uploadFrom(filePath, `/${fileName}`);
    // tslint:disable-next-line:no-console
    console.log("✅ File uploaded successfully to FTP.");
  } catch (error) {
    // tslint:disable-next-line:no-console
    console.error("❌ FTP Upload Error:", error);
    throw error;
  } finally {
    client.close();
  }
};

export const FTPController = async (req: any, res: any) => {
  try {
    if (!req.files || !req.files.file) {
      return res.status(400).json({ error: "No file uploaded." });
    }

    const uploadedFile = req.files.file;
    const uploadPath = path.join(__dirname, "../uploads", uploadedFile.name);

    await uploadedFile.mv(uploadPath);
    await uploadToFTP(uploadPath, uploadedFile.name);

    await new Promise(resolve => setTimeout(resolve, 45000));
    try {
      await FTPReadAllController();
    } catch (error) {
      // tslint:disable-next-line:no-console
      console.error("❌ Error reading from FTP:", error);

      return res.status(500).json({ error: "Failed to read from FTP", success: false });
    }

    return res.json({ code: 200, message: "File uploaded successfully!", success: true, error: false });
  } catch (error) {
    // tslint:disable-next-line:no-console
    console.error("❌ Upload Error:", error);

    return res.status(500).json({ error: "File upload failed." });
  }
};
const retryOperation = async (operation: Function, retries: number = 3) => {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      // tslint:disable-next-line:no-console
      console.error(`Attempt ${attempt} failed:`, error);
      if (attempt === retries) throw error;
    }
  }
};
export const removeAllFilesFromFTP = async (client: any) => {
  try {
    const fileList = await client.list("/"); // Get all files in root directory
    for (const file of fileList) {
      await client.remove(`/${file.name}`); // Delete each file
      // tslint:disable-next-line:no-console
      console.log(`🗑️ Deleted file: ${file.name}`);
    }
  } catch (error: any) {
    // tslint:disable-next-line:no-console
    console.error("❌ Error while deleting files from FTP:", error);
  }
};

const formatNumber = (data: any) => {
  const totalCount = data?.length || 0; // Handle null/undefined cases
  const numDigits = totalCount.toString().length; // Count digits in totalCount
  const numSpaces = 9 - numDigits; // Ensure correct spacing
  const spaces = " ".repeat(numSpaces);

  return spaces + totalCount;
};
export const CreateVinTxtFileAndUpload = async (req: any, res: any) => {
  try {
    const { data = [1, 2, 3, 4, 5, 6, 7] } = req.body;
    const totalCount = await formatNumber(data);
    const todayDate = new Date().toISOString().slice(0, 10).replace(/-/g, "");
    const firstLine = `CMY${totalCount}${todayDate}`;
    const fileContent = [firstLine, ...data.map((item: any) => `D${item}`)].join("\n");
    const uploadPath = path.join(__dirname, "../uploads", "MY.T.CINQ.INPUT.TXT");

    // Create the file locally
    fs.writeFileSync(uploadPath, fileContent, "utf8");

    // Upload the file to FTP server
    await uploadToFTP(uploadPath, "MY.T.CINQ.INPUT.TXT");
    await new Promise(resolve => setTimeout(resolve, 45000));

    try {
      await FTPReadAllController();
    } catch (error) {
      // tslint:disable-next-line:no-console
      console.error("❌ Error reading from FTP:", error);

      return res.status(500).json({ error: "Failed to read from FTP", success: false });
    }

    return res.json({ code: 200, message: "File uploaded successfully!", success: true, error: false });
  } catch (error: any) {
    // tslint:disable-next-line:no-console
    console.error("❌ Error creating and uploading VIN TXT file:", error);
    res.status(500).json({ error: "Failed to create and upload the file" });
  }
};

const downloadAndReadFile = async (client: any, targetFileName: any) => {
  await client.access(ftpConfig);
  await client.ensureDir("/");
  const localPath = path.join(__dirname, "../AAMVAFTP", targetFileName);
  // Retry connection in case of failure
  await retryOperation(() => client.downloadTo(localPath, `/${targetFileName}`));
  console.log(`✅ File ${targetFileName} downloaded successfully.`);
  if (!fs.existsSync(localPath)) { 

    return null;
  }

  return fs.readFileSync(localPath, "utf8").replace(/\r\n/g, "\n");
};

export const FTPReadAllController = async () => {
  const client: any = new Client();
  client.ftp.verbose = true;
  client.ftp.keepAlive = 10000;
  client.ftp.timeout = 30000;
  try {
    const fileContentTitle = await downloadAndReadFile(client, "MY.T.CINQ.TITLE.txt");
   const titleContent = await ReadTheTxtFomatJson(fileContentTitle); 
   
    const fileContentBrand = await downloadAndReadFile(client, "MY.T.CINQ.BRAND.txt");
    const brandContent = await parseVehicleDataBrand(fileContentBrand);  
    const fileContentJsi = await downloadAndReadFile(client, "MY.T.CINQ.JSI.txt");
    const JsiContent = await parseVehicleDataJSI(fileContentJsi); 
    await insertBulkSheetData(titleContent, brandContent, JsiContent);

    // await removeAllFilesFromFTP(client);
    return; 
  } catch (error) {
    console.error("❌ FTP Read All Error:", error);
  } finally {
    await client.close();
  }
};

export const testR = async (req: any, res: any) => {
  try { 
    const queryBuilder = VehicleData.createQueryBuilder('vd')
      .select([
        "vd.*",
        "masterstate.name AS state",
        "masterbrand.name AS brand",
      ]) 
      .leftJoin(MasterState, "masterstate", "vd.state = masterstate.code")
      .leftJoin(MasterBrand, "masterbrand", "vd.brand = masterbrand.code")  
      .orderBy("vd.vin", "ASC")  // Ensure vin is the first ORDER BY field
      .addOrderBy("vd.titleBrandDate", "DESC")
      .addOrderBy("vd.createdAt", "DESC") 
      .addOrderBy("vd.alertType", "DESC");
    const result = await queryBuilder.getRawMany();
    const items = await correctedData(result);
    const rawData = await VehicleData.find();
    
 return createResponse(res, 200, MESSAGES?.DATA_FETCH_SUCCESS, { csvData: items, rawData });
    
  } catch (error) {
    console.error("Error fetching data:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};


