
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
import { UnreadNotificationsAlert, UnreadNotificationsTopTenData } from "../controller/Notification";
import { insertBulkSheetData } from "../controller/StoreNewPreviousData";
import { FTPController } from "../controller/FTPUpload";
 const routerAdmin = express.Router();

routerAdmin.post("/user-login", LoginController);
routerAdmin.put("/user-profile-update", userProfileUpdate);
routerAdmin.get("/user-profile/:email", ProfileUpdate);
routerAdmin.post("/forget-password", ForgetPassword);
routerAdmin.post("/reset-password", ResetPassword);
routerAdmin.post("/reset-token-check", ResetTockenCheck);

routerAdmin.post("/contact-us", insertContactUs);
routerAdmin.get("/contact-us", readContactUs);
routerAdmin.delete("/contact-us/:id", deleteContactUs);

routerAdmin.post("/csv-import", insertBulkSheetData);
routerAdmin.get("/search-pop-vin", getSearchVinPop);
routerAdmin.get("/kpi-data", getTotalKpiesData);
routerAdmin.get("/dashboard-vin-summary", DashboardSummaryVIN);
routerAdmin.get("/dashboard-vin-summary-updated", DashboardSummaryVINUpdated);
routerAdmin.get("/new-alerts", NewAlertVIN);
routerAdmin.post("/export-pdf", ExportPdfVINData);
// soap data
routerAdmin.get("/get-soap-token", SoapToken);
routerAdmin.post("/new-validate-vin-data", NewValidateVinData);
// track vin me populate
routerAdmin.get("/track-vin-pop", TrackVinPopController);
// history
routerAdmin.get("/title-detail-history", CompareHistoryTitalDetails);
routerAdmin.post("/seen-alert", SeenUpdateAlert);
// unread notification

routerAdmin.get("/total-unread-alert", TotalUnreadAlerts);
routerAdmin.get("/unread-notification", UnreadNotificationsAlert);//Tptal data
routerAdmin.get("/notification-top-ten", UnreadNotificationsTopTenData);
// dashboard-vin-summary
routerAdmin.post("/test", FTPController);
export default routerAdmin;