function doGet(e) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  
  function getTabData(sheetName) {
    var sheet = ss.getSheetByName(sheetName);
    if (!sheet) return [];
    var rows = sheet.getDataRange().getValues();
    if (rows.length <= 1) return [];
    var headers = rows[0];
    var data = [];
    for (var i = 1; i < rows.length; i++) {
      var row = rows[i];
      var record = { rowIndex: i + 1 };
      for (var j = 0; j < headers.length; j++) {
        record[headers[j]] = row[j];
      }
      data.push(record);
    }
    return data;
  }

  var response = {
    status: "success",
    data: getTabData("Schedule"), // Backwards compatibility
    schedule: getTabData("Schedule"),
    tasks: getTabData("Tasks"),
    dwar: getTabData("DWAR"),
    questions: getTabData("Questions"),
    mocks: getTabData("Mocks"),
    sm2Deck: getTabData("SM2Deck")
  };

  return ContentService
    .createTextOutput(JSON.stringify(response))
    .setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  
  if (!e || !e.postData || !e.postData.contents) {
    return ContentService.createTextOutput(JSON.stringify({ status: "error", message: "No post data received" }))
      .setMimeType(ContentService.MimeType.JSON);
  }

  var body = JSON.parse(e.postData.contents);
  var action = body.action;

  // Single Schedule Row Update (Handles both "update" and "updateSchedule")
  if (action === "updateSchedule" || action === "update") {
    var sheet = ss.getSheetByName("Schedule");
    var rowIndex = body.rowIndex;
    if (sheet && rowIndex) {
      if (body.status !== undefined) sheet.getRange(rowIndex, 4).setValue(body.status);
      if (body.strength !== undefined) sheet.getRange(rowIndex, 5).setValue(body.strength);
      if (body.scheduledDate !== undefined) sheet.getRange(rowIndex, 6).setValue(body.scheduledDate);
    }
    return ContentService.createTextOutput(JSON.stringify({ status: "success", message: "Schedule updated" }))
      .setMimeType(ContentService.MimeType.JSON);
  }

  // Full Cloud Backup Sync
  if (action === "syncAll") {
    function overwriteTab(sheetName, headers, rowsData) {
      var sheet = ss.getSheetByName(sheetName);
      if (!sheet) sheet = ss.insertSheet(sheetName);
      sheet.clear();
      sheet.appendRow(headers);
      if (rowsData && rowsData.length > 0) {
        var matrix = rowsData.map(function(item) {
          return headers.map(function(h) {
            var val = item[h];
            if (Array.isArray(val)) return JSON.stringify(val);
            return val !== undefined && val !== null ? val : "";
          });
        });
        sheet.getRange(2, 1, matrix.length, headers.length).setValues(matrix);
      }
    }

    if (body.tasks) overwriteTab("Tasks", ["id", "date", "text", "timeSlot", "completed"], body.tasks);
    if (body.dwar) overwriteTab("DWAR", ["id", "date", "did", "will", "achievement", "regret", "score"], body.dwar);
    if (body.questions) overwriteTab("Questions", ["id", "subject", "chapter", "topic", "questionText", "image", "errorType", "difficulty", "attempts"], body.questions);
    if (body.mocks) overwriteTab("Mocks", ["id", "name", "date", "timeframe", "physics", "chemistry", "biology", "total", "negativeMarks", "rank"], body.mocks);
    if (body.sm2Deck) overwriteTab("SM2Deck", ["id", "subject", "topic", "repetition", "interval", "easeFactor", "lastReviewed", "nextDue", "retentionScore"], body.sm2Deck);

    return ContentService
      .createTextOutput(JSON.stringify({ status: "success", message: "Cloud backup completed" }))
      .setMimeType(ContentService.MimeType.JSON);
  }

  return ContentService.createTextOutput(JSON.stringify({ status: "invalid action", actionReceived: action }))
    .setMimeType(ContentService.MimeType.JSON);
}