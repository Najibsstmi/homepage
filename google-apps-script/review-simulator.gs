/**
 * EduSim Review Simulator Web App
 *
 * Deploy:
 * 1. Buka Google Sheet REVIEW SIMULATOR > Extensions > Apps Script.
 * 2. Paste kod ini dalam Code.gs.
 * 3. Pastikan SPREADSHEET_ID betul dan SHEET_NAME sama dengan nama tab sheet.
 * 4. Deploy > New deployment > Web app.
 * 5. Execute as: Me. Who has access: Anyone.
 * 6. Copy Web App URL yang berakhir dengan /exec ke VITE_REVIEW_SIMULATOR_WEB_APP_URL.
 */

const SPREADSHEET_ID = "1Ny-Swkd4trM6WJOxIkjzbAaPQN7yNq4u3RKx6hEymmA";
const SHEET_NAME = "Sheet1";
const HEADERS = ["timestamp", "simulator_id", "device_id", "user_type", "comment", "rating"];
const ALLOWED_USER_TYPES = ["Murid", "Guru", "Orang Awam"];
const POST_MESSAGE_SOURCE = "edusim-review";

function doGet(e) {
  var params = (e && e.parameter) || {};

  try {
    var action = params.action || "summary";

    if (action !== "summary") {
      throw new Error("Action tidak disokong.");
    }

    return webOutput_(
      {
        ok: true,
        summaries: getSummaries_(params.simulator_id || ""),
      },
      params
    );
  } catch (error) {
    return webOutput_(
      {
        ok: false,
        error: getPublicError_(error),
      },
      params
    );
  }
}

function doPost(e) {
  var params = parsePostParams_(e);
  var result;

  try {
    result = saveRating_(params);
  } catch (error) {
    result = {
      ok: false,
      request_id: params.request_id || "",
      error: getPublicError_(error),
    };
  }

  if (params.response_mode === "iframe") {
    return htmlPostMessageOutput_(result, params.origin || "*");
  }

  return jsonOutput_(result);
}

function parsePostParams_(e) {
  if (!e) {
    return {};
  }

  var postData = e.postData;
  var contents = postData && postData.contents ? postData.contents.trim() : "";

  if (contents && contents.charAt(0) === "{") {
    return JSON.parse(contents);
  }

  return e.parameter || {};
}

function saveRating_(params) {
  var payload = normalizePayload_(params);
  var lock = LockService.getScriptLock();
  lock.waitLock(10000);

  try {
    var sheet = getReviewSheet_();
    var headerMap = ensureHeaders_(sheet);
    var values = sheet.getDataRange().getValues();
    var existingRow = findExistingRow_(values, headerMap, payload.simulator_id, payload.device_id);
    var rowValues = [
      new Date(),
      payload.simulator_id,
      payload.device_id,
      payload.user_type,
      payload.comment,
      payload.rating,
    ];

    if (existingRow > 0) {
      sheet.getRange(existingRow, 1, 1, HEADERS.length).setValues([rowValues]);
    } else {
      sheet.appendRow(rowValues);
    }

    return {
      ok: true,
      request_id: params.request_id || "",
      message: "Terima kasih atas penilaian anda!",
      simulator_id: payload.simulator_id,
      summary: getSummaryForSimulator_(sheet, payload.simulator_id),
    };
  } finally {
    lock.releaseLock();
  }
}

function normalizePayload_(params) {
  var simulatorId = cleanText_(params.simulator_id, 100);
  var deviceId = cleanText_(params.device_id, 140);
  var userType = cleanText_(params.user_type, 40);
  var comment = cleanText_(params.comment || "", 300);
  var rating = Number(params.rating);

  if (!simulatorId) {
    throw new Error("simulator_id diperlukan.");
  }

  if (!deviceId) {
    throw new Error("device_id diperlukan.");
  }

  if (ALLOWED_USER_TYPES.indexOf(userType) === -1) {
    throw new Error("user_type tidak sah.");
  }

  if (rating !== Math.floor(rating) || rating < 1 || rating > 5) {
    throw new Error("rating mesti antara 1 hingga 5.");
  }

  return {
    simulator_id: simulatorId,
    device_id: deviceId,
    user_type: userType,
    comment: comment,
    rating: rating,
  };
}

function getSummaries_(simulatorId) {
  var sheet = getReviewSheet_();
  ensureHeaders_(sheet);

  if (simulatorId) {
    var cleanSimulatorId = cleanText_(simulatorId, 100);
    var singleSummary = getSummaryForSimulator_(sheet, cleanSimulatorId);
    var singleResult = {};

    if (singleSummary.count > 0) {
      singleResult[cleanSimulatorId] = singleSummary;
    }

    return singleResult;
  }

  return getAllSummariesForSheet_(sheet);
}

function getSummaryForSimulator_(sheet, simulatorId) {
  return getAllSummariesForSheet_(sheet, simulatorId)[simulatorId] || {
    average: 0,
    count: 0,
  };
}

