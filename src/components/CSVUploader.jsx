import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Upload, CheckCircle, AlertCircle, Globe } from 'lucide-react';
import { db } from '../lib/db';
import { tabSync, SYNC_EVENTS } from '../lib/tab-sync';
import { atomicWriter } from '../lib/atomic-writer';
import { persistenceGuard } from '../lib/persistence-guard';

export function CSVUploader({ onComplete }) {
  const [status, setStatus] = useState('idle');
  const [progress, setProgress] = useState({ processed: 0, total: 0, percentage: 0 });
  const [marketplace, setMarketplace] = useState(null);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [failedChunks, setFailedChunks] = useState([]);

  const workerRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    workerRef.current = new Worker(
      new URL('../workers/csv-processor.worker.js', import.meta.url),
      { type: 'module' }
    );

    workerRef.current.onmessage = async (e) => {
      const { type } = e.data;

      try {
        if (type === 'MARKETPLACE_DETECTED') {
          const { marketplace: code, name, confidence } = e.data;
          setMarketplace({ code, name, confidence });
        }

        if (type === 'CHUNK') {
          const { data, progress: chunkProgress } = e.data;

          try {
            const sanitizedData = data.map(campaign => {
              const { id, ...rest } = campaign;
              return rest;
            });

            console.log(`📦 Processing chunk: ${sanitizedData.length} campaigns`);

            const result = await atomicWriter.writeWithVerification(
              sanitizedData,
              `Chunk ${Math.floor(chunkProgress.processed / 1000)}`
            );

            if (result.success) {
              setProgress(chunkProgress);
            } else {
              console.error(`❌ Chunk write failed: ${result.failed} rows not saved`);
              setFailedChunks(prev => [...prev, {
                chunkIndex: Math.floor(chunkProgress.processed / 1000),
                rowCount: data.length,
                written: result.written,
                failed: result.failed,
                error: result.error
              }]);
              setProgress(chunkProgress);
            }
          } catch (chunkError) {
            console.error(`❌ Chunk processing catastrophic failure:`, chunkError);
            setFailedChunks(prev => [...prev, {
              chunkIndex: Math.floor(chunkProgress.processed / 1000),
              rowCount: data.length,
              error: chunkError.message
            }]);
            setProgress(chunkProgress);
          }
        }

        if (type === 'COMPLETE') {
          const { totalProcessed, totalRows, skipped, marketplace: finalMarketplace } = e.data;

          try {
            console.log('⏳ Verifying database write...');
            await new Promise(resolve => setTimeout(resolve, 500));

            const actualCount = await persistenceGuard.execute(
              async () => await db.campaigns.filter(c => !c.deleted).count(),
              'Final Count Verification'
            );

            console.log(`✅ Database verification: ${actualCount} campaigns saved`);

            if (actualCount === 0 && totalProcessed > 0) {
              throw new Error('Database write verification failed: No data was saved');
            }

            setStatus('complete');
            setResult({
              totalProcessed: actualCount,
              totalRows,
              skipped,
              marketplace: finalMarketplace,
              failedChunks: failedChunks.length
            });

            try {
              if (tabSync && tabSync.broadcast) {
                tabSync.broadcast(SYNC_EVENTS.CAMPAIGNS_UPLOADED, {
                  count: actualCount,
                  marketplace: finalMarketplace
                });
              }
            } catch (syncError) {
              console.warn('⚠️ Tab sync skipped (harmless):', syncError);
            }

            if (onComplete) {
              console.log('🔄 Triggering Dashboard Refresh...');
              onComplete({ totalRows: actualCount, skipped });
            }

          } catch (verificationError) {
            console.error('❌ Database verification failed:', verificationError);
            setStatus('error');
            setError(`Upload completed but data verification failed: ${verificationError.message}`);
          }
        }

        if (type === 'ERROR') {
          setStatus('error');
          setError(e.data.error || 'Failed to process file');
        }

      } catch (err) {
        console.error('❌ Failed to handle worker message:', err);
        setStatus('error');
        setError('Failed to save data. Please try again.');
      }
    };

    workerRef.current.onerror = (err) => {
      console.error('❌ Worker error:', err);
      setStatus('error');
      setError('Processing failed. Please try again.');
    };

    return () => {
      workerRef.current?.terminate();
    };
  }, [onComplete]);

  const handleFile = (file) => {
    if (!file) return;

    if (!file.name.endsWith('.csv')) {
      setError('Please upload a CSV file');
      setStatus('error');
      return;
    }

    if (file.size > 100 * 1024 * 1024) {
      setError('File too large. Maximum size is 100MB');
      setStatus('error');
      return;
    }

    setStatus('processing');
    setProgress({ processed: 0, total: 0, percentage: 0 });
    setMarketplace(null);
    setResult(null);
    setError(null);

    workerRef.current.postMessage({ file, chunkSize: 1000 });
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    handleFile(file);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    handleFile(file);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleReset = () => {
    setStatus('idle');
    setProgress({ processed: 0, total: 0, percentage: 0 });
    setMarketplace(null);
    setResult(null);
    setError(null);
    setFailedChunks([]);
  };

  return (
    <div className="rounded-[9px] p-6 sm:p-8" style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--card-border)', transition: 'var(--theme-transition)' }}>
      <div className="max-w-2xl mx-auto">
        <div
          className={`border-[0.5px] border-dashed rounded-[9px] p-6 sm:p-8 text-center`}
          style={{
            borderColor: isDragging ? 'var(--accent-primary)' : 'var(--border-secondary)',
            backgroundColor: isDragging ? 'var(--accent-light)' : 'transparent',
            transform: isDragging ? 'scale(1.01)' : 'scale(1)',
            borderRadius: '14px',
            transition: 'border-color 0.2s ease, transform 0.2s ease, background 0.2s ease'
          }}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
        >
          {/* Idle State */}
          {status === 'idle' && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4"
            >
              <div className="w-16 h-16 rounded-xl flex items-center justify-center mx-auto" style={{ backgroundColor: 'var(--accent-light)' }}>
                <Upload className="w-8 h-8" style={{ color: 'var(--accent-primary)' }} />
              </div>
              <div>
                <h3 className="text-xl font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
                  Upload Amazon Report
                </h3>
                <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>
                  Drop your CSV file here or click to browse
                </p>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                onChange={handleFileSelect}
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="px-6 py-3 rounded-[9px] font-medium transition-colors"
                style={{ backgroundColor: 'var(--accent-primary)', color: '#FFFFFF' }}
              >
                Choose File
              </button>
              <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                Supports CSV files up to 100MB • Auto-detects marketplace
              </p>
            </motion.div>
          )}

          {/* Processing State */}
          {status === 'processing' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-4"
            >
              <div className="w-16 h-16 border-4 rounded-[4px] animate-spin mx-auto" style={{ borderColor: 'var(--accent-primary)', borderTopColor: 'transparent' }}></div>
              <div>
                <h3 className="text-xl font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
                  Processing Your Data
                </h3>
                <p className="text-sm mb-1" style={{ color: 'var(--text-tertiary)' }}>
                  {progress.processed > 0
                    ? `Processing ${progress.processed.toLocaleString()} of ${progress.total.toLocaleString()} rows...`
                    : 'Analyzing file...'}
                </p>
                {marketplace && (
                  <div className="flex items-center justify-center gap-2 text-xs mt-2" style={{ color: 'var(--accent-primary)' }}>
                    <Globe size={12} />
                    <span>Detected: {marketplace.name}</span>
                  </div>
                )}
              </div>
              <div className="space-y-2">
                <div className="h-3 rounded-[4px] overflow-hidden relative" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
                  <motion.div
                    className="h-full relative"
                    style={{ backgroundColor: 'var(--accent-primary)' }}
                    initial={{ width: 0 }}
                    animate={{ width: `${progress.percentage}%` }}
                    transition={{ duration: 0.3, ease: 'easeOut' }}
                  >
                    <div className="absolute inset-0 blur-sm" style={{ backgroundColor: 'var(--accent-light)' }}></div>
                  </motion.div>
                </div>
                <div className="flex justify-between text-xs" style={{ color: 'var(--text-tertiary)' }}>
                  <span>{progress.percentage}% complete</span>
                  <span>{progress.processed.toLocaleString()} rows</span>
                </div>
              </div>
            </motion.div>
          )}

          {/* Complete State */}
          {status === 'complete' && result && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="space-y-4"
            >
              <div className="w-16 h-16 rounded-[4px] flex items-center justify-center mx-auto" style={{ backgroundColor: 'var(--success)' }}>
                <CheckCircle className="w-8 h-8 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
                  Upload Complete!
                </h3>
                <p className="text-sm mb-3" style={{ color: 'var(--text-tertiary)' }}>
                  Imported {result.totalProcessed.toLocaleString()} rows
                  {result.skipped > 0 && (
                    <span style={{ color: 'var(--warning)' }}> • {result.skipped} rows skipped</span>
                  )}
                  {result.failedChunks > 0 && (
                    <span style={{ color: 'var(--error)' }}> • {result.failedChunks} chunks failed</span>
                  )}
                </p>
                {marketplace && (
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-[4px] text-xs" style={{ backgroundColor: 'var(--accent-light)', border: '1px solid var(--accent-primary)', color: 'var(--success)' }}>
                    <Globe size={12} />
                    <span>{marketplace.name} Marketplace</span>
                  </div>
                )}
              </div>
              <button
                onClick={handleReset}
                className="px-6 py-3 rounded-[9px] font-medium transition-colors"
                style={{ backgroundColor: 'var(--bg-tertiary)', border: '1px solid var(--border-primary)', color: 'var(--text-primary)' }}
              >
                Upload Another File
              </button>
            </motion.div>
          )}

          {/* Error State */}
          {status === 'error' && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="space-y-4"
            >
              <div className="w-16 h-16 rounded-[4px] flex items-center justify-center mx-auto" style={{ backgroundColor: 'var(--error)' }}>
                <AlertCircle className="w-8 h-8 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-medium mb-2" style={{ color: 'var(--text-primary)' }}>Upload Failed</h3>
                <p className="text-sm" style={{ color: 'var(--error)' }}>{error}</p>
              </div>
              <button
                onClick={handleReset}
                className="px-6 py-3 rounded-[9px] font-medium transition-colors"
                style={{ backgroundColor: 'var(--bg-tertiary)', border: '1px solid var(--border-primary)', color: 'var(--text-primary)' }}
              >
                Try Again
              </button>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}