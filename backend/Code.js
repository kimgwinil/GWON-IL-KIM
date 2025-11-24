
/**
 * Google Apps Script Backend Code
 * Copy this content into Code.gs
 */

// The Spreadsheet ID provided by the user
const SPREADSHEET_ID = '1fWeLcQvotKZGgxelAOvKt_UXyYvdoneYVBeVXFMLRKY';

function doGet(e) {
  try {
    return HtmlService.createTemplateFromFile('index')
        .evaluate()
        .setTitle('IEG CRM')
        .addMetaTag('viewport', 'width=device-width, initial-scale=1')
        .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
  } catch (e) {
    return HtmlService.createHtmlOutput(
      `<div style="font-family: sans-serif; padding: 20px; text-align: center; color: #e11d48;">
         <h2>⚠️ System Loading Error</h2>
         <p>Could not find <b>index.html</b>.</p>
         <p>1. In Apps Script, click <b>[+]</b> -> <b>HTML</b> and name it <b>index</b>.</p>
         <p>2. Paste the provided frontend code.</p>
         <p>3. Deploy as Web App.</p>
         <br>
         <details><summary>Error Details</summary>${e.toString()}</details>
       </div>`
    );
  }
}

function getCRMData() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  
  const contacts = getSheetData(ss, 'Contacts', [
    'id', 'name', 'email', 'phone', 'company', 'address', 'role', 'department', 'lastContacted', 'notes', 'grade', 'targetAmount', 'type', 'owner', 'team'
  ]);
  
  const deals = getSheetData(ss, 'Deals', [
    'id', 'title', 'value', 'productAmount', 'goodsAmount', 'itemDetails', 'status', 'stage', 'contactId', 'expectedCloseDate', 'probability', 'owner', 'team', 'department'
  ]);
  
  const salesReps = getSheetData(ss, 'SalesReps', [
    'id', 'name', 'team', 'department', 'role', 'email', 'phone', 'profilePicture'
  ]);

  return JSON.stringify({
    contacts: contacts,
    deals: deals,
    salesReps: salesReps
  });
}

function saveCRMData(type, jsonData) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  let sheetName = '';
  let headers = [];

  if (type === 'contacts') {
    sheetName = 'Contacts';
    headers = ['id', 'name', 'email', 'phone', 'company', 'address', 'role', 'department', 'lastContacted', 'notes', 'grade', 'targetAmount', 'type', 'owner', 'team'];
  } else if (type === 'deals') {
    sheetName = 'Deals';
    headers = ['id', 'title', 'value', 'productAmount', 'goodsAmount', 'itemDetails', 'status', 'stage', 'contactId', 'expectedCloseDate', 'probability', 'owner', 'team', 'department'];
  } else if (type === 'salesReps') {
    sheetName = 'SalesReps';
    headers = ['id', 'name', 'team', 'department', 'role', 'email', 'phone', 'profilePicture'];
  }

  const data = JSON.parse(jsonData);
  saveSheetData(ss, sheetName, headers, data);
  return "Success";
}

function sendEmail(recipient, subject, body) {
  try {
    MailApp.sendEmail({
      to: recipient,
      subject: subject,
      htmlBody: body.replace(/\n/g, '<br>')
    });
    return "Success";
  } catch (e) {
    throw new Error("Email failed: " + e.toString());
  }
}

function getSheetData(ss, sheetName, headers) {
  let sheet = ss.getSheetByName(sheetName);
  if (!sheet) {
    sheet = ss.insertSheet(sheetName);
    sheet.appendRow(headers);
    return [];
  }
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return [];
  const range = sheet.getRange(2, 1, lastRow - 1, headers.length);
  const values = range.getValues();
  return values.map(row => {
    let obj = {};
    headers.forEach((header, index) => {
      let value = row[index];
      if (header === 'notes' && typeof value === 'string' && value.startsWith('[')) {
        try { value = JSON.parse(value); } catch(e) { value = []; }
      }
      if (value instanceof Date) value = Utilities.formatDate(value, ss.getSpreadsheetTimeZone(), "yyyy-MM-dd");
      obj[header] = value;
    });
    return obj;
  });
}

function saveSheetData(ss, sheetName, headers, data) {
  let sheet = ss.getSheetByName(sheetName);
  if (!sheet) sheet = ss.insertSheet(sheetName);
  sheet.clear();
  sheet.appendRow(headers);
  if (!data || data.length === 0) return;
  const rows = data.map(item => headers.map(header => {
    let val = item[header];
    if (header === 'notes' && Array.isArray(val)) return JSON.stringify(val);
    return val;
  }));
  if (rows.length > 0) sheet.getRange(2, 1, rows.length, headers.length).setValues(rows);
}
