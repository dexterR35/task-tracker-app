import React, { useEffect, useState } from 'react';

const PerformanceMonitor = () => {
  const [metrics, setMetrics] = useState({});
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Only show in development or when explicitly enabled
    if (process.env.NODE_ENV === 'development' || localStorage.getItem('showPerformanceMonitor') === 'true') {
      setIsVisible(true);
    }

    // Collect performance metrics
    const collectMetrics = () => {
      if ('performance' in window) {
        try {
          const navigation = performance.getEntriesByType('navigation')[0];
          const paint = performance.getEntriesByType('paint');
          
          const newMetrics = {
            // Navigation timing
            domContentLoaded: navigation?.domContentLoadedEventEnd - navigation?.domContentLoadedEventStart,
            loadComplete: navigation?.loadEventEnd - navigation?.loadEventStart,
            totalLoadTime: navigation?.loadEventEnd - navigation?.fetchStart,
            
            // Paint timing
            firstPaint: paint.find(p => p.name === 'first-paint')?.startTime,
            firstContentfulPaint: paint.find(p => p.name === 'first-contentful-paint')?.startTime,
            largestContentfulPaint: 0,
            
            // Resource timing
            totalResources: performance.getEntriesByType('resource').length,
            fontResources: performance.getEntriesByType('resource').filter(r => 
              r.name.includes('.woff') || r.name.includes('.woff2')
            ).length,
            
            // Memory usage (if available)
            memory: performance.memory ? {
              used: Math.round(performance.memory.usedJSHeapSize / 1024 / 1024),
              total: Math.round(performance.memory.totalJSHeapSize / 1024 / 1024),
              limit: Math.round(performance.memory.jsHeapSizeLimit / 1024 / 1024)
            } : null
          };

          // Get LCP if available
          if ('PerformanceObserver' in window) {
            try {
              const observer = new PerformanceObserver((list) => {
                const entries = list.getEntries();
                const lastEntry = entries[entries.length - 1];
                if (lastEntry) {
                  newMetrics.largestContentfulPaint = lastEntry.startTime;
                  setMetrics(prev => ({ ...prev, ...newMetrics }));
                }
              });
              observer.observe({ entryTypes: ['largest-contentful-paint'] });
            } catch (e) {
              console.warn('LCP observer failed:', e);
            }
          }

          setMetrics(newMetrics);
        } catch (error) {
          console.warn('Failed to collect performance metrics:', error);
        }
      }
    };

    // Collect metrics after page load
    if (document.readyState === 'complete') {
      collectMetrics();
    } else {
      window.addEventListener('load', collectMetrics);
    }

    // Monitor font loading
    if ('fonts' in document) {
      document.fonts.ready.then(() => {
        setMetrics(prev => ({
          ...prev,
          fontsLoaded: true,
          fontLoadTime: Date.now() - (performance.timing?.navigationStart || Date.now())
        }));
      }).catch(error => {
        console.warn('Font loading monitoring failed:', error);
      });
    }

    return () => {
      window.removeEventListener('load', collectMetrics);
    };
  }, []);

  if (!isVisible) return null;

  const formatTime = (ms) => {
    if (!ms || isNaN(ms)) return 'N/A';
    return ms < 1000 ? `${Math.round(ms)}ms` : `${(ms / 1000).toFixed(2)}s`;
  };

  const getPerformanceGrade = (lcp) => {
    if (!lcp || isNaN(lcp)) return 'N/A';
    if (lcp < 2500) return '🟢 Good';
    if (lcp < 4000) return '🟡 Needs Improvement';
    return '🔴 Poor';
  };

  return (
    <div className="fixed bottom-4 right-4 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg shadow-lg p-4 max-w-sm z-50">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-300">
          Performance Monitor
        </h3>
        <button
          onClick={() => setIsVisible(false)}
          className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
        >
          ×
        </button>
      </div>
      
      <div className="space-y-2 text-xs">
        <div className="flex justify-between">
          <span className="text-gray-600 dark:text-gray-400">LCP:</span>
          <span className={`font-mono ${metrics.largestContentfulPaint > 2500 ? 'text-red-500' : 'text-green-500'}`}>
            {formatTime(metrics.largestContentfulPaint)}
          </span>
        </div>
        
        <div className="flex justify-between">
          <span className="text-gray-600 dark:text-gray-400">Grade:</span>
          <span className="font-semibold">
            {getPerformanceGrade(metrics.largestContentfulPaint)}
          </span>
        </div>
        
        <div className="flex justify-between">
          <span className="text-gray-600 dark:text-gray-400">FCP:</span>
          <span className="font-mono">{formatTime(metrics.firstContentfulPaint)}</span>
        </div>
        
        <div className="flex justify-between">
          <span className="text-gray-600 dark:text-gray-400">DOM Ready:</span>
          <span className="font-mono">{formatTime(metrics.domContentLoaded)}</span>
        </div>
        
        <div className="flex justify-between">
          <span className="text-gray-600 dark:text-gray-400">Total Load:</span>
          <span className="font-mono">{formatTime(metrics.totalLoadTime)}</span>
        </div>
        
        <div className="flex justify-between">
          <span className="text-gray-600 dark:text-gray-400">Resources:</span>
          <span className="font-mono">{metrics.totalResources || 0}</span>
        </div>
        
        <div className="flex justify-between">
          <span className="text-gray-600 dark:text-gray-400">Fonts:</span>
          <span className="font-mono">{metrics.fontResources || 0}</span>
        </div>
        
        {metrics.memory && (
          <div className="flex justify-between">
            <span className="text-gray-600 dark:text-gray-400">Memory:</span>
            <span className="font-mono">{metrics.memory.used}MB / {metrics.memory.total}MB</span>
          </div>
        )}
        
        <div className="flex justify-between">
          <span className="text-gray-600 dark:text-gray-400">Fonts Loaded:</span>
          <span className={metrics.fontsLoaded ? 'text-green-500' : 'text-yellow-500'}>
            {metrics.fontsLoaded ? '✓' : '⏳'}
          </span>
        </div>
      </div>
      
      <div className="mt-3 pt-2 border-t border-gray-300 dark:border-gray-700">
        <button
          onClick={() => {
            localStorage.setItem('showPerformanceMonitor', 'false');
            setIsVisible(false);
          }}
          className="text-xs text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
        >
          Hide permanently
        </button>
      </div>
    </div>
  );
};

export default PerformanceMonitor;
