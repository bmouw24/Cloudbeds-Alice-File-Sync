# Cloudbeds-Alice-File-Sync
Google Script code example to connect to Cloudbeds API, create sync files and email them to Alice at regular intervals.   

## Follow the following steps to get started.
1. Copy alice_sync.gs into a Google Scripts project.  
2. Grab the Google Scripts id from Project Settings->Script ID
3. Setup API Credentials Access 
    - Get your Client credentials from your Cloudbeds account by logging in and going to Manage->Apps And Integrations->API Credentials. 
    - Create a set of New Credentials with the following settings.
      - Name: Any name you choose
      - Integration Type: Housekeeping
      - Redirect URI, "https://script.google.com/macros/d/<Script ID>/usercallback" replacing <Script ID> with your Google Script ID
  -. Copy the Client ID and Client SECRET into these Constants in alice_sync.gs
4. Set your Property Details
    - Property ID is your MFD ID, this can be retrieved from the url where XXXXXX will your MFD ID. https://hotels.cloudbeds.com/connect/XXXXXX#/
    - Property Name is the name of your property that you used with your Alice Account
    - Property Timezone is the timezone the property is located in.
    - Destination email, during testing set it to the email address to test with, when ready to run this in production, adjust it to the 
5. Install Oauth2 library 
    - Follow the setup instructions at https://github.com/googleworkspace/apps-script-oauth2/blob/main/README.md#setup
6. Authorize your app 
    - Run the SendFutureArrivalsEmail in Google script
      - Give permissions to this google script to access 
    - This will error a url in the Execution log, copy that url and paste it into the browser
      - Follow the prompts here to authorize your app.
7. Test file creation and send
    - You can test this by running SendFutureArrivalsEmail or SendInHouseEmail scripts to test building and emailing files to your test email.
8. Success, move to production.
    - Update email address to "connect@pms.alice-app.com"
    - Setup Google Scripts Trigger to run SendFutureArrivalsEmails once per hour ( Alice's preference )
    - Setup Google SCripts Trigger to run SendInHouseEmails once every 15 minutes ( Alice's preference )
  
**Note:** Alice will not automatically start consuming these files, you will need to inform them that you are sending these files.  
