
/**
 * Google Apps Script Backend Code
 * 이 코드는 Code.gs 파일에 붙여넣으세요.
 */

// 사용자가 지정한 스프레드시트 ID
const SPREADSHEET_ID = '1fWeLcQvotKZGgxelAOvKt_UXyYvdoneYVBeVXFMLRKY';

function doGet(e) {
  try {
    // index.html 파일을 찾아 웹앱으로 표시합니다.
    return HtmlService.createTemplateFromFile('index')
        .evaluate()
        .setTitle('IEG CRM')
        .addMetaTag('viewport', 'width=device-width, initial-scale=1')
        .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
  } catch (e) {
    // index.html 파일이 없을 경우 에러 메시지를 표시하는 안전장치입니다.
    return HtmlService.createHtmlOutput(
      `<div style="font-family: sans-serif; padding: 20px; text-align: center;">
         <h2 style="color: #e11d48;">⚠️ 설치 오류</h2>
         <p><b>index.html</b> 파일을 찾을 수 없습니다.</p>
         <p>좌측 메뉴에서 <b>[+] > HTML</b>을 클릭하여 파일 이름을 <b>index</b>로 생성하고,</p>
         <p>제공된 React 통합 코드를 모두 붙여넣으세요.</p>
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
    throw new Error("이메일 발송 실패: " + e.toString());
  }
}

function syncSheetData() {
  return getCRMData();
}

// --- Helper Functions ---

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
      if (value instanceof Date) {
         value = Utilities.formatDate(value, ss.getSpreadsheetTimeZone(), "yyyy-MM-dd");
      }
      obj[header] = value;
    });
    return obj;
  });
}

function saveSheetData(ss, sheetName, headers, data) {
  let sheet = ss.getSheetByName(sheetName);
  if (!sheet) {
    sheet = ss.insertSheet(sheetName);
  }
  
  sheet.clear();
  if (sheet.getLastRow() === 0) {
      sheet.appendRow(headers);
  } else {
      sheet.getRange(2, 1, sheet.getMaxRows(), sheet.getMaxColumns()).clearContent();
  }

  if (!data || data.length === 0) return;

  const rows = data.map(item => {
    return headers.map(header => {
      let val = item[header];
      if (header === 'notes' && Array.isArray(val)) {
        return JSON.stringify(val);
      }
      return val;
    });
  });

  if (rows.length > 0) {
    sheet.getRange(2, 1, rows.length, headers.length).setValues(rows);
  }
}
