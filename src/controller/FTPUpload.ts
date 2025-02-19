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
const removeAllFilesFromFTP = async (client: any) => {
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
export const FTPReadAllController = async () => {
  const client: any = new Client();
  client.ftp.verbose = true;
  client.ftp.keepAlive = 10000;
  client.ftp.timeout = 30000;

  try {
    await client.access(ftpConfig);
    await client.ensureDir("/");

    const targetFileName = "MY.T.CINQ.TITLE.txt";
    const localPath = path.join(__dirname, "../AAMVAFTP", targetFileName);

    // Retry connection in case of failure
    await retryOperation(() => client.downloadTo(localPath, `/${targetFileName}`));
    // tslint:disable-next-line:no-console
    console.log(`✅ File ${targetFileName} downloaded successfully.`);

    if (!fs.existsSync(localPath)) {
       // tslint:disable-next-line:no-console
      console.log("Downloaded file not found in local directory.");

      return
        ;
    }

    const fileContent = fs.readFileSync(localPath, "utf8").replace(/\r\n/g, "\n");
    const parsedData = await ReadTheTxtFomatJson(fileContent);
    if (parsedData?.length > 0) {
      await insertBulkSheetData(parsedData);
    } 
    await removeAllFilesFromFTP(client);

    return;
  } catch (error: any) {
     // tslint:disable-next-line:no-console
    console.error("❌ FTP Read All Error:", error);

    return;
  } finally {
    await client.close();
  }
};  

const  formatNumber = (data: any) => { 
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
// export const FTPReadAllController = async (req:any,res:any) => {
//   const client:any = new Client();
//   client.ftp.verbose = true;
//   client.ftp.keepAlive = 10000;
//   client.ftp.timeout = 30000;

//   try {
//     await client.access(ftpConfig);
//     await client.ensureDir("/");

//     const targetFileName = "MY.T.CINQ.TITLE.txt";
//     const localPath = path.join(__dirname, "../AAMVAFTP", targetFileName);

//     // Retry connection in case of failure
//     await retryOperation(() => client.downloadTo(localPath, `/${targetFileName}`));

//     console.log(`✅ File ${targetFileName} downloaded successfully.`);

//     if (!fs.existsSync(localPath)) {
//       console.log("Downloaded file not found in local directory.");
//       return 
//       ;
//     }

//     const fileContent = fs.readFileSync(localPath, "utf8").replace(/\r\n/g, "\n");
//     const parsedData = await ReadTheTxtFomatJson(fileContent);
//     const inserted= await insertBulkSheetData(parsedData);

//      return res.send({fileContent,parsedData,inserted,msg:"okkkay"})
//     console.log("✅ Data inserted successfully from file.");
//   } catch (error:any) {
//     console.error("❌ FTP Read All Error:", error);
//     return ;
//   } finally {
//     await client.close();
//   }
// };
 