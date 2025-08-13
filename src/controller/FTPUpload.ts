import fs from "fs";
import path from "path";
import { Client } from "basic-ftp";
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

// FTP config
const ftpConfig = {
  host: process.env.FTP_HOST!,
  user: process.env.FTP_USERNAME!,
  password: process.env.FTP_PASSWORD!,
  secure: true,
};

// Upload to FTP
export const uploadToFTP = async (filePath: string, fileName: string) => {
  const client = new Client();
  client.ftp.verbose = true;

  try {
    console.log("🔌 Connecting to FTP...");
    await client.access(ftpConfig);

    // Remove trailing slashes from the FTP path (e.g. "/folder///" -> "/folder")
    const ftpPath = (process.env.FTP_INPUT_PATH || "/").replace(/\/+$/, "");

    console.log("📁 Ensuring directory:", ftpPath);
    await client.ensureDir(ftpPath);

    const remotePath = `${ftpPath}/${fileName}`; // This now safely becomes "/filename" without double slashes
    console.log(`📤 Uploading file from ${filePath} to ${remotePath}`);

    await client.uploadFrom(filePath, remotePath);
    console.log("✅ Upload successful!");
  } catch (error) {
    console.error("❌ FTP Upload Error:", error);
    throw error;
  } finally {
    client.close();
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
    console.log("📥 Saving file to:", uploadPath);
    await uploadedFile.mv(uploadPath);

    console.log("⏫ Uploading to FTP...");
    await uploadToFTP(uploadPath, uploadedFile.name);

    return res.json({
      code: 200,
      message: "File uploaded successfully!",
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

// Remove old FTP output files
export const removeAllFilesFromFTP = async (client: Client) => {
  try {
    const ftpPath = process.env.FTP_OUTPUT_PATH || "/";
    const fileList = await client.list(ftpPath);

    for (const file of fileList) {
      const remotePath = path.posix.join(ftpPath, file.name); // use posix for FTP paths
      await client.remove(remotePath);
    }
  } catch (error) {
    console.error("❌ Error while deleting FTP files:", error);
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

const downloadFile = async (client: Client, targetFileName: string) => {
  await client.access(ftpConfig);

  // Normalize remote dir
  const remoteDir = (process.env.FTP_OUTPUT_PATH || "/Output").replace(/\/+$/, "");
  await client.ensureDir(remoteDir);

  // Build remote file path without double slashes
  const remoteFilePath = `${remoteDir}/${targetFileName}`.replace(/\/{2,}/g, "/");

  // Local save path
  const localPath = path.join(__dirname, "../AAMVAFTP", targetFileName);

  await retryOperation(() => client.downloadTo(localPath, remoteFilePath));

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
  const client: any = new Client();
  client.ftp.verbose = true;
  client.ftp.keepAlive = 10000;
  client.ftp.timeout = 30000;

  try {
    const filePathTitle = await downloadFile(client, process.env.FTP_TITLE_FILE!);
    const filePathBrand = await downloadFile(client, process.env.FTP_BRAND_FILE!);
    const filePathJSI = await downloadFile(client, process.env.FTP_JSI_FILE!);

    const titleContent = await ReadTheTxtFormatJsonStream(filePathTitle);
    const brandContent = await parseVehicleDataBrandStream(filePathBrand);
    const jsiContent = await parseVehicleDataJSIStream(filePathJSI);

    await removeAllFilesFromFTP(client);

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
    console.error("❌ FTP Read All Error:", error);
  } finally {
    client.close();
  }
};

// Manual trigger for cron
export const testR = async (req: any, res: any) => {
  try {
    await FTPReadAllControllerRead();
    return res.json({ code: 200, message: "Cron executed", success: true, error: false });
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
