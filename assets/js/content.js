// Content script to intercept supported file types
(function() {
  'use strict';

  const currentUrl = window.location.href;

  // Don't redirect if already in the viewer
  if (currentUrl.includes('index.html')) return;

  // Content-type detection requires DOM access (document.contentType), so it stays here.
  // Extension-based detection is delegated to the background service worker to avoid
  // duplicating the NATIVE_TYPES / TEXT_EXTENSIONS lists.
  function getFileTypeFromContentType() {
    const ct = document.contentType;
    if (ct === 'text/csv' || ct === 'application/csv') return 'csv';
    if (ct === 'application/json') return 'json';
    if (ct === 'text/markdown') return 'md';
    if (ct === 'text/plain') return 'txt';
    return null;
  }

  // Ask the background script to detect the file type from the URL extension
  chrome.runtime.sendMessage(
    { action: 'detectFileType', url: currentUrl },
    (response) => {
      const fileType = (response && response.fileType) || getFileTypeFromContentType();
      if (fileType) {
        const viewerUrl = chrome.runtime.getURL('index.html') +
          '?url=' + encodeURIComponent(currentUrl) +
          '&type=' + fileType;
        window.location.replace(viewerUrl);
      }
    }
  );
})();
