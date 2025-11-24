
// Backend: Code.gs
const SPREADSHEET_ID = '1fWeLcQvotKZGgxelAOvKt_UXyYvdoneYVBeVXFMLRKY';

function doGet(e) {
  try {
    return HtmlService.createTemplateFromFile('index')
        .evaluate()
        .setTitle('IEG CRM')
        .addMetaTag('viewport', 'width=device-width, initial-scale=1')
        .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
  } catch (e) {
    return HtmlService.createHtmlOutput(`
      <div style="text-align:center; font-family:sans-serif; padding:20px;">
        <h2>⚠️ Application Error</h2>
        <p><b>index.html</b> 파일을 찾을 수 없습니다.</p>
        <p>Apps Script 에디터에서 HTML 파일을 만들고 이름을 'index'로 지정한 뒤 코드를 붙여넣으세요.</p>
        <details style="color:gray;">${e.toString()}</details>
      </div>
    `);
  }
}

function getCRMData() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  
  const getData = (sheetName) => {
    let sheet = ss.getSheetByName(sheetName);
    if (!sheet) {
        // 시트가 없으면 생성 (에러 방지)
        sheet = ss.insertSheet(sheetName);
        if(sheetName === 'SalesReps') sheet.appendRow(['id', 'name', 'team', 'department', 'role', 'email', 'phone', 'profilePicture']);
        else if(sheetName === 'Contacts') sheet.appendRow(['id', 'name', 'email', 'phone', 'company', 'address', 'role', 'department', 'lastContacted', 'notes', 'grade', 'targetAmount', 'type', 'owner', 'team']);
        return [];
    }
    const rows = sheet.getDataRange().getValues();
    if (rows.length < 2) return [];
    const headers = rows[0];
    return rows.slice(1).map(row => {
      let obj = {};
      headers.forEach((h, i) => {
        let val = row[i];
        if (h === 'notes') { try { val = JSON.parse(val); } catch(e) { val = []; } }
        if (val instanceof Date) val = Utilities.formatDate(val, ss.getSpreadsheetTimeZone(), "yyyy-MM-dd");
        obj[h] = val;
      });
      return obj;
    });
  };

  return JSON.stringify({
    contacts: getData('Contacts'),
    deals: getData('Deals'),
    salesReps: getData('SalesReps')
  });
}

function saveCRMData(type, jsonData) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const data = JSON.parse(jsonData);
  
  let sheetName = '';
  let headers = [];

  if (type === 'contacts') {
    sheetName = 'Contacts';
    headers = ['id', 'name', 'email', 'phone', 'company', 'address', 'role', 'department', 'lastContacted', 'notes', 'grade', 'targetAmount', 'type', 'owner', 'team'];
  } else if (type === 'deals') {
    sheetName = 'Deals';
    headers = ['id', 'title', 'value', 'productAmount', 'goodsAmount', 'itemDetails', 'status', 'stage', 'contactId', 'expectedCloseDate', 'probability', 'owner', 'team', 'department', 'updatedAt'];
  } else if (type === 'salesReps') {
    sheetName = 'SalesReps';
    headers = ['id', 'name', 'team', 'department', 'role', 'email', 'phone', 'profilePicture'];
  }

  let sheet = ss.getSheetByName(sheetName);
  if (!sheet) {
    sheet = ss.insertSheet(sheetName);
    sheet.appendRow(headers);
  }
  
  if (sheet.getLastRow() > 1) {
    sheet.getRange(2, 1, sheet.getLastRow()-1, sheet.getLastColumn()).clearContent();
  }
  
  if (data.length > 0) {
    const rows = data.map(item => headers.map(h => {
      let val = item[h];
      if (h === 'notes' && Array.isArray(val)) return JSON.stringify(val);
      return val;
    }));
    sheet.getRange(2, 1, rows.length, headers.length).setValues(rows);
  }
  
  return "Success";
}

function createGoogleDoc(title, htmlContent) {
  try {
    const doc = DocumentApp.create(title);
    const body = doc.getBody();
    const text = htmlContent.replace(/<[^>]+>/g, '\n').replace(/\n\s*\n/g, '\n\n');
    body.setText(text);
    doc.saveAndClose();
    return doc.getUrl();
  } catch(e) {
    throw new Error("Doc creation failed: " + e.toString());
  }
}

function sendEmail(recipient, subject, body) {
  MailApp.sendEmail({to: recipient, subject: subject, htmlBody: body});
}
