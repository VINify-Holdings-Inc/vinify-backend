import express from "express";
import * as Controllers from "./importController"; 
const routerAdmin = express.Router();

// User Details
routerAdmin.post("/user-login", Controllers.LoginController);  
routerAdmin.put("/user-profile-update", Controllers.userProfileUpdate); 
routerAdmin.get("/user-profile/:email", Controllers.ProfileUpdate); 
routerAdmin.post("/forget-password", Controllers.ForgetPassword); 
routerAdmin.post("/reset-password", Controllers.ResetPassword); 
routerAdmin.post("/reset-token-check", Controllers.ResetTockenCheck); 

// Contact Details
routerAdmin.post("/contact-us", Controllers.insertContactUs);  
routerAdmin.get("/contact-us", Controllers.readContactUs); 
routerAdmin.delete("/contact-us/:id", Controllers.deleteContactUs); 

// DataGrid Content 
routerAdmin.get("/kpi-data", Controllers.getTotalKpiesData);
routerAdmin.get("/dashboard-vin-summary", Controllers.DashboardSummaryVIN );  
routerAdmin.get("/dashboard-vin-summary-updated", Controllers.DashboardSummaryVINUpdated);   
routerAdmin.get("/new-alerts", Controllers.NewAlertVIN);
routerAdmin.get("/unread-notification", Controllers.UnreadNotificationsAlert); 
routerAdmin.get("/search-pop-vin", Controllers.getSearchVinPop);
routerAdmin.post("/export-pdf", Controllers.ExportPdfVINData); 
//export-vin-selection-list
routerAdmin.get("/export-vin-selection-list", Controllers.ExportPdfVINDataList); 

// Bell icon section--
routerAdmin.get("/total-unread-alert", Controllers.TotalUnreadAlerts); 
routerAdmin.get("/notification-top-ten", Controllers.UnreadNotificationsTopTenData);

// Update Seen / Unseen 
routerAdmin.post("/seen-alert", Controllers.UpdateSeenUpdateAlert);  

// Calculate history
routerAdmin.get("/title-detail-history", Controllers.CompareHistoryTitalDetails); 

// SOAP Data
routerAdmin.get("/get-soap-token", Controllers.SoapToken);  
routerAdmin.post("/new-validate-vin-data", Controllers.NewValidateVinData); 
routerAdmin.get("/track-vin-pop", Controllers.TrackVinPopController);

// FTP organization
routerAdmin.post("/upload-ftp-txt", Controllers.FTPController);  
routerAdmin.get("/file-create-automation", Controllers.VinListAutomateFileCreatetion);  
routerAdmin.post("/file-create-automation", Controllers.CreateVinTxtFileAndUpload);  

// Test Route
routerAdmin.get("/test-csv-export", Controllers.testR);  

export default routerAdmin;
