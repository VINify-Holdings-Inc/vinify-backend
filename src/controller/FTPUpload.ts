import fs from "fs";
import path from "path";
import SftpClient from "ssh2-sftp-client";
import dotenv from "dotenv";
dotenv.config();

import {
  parseVehicleDataBrandStream,
  parseVehicleDataJSIStream,
  ReadTheTxtFormatJsonStream,
} from "../helpers/ReadTxtFile";

import { VehicleDataTemp } from "../Entities/vehicle_data_temp";
import { correctedData } from "../helpers/DashBoardHelpers";
import { DashboardDataList } from "../Entities/DashboardDataList";

import {
  BrandDataCompare,
  copyDataFromVehicleDataTemp,
  insertDashboardDataList,
  JSIDataCompare,
  TitleDataCompare,
} from "../helpers/CompareAndStoreData";

import { VehicleData } from "../Entities/vehicle_data";
import { truncateTable } from "../helpers/CompareHelpers";
import { updateLastFileProcess } from "../helpers/UpdateLastRecord";
// import {
//   dataCompareForDataSource2,
//   //  dataCompareForDataSource2,
//   getDataFromSourceTwo
// } from "./phase2test";

// SFTP config
const sftpConfig = {
  host: process.env.FTP_HOST!,
  port: parseInt(process.env.FTP_PORT || "22"),
  username: process.env.FTP_USERNAME!,
  password: process.env.FTP_PASSWORD!,
};

// Create a new SFTP client instance
const createSftpClient = () => new SftpClient();

// Upload to SFTP
export const uploadToFTP = async (filePath: string, fileName: string) => {
  const sftp = createSftpClient();

  try {
    await sftp.connect(sftpConfig);
    // Remove trailing slashes from the path (e.g. "/folder///" -> "/folder")
    const remotePath = (process.env.FTP_INPUT_PATH || "/").replace(/\/+$/, "");

    const remoteFilePath = `${remotePath}/${fileName}`.replace(/\/{2,}/g, "/");
    await sftp.put(filePath, remoteFilePath);
    console.log(`✅ SFTP Upload Success: ${remoteFilePath}`);
  } catch (error) {
    console.error("❌ SFTP Upload Error:", error);
    throw error;
  } finally {
    await sftp.end();
  }
};


// Upload File Endpoint
export const FTPController = async (req: any, res: any) => {
  try {
    if (!req.files || !req.files.file) {
      console.warn("⚠️ No file uploaded in request.");
      return res.status(400).json({ error: "No file uploaded." });
    }

    const uploadedFile = req.files.file;
    const uploadPath = path.join(__dirname, "../uploads", uploadedFile.name);

    await uploadedFile.mv(uploadPath);
    await uploadToFTP(uploadPath, uploadedFile.name);

    // 💤 Wait 60 seconds before continuing
    await new Promise(resolve => setTimeout(resolve, 60000));

    // 🚀 Now call the delayed functions
    await FTPReadAllControllerRead();
    // await getDataFromSourceTwo();
    // await dataCompareForDataSource2();

    // ✅ Now finally send response after 60 seconds
    return res.json({
      code: 200,
      message: "File uploaded and processed after 60 seconds.",
      success: true,
      error: false,
    });

  } catch (error) {
    console.error("❌ Upload Error:", error);
    return res.status(500).json({ error: "File upload failed." });
  }
};




// Retry wrapper
const retryOperation = async (operation: Function, retries: number = 3) => {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      console.error(`Attempt ${attempt} failed:`, error);
      if (attempt === retries) throw error;
    }
  }
};

// Remove old SFTP output files
export const removeAllFilesFromSFTP = async (sftp: SftpClient) => {
  try {
    const remotePath = process.env.FTP_OUTPUT_PATH || "/";
    const fileList = await sftp.list(remotePath);

    for (const file of fileList) {
      if (file.type !== "d") { // skip directories
        const filePath = path.posix.join(remotePath, file.name);
        await sftp.delete(filePath);
      }
    }
  } catch (error) {
    console.error("❌ Error while deleting SFTP files:", error);
  }
};

// Format header
const formatNumber = (data: any[]) => {
  const totalCount = data?.length || 0;
  const numDigits = totalCount.toString().length;
  const spaces = " ".repeat(9 - numDigits);
  return spaces + totalCount;
};

