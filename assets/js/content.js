// Content script to intercept CSV files
(function() {
  'use strict';
  
  // Get the current URL
  const currentUrl = window.location.href;
  const pathname = window.location.pathname;
  
  // Check if we should intercept this as a CSV file
  const shouldIntercept = () => {
    // Check file extension
    const hasCSVExtension = pathname.toLowerCase().endsWith('.csv') || 
                           pathname.toLowerCase().includes('.csv?');
    
    // Check content type
    const isCSVContentType = document.contentType === 'text/csv' || 
                            document.contentType === 'application/csv' ||
                            document.contentType === 'text/plain';
    
    // For file:// URLs, rely primarily on extension
    if (currentUrl.startsWith('file://')) {
      return hasCSVExtension;
    }
    
    // For http(s) URLs, check both extension and content type
    return hasCSVExtension || isCSVContentType;
  };
  
  if (shouldIntercept()) {
    // Check if we're already in the viewer (to prevent infinite redirects)
    if (!currentUrl.includes('viewer.html')) {
      // Create viewer URL with the CSV file URL as parameter
      const viewerUrl = chrome.runtime.getURL('viewer.html') + '?url=' + encodeURIComponent(currentUrl);
      
      // Replace current page with our viewer
      window.location.replace(viewerUrl);
    }
  }
})();
