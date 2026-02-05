// Background script for FileLens extension

// Supported file extensions
const supportedExtensions = ['.csv', '.json', '.txt', '.md'];

// Get file type from URL
function getFileType(url) {
  const lowerUrl = url.toLowerCase();
  if (lowerUrl.endsWith('.csv') || lowerUrl.includes('.csv?')) return 'csv';
  if (lowerUrl.endsWith('.json') || lowerUrl.includes('.json?')) return 'json';
  if (lowerUrl.endsWith('.txt') || lowerUrl.includes('.txt?')) return 'txt';
  if (lowerUrl.endsWith('.md') || lowerUrl.includes('.md?')) return 'md';
  return null;
}

// Check if URL has a supported extension
function isSupportedFile(url) {
  return getFileType(url) !== null;
}

// Handle extension icon click
chrome.action.onClicked.addListener((tab) => {
  // Open FileLens viewer in a new tab when extension icon is clicked
  chrome.tabs.create({
    url: chrome.runtime.getURL('index.html')
  });
});

// Listen for navigation events to intercept supported files
chrome.webNavigation.onBeforeNavigate.addListener(
  (details) => {
    // Check if it's a main frame navigation (not iframe)
    if (details.frameId !== 0) return;

    const url = details.url;

    // Check if it's a file:// URL with a supported extension
    if (url.startsWith('file://') && isSupportedFile(url)) {
      const fileType = getFileType(url);
      const viewerUrl = chrome.runtime.getURL('index.html') +
        '?url=' + encodeURIComponent(url) +
        '&type=' + fileType;

      chrome.tabs.update(details.tabId, {
        url: viewerUrl
      });
    }
  },
  {
    url: [
      // CSV files
      { schemes: ['file'], pathSuffix: '.csv' },
      { schemes: ['file'], pathSuffix: '.CSV' },
      // JSON files
      { schemes: ['file'], pathSuffix: '.json' },
      { schemes: ['file'], pathSuffix: '.JSON' },
      // TXT files
      { schemes: ['file'], pathSuffix: '.txt' },
      { schemes: ['file'], pathSuffix: '.TXT' },
      // Markdown files
      { schemes: ['file'], pathSuffix: '.md' },
      { schemes: ['file'], pathSuffix: '.MD' }
    ]
  }
);

// Handle installation
chrome.runtime.onInstalled.addListener(() => {
  console.log('FileLens extension installed');

  // Request file access permission if needed
  chrome.permissions.contains({
    origins: ['file:///*']
  }, (result) => {
    if (!result) {
      console.log('File access permission not granted. Users may need to enable "Allow access to file URLs" in extension settings.');
    }
  });
});
