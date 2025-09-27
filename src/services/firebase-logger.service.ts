import { admin, firebaseApp } from '@/config/firebase.config';
import * as FirebaseFirestore from 'firebase-admin/firestore';

export interface FirebaseLogEntry {
  id?: string;
  timestamp: Date;
  level: string;
  message: string;
  metadata?: any;
  userId?: string;
  ipAddress?: string;
  userAgent?: string;
  resource?: string;
  action?: string;
}

export interface DatabaseChangeLog {
  id?: string;
  timestamp: Date;
  operation: string;
  table: string;
  recordId?: string;
  userId?: string;
  changes?: any;
  before?: any;
  after?: any;
}

export class FirebaseLoggerService {
  private firestore: FirebaseFirestore.Firestore | null = null;
  private enabled: boolean = false;

  constructor() {
    if (firebaseApp) {
      try {
        this.firestore = admin.firestore();
        this.enabled = true;
        console.log('Firebase Logger Service initialized successfully');
      } catch (error) {
        console.error('Failed to initialize Firebase Logger Service', error);
      }
    } else {
      console.warn('Firebase Logger Service disabled - Firebase not configured');
    }
  }

  /**
   * Log an activity to Firebase Firestore
   */
  async logActivity(logEntry: FirebaseLogEntry): Promise<void> {
    if (!this.enabled || !this.firestore) {
      return;
    }

    try {
      const logCollection = this.firestore.collection('activity_logs');
      // Remove undefined values before sending to Firestore
      const cleanLogEntry = this.removeUndefinedValues({
        ...logEntry,
        // Ensure timestamp is properly formatted for Firestore
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
      });
      await logCollection.add(cleanLogEntry);
    } catch (error) {
      console.error('Failed to log activity to Firebase', error);
    }
  }

  /**
   * Log a database change to Firebase Firestore
   */
  async logDatabaseChange(changeLog: DatabaseChangeLog): Promise<void> {
    if (!this.enabled || !this.firestore) {
      return;
    }

    try {
      const logCollection = this.firestore.collection('database_changes');
      // Remove undefined values before sending to Firestore
      const cleanChangeLog = this.removeUndefinedValues({
        ...changeLog,
        // Ensure timestamp is properly formatted for Firestore
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
      });
      await logCollection.add(cleanChangeLog);
    } catch (error) {
      console.error('Failed to log database change to Firebase', error);
    }
  }

  /**
   * Get activity logs from Firebase
   */
  async getActivityLogs(
    limit: number = 100,
    userId?: string,
    level?: string
  ): Promise<FirebaseLogEntry[]> {
    if (!this.enabled || !this.firestore) {
      return [];
    }

    try {
      // Start with a simple query to avoid index issues
      let query: FirebaseFirestore.Query = this.firestore
        .collection('activity_logs')
        .orderBy('timestamp', 'desc');

      // Apply filters one at a time, but catch index errors
      const snapshot = await query.limit(limit * 2).get(); // Get more to account for filtering
      
      // Filter results in memory to avoid composite index requirements
      let results = snapshot.docs.map((doc: FirebaseFirestore.QueryDocumentSnapshot) => {
        const data = doc.data();
        // Fix timestamp handling - check if it's already a Date or needs conversion
        let timestamp: Date;
        if (data['timestamp'] instanceof Date) {
          timestamp = data['timestamp'];
        } else if (data['timestamp'] && typeof data['timestamp'].toDate === 'function') {
          timestamp = data['timestamp'].toDate();
        } else {
          timestamp = new Date();
        }
        
        return {
          id: doc.id,
          ...data,
          timestamp,
        } as FirebaseLogEntry;
      });

      // Apply in-memory filtering to avoid composite index requirements
      if (userId) {
        results = results.filter(log => log.userId === userId);
      }
      
      if (level) {
        results = results.filter(log => log.level === level);
      }

      // Apply limit after filtering
      return results.slice(0, limit);
    } catch (error: any) {
      console.error('Failed to retrieve activity logs from Firebase', error);
      // Return empty array but log the error for debugging
      return [];
    }
  }

  /**
   * Get database changes from Firebase
   */
  async getDatabaseChanges(
    limit: number = 100,
    table?: string,
    operation?: string
  ): Promise<DatabaseChangeLog[]> {
    if (!this.enabled || !this.firestore) {
      return [];
    }

    try {
      // Start with a simple query to avoid index issues
      let query: FirebaseFirestore.Query = this.firestore
        .collection('database_changes')
        .orderBy('timestamp', 'desc');

      // Apply filters one at a time, but catch index errors
      const snapshot = await query.limit(limit).get();
      
      // Filter results in memory to avoid composite index requirements
      let results = snapshot.docs.map(doc => {
        const data = doc.data();
        // Fix timestamp handling - check if it's already a Date or needs conversion
        let timestamp: Date;
        if (data['timestamp'] instanceof Date) {
          timestamp = data['timestamp'];
        } else if (data['timestamp'] && typeof data['timestamp'].toDate === 'function') {
          timestamp = data['timestamp'].toDate();
        } else {
          timestamp = new Date();
        }

        return {
          id: doc.id,
          ...data,
          timestamp,
        } as DatabaseChangeLog;
      });

      // Apply in-memory filtering to avoid composite index requirements
      if (table) {
        results = results.filter(log => log.table === table);
      }
      
      if (operation) {
        results = results.filter(log => log.operation === operation);
      }

      // Apply limit after filtering
      return results.slice(0, limit);
    } catch (error: any) {
      console.error('Failed to retrieve database changes from Firebase', error);
      // Return empty array but log the error for debugging
      return [];
    }
  }

  /**
   * Check if Firebase logging is enabled
   */
  isEnabled(): boolean {
    return this.enabled;
  }

  /**
   * Remove undefined values from an object
   */
  private removeUndefinedValues(obj: any): any {
    const cleaned: any = {};
    for (const key in obj) {
      if (obj[key] !== undefined) {
        if (typeof obj[key] === 'object' && obj[key] !== null && !Array.isArray(obj[key])) {
          cleaned[key] = this.removeUndefinedValues(obj[key]);
        } else {
          cleaned[key] = obj[key];
        }
      }
    }
    return cleaned;
  }
}

// Export singleton instance
export const firebaseLogger = new FirebaseLoggerService();
