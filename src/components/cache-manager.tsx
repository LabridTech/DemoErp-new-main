'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { RefreshCw, Trash2, Info, AlertTriangle } from 'lucide-react';
import { clearAllCaches, clearCacheFromHistory, forceRefresh, getCacheInfo } from '@/lib/cache-utils';

interface CacheManagerProps {
  showDebugInfo?: boolean;
}

export function CacheManager({ showDebugInfo = false }: CacheManagerProps) {
  const [isClearing, setIsClearing] = useState(false);
  const [cacheInfo, setCacheInfo] = useState(getCacheInfo());

  const handleClearCache = async () => {
    setIsClearing(true);
    try {
      clearAllCaches();
    } catch (error) {
      console.error('Error clearing cache:', error);
    } finally {
      setIsClearing(false);
    }
  };

  const handleClearFromHistory = async () => {
    setIsClearing(true);
    try {
      clearCacheFromHistory();
    } catch (error) {
      console.error('Error clearing cache from history:', error);
    } finally {
      setIsClearing(false);
    }
  };

  const handleForceRefresh = () => {
    forceRefresh();
  };

  const refreshCacheInfo = () => {
    setCacheInfo(getCacheInfo());
  };

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <RefreshCw className="h-5 w-5" />
          Cache Management
        </CardTitle>
        <CardDescription>
          Clear browser cache and force refresh to resolve display issues
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-3">
          <div className="flex flex-col sm:flex-row gap-2">
            <Button
              onClick={handleForceRefresh}
              variant="outline"
              className="flex items-center gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Force Refresh
            </Button>
            
            <Button
              onClick={handleClearCache}
              disabled={isClearing}
              variant="secondary"
              className="flex items-center gap-2"
            >
              <Trash2 className="h-4 w-4" />
              {isClearing ? 'Clearing...' : 'Clear App Cache'}
            </Button>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-2">
            <Button
              onClick={handleClearFromHistory}
              disabled={isClearing}
              variant="destructive"
              className="flex items-center gap-2"
            >
              <Trash2 className="h-4 w-4" />
              {isClearing ? 'Clearing...' : 'Clear All + History'}
            </Button>
          </div>
        </div>

        <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
          <div className="flex items-start gap-2">
            <AlertTriangle className="h-4 w-4 text-yellow-600 dark:text-yellow-400 mt-0.5" />
            <div className="text-sm">
              <p className="font-medium text-yellow-800 dark:text-yellow-200">
                If you&apos;re experiencing issues:
              </p>
              <ul className="mt-1 text-yellow-700 dark:text-yellow-300 list-disc list-inside space-y-1">
                <li><strong>Force Refresh:</strong> Try this first (Ctrl+F5 or Cmd+Shift+R)</li>
                <li><strong>Clear App Cache:</strong> Clears app data but keeps browser cache</li>
                <li><strong>Clear All + History:</strong> Most thorough - clears everything including browser history</li>
                <li>This will log you out and clear all stored data</li>
              </ul>
            </div>
          </div>
        </div>

        {showDebugInfo && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-medium flex items-center gap-2">
                <Info className="h-4 w-4" />
                Debug Information
              </h4>
              <Button
                onClick={refreshCacheInfo}
                variant="ghost"
                size="sm"
                className="h-8"
              >
                Refresh
              </Button>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">App Version:</span>
                  <Badge variant="secondary">{cacheInfo.version}</Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Build Time:</span>
                  <span className="font-mono">{new Date(cacheInfo.buildTime).toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Last Modified:</span>
                  <span className="font-mono">{new Date(cacheInfo.lastModified).toLocaleString()}</span>
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">From Cache:</span>
                  <Badge variant={cacheInfo.isFromCache ? "destructive" : "default"}>
                    {cacheInfo.isFromCache ? "Yes" : "No"}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Browser:</span>
                  <span className="truncate max-w-32" title={cacheInfo.userAgent}>
                    {cacheInfo.userAgent.split(' ')[0]}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
