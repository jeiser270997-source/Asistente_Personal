const { google } = require('googleapis');
const { authorize } = require('./google_auth');

const DRIVE_SCOPES = [
  'https://www.googleapis.com/auth/gmail.modify',
  'https://www.googleapis.com/auth/calendar',
  'https://www.googleapis.com/auth/drive'
];

async function getDriveClient() {
  const auth = await authorize(DRIVE_SCOPES);
  return google.drive({ version: 'v3', auth });
}

/**
 * List files in Google Drive sorted by size or modification date
 */
async function listFiles({ pageSize = 20, query = "trashed = false", orderBy = "quotaBytesUsed desc" } = {}) {
  try {
    const drive = await getDriveClient();
    const res = await drive.files.list({
      pageSize,
      q: query,
      orderBy,
      fields: 'nextPageToken, files(id, name, mimeType, size, quotaBytesUsed, createdTime, modifiedTime, trashed)'
    });
    return res.data.files || [];
  } catch (err) {
    console.error('Error listing Drive files:', err.message);
    throw err;
  }
}

/**
 * Move specific file IDs to Drive trash
 */
async function trashFiles(fileIds = []) {
  try {
    const drive = await getDriveClient();
    const results = [];
    for (const fileId of fileIds) {
      try {
        const res = await drive.files.update({
          fileId,
          requestBody: { trashed: true },
          supportsAllDrives: true
        });
        results.push({ id: fileId, name: res.data.name, status: 'trashed' });
      } catch (err) {
        try {
          await drive.files.delete({ fileId, supportsAllDrives: true });
          results.push({ id: fileId, status: 'deleted' });
        } catch (delErr) {
          console.warn(`   ⚠️ Archivo ID ${fileId} ("Compartido conmigo" - sin permiso de escritura por el propietario original): ${err.message}`);
        }
      }
    }
    return results;
  } catch (err) {
    console.error('Error moving files to trash:', err.message);
    throw err;
  }
}

/**
 * Permanently empty Google Drive trash
 */
async function emptyTrash() {
  try {
    const drive = await getDriveClient();
    await drive.files.emptyTrash();
    return { success: true, message: 'Google Drive Papelera vaciada permanentemente.' };
  } catch (err) {
    console.error('Error emptying Drive trash:', err.message);
    throw err;
  }
}

/**
 * Get or create a dedicated folder in Google Drive
 */
async function getOrCreateFolder(folderName = 'LifeOS_Backups') {
  const drive = await getDriveClient();
  const res = await drive.files.list({
    q: `mimeType = 'application/vnd.google-apps.folder' and name = '${folderName}' and trashed = false`,
    fields: 'files(id, name)'
  });

  if (res.data.files && res.data.files.length > 0) {
    return res.data.files[0].id;
  }

  const folderMeta = {
    name: folderName,
    mimeType: 'application/vnd.google-apps.folder'
  };

  const folder = await drive.files.create({
    requestBody: folderMeta,
    fields: 'id'
  });

  return folder.data.id;
}

/**
 * Upload a local file to Google Drive
 */
async function uploadFileToDrive(filePath, folderId = null, customName = null) {
  const fsNode = require('node:fs');
  const pathNode = require('node:path');
  const drive = await getDriveClient();

  const fileName = customName || pathNode.basename(filePath);
  const fileMetadata = {
    name: fileName,
    parents: folderId ? [folderId] : []
  };

  const media = {
    body: fsNode.createReadStream(filePath)
  };

  const res = await drive.files.create({
    requestBody: fileMetadata,
    media: media,
    fields: 'id, name, webViewLink, size'
  });

  return res.data;
}

module.exports = {
  getDriveClient,
  listFiles,
  trashFiles,
  emptyTrash,
  getOrCreateFolder,
  uploadFileToDrive,
  DRIVE_SCOPES
};

