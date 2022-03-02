const nodemailer = require('nodemailer')
const emailConfig = require('../../config/emailConfig')


module.exports = sendeMail= async (email,link)=>{
   
   var transporter = nodemailer.createTransport({
       host: emailConfig.host,
       port: emailConfig.port,
       secure: true, // true for 465, false for other ports
       auth: {
         user: 'info@betmaster.site', // your domain email address
         pass: 'Infobetmaster@123' // your password
       }
     });
   
   
   var mailOptions = {
     from: 'info@betmaster.site',
     to: email,
     subject: 'link to reset your password',
     html:`<html>
     <body>
     
     <div style="font-family: Helvetica,Arial,sans-serif;min-width:1000px;overflow:auto;line-height:2">
       <div style="margin:50px auto;width:70%;padding:20px 0">
         <div style="border-bottom:1px solid #eee">
           <a href="" style="font-size:1.4em;color: #00466a;text-decoration:none;font-weight:600">
           <img src="https://betmaster-pictures.s3.ap-northeast-2.amazonaws.com/Logo.png" style="width:8rem" alt="logo"/>
           </a>
         </div>
         <p style="font-size:1.1em">Hi,</p>
         <p>Thank you for choosing BetMaster.<a href="${link}" target="_blank">Click here</a> to verify your email.</p>
         <h2 style="background: #00466a;margin: 0 auto;width: max-content;padding: 0 10px;color: #fff;border-radius: 4px;"></h2>
         <p style="font-size:0.9em;">Regards,<br />BETMASTER Team</p>
         <hr style="border:none;border-top:1px solid #eee" />
         <div style="float:right;padding:8px 0;color:#aaa;font-size:0.8em;line-height:1;font-weight:300">
         
         </div>
       </div>
     </div>
     </body>
     </html>`
   };
   let status;
  await transporter.sendMail(mailOptions)
                    .then((info)=>{
                      console.log("Email sent "+info.response)
                      status = 200;
                      return info
                    })
                    .catch((error)=>{
                    status = 501;
                    return error
                    });
   return status;
   }
