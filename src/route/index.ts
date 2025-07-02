import express from "express";
import * as Handler from "./importController";
import path from "path";
const routerAdmin = express.Router();

// User Details
routerAdmin.post("/user-login", Handler.LoginController); // 1      -> .782 s
routerAdmin.put("/user-profile-update", Handler.userProfileUpdate); // 2  -> .282 s
routerAdmin.get("/user-profile/:email", Handler.ProfileUpdate); // 3   -> 2.69 s
routerAdmin.post("/forget-password", Handler.ForgetPassword); // 4    -> 6.34 s
routerAdmin.post("/reset-password", Handler.ResetPassword); // 5     ->.790 s
routerAdmin.post("/reset-token-check", Handler.ResetTockenCheck); // 6  ->.629 s     

// Contact Details
routerAdmin.post("/contact-us", Handler.insertContactUs); // 7 -> 5.7 s ->2.7s
routerAdmin.get("/contact-us", Handler.readContactUs); // 8   ->2.54 s       1s
routerAdmin.delete("/contact-us/:id", Handler.deleteContactUs); // 9   -> .987 s

// DataGrid Content  
routerAdmin.get("/kpi-data", Handler.AuthSignIn, Handler.getTotalKpiesData); // 10     -> 5.4s   259ms
routerAdmin.get("/dashboard-vin-summary", Handler.AuthSignIn, Handler.DashboardSummaryVIN); // 11   5.14 s    257ms
routerAdmin.get("/dashboard-vin-summary-updated", Handler.AuthSignIn, Handler.DashboardSummaryVINUpdated);  // 12->4.28 s   434 ms
routerAdmin.get("/new-alerts", Handler.AuthSignIn, Handler.NewAlertVIN); // 13       -> 5.26 s    286ms
routerAdmin.get("/unread-notification", Handler.AuthSignIn, Handler.UnreadNotificationsAlert); // 14  ->5.2 s  245ms
routerAdmin.get("/search-pop-vin", Handler.AuthSignIn, Handler.getSearchVinPop); // 15   ->2.3 s    338ms
routerAdmin.post("/export-pdf", Handler.AuthSignIn, Handler.ExportPdfVINData); // 16   -> 2.91 s      557ms 
// export-vin-selection-list
routerAdmin.get("/export-vin-selection-list", Handler.AuthSignIn, Handler.ExportPdfVINDataList); // 17  -> 2.8s  2.6s

// Bell icon section--
routerAdmin.get("/total-unread-alert", Handler.AuthSignIn, Handler.TotalUnreadAlerts); // 18 -> 2.76 s      4.8s
routerAdmin.get("/notification-top-ten", Handler.AuthSignIn, Handler.UnreadNotificationsTopTenData); // 19 -> 276 s   2.8s

// Update Seen / Unseen 
routerAdmin.post("/seen-alert", Handler.AuthSignIn, Handler.UpdateSeenUpdateAlert);  // 20  -> 2.44 s

// Calculate history Comparission
routerAdmin.get("/title-detail-history", Handler.AuthSignIn, Handler.CompareHistoryTitalDetails); // 21 -> 3.51 s

// SOAP Data
routerAdmin.get("/get-soap-token", Handler.SoapToken);  // 22  ->5.71 s
routerAdmin.post("/new-validate-vin-data", Handler.NewValidateVinData); // 23 -> 8.81 s
routerAdmin.get("/track-vin-pop", Handler.TrackVinPopController); // 24  -> 2.72 s

// FTP organization
routerAdmin.post("/upload-ftp-txt", Handler.AuthSignIn, Handler.FTPController); // 25   -> 46.20 s
routerAdmin.get("/file-create-automation", Handler.AuthSignIn, Handler.VinListAutomateFileCreatetion);  // 26   -> 2.30 s
routerAdmin.post("/file-create-automation", Handler.AuthSignIn, Handler.CreateVinTxtFileAndUpload);  // 27    ->  46.69 s

// Test Route
routerAdmin.get("/test-csv-export", Handler.AuthSignIn, Handler.testR);  // 28
// routerAdmin.get("/test-csv-exportt", Handler.testResultController) ; 
routerAdmin.get("/navigate-sidebar-first-item", Handler.AuthSignIn, Handler.NavigateSidebarFirstItem);

routerAdmin.get("/track-email", (req, res) => {
  const { email, userId } = req.query;
  console.log(`✅ Email opened by ${email} | UserID: ${userId} at ${new Date().toISOString()}`);

  const imagePath = path.join(__dirname, "tr.png");
  res.sendFile(imagePath);
});
export default routerAdmin;
