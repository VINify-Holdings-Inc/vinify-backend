export const forgetPasswordMailTemplate = ({ subject, text, hyperText }: any) => {
    return ` 
<!doctype html>
<html style="height:100%">
<head>
    <meta http-equiv="X-UA-Compatible" content="ie=edge">
    <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Open+Sans:wght@300;400;500;600&display=swap" rel="stylesheet">
    <link href="https://fonts.googleapis.com/css2?family=Roboto:wght@100;300;400;500;700&display=swap" rel="stylesheet">
    <title>Simple Transactional Email</title>
    <style>
        @media only screen and (max-width: 620px) {
            table.body h1 {
                font-size: 28px !important;
                margin-bottom: 10px !important;
            }

            table.body p,
            table.body ul,
            table.body ol,
            table.body td,
            table.body span,
            table.body a {
                font-size: 16px !important;
            }

            table.body .wrapper,
            table.body .article {
                padding: 10px !important;
            }

            table.body .content {
                padding: 0 !important;
            }

            table.body .container {
                padding: 0 !important;
                width: 100% !important;
            }

            table.body .main {
                border-left-width: 0 !important;
                border-radius: 0 !important;
                border-right-width: 0 !important;
            }

            table.body .btn table {
                width: 100% !important;
            }

            table.body .btn a {
                width: 100% !important;
            }

            table.body .img-responsive {
                height: auto !important;
                max-width: 100% !important;
                width: auto !important;
            }
        }

        @media all {
            .ExternalClass {
                width: 100%;
            }

                .ExternalClass,
                .ExternalClass p,
                .ExternalClass span,
                .ExternalClass font,
                .ExternalClass td,
                .ExternalClass div {
                    line-height: 100%;
                }

            .apple-link a {
                color: inherit !important;
                font-family: inherit !important;
                font-size: inherit !important;
                font-weight: inherit !important;
                line-height: inherit !important;
                text-decoration: none !important;
            }

            #MessageViewBody a {
                color: inherit;
                text-decoration: none;
                font-size: inherit;
                font-family: inherit;
                font-weight: inherit;
                line-height: inherit;
            }

            .btn-primary table td:hover {
                background-color: #34495e !important;
            }

            .btn-primary a:hover {
                background-color: #34495e !important;
                border-color: #34495e !important;
            }
        }
    </style>
</head>
<body style="background-color: #fff; font-family: 'Open Sans', sans-serif; -webkit-font-smoothing: antialiased; font-size: 13px; line-height: 1.4; margin: 0; padding: 0; -ms-text-size-adjust: 100%; -webkit-text-size-adjust: 100%; height: 100%;">
    <table class="es-wrapper" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;padding:0;Margin:0;width:100%;height:100%;background-repeat:repeat;background-position:center top;background-color:#EDEDED;" width="100%" cellspacing="0" cellpadding="0">
        <tbody>
            <tr>
                <td style="height: 15px;"></td>
            </tr>
            <tr>
                <td style="padding:0;Margin:0" valign="top">

                    <table class="es-content" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;table-layout:fixed !important;width:100%" cellspacing="0" cellpadding="0" align="center">
                        <tbody>
                            <tr>
                                <td style="padding:0;Margin:0" align="center">
                                    <table class="es-content-body" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;background-color:#ffffff;width:100%; max-width:600px" cellspacing="0" cellpadding="0" bgcolor="#ffffff" align="center">
                                        <tbody>
                                            <tr>
                                                <td class="es-m-p0t" style="Margin:0;padding-top:0;padding-bottom:30px;padding-left:30px;padding-right:30px;" align="left">
                                                    <table style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px" width="100%" cellspacing="0" cellpadding="0">
                                                        <tbody>
                                                            <tr>
                                                                <td style="padding:0;Margin:0;width:520px" valign="top" align="center">
                                                                    <table role="presentation" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px" width="100%" cellspacing="0" cellpadding="0">
                                                                        <tbody>
                                                                            <tr>
                                                                                <td style="padding:0; height: 20px" align="left"> &nbsp;</td>
                                                                            </tr>
                                                                            <tr>
                                                                                <td style="padding:0;" align="left"><a href="#" style="display: inline-block;"><img width="180" class="adapt-img" style="display:block;border:0;outline:none;text-decoration:none;-ms-interpolation-mode:bicubic;" alt="LOGO" src="https://mvm.techwagger.com/assets/images/eta-logo.png"></a></td>
                                                                            </tr>
                                                                            <tr>
                                                                                <td style="padding:0; height: 35px" align="left"> &nbsp;</td>
                                                                            </tr>
                                                                            <tr>
                                                                                <td style="padding:0;Margin:0;padding-bottom:10px" align="left"><p style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:Roboto;line-height:24px;color:#0f131a;font-size:16px;font-weight: 300;">Dear User,</p></td>
                                                                            </tr>
                                                                            <tr>
                                                                                <td style="padding:0;Margin:0;padding-bottom:10px" align="left">
                                                                                    <p style="margin-top:0;margin-bottom:10px;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:Roboto;line-height:24px;color:#0f131a;font-size:16px;font-weight: 300;">We are sending you this email because you requested a password reset. Click on this link to create a new password.</p>

                                                                                    <p style="margin-bottom:10px;">
                                                                                    <a href="${hyperText}" style="display: inline-block">
                                                                                    <img width="160" height="41" src="https://mvm.techwagger.com/assets/images/reset-password-red.png" />  </a>    </p>


                                                                                    <p style="margin-bottom:10px;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:Roboto;line-height:24px;color:#0f131a;font-size:16px;font-weight: 300;">
                                                                                        If you did not request a password reset, you can ignore this email. Your existing will not be changed.
                                                                                    </p>


                                                                   
                                                                                </td>
                                                                            </tr>
                                                                            
                                                                            <tr>
                                                                                <td><p style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:Roboto;line-height:24px;color:#0f131a;font-size:16px;font-weight: 300;">Regards,<br />Team Title Alert</p></td>
                                                                            </tr>
                                                                        </tbody>
                                                                    </table>
                                                                </td>
                                                            </tr>
                                                        </tbody>
                                                    </table>
                                                </td>
                                            </tr>



                                        </tbody>
                                    </table>
                                </td>
                            </tr>
                        </tbody>
                    </table>



                    <table class="es-content" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;table-layout:fixed !important;width:100%" cellspacing="0" cellpadding="0" align="center">
                        <tbody>
                            <tr>
                                <td class="es-info-area" style="padding:0;Margin:0" align="center">
                                    <table class="es-content-body" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;background-color:transparent;width:100%; max-width:600px" cellspacing="0" cellpadding="0" align="center">
                                        <tbody>
                                            <tr>
                                                <td style="Margin:0;padding-top:10px;padding-bottom:30px;padding-left:30px;padding-right:30px;" align="left">
                                                    <table style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px" width="100%" cellspacing="0" cellpadding="0">
                                                        <tbody>
                                                            <tr>
                                                                <td style="padding:0;Margin:0;width:520px" valign="top" align="center">
                                                                    <table role="presentation" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px" width="100%" cellspacing="0" cellpadding="0">
                                                                        <tbody>
                                                                            <tr>
                                                                                <td class="es-infoblock made_with" style="padding:0;Margin:0;line-height:120%;font-size:0;padding-top:0px;height: 20px;" align="left">
                                                                                    <p style="text-align:center;Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:Roboto;line-height:24px;color:#0f131a;font-size:14px;font-weight: 300;">
                                                                                        &nbsp;
                                                                                    Title Alert. &copy; 2025 All Rights Reserved.</p>
                                                                                </td>
                                                                            </tr>
                                                                        </tbody>
                                                                    </table>
                                                                </td>
                                                            </tr>
                                                        </tbody>
                                                    </table>
                                                </td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </td>
            </tr>
        </tbody>
    </table>
</body>
</html>

      `;
};
  export const  contactFormMailTemplate = ({ name, email, phone, message, subject }: any) => {
      return `
      <!DOCTYPE html>
      <html>
      <head>
          <title>${subject}</title>
          <style>
              .x_831786570darkmode { background: rgb(255, 255, 255); }
              .x_831786570w-100p { width: 100%; }
              .x_831786570pb-60 { padding-bottom: 60px; }
              .x_831786570pt-60 { padding-top: 60px; }
              .x_831786570content { font-family: Arial, sans-serif; color: #000; font-size: 16px; line-height: 24px; }
              .x_831786570heading { font-size: 24px; font-weight: bold; color: #cf4b5f; text-align: center; }
              .x_831786570label { font-weight: bold; color: #cf4b5f; }
          </style>
      </head>
      <body>
          <table align="center" class="x_831786570darkmode" width="650" style="background: rgb(255, 255, 255); min-width: 320px" cellspacing="0" cellpadding="0">
              <tbody>
                  <tr>
                      <td>
                          <table class="x_831786570w-100p" width="650" align="center" style="max-width: 650px; margin: 0 auto" cellpadding="0" cellspacing="0">
                              <tbody>
                                  <tr>
                                    <td align="left" class="x_831786570pb-32 x_831786570darkmode" style="padding: 28px 0 24px">
                                        <a style="text-decoration: none" href="https://mvm.techwagger.com/" target="_blank">
                                            <img class="x_831786570light-img" width="150" style="width: 150px; max-width: 150px; background-color: rgb(255, 255, 255); color: rgb(0, 0, 0); text-align: center" alt="Motor Vehicle Monitoring" src="https://mvm.techwagger.com/assets/images/eta-logo.png">
                                        </a>
                                    </td>
                                </tr>
                                  <tr>
                                      <td class="x_831786570pb-60" style="padding: 20px 0 30px">
                                          <table align="center" class="x_831786570content" width="100%" cellpadding="0" cellspacing="0">
                                              <tbody>
                                                  <tr>
                                                      <td width="80" style="text-align:left; color: #000; font-weight:normal; width:80px">
                                                      Name</td>
                                                      <td>:</td>
                                                      <td style="text-align:left; color: #000; font-weight:normal">${name}</td>
                                                  </tr>
                                                  <tr>
                                                      <td width="80" style="text-align:left; color: #000; font-weight:normal; width:80px">Email</td>
                                                      <td width="10">:</td>
                                                      <td style="text-align:left; color: #000; font-weight:normal">${email}</td>
                                                  </tr>
                                                  <tr>
                                                      <td width="80" style="text-align:left; color: #000; font-weight:normal;  width:80px">Phone</td>
                                                      <td width="10">:</td>
                                                      <td style="text-align:left; color: #000; font-weight:normal">${phone}</td>
                                                  </tr>
                                                  <tr>
                                                      <td width="80" style="text-align:left; color: #000; font-weight:normal;  width:80px">Subject</td>
                                                      <td width="10">:</td>
                                                      <td style="text-align:left; color: #000; font-weight:normal">${subject}</td>
                                                  </tr>
                                                  <tr>
                                                      <td valign="top" width="80" style="text-align:left; color: #000; font-weight:normal; verticle-align:top; width:80px; height:24px">Message</td>
                                                      <td valign="top" width="10">:</td>
                                                      <td style="text-align:left; color: #000; font-weight:normal">${message}</td>
                                                  </tr>
                                                  
                                                  
                                                  
                                              </tbody>
                                          </table>
                                      </td>
                                  </tr>
                                  <tr>
                                      <td align="center" style="border-top: 1px solid rgb(222, 222, 222); color: rgb(165, 165, 165); font-size: 14px; line-height: 18px; padding: 20px 0 0">
                                          Title Alert. © 2025 All Rights Reserved.
                                      </td>
                                  </tr>
                              </tbody>
                          </table>
                      </td>
                  </tr>
              </tbody>
          </table>
      </body>
      </html>
      `;
    };