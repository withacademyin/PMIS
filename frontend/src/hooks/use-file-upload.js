'use client';

import { useState, useRef, useCallback } from 'react';

export function formatBytes(bytes, decimals = 2) {
  if (!+bytes) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

export function useFileUpload({
  maxFiles = 5,
  maxSize = 10 * 1024 * 1024,
  accept = '*',
  multiple = true,
  initialFiles = [],
  onFilesChange,
} = {}) {
  const [isDragging, setIsDragging] = useState(false);
  const [errors, setErrors] = useState([]);
  const fileInputRef = useRef(null);
  const [files, setFiles] = useState(initialFiles || []);

  const validateFile = useCallback(
    (file) => {
      if (file.size > maxSize) {
        return `File "${file.name}" exceeds maximum size of ${formatBytes(maxSize)}`;
      }
      if (accept !== '*' && accept) {
        const acceptedTypes = accept.split(',').map((t) => t.trim().toLowerCase());
        const fileExt = '.' + file.name.split('.').pop().toLowerCase();
        const isAccepted = acceptedTypes.some(
          (type) =>
            type === file.type ||
            type === fileExt ||
            (type.endsWith('/*') && file.type.startsWith(type.replace('/*', '')))
        );
        if (!isAccepted) {
          return `File type "${file.name}" is not supported.`;
        }
      }
      return null;
    },
    [maxSize, accept]
  );

  const addFiles = useCallback(
    (newRawFiles) => {
      const fileList = Array.from(newRawFiles);
      const newErrors = [];
      const validNewFiles = [];

      for (const file of fileList) {
        const err = validateFile(file);
        if (err) {
          newErrors.push(err);
        } else {
          const fileWithPreview = {
            id: `${file.name}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            file,
            preview: file.type?.startsWith('image/') ? URL.createObjectURL(file) : undefined,
          };
          validNewFiles.push(fileWithPreview);
        }
      }

      setErrors(newErrors);

      if (validNewFiles.length > 0) {
        setFiles((prev) => {
          const updated = !multiple
            ? validNewFiles.slice(0, 1)
            : [...prev, ...validNewFiles].slice(0, maxFiles);
          
          // Execute callback outside the setState updater cycle
          queueMicrotask(() => {
            onFilesChange?.(updated);
          });
          return updated;
        });
      }
    },
    [validateFile, multiple, maxFiles, onFilesChange]
  );

  const removeFile = useCallback(
    (fileId) => {
      setFiles((prev) => {
        const updated = prev.filter((f) => f.id !== fileId);
        queueMicrotask(() => {
          onFilesChange?.(updated);
        });
        return updated;
      });
    },
    [onFilesChange]
  );

  const clearFiles = useCallback(() => {
    setFiles([]);
    setErrors([]);
    queueMicrotask(() => {
      onFilesChange?.([]);
    });
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [onFilesChange]);

  const handleDragEnter = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDrop = useCallback(
    (e) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);
      if (e.dataTransfer?.files && e.dataTransfer.files.length > 0) {
        addFiles(e.dataTransfer.files);
      }
    },
    [addFiles]
  );

  const openFileDialog = useCallback(() => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  }, []);

  const handleInputChange = useCallback(
    (e) => {
      if (e.target.files && e.target.files.length > 0) {
        addFiles(e.target.files);
      }
    },
    [addFiles]
  );

  const getInputProps = useCallback(
    () => ({
      ref: fileInputRef,
      type: 'file',
      accept,
      multiple,
      onChange: handleInputChange,
    }),
    [accept, multiple, handleInputChange]
  );

  return [
    { isDragging, errors, files },
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
  ];
}
