import { Client } from "basic-ftp";
import path from "path";
import fs from "fs"; 
import { ReadTheTxtFomatJson } from "../helpers/ReadTxtFile";
import { insertBulkSheetData } from "./StoreNewPreviousData"; 

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
    console.log("✅ File uploaded successfully to FTP.");
  } catch (error) {
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

    const uploadedFile = req.files.file as any;
    const uploadPath = path.join(__dirname, "../uploads", uploadedFile.name);

    await uploadedFile.mv(uploadPath);
    await uploadToFTP(uploadPath, uploadedFile.name);
    
    return res.status(200).json({ message: "File uploaded successfully!" });
  } catch (error) {
    console.error("❌ Upload Error:", error);
    return res.status(500).json({ error: "File upload failed." });
  }
};

export const FTPReadAllController = async () => {
  const client = new Client();
  client.ftp.verbose = true;

  try {
    await client.access(ftpConfig);
    await client.ensureDir("/");

    const fileList = await client.list("/");
    if (!fileList.length) {
      console.log("No files found on FTP server.");
      return;
    }

    const targetFile = fileList.find(file => file.type === 1 && file.name === "MY.T.CINQ.TITLE.txt");
    if (!targetFile) {
      console.log("Target file not found on FTP server.");
      return;
    }

    const localPath = path.join(__dirname, "../AAMVAFTP", targetFile.name);
    await client.downloadTo(localPath, `/${targetFile.name}`);
    console.log(`✅ File ${targetFile.name} downloaded successfully.`);

    if (!fs.existsSync(localPath)) {
      console.log("Downloaded file not found in local directory.");
      return;
    }

    const fileContent = fs.readFileSync(localPath, "utf8").replace(/\r\n/g, "\n");
    const parsedData = await ReadTheTxtFomatJson(fileContent);
    await insertBulkSheetData(parsedData);
    console.log("✅ Data inserted successfully from file.");
  } catch (error) {
    console.error("❌ FTP Read All Error:", error);
  } finally {
    client.close();
  }
};

 
