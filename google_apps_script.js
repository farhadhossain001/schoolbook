/**
 * Google Apps Script for SchoolBooks Connect
 * 
 * INSTRUCTIONS:
 * 1. Go to https://script.google.com/home
 * 2. Open your existing project.
 * 3. Replace all code in Code.gs with this code.
 * 4. Deploy as Web App:
 *    - Click 'Deploy' > 'Manage deployments' > Edit (pencil icon) > 'New version' > 'Deploy'
 *    - Ensure "Who has access" is set to "Anyone".
 * 
 * COLUMN STRUCTURE (Indices):
 * 0: id
 * 1: title
 * 2: subject
 * 3: classLevel
 * 4: subCategory (Column E)
 * 5: thumbnailUrl
 * 6: pdfUrl
 * 7: description
 * 8: publishYear
 * 9: createdAt
 */

const SHEET_NAME = 'Books';

function doGet(e) {
  return handleRequest(e);
}

function doPost(e) {
  return handleRequest(e);
}

function handleRequest(e) {
  const lock = LockService.getScriptLock();
  lock.tryLock(30000); // Wait up to 30s
  
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let sheet = ss.getSheetByName(SHEET_NAME);
    
    // Auto-create sheet if missing
    if (!sheet) {
      sheet = ss.insertSheet(SHEET_NAME);
      sheet.appendRow(['id', 'title', 'subject', 'classLevel', 'subCategory', 'thumbnailUrl', 'pdfUrl', 'description', 'publishYear', 'createdAt']);
    }

    const params = e.parameter || {};
    const postData = e.postData ? JSON.parse(e.postData.contents) : {};
    const data = { ...params, ...postData };
    const action = data.action || 'read';

    // --- READ ACTION ---
    if (action === 'read') {
      const rows = sheet.getDataRange().getValues();
      const books = [];
      
      // Start from row 1 (skipping header at row 0)
      for (let i = 1; i < rows.length; i++) {
        const row = rows[i];
        if (!row[0]) continue;
        
        // Map columns to object keys safely
        const book = {
          id: row[0],
          title: row[1],
          subject: row[2],
          classLevel: row[3],
          subCategory: row[4], // Important: This must be Column E
          thumbnailUrl: row[5],
          pdfUrl: row[6],
          description: row[7],
          publishYear: row[8]
        };
        books.push(book);
      }
      return createJSONOutput(books);
    }
    
    // --- CREATE ACTION ---
    if (action === 'create') {
      const newRow = [
        data.id || Utilities.getUuid(),
        data.title || '',
        data.subject || '',
        data.classLevel || '',
        data.subCategory || '', // Saves the ID (e.g. 'textbook', 'concept')
        data.thumbnailUrl || '',
        data.pdfUrl || '',
        data.description || '',
        data.publishYear || '',
        new Date().toISOString()
      ];
      sheet.appendRow(newRow);
      return createJSONOutput({ status: 'success', id: newRow[0] });
    }

    // --- RESET AND SEED (Fixes Structure) ---
    if (action === 'reset_and_seed') {
      const booksToSeed = data.books || [];
      
      // 1. Clear entire sheet to fix column misalignment
      sheet.clear();
      
      // 2. Write correct headers
      sheet.appendRow(['id', 'title', 'subject', 'classLevel', 'subCategory', 'thumbnailUrl', 'pdfUrl', 'description', 'publishYear', 'createdAt']);
      
      // 3. Bulk insert data
      if (booksToSeed.length > 0) {
        const rowsToAdd = booksToSeed.map(b => [
           b.id || Utilities.getUuid(),
           b.title || '',
           b.subject || '',
           b.classLevel || '',
           b.subCategory || '', 
           b.thumbnailUrl || '',
           b.pdfUrl || '',
           b.description || '',
           b.publishYear || '',
           new Date().toISOString()
        ]);
        
        // Use setValues for speed
        sheet.getRange(2, 1, rowsToAdd.length, 10).setValues(rowsToAdd);
      }
      
      return createJSONOutput({ status: 'success', count: booksToSeed.length });
    }
    
    // --- UPDATE ACTION ---
    if (action === 'update') {
      const id = data.id;
      const rows = sheet.getDataRange().getValues();
      let found = false;
      
      for (let i = 1; i < rows.length; i++) {
        if (rows[i][0] == id) {
          const rowIndex = i + 1;
          
          // Explicitly map updates to correct columns (1-based index)
          if (data.title !== undefined) sheet.getRange(rowIndex, 2).setValue(data.title);
          if (data.subject !== undefined) sheet.getRange(rowIndex, 3).setValue(data.subject);
          if (data.classLevel !== undefined) sheet.getRange(rowIndex, 4).setValue(data.classLevel);
          if (data.subCategory !== undefined) sheet.getRange(rowIndex, 5).setValue(data.subCategory); // Col E
          if (data.thumbnailUrl !== undefined) sheet.getRange(rowIndex, 6).setValue(data.thumbnailUrl); // Col F
          if (data.pdfUrl !== undefined) sheet.getRange(rowIndex, 7).setValue(data.pdfUrl);
          if (data.description !== undefined) sheet.getRange(rowIndex, 8).setValue(data.description);
          
          found = true;
          break;
        }
      }
      return createJSONOutput({ status: found ? 'success' : 'not_found' });
    }
    
    // --- DELETE ACTION ---
    if (action === 'delete') {
      const id = data.id;
      const rows = sheet.getDataRange().getValues();
      for (let i = 1; i < rows.length; i++) {
        if (rows[i][0] == id) {
          sheet.deleteRow(i + 1);
          return createJSONOutput({ status: 'success' });
        }
      }
      return createJSONOutput({ status: 'not_found' });
    }

  } catch (err) {
    return createJSONOutput({ status: 'error', message: err.toString() });
  } finally {
    lock.releaseLock();
  }
}

function createJSONOutput(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}