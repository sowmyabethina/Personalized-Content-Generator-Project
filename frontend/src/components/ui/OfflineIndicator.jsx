// greptile review trigger
import React, { useState, useEffect } from 'react';
import { Wifi, WifiOff, RefreshCw } from 'lucide-react';
import { getPendingSyncCount, syncPendingData } from '../../utils/offlineStorage';

const OfflineIndicator = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [pendingSync, setPendingSync] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Check for pending sync data
    const checkPendingSync = async () => {
      try {
        const count = await getPendingSyncCount();
        setPendingSync(count);
      } catch (error) {
        console.error('Error checking pending sync:', error);
      }
    };

    checkPendingSync();

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleSync = async () => {
    if (!isOnline || isSyncing) return;

    setIsSyncing(true);
    try {
      await syncPendingData();
      setPendingSync(0);
    } catch (error) {
      console.error('Sync failed:', error);
    } finally {
      setIsSyncing(false);
    }
  };

  if (isOnline && pendingSync === 0) return null;

  return (
    <div className={`offline-indicator ${!isOnline ? 'offline' : 'online'}`}>
      <div className="offline-indicator-content">
        <div className="offline-status">
          {!isOnline ? (
            <>
              <WifiOff size={16} />
              <span>You're offline</span>
            </>
          ) : (
            <>
              <Wifi size={16} />
              <span>Back online</span>
            </>
          )}
        </div>

        {pendingSync > 0 && isOnline && (
          <button
            className="sync-button"
            onClick={handleSync}
            disabled={isSyncing}
          >
            <RefreshCw size={14} className={isSyncing ? 'spinning' : ''} />
            <span>Sync {pendingSync} item{pendingSync !== 1 ? 's' : ''}</span>
          </button>
        )}
      </div>

      <style jsx>{`
        .offline-indicator {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          z-index: 1000;
          background: #fff;
          border-bottom: 2px solid;
          transition: all 0.3s ease;
        }

        .offline-indicator.offline {
          background: #fef2f2;
          border-bottom-color: #ef4444;
        }

        .offline-indicator.online {
          background: #f0fdf4;
          border-bottom-color: #22c55e;
        }

        .offline-indicator-content {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 8px 16px;
          max-width: 1200px;
          margin: 0 auto;
        }

        .offline-status {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 14px;
          font-weight: 500;
          color: #374151;
        }

        .offline-indicator.offline .offline-status {
          color: #dc2626;
        }

        .offline-indicator.online .offline-status {
          color: #16a34a;
        }

        .sync-button {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 6px 12px;
          background: #3b82f6;
          color: white;
          border: none;
          border-radius: 6px;
          font-size: 12px;
          font-weight: 500;
          cursor: pointer;
          transition: background-color 0.2s;
        }

        .sync-button:hover:not(:disabled) {
          background: #2563eb;
        }

        .sync-button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .spinning {
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        @media (max-width: 640px) {
          .offline-indicator-content {
            flex-direction: column;
            gap: 8px;
            align-items: flex-start;
          }

          .sync-button {
            align-self: flex-end;
          }
        }
      `}</style>
    </div>
  );
};

export default OfflineIndicator;
