
import express from "express";
import { deleteContactUs, insertContactUs, readContactUs } from "../controller/ContactUs";
import {
    getSearchVinPop, getTotalKpiesData, DashboardSummaryVIN,
    ExportPdfVINData, DashboardSummaryVINUpdated, NewAlertVIN,
    TotalUnreadAlerts
} from "../controller/BulkInsert";
import {
    ForgetPassword, LoginController, ResetPassword,
    userProfileUpdate, ProfileUpdate, ResetTockenCheck,
    // TestRoute
} from "../controller/LoginController";
import { NewValidateVinData, SoapToken, TrackVinPopController } from "../controller/soapController";
import { CompareHistoryTitalDetails, SeenUpdateAlert } from "../controller/CompareHistory";
import { UnreadNotificationsAlert, UnreadNotificationsTopTenData, VinListAutomateFileCreatetion } from "../controller/Notification";
// import { insertBulkSheetData } from "../controller/StoreNewPreviousData";
import { CreateVinTxtFileAndUpload, FTPController, testR,
    //  FTPReadAllController
     } from "../controller/FTPUpload";
 const routerAdmin = express.Router();

routerAdmin.post("/user-login", LoginController); //##C
routerAdmin.put("/user-profile-update", userProfileUpdate);//##C
routerAdmin.get("/user-profile/:email", ProfileUpdate);//##C
routerAdmin.post("/forget-password", ForgetPassword);//##C
routerAdmin.post("/reset-password", ResetPassword);//##C
routerAdmin.post("/reset-token-check", ResetTockenCheck);//##C

routerAdmin.post("/contact-us", insertContactUs); //##C
routerAdmin.get("/contact-us", readContactUs);//##C
routerAdmin.delete("/contact-us/:id", deleteContactUs);//##C

// routerAdmin.post("/csv-import", insertBulkSheetData);
routerAdmin.get("/search-pop-vin", getSearchVinPop);
routerAdmin.get("/kpi-data", getTotalKpiesData);//##C
routerAdmin.get("/dashboard-vin-summary", DashboardSummaryVIN); //##C
routerAdmin.get("/dashboard-vin-summary-updated", DashboardSummaryVINUpdated);
routerAdmin.get("/new-alerts", NewAlertVIN); //##C
routerAdmin.post("/export-pdf", ExportPdfVINData);
// soap data
routerAdmin.get("/get-soap-token", SoapToken); //##C
routerAdmin.post("/new-validate-vin-data", NewValidateVinData); //##C
// track vin me populate soap
routerAdmin.get("/track-vin-pop", TrackVinPopController); //##C
// history
routerAdmin.get("/title-detail-history", CompareHistoryTitalDetails);
routerAdmin.post("/seen-alert", SeenUpdateAlert); //##C
// unread notification

routerAdmin.get("/total-unread-alert", TotalUnreadAlerts); //##C
routerAdmin.get("/unread-notification", UnreadNotificationsAlert);  
routerAdmin.get("/notification-top-ten", UnreadNotificationsTopTenData);
// dashboard-vin-summary
routerAdmin.post("/upload-ftp-txt", FTPController); //##C
// routerAdmin.get("/upload-ftp-txt", FTPReadAllController);

// VIn List for the file createtion
routerAdmin.get("/file-create-automation", VinListAutomateFileCreatetion); //##C
routerAdmin.post("/file-create-automation", CreateVinTxtFileAndUpload); //##C

routerAdmin.get("/test", testR); //##C
export default routerAdmin;