// Create & Upload VIN TXT file
export const CreateVinTxtFileAndUpload = async (req: any, res: any) => {
  try {
    const { data = [] } = req.body;
    const totalCount = formatNumber(data);
    const todayDate = new Date().toISOString().slice(0, 10).replace(/-/g, "");
    const firstLine = `CMY${totalCount}${todayDate}`;
    const fileContent = [firstLine, ...data.map((item: any) => `D${item}`)].join("\n");

    const uploadPath = path.join(__dirname, "../uploads", process.env.FTP_INPUT_FILE!);
    fs.writeFileSync(uploadPath, fileContent, "utf8");

    await uploadToFTP(uploadPath, process.env.FTP_INPUT_FILE!);
    await new Promise((resolve) => setTimeout(resolve, 45000));

    await FTPReadAllControllerRead();

    return res.json({
      code: 200,
      message: "File uploaded and processed successfully!",
      success: true,
      error: false,
    });
  } catch (error) {
    console.error("❌ Error in CreateVinTxtFileAndUpload:", error);
    res.status(500).json({ error: "Failed to process VIN TXT file" });
  }
};

const downloadFile = async (sftp: SftpClient, targetFileName: string): Promise<string | null> => {
  // Normalize remote dir
  const remoteDir = (process.env.FTP_OUTPUT_PATH || "/Output").replace(/\/+$/, "");

  // Build remote file path without double slashes
  const remoteFilePath = `${remoteDir}/${targetFileName}`.replace(/\/{2,}/g, "/");

  // Check if file exists on SFTP server
  const fileExists = await sftp.exists(remoteFilePath);
  if (!fileExists) {
    console.warn(`⚠️ File not found on SFTP: ${remoteFilePath}`);
    return null;
  }

  // Local save path
  const localPath = path.join(__dirname, "../AAMVAFTP", targetFileName);

  // Ensure local directory exists
  const localDir = path.dirname(localPath);
  if (!fs.existsSync(localDir)) {
    fs.mkdirSync(localDir, { recursive: true });
  }

  await retryOperation(() => sftp.fastGet(remoteFilePath, localPath));

  return localPath;
};

// Batch insert
const batchInsert = async (data: any[], batchSize = 1000) => {
  for (let i = 0; i < data.length; i += batchSize) {
    const chunk = data.slice(i, i + batchSize);
    await VehicleDataTemp.save(chunk);
  }
};

// Read all files & process
export const FTPReadAllControllerRead = async () => {
  const sftp = createSftpClient();

  try {
    await sftp.connect(sftpConfig); 

    const filePathTitle = await downloadFile(sftp, process.env.FTP_TITLE_FILE!);
    const filePathBrand = await downloadFile(sftp, process.env.FTP_BRAND_FILE!);
    const filePathJSI = await downloadFile(sftp, process.env.FTP_JSI_FILE!);

    // If any file is missing, return early
    if (!filePathTitle || !filePathBrand || !filePathJSI) {
      console.warn("⚠️ One or more files not found on SFTP. Skipping processing.");
      
      return;
    }

    const titleContent = await ReadTheTxtFormatJsonStream(filePathTitle);
    const brandContent = await parseVehicleDataBrandStream(filePathBrand);
    const jsiContent = await parseVehicleDataJSIStream(filePathJSI); 

    await removeAllFilesFromSFTP(sftp);

    await batchInsert(titleContent);
    await batchInsert(brandContent);
    await batchInsert(jsiContent);

    await TitleDataCompare();
    await BrandDataCompare();
    await JSIDataCompare();

    await truncateTable(VehicleData);
    await truncateTable(DashboardDataList);

    await copyDataFromVehicleDataTemp();
    await updateLastFileProcess();
    await insertDashboardDataList();
    await truncateTable(VehicleDataTemp);

    return;
  } catch (error) {
    console.error("❌ SFTP Read All Error:", error);
  } finally {
    await sftp.end();
  }
};

// Manual trigger for cron
export const testR = async (req: any, res: any) => {
  try {
    console.log("in#########");

    await FTPReadAllControllerRead();
    console.log("out#########");
    //const resultSource2= await getDataFromSourceTwo()
    /// await dataCompareForDataSource2()
    return res.json({ code: 200, message: "Cron executed", data: [], success: true, error: false });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// Apply corrections from temp data
export const testResultController = async (req: any, res: any) => {
  try {
    const data = await VehicleDataTemp.find();
    const final = await correctedData(data);
    await DashboardDataList.save(final);

    return res.json({ code: 200, message: "Result saved", success: true, error: false });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};
