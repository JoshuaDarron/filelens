// Background script for CSV Editor extension

// Handle extension icon click
chrome.action.onClicked.addListener((tab) => {
  // Open CSV viewer in a new tab when extension icon is clicked
  chrome.tabs.create({
    url: chrome.runtime.getURL('viewer.html')
  });
});

// Listen for navigation events to intercept CSV files
chrome.webNavigation.onBeforeNavigate.addListener(
  (details) => {
    // Check if it's a main frame navigation (not iframe)
    if (details.frameId !== 0) return;
    
    const url = details.url;
    
    // Check if it's a file:// URL with .csv extension
    if (url.startsWith('file://') && (url.toLowerCase().endsWith('.csv') || url.toLowerCase().includes('.csv?'))) {
      // Redirect to our viewer with the file URL
      const viewerUrl = chrome.runtime.getURL('viewer.html') + '?url=' + encodeURIComponent(url);
      
      chrome.tabs.update(details.tabId, {
        url: viewerUrl
      });
    }
  },
  {
    url: [
      {
        schemes: ['file'],
        pathSuffix: '.csv'
      },
      {
        schemes: ['file'],
        pathSuffix: '.CSV'
      }
    ]
  }
);

// Handle installation
chrome.runtime.onInstalled.addListener(() => {
  console.log('CSV Editor extension installed');
  
  // Request file access permission if needed
  chrome.permissions.contains({
    origins: ['file:///*']
  }, (result) => {
    if (!result) {
      console.log('File access permission not granted. Users may need to enable "Allow access to file URLs" in extension settings.');
    }
  });
});
