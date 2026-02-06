// Content script to detect Chrome's directory listing pages (fallback for URLs without trailing slash)
(function() {
  'use strict';

  const currentUrl = window.location.href;

  // Guard against redirect loops
  if (currentUrl.includes('index.html') || currentUrl.startsWith('chrome-extension://')) {
    return;
  }

  // Only run on file:// URLs
  if (!currentUrl.startsWith('file://')) {
    return;
  }

  // Check if this is Chrome's "Index of" directory listing page
  if (document.title && document.title.startsWith('Index of ')) {
    const viewerUrl = chrome.runtime.getURL('index.html') +
      '?url=' + encodeURIComponent(currentUrl) +
      '&type=directory';

    window.location.replace(viewerUrl);
  }
})();
