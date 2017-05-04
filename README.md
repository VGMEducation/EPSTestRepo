# ExecutionTrail
custom hr-tool


## Prerequisites
1. Node Installed
2. Npm Installed
3. Bower Installed

## Installation
1. Unzip this directory.
2. Install npm modules: `npm install`
3. Install bower dependencies `bower install`
4. Start up the server: `npm start` 
5. View in browser at http://localhost:5678

## Cert Info
1. http://docs.aws.amazon.com/elasticbeanstalk/latest/dg/configuring-https-ssl.html
2. http://docs.aws.amazon.com/elasticbeanstalk/latest/dg/configuring-https-ssl-upload.html (LOAD BALANCER)
3. http://docs.aws.amazon.com/elasticbeanstalk/latest/dg/https-singleinstance.html
4. http://docs.aws.amazon.com/elasticbeanstalk/latest/dg/https-singleinstance-nodejs.html

```
{
    "ServerCertificateMetadata": {
        "ServerCertificateId": "ASCAJBNZFFXLW3GQZJ72E", 
        "ServerCertificateName": "hr-tool-env-self-signed-x509", 
        "Expiration": "2017-03-25T22:26:33Z", 
        "Path": "/", 
        "Arn": "arn:aws:iam::435084773314:server-certificate/hr-tool-env-self-signed-x509", 
        "UploadDate": "2016-03-25T22:26:46.565Z"
    }
}
```


## Scripts
1. monthlyNotifications.js - Script run monthly to send emails to admins about upcoming and overdur reviews.
2. bulkStormpathUserCreation - Manual script for bulk creating stormpath users for mongo populated users.


## Other Information

### Language, Tools, Frameworks,
1. Node + Express w/ npm
2. Angular w/ bower
3. Mongo w/ mongooose 

### Services
1. AWS -
2. MongoLabs - 
3. Stormpath -
4. SMTP?

### SMTP, Config 

### Single Instance HTTP/HTTPS Auto-Redirect
1. .ebextensions/00_nginx_https_rw.config
  