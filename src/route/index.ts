 
import express from "express";
import { deleteContactUs, insertContactUs, readContactUs } from "../controller/ContactUs";
import { getBulkSheetData, getSearchVinPop, getBulkSheetDataSheet2, insertBulkSheetData, insertBulkSheetDatSheet2 } from "../controller/BulkInsert";
import { ForgetPassword, LoginController, ResetPassword, userProfileUpdate , ProfileUpdate, ResetTockenCheck} from "../controller/LoginController";
const routerAdmin = express.Router();

routerAdmin.post("/user-login", LoginController);
routerAdmin.put("/user-profile-update", userProfileUpdate);
routerAdmin.get("/user-profile/:email",  ProfileUpdate);
routerAdmin.post("/forget-password", ForgetPassword);
routerAdmin.post("/reset-password", ResetPassword);  
routerAdmin.post("/reset-token-check", ResetTockenCheck);

routerAdmin.post("/contact-us",  insertContactUs);
routerAdmin.get("/contact-us",  readContactUs);
routerAdmin.delete("/contact-us/:id",  deleteContactUs); 

routerAdmin.post("/csv-import", insertBulkSheetData);  
routerAdmin.get("/csv-import",  getBulkSheetData); 
routerAdmin.post("/csv-import-sheet2", insertBulkSheetDatSheet2);
routerAdmin.get("/csv-import-sheet2",  getBulkSheetDataSheet2);
routerAdmin.get("/search-pop-vin/:vin",  getSearchVinPop);
export default routerAdmin;