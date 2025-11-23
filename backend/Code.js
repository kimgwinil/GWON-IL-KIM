
/**
 * Google Apps Script Backend Code
 * 이 코드를 Google Apps Script 프로젝트의 Code.gs 파일에 복사하여 붙여넣으세요.
 */

// 사용자가 지정한 스프레드시트 ID
const SPREADSHEET_ID = '1fWeLcQvotKZGgxelAOvKt_UXyYvdoneYVBeVXFMLRKY';

function doGet(e) {
  return HtmlService.createTemplateFromFile('index')
      .evaluate()
      .setTitle('IEG CRM')
      .addMetaTag('viewport', 'width=device-width, initial-scale=1')
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

/**
 * 초기 데이터 로드
 */
function getCRMData() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  // address column added
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

/**
 * 데이터 저장 (개별 업데이트 또는 전체 저장)
 */
function saveCRMData(type, jsonData) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  let sheetName = '';
  let headers = [];

  if (type === 'contacts') {
    sheetName = 'Contacts';
    // address, type, owner, team added
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

/**
 * 주간 리포트 이메일 발송
 */
function sendEmail(recipient, subject, body) {
  try {
    MailApp.sendEmail({
      to: recipient,
      subject: subject,
      htmlBody: body.replace(/\n/g, '<br>') // Convert newlines to HTML breaks
    });
    return "Success";
  } catch (e) {
    Logger.log("Email Error: " + e.toString());
    throw new Error("이메일 발송 실패: " + e.toString());
  }
}

/**
 * 시트 데이터 전체 동기화 (Bulk Import 용)
 * 구글 시트에 사용자가 직접 입력한 데이터를 앱으로 가져올 때 사용
 */
function syncSheetData() {
  // 단순히 getCRMData를 재호출하여 최신 시트 상태를 반환
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
      // 날짜 객체 처리
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
  // 헤더가 없으면 추가
  if (sheet.getLastRow() === 0) {
      sheet.appendRow(headers);
  } else {
      // 기존 데이터 삭제 (헤더 유지)
      // sheet.deleteRows(2, sheet.getLastRow() - 1); // This can be slow for many rows
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

  // 대량 데이터 쓰기 최적화
  if (rows.length > 0) {
    sheet.getRange(2, 1, rows.length, headers.length).setValues(rows);
  }
}
