'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { formatBytes, useFileUpload } from '@/hooks/use-file-upload';
import { Alert, AlertAction, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  CircleAlertIcon,
  FileArchiveIcon,
  FileSpreadsheetIcon,
  FileTextIcon,
  HeadphonesIcon,
  ImageIcon,
  RefreshCwIcon,
  UploadIcon,
  VideoIcon,
  
  XIcon,
} from 'lucide-react';

export function ProgressUpload({
  maxFiles = 5,
  maxSize = 10 * 1024 * 1024, // 10MB
  accept = '*',
  multiple = true,
  className,
  initialFiles = [],
  onFilesChange,
  simulateUpload = true,
  title = 'Upload your files',
  description = 'Drag and drop files here or click to browse',
}) {
  const [uploadFiles, setUploadFiles] = useState(() =>
    (initialFiles || []).map((item) => ({
      ...item,
      progress: item.progress ?? 100,
      status: item.status ?? 'completed',
    }))
  );

  const handleHookFilesChange = useCallback(
    (newFiles) => {
      setUploadFiles((prevUploadFiles) => {
        const newUploadFiles = newFiles.map((fileItem) => {
          const existingFile = prevUploadFiles.find((existing) => existing.id === fileItem.id);

          if (existingFile) {
            return {
              ...existingFile,
              ...fileItem,
            };
          } else {
            return {
              ...fileItem,
              progress: 0,
              status: 'uploading',
            };
          }
        });

        // Notify parent outside render/state updater phase
        queueMicrotask(() => {
          onFilesChange?.(newUploadFiles);
        });

        return newUploadFiles;
      });
    },
    [onFilesChange]
  );

  const [
    { isDragging, errors },
    {
      removeFile,
      clearFiles,
      handleDragEnter,
      handleDragLeave,
      handleDragOver,
      handleDrop,
      openFileDialog,
      getInputProps,
    },
  ] = useFileUpload({
    maxFiles,
    maxSize,
    accept,
    multiple,
    initialFiles,
    onFilesChange: handleHookFilesChange,
  });

  // Simulated progress when enabled (purely local UI state, no parent onFilesChange notification)
  useEffect(() => {
    if (!simulateUpload) return;

    const interval = setInterval(() => {
      setUploadFiles((prev) => {
        const hasUploading = prev.some((file) => file.status === 'uploading');
        if (!hasUploading) return prev;

        return prev.map((file) => {
          if (file.status !== 'uploading') return file;

          const increment = Math.random() * 20 + 15;
          const newProgress = Math.min(file.progress + increment, 100);

          if (newProgress >= 100) {
            return {
              ...file,
              progress: 100,
              status: 'completed',
            };
          }

          return {
            ...file,
            progress: newProgress,
          };
        });
      });
    }, 400);

    return () => clearInterval(interval);
  }, [simulateUpload]);

  const retryUpload = (fileId) => {
    setUploadFiles((prev) =>
      prev.map((file) =>
        file.id === fileId
          ? {
              ...file,
              progress: 0,
              status: 'uploading',
              error: undefined,
            }
          : file
      )
    );
  };

  const removeUploadFile = (fileId) => {
    setUploadFiles((prev) => {
      const filtered = prev.filter((file) => file.id !== fileId);
      queueMicrotask(() => {
        onFilesChange?.(filtered);
      });
      return filtered;
    });
    removeFile(fileId);
  };

  const handleClearAll = () => {
    setUploadFiles([]);
    clearFiles();
    queueMicrotask(() => {
      onFilesChange?.([]);
    });
  };

  const getFileIcon = (file) => {
    const type = file?.type || '';
    const name = file?.name || '';
    if (type.startsWith('image/')) return <ImageIcon className="h-4 w-4" />;
    if (type.startsWith('video/')) return <VideoIcon className="h-4 w-4" />;
    if (type.startsWith('audio/')) return <HeadphonesIcon className="h-4 w-4" />;
    if (type.includes('pdf') || name.endsWith('.pdf')) return <FileTextIcon className="h-4 w-4" />;
    if (type.includes('word') || type.includes('doc') || name.endsWith('.doc') || name.endsWith('.docx'))
      return <FileTextIcon className="h-4 w-4" />;
    if (type.includes('excel') || type.includes('sheet') || name.endsWith('.xls') || name.endsWith('.xlsx'))
      return <FileSpreadsheetIcon className="h-4 w-4" />;
    if (type.includes('zip') || type.includes('rar') || name.endsWith('.zip'))
      return <FileArchiveIcon className="h-4 w-4" />;
    return <FileTextIcon className="h-4 w-4" />;
  };

  const completedCount = uploadFiles.filter((f) => f.status === 'completed').length;
  const errorCount = uploadFiles.filter((f) => f.status === 'error').length;
  const uploadingCount = uploadFiles.filter((f) => f.status === 'uploading').length;

  return (
    <div className={cn('w-full max-w-2xl', className)}>
      {/* Upload Drop Area */}
      <div
        className={cn(
          'rounded-xl relative border-2 border-dashed p-8 text-center transition-all cursor-pointer',
          isDragging
            ? 'border-indigo-500 bg-indigo-50/50 scale-[1.01]'
            : 'border-slate-300 hover:border-indigo-400 hover:bg-slate-50/70 bg-white'
        )}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onClick={openFileDialog}
      >
        <input {...getInputProps()} className="sr-only" />

        <div className="flex flex-col items-center gap-3">
          <div
            className={cn(
              'flex h-14 w-14 items-center justify-center rounded-full transition-colors',
              isDragging ? 'bg-indigo-100 text-indigo-600' : 'bg-slate-100 text-slate-500'
            )}
          >
            <UploadIcon className="h-6 w-6" />
          </div>

          <div className="space-y-1">
            <h3 className="text-base font-semibold text-slate-900">{title}</h3>
            <p className="text-slate-500 text-sm">{description}</p>
            <p className="text-slate-400 text-xs mt-1">
              Supports {accept === '*' ? 'any file type' : accept} up to {formatBytes(maxSize)} each
            </p>
          </div>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              openFileDialog();
            }}
            className="mt-2 text-xs"
          >
            <UploadIcon className="h-3.5 w-3.5 mr-1.5" />
            Select {multiple ? 'files' : 'file'}
          </Button>
        </div>
      </div>

      {/* Upload Stats */}
      {uploadFiles.length > 0 && (
        <div className="mt-5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500">Files</h4>
            <div className="flex items-center gap-1.5">
              {completedCount > 0 && (
                <Badge variant="success-light">
                  Ready: {completedCount}
                </Badge>
              )}
              {errorCount > 0 && (
                <Badge variant="destructive">
                  Failed: {errorCount}
                </Badge>
              )}
              {uploadingCount > 0 && (
                <Badge variant="secondary">
                  Processing: {uploadingCount}
                </Badge>
              )}
            </div>
          </div>

          <Button
            type="button"
            onClick={handleClearAll}
            variant="ghost"
            size="sm"
            className="text-xs text-slate-500 h-7"
          >
            Clear all
          </Button>
        </div>
      )}

      {/* File List */}
      {uploadFiles.length > 0 && (
        <div className="mt-3 space-y-2.5">
          {uploadFiles.map((fileItem) => {
            const rawFile = fileItem.file || fileItem;
            const fileName = rawFile?.name || fileItem.name || 'File';
            const fileSize = rawFile?.size || fileItem.size || 0;

            return (
              <div
                key={fileItem.id}
                className="bg-white border border-slate-200 rounded-lg p-3 shadow-xs transition-colors"
              >
                <div className="flex items-start gap-3">
                  {/* File Icon / Preview */}
                  <div className="shrink-0">
                    {fileItem.preview && rawFile?.type?.startsWith('image/') ? (
                      <img
                        src={fileItem.preview}
                        alt={fileName}
                        className="rounded-lg h-10 w-10 border object-cover"
                      />
                    ) : (
                      <div className="bg-slate-100 text-slate-600 rounded-lg flex h-10 w-10 items-center justify-center border border-slate-200">
                        {getFileIcon(rawFile)}
                      </div>
                    )}
                  </div>

                  {/* File Info */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between">
                      <div className="truncate pr-2">
                        <span className="text-sm font-medium text-slate-800 block truncate">{fileName}</span>
                        <span className="text-slate-400 text-xs">{formatBytes(fileSize)}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button
                          type="button"
                          onClick={() => removeUploadFile(fileItem.id)}
                          variant="ghost"
                          size="icon"
                          className="text-slate-400 hover:text-slate-600 h-7 w-7 rounded-full"
                        >
                          <XIcon className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    {fileItem.status === 'uploading' && (
                      <div className="mt-2.5">
                        <Progress value={fileItem.progress} className="h-1.5" />
                      </div>
                    )}

                    {/* Error Message */}
                    {fileItem.status === 'error' && fileItem.error && (
                      <Alert variant="destructive" className="mt-2 px-2.5 py-1.5">
                        <CircleAlertIcon className="h-4 w-4" />
                        <AlertTitle className="text-xs">{fileItem.error}</AlertTitle>
                        <AlertAction>
                          <Button
                            type="button"
                            onClick={() => retryUpload(fileItem.id)}
                            variant="ghost"
                            size="icon"
                            className="text-slate-400 hover:text-slate-600 h-6 w-6"
                          >
                            <RefreshCwIcon className="h-3 w-3" />
                          </Button>
                        </AlertAction>
                      </Alert>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Error Messages */}
      {errors.length > 0 && (
        <Alert variant="destructive" className="mt-4">
          <CircleAlertIcon className="h-4 w-4" />
          <div>
            <AlertTitle>File upload error(s)</AlertTitle>
            <AlertDescription>
              {errors.map((error, index) => (
                <p key={index} className="last:mb-0">
                  {error}
                </p>
              ))}
            </AlertDescription>
          </div>
        </Alert>
      )}
    </div>
  );
}

export const Pattern = ProgressUpload;
export default ProgressUpload;
