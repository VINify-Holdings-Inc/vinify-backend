import express from "express";
import * as Controllers from "./importController";  
const routerAdmin = express.Router();

// User Details
routerAdmin.post("/user-login", Controllers.LoginController); // 1      -> .782 s
routerAdmin.put("/user-profile-update", Controllers.userProfileUpdate); // 2  -> .282 s
routerAdmin.get("/user-profile/:email", Controllers.ProfileUpdate); // 3   -> 2.69 s
routerAdmin.post("/forget-password", Controllers.ForgetPassword); // 4    -> 6.34 s
routerAdmin.post("/reset-password", Controllers.ResetPassword); // 5     ->.790 s
routerAdmin.post("/reset-token-check", Controllers.ResetTockenCheck); // 6  ->.629 s

// Contact Details
routerAdmin.post("/contact-us", Controllers.insertContactUs); // 7 -> 5.7 s
routerAdmin.get("/contact-us", Controllers.readContactUs); // 8   ->2.54 s
routerAdmin.delete("/contact-us/:id", Controllers.deleteContactUs); // 9   -> .987 s

// DataGrid Content  
routerAdmin.get("/kpi-data", Controllers.getTotalKpiesData); // 10     -> 5.4s
routerAdmin.get("/dashboard-vin-summary", Controllers.DashboardSummaryVIN ); // 11   5.14 s
routerAdmin.get("/dashboard-vin-summary-updated", Controllers.DashboardSummaryVINUpdated);  // 12    ->4.28 s
routerAdmin.get("/new-alerts", Controllers.NewAlertVIN); // 13       -> 5.26 s
routerAdmin.get("/unread-notification", Controllers.UnreadNotificationsAlert); // 14  ->5.2 s
routerAdmin.get("/search-pop-vin", Controllers.getSearchVinPop); // 15   ->2.3 s
routerAdmin.post("/export-pdf", Controllers.ExportPdfVINData); // 16   -> 2.91 s
// export-vin-selection-list
routerAdmin.get("/export-vin-selection-list", Controllers.ExportPdfVINDataList); // 17  -> 2.8s

// Bell icon section--
routerAdmin.get("/total-unread-alert", Controllers.TotalUnreadAlerts); // 18 -> 2.76 s
routerAdmin.get("/notification-top-ten", Controllers.UnreadNotificationsTopTenData); // 19 -> 276 s

// Update Seen / Unseen 
routerAdmin.post("/seen-alert", Controllers.UpdateSeenUpdateAlert);  // 20  -> 2.44 s

// Calculate history Comparission
routerAdmin.get("/title-detail-history", Controllers.CompareHistoryTitalDetails); // 21 -> 3.51 s

// SOAP Data
routerAdmin.get("/get-soap-token", Controllers.SoapToken);  // 22  ->5.71 s
routerAdmin.post("/new-validate-vin-data", Controllers.NewValidateVinData); // 23 -> 8.81 s
routerAdmin.get("/track-vin-pop", Controllers.TrackVinPopController); // 24  -> 2.72 s

// FTP organization
routerAdmin.post("/upload-ftp-txt", Controllers.FTPController); // 25   -> 46.20 s
routerAdmin.get("/file-create-automation", Controllers.VinListAutomateFileCreatetion);  // 26   -> 2.30 s
routerAdmin.post("/file-create-automation", Controllers.CreateVinTxtFileAndUpload);  // 27    ->  46.69 s

// Test Route
routerAdmin.get("/test-csv-export", Controllers.testR);  // 28
// routerAdmin.get("/test-csv-exportt", Controllers.testResultController);
routerAdmin.get("/navigate-sidebar-first-item",Controllers.NavigateSidebarFirstItem ); 
export default routerAdmin;
