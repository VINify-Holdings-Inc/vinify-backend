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

    return res.json({ code:200,message: "File uploaded successfully!" ,success:true,error:false});
  } catch (error) {
    console.error("❌ Upload Error:", error);
    return res.status(500).json({ error: "File upload failed." });
  }
};

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


export const FTPReadAllController = async () => {
  const client:any = new Client();
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

    console.log(`✅ File ${targetFileName} downloaded successfully.`);

    if (!fs.existsSync(localPath)) {
      console.log("Downloaded file not found in local directory.");
      return 
      ;
    }

    const fileContent = fs.readFileSync(localPath, "utf8").replace(/\r\n/g, "\n");
    const parsedData = await ReadTheTxtFomatJson(fileContent);
    await insertBulkSheetData(parsedData);
    
     return  
  } catch (error:any) {
    console.error("❌ FTP Read All Error:", error);
    return ;
  } finally {
    await client.close();
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



