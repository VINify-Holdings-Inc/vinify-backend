import crypto from "crypto";  
const ENCRYPTION_KEY = crypto.randomBytes(32);  
const IV_LENGTH = 16;

export const encryptPayload = (text: any) => {
    const iv = crypto.randomBytes(IV_LENGTH); 
    const cipher = crypto.createCipheriv("aes-256-cbc", ENCRYPTION_KEY, iv);

    let encrypted = cipher.update(text, "utf8", "base64");
    encrypted += cipher.final("base64");

    // Combine IV and encrypted text as a single string
    return `${iv.toString("base64")}:${encrypted}`;
};  
export const decryptPayload = (encryptedData: any) => {
    const [iv, encryptedText] = encryptedData?.split(":")?.map((part: any) => Buffer?.from(part, "base64"));
    const decipher = crypto?.createDecipheriv("aes-256-cbc", ENCRYPTION_KEY, iv);

    let decrypted = decipher?.update(encryptedText, "base64", "utf8");
    decrypted += decipher?.final("utf8");

    return decrypted;
};  
export const generateToken = () => {
    const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    const tokenLength = 20;
    let token = "";

    for (let i = 0; i < tokenLength; i++) {
        const randomIndex = Math.floor(Math.random() * characters.length);
        token += characters[randomIndex];
    }

    return token;
};  
// Fields to consider for profile completion
const fieldsToCheck = ['firstName', 'lastName', 'emailId', 'secondaryEmailId', 'companyId', 'title', 'profile'];

export const profileCompletion = (data: any) => {  
   const total = fieldsToCheck.length; 
   let raw = 0; 
   fieldsToCheck?.forEach((field) => { 
     if (data[field] != null && data[field] !== undefined) {
       raw++;  
     }
   }); 

   const per = (raw * 100) / total;
   return Math.ceil(per)
};

 