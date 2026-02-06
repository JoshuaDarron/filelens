// Background script for FileLens extension

// Native file types with dedicated viewers
const NATIVE_TYPES = {
  'csv': 'csv',
  'json': 'json',
  'txt': 'txt',
  'md': 'md'
};

// Text-like file extensions that should open in TxtViewer
const TEXT_EXTENSIONS = new Set([
  // Programming
  'py', 'js', 'jsx', 'ts', 'tsx', 'java', 'c', 'cpp', 'h', 'hpp', 'cs',
  'go', 'rs', 'rb', 'php', 'swift', 'kt', 'scala', 'r', 'pl', 'lua',
  'dart', 'zig', 'ex', 'exs', 'hs', 'ml', 'clj', 'lisp', 'vim', 'v', 'm',
  // Web / markup
  'css', 'scss', 'sass', 'less', 'vue', 'svelte', 'astro',
  // Config
  'yaml', 'yml', 'toml', 'ini', 'cfg', 'conf', 'properties', 'env',
  'editorconfig', 'gitignore', 'gitattributes', 'dockerignore',
  // Shell
  'sh', 'bash', 'zsh', 'fish', 'bat', 'cmd', 'ps1',
  // Other text
  'log', 'sql', 'graphql', 'proto', 'tf', 'hcl', 'gradle', 'cmake',
  'rst', 'tex', 'org'
]);

// Extract file extension from a URL (lowercase, without the dot)
function getExtension(url) {
  try {
    const pathname = new URL(url).pathname.toLowerCase();
    const dotIndex = pathname.lastIndexOf('.');
    if (dotIndex === -1) return null;
    // Strip query-like fragments that may follow the extension
    return pathname.slice(dotIndex + 1).split(/[?#]/)[0] || null;
  } catch {
    return null;
  }
}

// Get file type from URL
function getFileType(url) {
  const ext = getExtension(url);
  if (!ext) return null;
  if (NATIVE_TYPES[ext]) return NATIVE_TYPES[ext];
  if (TEXT_EXTENSIONS.has(ext)) return 'txt';
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
      { schemes: ['file'] }
    ]
  }
);

// Check if URL is likely a directory (ends with /)
function isLikelyDirectory(url) {
  try {
    const parsed = new URL(url);
    return parsed.pathname.endsWith('/');
  } catch {
    return false;
  }
}

// Listen for navigation events to intercept directory listings
chrome.webNavigation.onBeforeNavigate.addListener(
  (details) => {
    if (details.frameId !== 0) return;

    const url = details.url;

    if (url.startsWith('file://') && isLikelyDirectory(url)) {
      const viewerUrl = chrome.runtime.getURL('index.html') +
        '?url=' + encodeURIComponent(url) +
        '&type=directory';

      chrome.tabs.update(details.tabId, {
        url: viewerUrl
      });
    }
  },
  {
    url: [
      { schemes: ['file'], pathSuffix: '/' }
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
