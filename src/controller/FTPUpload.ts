import { Client } from "basic-ftp";
import path from "path";
import fs from "fs";

const ftpConfig = {
  host: "ftp-cert.aamva.org",
  user: "nmvtis-my-test",
  password: "?a6uk4Zzzm--um3v",
  secure: true,  
};

export const uploadToFTP = async (filePath:any, fileName:any) => {
  const client = new Client();
  client.ftp.verbose = true;

  try {
    console.log("🔄 Connecting to FTP Server...");
    await client.access(ftpConfig);
    console.log("✅ Connected to FTP Server!");

    await client.ensureDir("/");
    console.log(`📤 Uploading file: ${fileName}...`);
    await client.uploadFrom(filePath, `/${fileName}`);
    console.log("✅ File uploaded successfully!");
  } catch (error) {
    console.error("❌ FTP Upload Error:", error);
    throw error;
  } finally {
    client.close();
  }
};

export const readFromFTP = async (fileName:any) => {
  const client = new Client();
  client.ftp.verbose = true;

  try {
    console.log("🔄 Connecting to FTP Server...");
    await client.access(ftpConfig);
    console.log("✅ Connected to FTP Server!");

    await client.ensureDir("/");
    const tempPath = path.join(__dirname, fileName);
    await client.downloadTo(tempPath, `/${fileName}`);

    const fileBuffer = fs.readFileSync(tempPath);
    fs.unlinkSync(tempPath);
    return fileBuffer;
  } catch (error) {
    console.error("❌ FTP Read Error:", error);
    throw error;
  } finally {
    client.close();
  }
};

export const FTPController = async (req:any, res:any) => {
  try {
    if (!req.files || !req.files.file) {
      return res.status(400).json({ error: "No file uploaded." });
    }

    const uploadedFile = req.files.file;
    const uploadPath = path.join(__dirname, uploadedFile.name);

    await uploadedFile.mv(uploadPath);
    console.log(`📁 File saved locally: ${uploadPath}`);

    await uploadToFTP(uploadPath, uploadedFile.name);
    fs.unlinkSync(uploadPath);
    console.log(`🗑️ Deleted local temporary file: ${uploadPath}`);

    const result = await readFromFTP(uploadedFile.name);
    res.status(200).json({ message: "File uploaded successfully!", data: result });
  } catch (error) {
    console.error("Upload Error:", error);
    res.status(500).json({ error: "File upload failed." });
  }
};
