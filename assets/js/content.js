// Content script to intercept supported file types
(function() {
  'use strict';

  // Get the current URL
  const currentUrl = window.location.href;
  const pathname = window.location.pathname.toLowerCase();

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

  // Extract file extension from pathname (lowercase, without the dot)
  const getExtension = (path) => {
    const dotIndex = path.lastIndexOf('.');
    if (dotIndex === -1) return null;
    return path.slice(dotIndex + 1).split(/[?#]/)[0] || null;
  };

  // Check if we should intercept this file
  const getFileType = () => {
    const ext = getExtension(pathname);
    if (ext) {
      if (NATIVE_TYPES[ext]) return NATIVE_TYPES[ext];
      if (TEXT_EXTENSIONS.has(ext)) return 'txt';
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
      if (ext && NATIVE_TYPES[ext]) return NATIVE_TYPES[ext];
      if (ext && TEXT_EXTENSIONS.has(ext)) return 'txt';
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
