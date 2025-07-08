import fs from "fs";
import path from "path";
import { Client } from "basic-ftp";

import { parseVehicleDataBrandStream, parseVehicleDataJSIStream, ReadTheTxtFormatJsonStream } from "../helpers/ReadTxtFile";
import { VehicleDataTemp } from "../Entities/vehicle_data_temp";
import { correctedData } from "../helpers/DashBoardHelpers";
import { DashboardDataList } from "../Entities/DashboardDataList";
import { BrandDataCompare, copyDataFromVehicleDataTemp, JSIDataCompare, TitleDataCompare } from "../helpers/CompareAndStoreData";
import { VehicleData } from "../Entities/vehicle_data";
import { truncateTable } from "../helpers/CompareHelpers";
import { updateLastFileProcess } from "../helpers/UpdateLastRecord";
// import { TitleDataCompare } from "../helpers/CompareAndStoreData";

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
      await FTPReadAllControllerRead();

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

const downloadFile = async (client: any, targetFileName: string) => {
  await client.access(ftpConfig);
  await client.ensureDir("/");
  const localPath = path.join(__dirname, "../AAMVAFTP", targetFileName);
  await retryOperation(() => client.downloadTo(localPath, `/${targetFileName}`));
  console.log(`✅ File ${targetFileName} downloaded successfully.`);
  return localPath;
};

const batchInsert = async (data: any[], batchSize: number = 1000) => {
  for (let i = 0; i < data.length; i += batchSize) {
    const chunk = data.slice(i, i + batchSize);
    await VehicleDataTemp.save(chunk);
  }
};

export const FTPReadAllControllerRead = async () => {
  const client: any = new Client();
  client.ftp.verbose = true;
  client.ftp.keepAlive = 10000;
  client.ftp.timeout = 30000;

  try {
    const filePath = await downloadFile(client, "MY.T.CINQ.TITLE.txt");
    const titleContent = await ReadTheTxtFormatJsonStream(filePath);
    const fileContentBrand = await downloadFile(client, "MY.T.CINQ.BRAND.txt");
    const brandContent = await parseVehicleDataBrandStream(fileContentBrand);
    const fileContentJsi = await downloadFile(client, "MY.T.CINQ.JSI.txt");
    const JsiContent = await parseVehicleDataJSIStream(fileContentJsi);
    await removeAllFilesFromFTP(client); 
    await batchInsert(titleContent);
    await batchInsert(brandContent);
    await batchInsert(JsiContent);
    await TitleDataCompare();
    await BrandDataCompare()
    await JSIDataCompare();
    await truncateTable(VehicleData)
    await truncateTable(DashboardDataList);
    //insery
    await copyDataFromVehicleDataTemp();
    // Updating the last file process record
    await updateLastFileProcess();
    const rawData = await VehicleDataTemp
      .createQueryBuilder("vehicle")
      .select("DISTINCT vehicle.vin", "vin")
      .getRawMany();
    const dasboardFinalData: any = await correctedData(rawData)
    // Saving the corrected dashboard data into the DashboardDataList table
    await DashboardDataList.save(dasboardFinalData);
    await truncateTable(VehicleDataTemp)
    return; // ✅ success path
  } catch (error) {
    console.error("❌ FTP Read All Error:", error);
    return []; // ✅ return an empty array or null in case of error
  } finally {
    await client.close();
  }
};


export const testR = async (req: any, res: any) => {
  try {
    await FTPReadAllControllerRead();
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
