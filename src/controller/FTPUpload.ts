import { Client } from "basic-ftp";
import path from "path";
import fs from "fs";
import { parseVehicleDataJSI, parseVehicleDataBrand, ReadTheTxtFomatJson} from "../helpers/ReadTxtFile"; 
import { insertBulkSheetData } from "./StoreDataInTable"; 
import { deleteISDelItem } from "../helpers/CompareHelpers"; 
import { VehicleData } from "../Entities/vehicle_data";
import { VehicleDataTemp } from "../Entities/vehicle_data_temp";
import { correctedData } from "../helpers/DashBoardHelpers";
import { DashboardDataList } from "../Entities/DashboardDataList";

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
    // Check if the file is provided in the request
    if (!req.files || !req.files.file) {
      return res.status(400).json({ error: "No file uploaded." });
    }

    // Retrieve the uploaded file from the request
    const uploadedFile = req.files.file;

    // Define the path to save the file locally
    const uploadPath = path.join(__dirname, "../uploads", uploadedFile.name);

    // Move the file to the server's local 'uploads' directory
    await uploadedFile.mv(uploadPath);

    // Upload the file to the FTP server
    await uploadToFTP(uploadPath, uploadedFile.name); 
    
    // Respond with a success message if the file is uploaded and transferred successfully
    return res.json({ code: 200, message: "File uploaded successfully!", success: true, error: false });
  } catch (error) {
    // tslint:disable-next-line:no-console
    console.error("❌ Upload Error:", error);

    // Respond with an error if the upload process fails
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
      // console.log(`🗑️ Deleted file: ${file.name}`);
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
   // tslint:disable-next-line:no-console
  console.log(`✅ File ${targetFileName} downloaded successfully.`);
  if (!fs.existsSync(localPath)) { 

    return null;
  }

  return fs.readFileSync(localPath, "utf8").replace(/\r\n/g, "\n");
};

export const FTPReadAllController = async () => {
  const client: any = new Client();
  client.ftp.verbose = true; // Enable verbose FTP logging for debugging
  client.ftp.keepAlive = 10000; // Set FTP keep-alive interval to avoid timeouts
  client.ftp.timeout = 30000; // Set FTP timeout to 30 seconds

  try {
    // Download and read the Title file from the FTP server
    const fileContentTitle = await downloadAndReadFile(client, "MY.T.CINQ.TITLE.txt");
    const titleContent = await ReadTheTxtFomatJson(fileContentTitle); // Parse the Title file content

    // Download and read the Brand file from the FTP server
    const fileContentBrand = await downloadAndReadFile(client, "MY.T.CINQ.BRAND.txt");
    const brandContent = await parseVehicleDataBrand(fileContentBrand); // Parse the Brand file content

    // Download and read the JSI file from the FTP server
    const fileContentJsi = await downloadAndReadFile(client, "MY.T.CINQ.JSI.txt");
    const JsiContent = await parseVehicleDataJSI(fileContentJsi); // Parse the JSI file content

    // Delete any items that are marked as deleted in VehicleData
    await deleteISDelItem(VehicleData);
    await deleteISDelItem(VehicleDataTemp);

    // Insert the parsed data into the database
    await insertBulkSheetData(titleContent, brandContent, JsiContent);

    // Remove all files from the FTP server after processing
    await removeAllFilesFromFTP(client);

    return; // Finish execution
  } catch (error) {
    // tslint:disable-next-line:no-console
    console.error("❌ FTP Read All Error:", error); // Log any errors that occur during the process
  } finally {
    // Ensure the FTP client is closed after processing is complete
    await client.close();
  }
};

export const testR = async (req: any, res: any) => {
  try { 
    await FTPReadAllController(); 
    // console.log("after cron");
    
    return res.json({ code: 200, message: "cron done ", success: true, error: false });
  } catch (error) {
     // tslint:disable-next-line:no-console
    console.error("Error fetching data:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const testResultController = async (req: any, res: any) => {
  try { 
   const data: any = await VehicleDataTemp.find();
   const final: any = await correctedData(data);
   await DashboardDataList.save(final);

   return res.json({ code: 200, message: "cron done ", success: true, error: false });
  } catch (error) {
     // tslint:disable-next-line:no-console
    console.error("Error fetching data:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};
