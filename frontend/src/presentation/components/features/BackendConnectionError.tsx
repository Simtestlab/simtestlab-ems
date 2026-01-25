'use client';

import { AlertTriangle, RefreshCw, Server } from 'lucide-react';
import { useEffect, useState } from 'react';

interface BackendConnectionErrorProps {
  onRetry?: () => void;
  showRetryButton?: boolean;
}

export default function BackendConnectionError({ 
  onRetry, 
  showRetryButton = true 
}: BackendConnectionErrorProps) {
  const [countdown, setCountdown] = useState(10);
  const [isRetrying, setIsRetrying] = useState(false);

  useEffect(() => {
    if (!showRetryButton) return;

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          handleRetry();
          return 10;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const handleRetry = () => {
    setIsRetrying(true);
    if (onRetry) {
      onRetry();
    } else {
      window.location.reload();
    }
    setTimeout(() => setIsRetrying(false), 2000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-xl border border-gray-200 p-8">
        {/* Icon */}
        <div className="flex justify-center mb-6">
          <div className="relative">
            <div className="absolute inset-0 bg-red-100 rounded-full animate-ping opacity-75"></div>
            <div className="relative bg-red-50 rounded-full p-4">
              <Server className="w-12 h-12 text-red-500" />
            </div>
          </div>
        </div>

        {/* Title */}
        <h2 className="text-2xl font-bold text-gray-900 text-center mb-2">
          Backend Connection Lost
        </h2>

        {/* Description */}
        <div className="space-y-3 mb-6">
          <p className="text-gray-600 text-center">
            Unable to connect to the Django backend server.
          </p>
          
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium text-amber-900 mb-1">
                  Possible causes:
                </p>
                <ul className="text-sm text-amber-800 space-y-1 list-disc list-inside">
                  <li>Backend server is not running</li>
                  <li>Server crashed or stopped</li>
                  <li>Network connection issue</li>
                  <li>Server starting up (please wait)</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm font-medium text-blue-900 mb-2">
              To start the backend:
            </p>
            <code className="block bg-blue-900 text-blue-100 px-3 py-2 rounded text-xs font-mono">
              cd backend && python3 manage.py runserver
            </code>
          </div>
        </div>

        {/* Retry Button */}
        {showRetryButton && (
          <div className="space-y-3">
            <button
              onClick={handleRetry}
              disabled={isRetrying}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-medium py-3 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center gap-2"
            >
              {isRetrying ? (
                <>
                  <RefreshCw className="w-5 h-5 animate-spin" />
                  Retrying...
                </>
              ) : (
                <>
                  <RefreshCw className="w-5 h-5" />
                  Retry Connection
                </>
              )}
            </button>

            <p className="text-sm text-gray-500 text-center">
              Auto-retry in {countdown} seconds
            </p>
          </div>
        )}

        {/* Status */}
        <div className="mt-6 pt-6 border-t border-gray-200">
          <div className="flex items-center justify-between text-xs text-gray-500">
            <span>Backend URL:</span>
            <code className="bg-gray-100 px-2 py-1 rounded">
              localhost:8000
            </code>
          </div>
        </div>
      </div>
    </div>
  );
}
