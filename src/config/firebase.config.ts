import * as admin from 'firebase-admin';
import config from '@/config';
import * as fs from 'fs';

// Initialize Firebase Admin SDK
let firebaseApp: admin.app.App;

if (config.app.env !== 'test') {
  try {
    // Check if Firebase credentials are provided
    if (process.env['FIREBASE_SERVICE_ACCOUNT_KEY']) {
      const serviceAccount = JSON.parse(process.env['FIREBASE_SERVICE_ACCOUNT_KEY']);

      firebaseApp = admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        databaseURL: process.env['FIREBASE_DATABASE_URL'] || '',
      });
    } else if (process.env['FIREBASE_SERVICE_ACCOUNT_PATH']) {
      const serviceAccount = JSON.parse(
        fs.readFileSync(process.env['FIREBASE_SERVICE_ACCOUNT_PATH'], 'utf8')
      );
      firebaseApp = admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        databaseURL: process.env['FIREBASE_DATABASE_URL'] || '',
      });
    } else {
      console.warn('Firebase credentials not provided. Firebase logging will be disabled.');
    }
  } catch (error) {
    console.error('Failed to initialize Firebase:', error);
  }
}

export { firebaseApp, admin };
