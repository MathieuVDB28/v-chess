'use client';

import { useState, useEffect } from 'react';

export function DebugConsole() {
  const [logs, setLogs] = useState<string[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    // Intercept console.log, console.error, etc.
    const originalLog = console.log;
    const originalError = console.error;
    const originalWarn = console.warn;

    console.log = (...args) => {
      setLogs(prev => [...prev, `[LOG] ${args.join(' ')}`].slice(-50)); // Keep last 50 logs
      originalLog.apply(console, args);
    };

    console.error = (...args) => {
      setLogs(prev => [...prev, `[ERROR] ${args.join(' ')}`].slice(-50));
      originalError.apply(console, args);
    };

    console.warn = (...args) => {
      setLogs(prev => [...prev, `[WARN] ${args.join(' ')}`].slice(-50));
      originalWarn.apply(console, args);
    };

    return () => {
      console.log = originalLog;
      console.error = originalError;
      console.warn = originalWarn;
    };
  }, []);

  // Only show on iOS
  const isIOS = typeof window !== 'undefined' && /iPad|iPhone|iPod/.test(navigator.userAgent);

  if (!isIOS) return null;

  return (
    <>
      {/* Toggle button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-20 left-6 z-50 px-3 py-2 bg-gray-800 text-white text-xs rounded-lg shadow-lg"
      >
        {isOpen ? '🔽 Logs' : '🔼 Logs'} ({logs.length})
      </button>

      {/* Console panel */}
      {isOpen && (
        <div className="fixed bottom-32 left-6 right-6 z-50 bg-black/95 text-white rounded-lg shadow-2xl max-h-96 overflow-hidden flex flex-col">
          <div className="px-4 py-2 bg-gray-800 flex justify-between items-center">
            <span className="font-bold text-sm">Debug Console</span>
            <button
              onClick={() => setLogs([])}
              className="text-xs px-2 py-1 bg-red-600 rounded"
            >
              Clear
            </button>
          </div>
          <div className="overflow-y-auto p-2 text-xs font-mono flex-1">
            {logs.length === 0 ? (
              <div className="text-gray-500">No logs yet...</div>
            ) : (
              logs.map((log, i) => (
                <div
                  key={i}
                  className={`py-1 border-b border-gray-800 ${
                    log.includes('[ERROR]') ? 'text-red-400' :
                    log.includes('[WARN]') ? 'text-yellow-400' :
                    'text-green-400'
                  }`}
                >
                  {log}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </>
  );
}
