import { openDB } from 'idb';

/**
 * Initialize IndexedDB for offline storage
 */
export const initOfflineDB = async () => {
  return openDB('learning-platform', 1, {
    upgrade(db) {
      // Store quiz results for later sync
      if (!db.objectStoreNames.contains('pending-quiz-results')) {
        db.createObjectStore('pending-quiz-results', { keyPath: 'id', autoIncrement: true });
      }

      // Store learning progress for later sync
      if (!db.objectStoreNames.contains('pending-progress')) {
        db.createObjectStore('pending-progress', { keyPath: 'id', autoIncrement: true });
      }

      // Cache generated content for offline viewing
      if (!db.objectStoreNames.contains('cached-content')) {
        db.createObjectStore('cached-content', { keyPath: 'id' });
      }

      // Store quiz data for offline taking
      if (!db.objectStoreNames.contains('cached-quizzes')) {
        db.createObjectStore('cached-quizzes', { keyPath: 'id' });
      }
    },
  });
};

/**
 * Check if the app is currently online
 */
export const isOnline = () => {
  return navigator.onLine;
};

/**
 * Listen for online/offline events
 */
export const setupNetworkListeners = (onOnline, onOffline) => {
  window.addEventListener('online', onOnline);
  window.addEventListener('offline', onOffline);

  // Return cleanup function
  return () => {
    window.removeEventListener('online', onOnline);
    window.removeEventListener('offline', onOffline);
  };
};

/**
 * Store quiz result for later sync when back online
 */
export const storeQuizResultOffline = async (quizData) => {
  try {
    const db = await initOfflineDB();
    await db.add('pending-quiz-results', {
      data: quizData,
      timestamp: Date.now(),
      synced: false
    });
    console.log('Quiz result stored offline for later sync');
  } catch (error) {
    console.error('Failed to store quiz result offline:', error);
  }
};

/**
 * Store learning progress for later sync
 */
export const storeProgressOffline = async (progressData) => {
  try {
    const db = await initOfflineDB();
    await db.add('pending-progress', {
      data: progressData,
      timestamp: Date.now(),
      synced: false
    });
    console.log('Progress stored offline for later sync');
  } catch (error) {
    console.error('Failed to store progress offline:', error);
  }
};

/**
 * Cache content for offline viewing
 */
export const cacheContentOffline = async (contentId, content) => {
  try {
    const db = await initOfflineDB();
    await db.put('cached-content', {
      id: contentId,
      content,
      timestamp: Date.now()
    });
    console.log('Content cached for offline viewing:', contentId);
  } catch (error) {
    console.error('Failed to cache content offline:', error);
  }
};

/**
 * Get cached content
 */
export const getCachedContent = async (contentId) => {
  try {
    const db = await initOfflineDB();
    return await db.get('cached-content', contentId);
  } catch (error) {
    console.error('Failed to get cached content:', error);
    return null;
  }
};

/**
 * Cache quiz for offline taking
 */
export const cacheQuizOffline = async (quizId, quizData) => {
  try {
    const db = await initOfflineDB();
    await db.put('cached-quizzes', {
      id: quizId,
      data: quizData,
      timestamp: Date.now()
    });
    console.log('Quiz cached for offline taking:', quizId);
  } catch (error) {
    console.error('Failed to cache quiz offline:', error);
  }
};

/**
 * Get cached quiz
 */
export const getCachedQuiz = async (quizId) => {
  try {
    const db = await initOfflineDB();
    const cached = await db.get('cached-quizzes', quizId);
    return cached ? cached.data : null;
  } catch (error) {
    console.error('Failed to get cached quiz:', error);
    return null;
  }
};

/**
 * Get pending sync data count
 */
export const getPendingSyncCount = async () => {
  try {
    const db = await initOfflineDB();
    const results = await db.getAll('pending-quiz-results');
    const progress = await db.getAll('pending-progress');
    return results.length + progress.length;
  } catch (error) {
    console.error('Failed to get pending sync count:', error);
    return 0;
  }
};
export const syncPendingData = async () => {
  if (!isOnline()) {
    console.log('Cannot sync: offline');
    return;
  }

  try {
    const db = await initOfflineDB();

    // Sync quiz results
    const pendingResults = await db.getAll('pending-quiz-results');
    for (const result of pendingResults) {
      try {
        const response = await fetch('/quiz/score-quiz', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(result.data)
        });

        if (response.ok) {
          await db.delete('pending-quiz-results', result.id);
          console.log('Synced quiz result:', result.id);
        }
      } catch (error) {
        console.error('Failed to sync quiz result:', result.id, error);
      }
    }

    // Sync progress
    const pendingProgress = await db.getAll('pending-progress');
    for (const progress of pendingProgress) {
      try {
        const response = await fetch('/learning/progress', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(progress.data)
        });

        if (response.ok) {
          await db.delete('pending-progress', progress.id);
          console.log('Synced progress:', progress.id);
        }
      } catch (error) {
        console.error('Failed to sync progress:', progress.id, error);
      }
    }

    console.log('Offline sync completed');
  } catch (error) {
    console.error('Sync failed:', error);
  }
};

/**
 * Clear all cached data (for storage management)
 */
export const clearOfflineCache = async () => {
  try {
    const db = await initOfflineDB();
    await db.clear('cached-content');
    await db.clear('cached-quizzes');
    console.log('Offline cache cleared');
  } catch (error) {
    console.error('Failed to clear offline cache:', error);
  }
};
