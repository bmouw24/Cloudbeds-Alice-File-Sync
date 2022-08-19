
// Property settings
var CLIENT_ID = 'XXXX';
var CLIENT_SECRET = 'XXXX';
var PROPERTY_ID = 'XXXX';
var PROPERTY_NAME = '<Property Name>';
var PROPERTY_TIMEZONE = 'America/Denver';



//This function creates the Future Arrivals file and emails it to Alice 
function SendFutureArrivalsEmail() {
  // Send the CSV of the spreadsheet to this email address
  var recipients = "connect@pms.alice-app.com";

  // call reservations to get get all future reservations.
  var reservations = getReservations();

  //build the csv 
  var contents = buildCSV(reservations, 'FutureArrivals');

  // Get email of Scripts user as the sender of the email
  var email = Session.getActiveUser().getEmail();
  var subject = PROPERTY_NAME+" - Future Arrivals";
  var body = "Automated report: "+PROPERTY_NAME+" - Future Arrivals";

  //Logger.log(contents);

  //Send the email with the sync file as an attached CSV
  MailApp.sendEmail(recipients, subject, body, {attachments:[{fileName:PROPERTY_NAME+"_Future_Arrivals.csv", content:contents, mimeType:"application//csv"}]});
}



//This function creates the Future Arrivals file and emails it to Alice 
function SendInHouseEmail() {
  // Send the CSV of the spreadsheet to this email address
  var recipients = "connect@pms.alice-app.com";

  // call reservations to get get all future reservations.
  var reservations = getReservations();

  //build the sheet 
  var contents = buildCSV(reservations, 'InHouse');

  // Get email of Scripts user as the sender of the email
  var email = Session.getActiveUser().getEmail();
  var subject = PROPERTY_NAME+" - In House";
  var body = "Automated report: "+PROPERTY_NAME+" - In House";

  //Logger.log(contents);

  //Send the email with the sync file as an attached CSV
  MailApp.sendEmail(recipients, subject, body, {attachments:[{fileName:PROPERTY_NAME+"_In_House.csv", content:contents, mimeType:"application//csv"}]});
}


function buildCSV(reservations, fileType) {
  //Logger.log("Building %s", fileType);
  //Logger.log(reservations);

  var contents = "Confirmation No, Room No, Prefix, Last, First, Arrival Date, Departure Date, Email, Phone Number, Reservation Status, VIP code\n";
  for (var i in reservations) {
    var reservation = reservations[i];
    var row = [];
    // If the filetype is in house, then just skip any reservations that aren't in house
    if (fileType == 'InHouse' && reservation.status != 'checked_in') {
      continue;
    }
    row[0] = reservation.reservationID;
    row[2] = '';  //Prefix is always empty, as this is not captured in Cloudbeds
    row[5] = reservation.startDate;
    row[6] = reservation.endDate;
    row[9] = reservation.status;
    for (var g in reservation.guestList){
      guest = reservation.guestList[g];
      //Only sync the main guest
      if (guest.isMainGuest) {
        //replace any commas with bars as commnas break the csv
        row[3] = guest.guestFirstName.replace(/,/g, '|');
        row[4] = guest.guestLastName.replace(/,/g, '|');
        row[7] = guest.guestEmail;
        // Send the cellphone if Cloudbeds has it, otherwise fall back on phone field ( which can also be a cellphone )
        if (guest.guestCellPhone) {
          row[8] = guest.guestCellPhone;
        }
        else {
          row[8] = guest.guestPhone;
        }
        // Add room assignment if a room has been assigned
        if (guest.assignedRoom) {
          var rooms = [];
          for ( var r in guest.rooms ) {
            rooms.push(guest.rooms[r].roomName);
          }
          // If there are multiple rooms send them over in the same field seperated by a |
          row[1] = rooms.join('|');
          row[1] = row[1].slice(0,255);
        }
      }
    }
    row[10] = ''; //VIP code is empty
    // Add the row with fields split by a comma
    contents += row.join(",");
    contents +="\n";
  }
  //Logger.log(contents);
  return contents;
}

function getService() {
  // Create a new service with the given name. The name will be used when
  // persisting the authorized token, so ensure it is unique within the
  // scope of the property store.
  return OAuth2.createService('aliceSyncProd')

      // Set the endpoint URLs, which are the same for all Google services.
      .setAuthorizationBaseUrl('https://hotels.cloudbeds.com/api/v1.1/oauth')
      .setTokenUrl('https://hotels.cloudbeds.com/api/v1.1/access_token')
      

      // Set the client ID and secret, from the Google Developers Console.
      .setClientId(CLIENT_ID)
      .setClientSecret(CLIENT_SECRET)

      // Set the name of the callback function in the script referenced
      // above that should be invoked to complete the OAuth flow.
      .setCallbackFunction('authCallback')

      // Set the property store where authorized tokens should be persisted.
      .setPropertyStore(PropertiesService.getUserProperties())

      // Set the scopes to request we only need to read reservations
      .setScope('read:reservation')

}

function authCallback(request) {
  var aliceSyncService = getService();
  var isAuthorized = aliceSyncService.handleCallback(request);
  if (isAuthorized) {
    return HtmlService.createHtmlOutput('Success! You can close this tab.');
  } else {
    return HtmlService.createHtmlOutput('Denied. You can close this tab');
  }
}

// here is where we make the call to the cloudbedsAPI
function getReservations() {

  var service = getService();
  // check if we are authorized
  if (service.hasAccess()) {
  
    var today = new Date();
    var today_date = Utilities.formatDate(today,  PROPERTY_TIMEZONE, 'yyyy-MM-dd');

    var api = "https://hotels.cloudbeds.com/api/v1.1/getReservations?includeGuestsDetails=true&propertyID='+PROPERTY_ID'+&checkOutFrom="+today_date;

    //Logger.log(api);
    // Build headers for the request
    var headers = {
      "Authorization": "Bearer " + getService().getAccessToken()
    };
    
    var options = {
      "headers": headers,
      "method" : "GET",
    };
    var pageNumber = 1;
    var reservations = [];
    // Cloudbeds returns results in batches of 100, so loop through and increment page number for each subsequent request
    while (1) {
      var response = UrlFetchApp.fetch(api+"&pageNumber="+pageNumber, options);

      var json = JSON.parse(response.getContentText());
      // grab just the data block from the response
      reservations.push(...json.data);
   
      // break if the count is less than 100, as we have reached the last page.
      if (json.count < 100) {
        break;
      }
      pageNumber++;
      //Logger.log(response.getContentText());
    }
    Logger.log(reservations.length);
    return reservations;
    
  } else {
    // load the authorization screen if the app is not authorized. 
    var authorizationUrl = service.getAuthorizationUrl();
    Logger.log('Open the following URL and re-run the script: %s',
        authorizationUrl);
  }
}
