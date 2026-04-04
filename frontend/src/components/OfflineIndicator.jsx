import React, { useState, useEffect } from 'react';
import { Wifi, WifiOff, RefreshCw, AlertCircle } from 'lucide-react';
import { isOnline, setupNetworkListeners, getPendingSyncCount, syncPendingData } from '../utils/offlineStorage';

const OfflineIndicator = () => {
  const [online, setOnline] = useState(isOnline());
  const [pendingCount, setPendingCount] = useState(0);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    // Update pending count periodically
    const updatePendingCount = async () => {
      const count = await getPendingSyncCount();
      setPendingCount(count);
    };

    updatePendingCount();
    const interval = setInterval(updatePendingCount, 5000); // Check every 5 seconds

    // Setup network listeners
    const cleanup = setupNetworkListeners(
      () => {
        setOnline(true);
        // Auto-sync when coming back online
        handleSync();
      },
      () => setOnline(false)
    );

    return () => {
      clearInterval(interval);
      cleanup();
    };
  }, []);

  const handleSync = async () => {
    if (!online || syncing) return;

    setSyncing(true);
    try {
      await syncPendingData();
      const newCount = await getPendingSyncCount();
      setPendingCount(newCount);
    } catch (error) {
      console.error('Sync failed:', error);
    } finally {
      setSyncing(false);
    }
  };

  if (online && pendingCount === 0) {
    return null; // Don't show anything when online and no pending data
  }

  return (
    <div className={`offline-indicator ${online ? 'online' : 'offline'}`}>
      <div className="indicator-content">
        <div className="status-icon">
          {online ? <Wifi size={16} /> : <WifiOff size={16} />}
        </div>

        <div className="status-text">
          {online ? (
            <>
              <span>Online</span>
              {pendingCount > 0 && (
                <span className="pending-text">
                  {pendingCount} item{pendingCount !== 1 ? 's' : ''} to sync
                </span>
              )}
            </>
          ) : (
            <span>Offline Mode</span>
          )}
        </div>

        {online && pendingCount > 0 && (
          <button
            className="sync-button"
            onClick={handleSync}
            disabled={syncing}
            title="Sync pending data"
          >
            {syncing ? (
              <RefreshCw size={14} className="spinning" />
            ) : (
              <RefreshCw size={14} />
            )}
          </button>
        )}

        {!online && (
          <div className="offline-message">
            <AlertCircle size={14} />
            <span>Some features require internet connection</span>
          </div>
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
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          transition: all 0.3s ease;
        }

        .offline-indicator.online {
          background: #e8f5e8;
          border-color: #4caf50;
          color: #2e7d32;
        }

        .offline-indicator.offline {
          background: #fff3e0;
          border-color: #ff9800;
          color: #f57c00;
        }

        .indicator-content {
          max-width: 1200px;
          margin: 0 auto;
          padding: 8px 16px;
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .status-icon {
          display: flex;
          align-items: center;
        }

        .status-text {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .status-text span:first-child {
          font-weight: 500;
          font-size: 14px;
        }

        .pending-text {
          font-size: 12px;
          opacity: 0.8;
        }

        .sync-button {
          background: none;
          border: 1px solid currentColor;
          border-radius: 4px;
          padding: 4px 8px;
          cursor: pointer;
          display: flex;
          align-items: center;
          transition: all 0.2s ease;
        }

        .sync-button:hover:not(:disabled) {
          background: currentColor;
          color: white;
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

        .offline-message {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 12px;
          opacity: 0.9;
        }

        @media (max-width: 768px) {
          .indicator-content {
            padding: 6px 12px;
            gap: 8px;
          }

          .status-text span:first-child {
            font-size: 13px;
          }

          .pending-text,
          .offline-message span {
            font-size: 11px;
          }
        }
      `}</style>
    </div>
  );
};

export default OfflineIndicator;