function getAllSummariesForSheet_(sheet, onlySimulatorId) {
  var headerMap = ensureHeaders_(sheet);
  var values = sheet.getDataRange().getValues();
  var summaries = {};

  for (var i = 1; i < values.length; i += 1) {
    var row = values[i];
    var simulatorId = cleanText_(row[headerMap.simulator_id], 100);
    var rating = Number(row[headerMap.rating]);

    if (!simulatorId || (onlySimulatorId && simulatorId !== onlySimulatorId)) {
      continue;
    }

    if (rating !== Math.floor(rating) || rating < 1 || rating > 5) {
      continue;
    }

    if (!summaries[simulatorId]) {
      summaries[simulatorId] = {
        average: 0,
        count: 0,
        total: 0,
      };
    }

    summaries[simulatorId].count += 1;
    summaries[simulatorId].total += rating;
  }

  Object.keys(summaries).forEach(function (simulatorId) {
    var summary = summaries[simulatorId];
    summary.average = Math.round((summary.total / summary.count) * 10) / 10;
    delete summary.total;
  });

  return summaries;
}

function findExistingRow_(values, headerMap, simulatorId, deviceId) {
  for (var i = 1; i < values.length; i += 1) {
    var row = values[i];
    var rowSimulatorId = cleanText_(row[headerMap.simulator_id], 100);
    var rowDeviceId = cleanText_(row[headerMap.device_id], 140);

    if (rowSimulatorId === simulatorId && rowDeviceId === deviceId) {
      return i + 1;
    }
  }

  return -1;
}

function getReviewSheet_() {
  var spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
  var sheet = spreadsheet.getSheetByName(SHEET_NAME);

  if (sheet) {
    return sheet;
  }

  var sheets = spreadsheet.getSheets();
  if (sheets.length > 0) {
    return sheets[0];
  }

  return spreadsheet.insertSheet(SHEET_NAME);
}

function ensureHeaders_(sheet) {
  if (sheet.getMaxColumns() < HEADERS.length) {
    sheet.insertColumnsAfter(sheet.getMaxColumns(), HEADERS.length - sheet.getMaxColumns());
  }

  var range = sheet.getRange(1, 1, 1, HEADERS.length);
  var currentHeaders = range.getValues()[0];
  var shouldUpdateHeaders = false;

  for (var i = 0; i < HEADERS.length; i += 1) {
    if (currentHeaders[i] !== HEADERS[i]) {
      currentHeaders[i] = HEADERS[i];
      shouldUpdateHeaders = true;
    }
  }

  if (shouldUpdateHeaders) {
    range.setValues([HEADERS]);
  }

  range.setFontWeight("bold");
  sheet.setFrozenRows(1);

  return {
    timestamp: 0,
    simulator_id: 1,
    device_id: 2,
    user_type: 3,
    comment: 4,
    rating: 5,
  };
}

function webOutput_(payload, params) {
  var callback = params.callback || "";

  if (callback) {
    return jsonpOutput_(payload, callback);
  }

  return jsonOutput_(payload);
}

function jsonOutput_(payload) {
  return ContentService.createTextOutput(JSON.stringify(payload)).setMimeType(
    ContentService.MimeType.JSON
  );
}

function jsonpOutput_(payload, callback) {
  if (!isValidCallback_(callback)) {
    return jsonOutput_({
      ok: false,
      error: "Callback tidak sah.",
    });
  }

  return ContentService.createTextOutput(callback + "(" + JSON.stringify(payload) + ");")
    .setMimeType(ContentService.MimeType.JAVASCRIPT);
}

function htmlPostMessageOutput_(payload, targetOrigin) {
  var origin = isValidOrigin_(targetOrigin) ? targetOrigin : "*";
  var safePayload = JSON.stringify({
    source: POST_MESSAGE_SOURCE,
    payload: payload,
  }).replace(/</g, "\\u003c");
  var safeOrigin = JSON.stringify(origin).replace(/</g, "\\u003c");
  var html = [
    "<!doctype html>",
    "<html><body>",
    "<script>",
    "window.parent.postMessage(" + safePayload + "," + safeOrigin + ");",
    "</script>",
    "</body></html>",
  ].join("");

  return HtmlService.createHtmlOutput(html)
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

function cleanText_(value, maxLength) {
  return String(value || "")
    .trim()
    .replace(/\s+/g, " ")
    .slice(0, maxLength);
}

function isValidCallback_(callback) {
  return /^[a-zA-Z_$][0-9a-zA-Z_$]*(\.[a-zA-Z_$][0-9a-zA-Z_$]*)*$/.test(callback);
}

function isValidOrigin_(origin) {
  return origin === "*" || /^https?:\/\/[a-z0-9.-]+(?::[0-9]+)?$/i.test(origin);
}

function getPublicError_(error) {
  return error && error.message ? error.message : "Ralat tidak diketahui.";
}
