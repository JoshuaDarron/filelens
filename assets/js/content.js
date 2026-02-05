// Content script to intercept supported file types
(function() {
  'use strict';

  // Get the current URL
  const currentUrl = window.location.href;
  const pathname = window.location.pathname.toLowerCase();

  // Supported file extensions and their types
  const supportedTypes = {
    '.csv': 'csv',
    '.json': 'json',
    '.txt': 'txt',
    '.md': 'md'
  };

  // Check if we should intercept this file
  const getFileType = () => {
    for (const [ext, type] of Object.entries(supportedTypes)) {
      if (pathname.endsWith(ext) || pathname.includes(ext + '?')) {
        return type;
      }
    }

    // Check content type for web URLs
    const contentType = document.contentType;
    if (contentType === 'text/csv' || contentType === 'application/csv') {
      return 'csv';
    }
    if (contentType === 'application/json') {
      return 'json';
    }
    if (contentType === 'text/plain') {
      // For plain text, try to detect from extension in URL
      for (const [ext, type] of Object.entries(supportedTypes)) {
        if (pathname.includes(ext)) {
          return type;
        }
      }
      // Default to txt for text/plain
      return 'txt';
    }
    if (contentType === 'text/markdown') {
      return 'md';
    }

    return null;
  };

  const fileType = getFileType();

  if (fileType) {
    // Check if we're already in the viewer (to prevent infinite redirects)
    if (!currentUrl.includes('index.html')) {
      // Create viewer URL with the file URL and type as parameters
      const viewerUrl = chrome.runtime.getURL('index.html') +
        '?url=' + encodeURIComponent(currentUrl) +
        '&type=' + fileType;

      // Replace current page with our viewer
      window.location.replace(viewerUrl);
    }
  }
})();
