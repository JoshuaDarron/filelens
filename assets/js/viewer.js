// Toast Notification System
class ToastManager {
    constructor() {
        this.container = document.getElementById('toastContainer');
        this.toasts = new Map();
        this.toastCounter = 0;
    }

    show(options = {}) {
        const {
            type = 'info',
            title = '',
            message = '',
            duration = 5000,
            showProgress = true,
            closable = true,
            id = null
        } = options;

        // If it's a loading toast with an ID, remove existing loading toast with same ID
        if (type === 'loading' && id && this.toasts.has(id)) {
            this.hide(id);
        }

        const toastId = id || `toast-${++this.toastCounter}`;
        const toast = this.createToast({ type, title, message, duration, showProgress, closable, id: toastId });
        
        this.toasts.set(toastId, toast);
        this.container.appendChild(toast.element);

        // Trigger animation
        requestAnimationFrame(() => {
            toast.element.classList.add('show');
        });

        // Auto hide (except for loading toasts without duration)
        if (duration > 0 && type !== 'loading') {
            toast.timeout = setTimeout(() => {
                this.hide(toastId);
            }, duration);

            // Start progress bar animation
            if (showProgress && toast.progressBar) {
                requestAnimationFrame(() => {
                    toast.progressBar.style.transitionDuration = `${duration}ms`;
                    toast.progressBar.style.transform = 'translateX(0)';
                });
            }
        }

        return toastId;
    }

    createToast({ type, title, message, duration, showProgress, closable, id }) {
        const toastElement = document.createElement('div');
        toastElement.className = `toast ${type}`;
        toastElement.dataset.toastId = id;

        // Icon based on type
        let icon = '';
        switch (type) {
            case 'success':
                icon = '<i class="bi bi-check-circle-fill"></i>';
                break;
            case 'error':
                icon = '<i class="bi bi-exclamation-triangle-fill"></i>';
                break;
            case 'loading':
                icon = '<div class="toast-spinner"></div>';
                break;
            default:
                icon = '<i class="bi bi-info-circle-fill"></i>';
        }

        let progressBar = null;
        let progressBarHtml = '';
        
        if (showProgress && duration > 0 && type !== 'loading') {
            progressBarHtml = `
                <div class="toast-progress">
                    <div class="toast-progress-bar"></div>
                </div>
            `;
        }

        toastElement.innerHTML = `
            <div class="toast-icon">${icon}</div>
            <div class="toast-content">
                ${title ? `<div class="toast-title">${title}</div>` : ''}
                <div class="toast-message">${message}</div>
            </div>
            ${closable ? '<button class="toast-close"><i class="bi bi-x"></i></button>' : ''}
            ${progressBarHtml}
        `;

        // Get progress bar element if it exists
        if (showProgress && duration > 0 && type !== 'loading') {
            progressBar = toastElement.querySelector('.toast-progress-bar');
        }

        // Add close functionality
        if (closable) {
            const closeBtn = toastElement.querySelector('.toast-close');
            closeBtn.addEventListener('click', () => {
                this.hide(id);
            });
        }

        return {
            element: toastElement,
            progressBar,
            timeout: null
        };
    }

    hide(toastId) {
        const toast = this.toasts.get(toastId);
        if (!toast) return;

        // Clear timeout if exists
        if (toast.timeout) {
            clearTimeout(toast.timeout);
        }

        // Trigger hide animation
        toast.element.classList.remove('show');
        toast.element.classList.add('hide');

        // Remove from DOM after animation
        setTimeout(() => {
            if (toast.element.parentNode) {
                toast.element.parentNode.removeChild(toast.element);
            }
            this.toasts.delete(toastId);
        }, 300);
    }

    // Convenience methods
    success(message, title = 'Success', options = {}) {
        return this.show({
            type: 'success',
            title,
            message,
            ...options
        });
    }

    error(message, title = 'Error', options = {}) {
        return this.show({
            type: 'error',
            title,
            message,
            duration: 7000, // Longer duration for errors
            ...options
        });
    }

    loading(message, title = 'Loading', options = {}) {
        return this.show({
            type: 'loading',
            title,
            message,
            duration: 0, // No auto-hide for loading
            showProgress: false,
            ...options
        });
    }

    info(message, title = 'Info', options = {}) {
        return this.show({
            type: 'info',
            title,
            message,
            ...options
        });
    }

    // Update an existing toast (useful for loading states)
    update(toastId, options = {}) {
        this.hide(toastId);
        return this.show({ ...options, id: toastId });
    }

    // Clear all toasts
    clear() {
        this.toasts.forEach((_, toastId) => {
            this.hide(toastId);
        });
    }
}

class CSVEditor {
    constructor() {
        this.data = [];
        this.originalData = [];
        this.isModified = false;
        this.filename = '';
        this.fileHandle = null;
        
        // Pagination properties
        this.currentPage = 1;
        this.rowsPerPage = 25;
        this.totalDataRows = 0;

        // Column resize properties
        this.columnWidths = [];
        
        // Initialize toast manager
        this.toast = new ToastManager();
        
        this.initElements();
        this.initEventListeners();
        this.initTheme();
        this.checkForURLParameter();
    }

    initElements() {
        this.fileInput = document.getElementById('csvFile');
        this.uploadBtn = document.getElementById('uploadBtn');
        this.dropZone = document.getElementById('dropZone');
        this.exportBtn = document.getElementById('exportBtn');
        this.saveBtn = document.getElementById('saveBtn');
        this.themeToggle = document.getElementById('themeToggle');
        this.fileInfo = document.getElementById('fileInfo');
        this.emptyState = document.getElementById('emptyState');
        this.tableContainer = document.getElementById('tableContainer');
        this.table = document.getElementById('csvTable');
        this.tableHead = document.getElementById('tableHead');
        this.tableBody = document.getElementById('tableBody');
        this.stats = document.getElementById('stats');
        this.rowCount = document.getElementById('rowCount');
        this.colCount = document.getElementById('colCount');
        this.modifiedStat = document.getElementById('modifiedStat');
        
        // Pagination elements
        this.rowsPerPageSelect = document.getElementById('rowsPerPage');
        this.paginationInfo = document.getElementById('paginationInfo');
        this.firstPageBtn = document.getElementById('firstPageBtn');
        this.prevPageBtn = document.getElementById('prevPageBtn');
        this.nextPageBtn = document.getElementById('nextPageBtn');
        this.lastPageBtn = document.getElementById('lastPageBtn');
        this.pageNumbers = document.getElementById('pageNumbers');
    }

    initEventListeners() {
        this.uploadBtn.addEventListener('click', () => this.openFile());
        this.dropZone.addEventListener('click', () => this.openFile());
        this.fileInput.addEventListener('change', (e) => this.handleFileSelect(e));
        this.exportBtn.addEventListener('click', () => this.exportCSV());
        this.saveBtn.addEventListener('click', () => this.saveFile());
        this.themeToggle.addEventListener('click', () => this.toggleTheme());
        
        // Pagination event listeners
        this.rowsPerPageSelect.addEventListener('change', (e) => this.changeRowsPerPage(e));
        this.firstPageBtn.addEventListener('click', () => this.goToPage(1));
        this.prevPageBtn.addEventListener('click', () => this.goToPage(this.currentPage - 1));
        this.nextPageBtn.addEventListener('click', () => this.goToPage(this.currentPage + 1));
        this.lastPageBtn.addEventListener('click', () => this.goToPage(this.getTotalPages()));
        
        // Drag and drop events
        this.dropZone.addEventListener('dragover', (e) => this.handleDragOver(e));
        this.dropZone.addEventListener('dragenter', (e) => this.handleDragEnter(e));
        this.dropZone.addEventListener('dragleave', (e) => this.handleDragLeave(e));
        this.dropZone.addEventListener('drop', (e) => this.handleDrop(e));
        
        // Prevent default drag behavior on document
        document.addEventListener('dragover', (e) => e.preventDefault());
        document.addEventListener('drop', (e) => e.preventDefault());
        
        // Handle paste events for bulk editing
        document.addEventListener('paste', (e) => this.handlePaste(e));
    }

    initTheme() {
        const savedTheme = localStorage.getItem('csvEditor-theme') || 'light';
        document.body.setAttribute('data-theme', savedTheme);
    }

    toggleTheme() {
        const currentTheme = document.body.getAttribute('data-theme');
        const newTheme = currentTheme === 'light' ? 'dark' : 'light';
        document.body.setAttribute('data-theme', newTheme);
        localStorage.setItem('csvEditor-theme', newTheme);
    }

    async openFile() {
        if (window.showOpenFilePicker) {
            try {
                const [handle] = await window.showOpenFilePicker({
                    types: [{
                        description: 'CSV Files',
                        accept: { 'text/csv': ['.csv'], 'text/plain': ['.txt'] }
                    }],
                    multiple: false
                })
                this.fileHandle = handle
                const file = await handle.getFile()
                await this.processFile(file)
            } catch (err) {
                // User cancelled the picker
                if (err.name !== 'AbortError') {
                    this.toast.error(`Error opening file: ${err.message}`)
                }
            }
        } else {
            this.fileInput.click()
        }
    }

    async saveFile() {
        if (!this.fileHandle) return

        try {
            const writable = await this.fileHandle.createWritable()
            await writable.write(this.generateCSVContent())
            await writable.close()

            this.isModified = false
            this.originalData = JSON.parse(JSON.stringify(this.data))
            this.modifiedStat.style.display = 'none'
            this.toast.success('File saved successfully!')
        } catch (err) {
            if (err.name !== 'AbortError') {
                this.toast.error(`Error saving file: ${err.message}`)
            }
        }
    }

    async checkForURLParameter() {
        const urlParams = new URLSearchParams(window.location.search);
        const csvUrl = urlParams.get('url');
        
        if (csvUrl) {
            await this.loadCSVFromURL(csvUrl);
        }
    }

    async loadCSVFromURL(url) {
        const loadingId = this.toast.loading('Loading CSV...');
        
        try {
            // Handle file:// URLs differently
            this.fileHandle = null
            if (url.startsWith('file://')) {
                // For file:// URLs, we need to fetch using XMLHttpRequest with special permissions
                const text = await this.fetchLocalFile(url);
                this.filename = this.getFilenameFromURL(url);
                this.toast.hide(loadingId);
                this.processCSVText(text);
            } else {
                // For http(s) URLs, use regular fetch
                const response = await fetch(url);
                if (!response.ok) {
                    throw new Error(`Failed to fetch CSV: ${response.statusText}`);
                }

                const text = await response.text();
                this.filename = this.getFilenameFromURL(url);
                this.toast.hide(loadingId);
                this.processCSVText(text);
            }
            this.saveBtn.style.display = 'none'
            
        } catch (error) {
            this.toast.hide(loadingId);
            
            // Provide more helpful error message for file:// URLs
            if (url.startsWith('file://')) {
                this.toast.error(
                    'Unable to load local file. Please ensure "Allow access to file URLs" is enabled in the extension settings.',
                    'File Access Error',
                    { duration: 10000 }
                );
                
                // Show instructions
                this.showFileAccessInstructions();
            } else {
                this.toast.error(`Error loading CSV: ${error.message}`);
            }
        }
    }

    async fetchLocalFile(url) {
        return new Promise((resolve, reject) => {
            const xhr = new XMLHttpRequest();
            xhr.open('GET', url, true);
            xhr.responseType = 'text';
            
            xhr.onload = function() {
                if (xhr.status === 200 || xhr.status === 0) {
                    resolve(xhr.responseText);
                } else {
                    reject(new Error(`Failed to load file: ${xhr.statusText}`));
                }
            };
            
            xhr.onerror = function() {
                reject(new Error('Failed to load local file'));
            };
            
            xhr.send();
        });
    }

    showFileAccessInstructions() {
        // Create a helpful message in the empty state
        const instructions = document.createElement('div');
        instructions.style.cssText = `
            background: var(--bg-accent);
            border: 1px solid var(--border-color);
            border-radius: 8px;
            padding: 16px;
            margin: 20px auto;
            max-width: 600px;
            text-align: left;
        `;
        
        instructions.innerHTML = `
            <h3 style="margin-top: 0; color: var(--text-primary);">
                <i class="bi bi-info-circle"></i> Enable File Access
            </h3>
            <p style="color: var(--text-secondary); margin: 10px 0;">
                To open local CSV files directly, you need to enable file access:
            </p>
            <ol style="color: var(--text-secondary); margin: 10px 0; padding-left: 20px;">
                <li>Go to Chrome Extensions (chrome://extensions/)</li>
                <li>Find "CSViewer" extension</li>
                <li>Click "Details"</li>
                <li>Enable "Allow access to file URLs"</li>
                <li>Refresh this page and try again</li>
            </ol>
            <p style="color: var(--text-secondary); margin: 10px 0;">
                Alternatively, you can use the "Open File" button or drag & drop to load CSV files.
            </p>
        `;
        
        // Insert after the drop zone
        if (this.dropZone && this.dropZone.parentNode) {
            this.dropZone.parentNode.insertBefore(instructions, this.dropZone.nextSibling);
        }
    }

    getFilenameFromURL(url) {
        try {
            // Handle file:// URLs
            if (url.startsWith('file://')) {
                // Remove file:// protocol and decode
                let path = decodeURIComponent(url.replace('file:///', '').replace('file://', ''));
                // Handle Windows paths
                path = path.replace(/\//g, '\\');
                // Get filename from path
                return path.split('\\').pop() || path.split('/').pop() || 'local.csv';
            }
            
            // Handle http(s) URLs
            const pathname = new URL(url).pathname;
            return pathname.split('/').pop() || 'remote.csv';
        } catch {
            return 'data.csv';
        }
    }

    handleDragOver(event) {
        event.preventDefault();
        event.stopPropagation();
        this.dropZone.classList.add('drag-over');
    }

    handleDragEnter(event) {
        event.preventDefault();
        event.stopPropagation();
        this.dropZone.classList.add('drag-over');
    }

    handleDragLeave(event) {
        event.preventDefault();
        event.stopPropagation();
        
        // Only remove drag-over if we're actually leaving the drop zone
        if (!this.dropZone.contains(event.relatedTarget)) {
            this.dropZone.classList.remove('drag-over');
        }
    }

    async handleDrop(event) {
        event.preventDefault();
        event.stopPropagation();
        this.dropZone.classList.remove('drag-over');

        const files = event.dataTransfer.files;
        if (files.length > 0) {
            const file = files[0];

            // Validate file type
            if (this.isValidCSVFile(file)) {
                // Try to get a file system handle for save support
                this.fileHandle = null
                if (event.dataTransfer.items && event.dataTransfer.items[0].getAsFileSystemHandle) {
                    try {
                        const handle = await event.dataTransfer.items[0].getAsFileSystemHandle()
                        if (handle.kind === 'file') {
                            this.fileHandle = handle
                        }
                    } catch (err) {
                        // Handle not available, continue without it
                    }
                }
                await this.processFile(file);
            } else {
                this.toast.error('Please drop a valid CSV file (.csv, .txt)');
            }
        }
    }

    isValidCSVFile(file) {
        const validExtensions = ['.csv', '.txt'];
        const validTypes = ['text/csv', 'text/plain', 'application/csv'];
        
        const hasValidExtension = validExtensions.some(ext => 
            file.name.toLowerCase().endsWith(ext)
        );
        const hasValidType = validTypes.includes(file.type);
        
        return hasValidExtension || hasValidType;
    }

    async processFile(file) {
        const loadingId = this.toast.loading('Reading file...');

        try {
            if (file.size > 10 * 1024 * 1024) { // 10MB limit
                throw new Error('File too large. Please use files under 10MB.');
            }

            const text = await file.text();
            this.filename = file.name;
            this.toast.hide(loadingId);
            this.processCSVText(text);
            this.saveBtn.style.display = this.fileHandle ? 'inline-flex' : 'none';

        } catch (error) {
            this.toast.hide(loadingId);
            this.toast.error(`Error reading file: ${error.message}`);
        }
    }

    async handleFileSelect(event) {
        const file = event.target.files[0];
        if (!file) return;

        this.fileHandle = null
        await this.processFile(file);
    }

    processCSVText(text) {
        try {
            // Check for completely empty file
            if (!text || text.trim().length === 0) {
                this.handleEmptyCSV();
                return;
            }

            const data = this.parseCSV(text);
            
            // Check for no data after parsing
            if (data.length === 0) {
                this.handleEmptyCSV();
                return;
            }

            // Check if only header exists (no data rows)
            if (data.length === 1) {
                this.handleHeaderOnlyCSV(data[0]);
                return;
            }

            // Check if all rows are empty
            const hasNonEmptyData = data.some((row, index) => {
                if (index === 0) return true; // Skip header check
                return row.some(cell => cell && cell.trim().length > 0);
            });

            if (!hasNonEmptyData) {
                this.handleEmptyDataCSV(data[0]);
                return;
            }

            this.data = data;
            this.originalData = JSON.parse(JSON.stringify(data)); // Deep copy
            this.isModified = false;
            this.totalDataRows = data.length - 1; // Exclude header
            this.currentPage = 1; // Reset to first page
            this.columnWidths = []; // Reset column widths for new file
            
            this.displayData();
            this.updateFileInfo();
            this.updateStats();
            this.updatePagination();
            
            this.toast.success('CSV loaded successfully!');
            
        } catch (error) {
            this.toast.error(`Error processing CSV: ${error.message}`);
        }
    }

    handleEmptyCSV() {
        // Create a default empty structure with one header and one empty row
        this.data = [
            ['Column 1', 'Column 2', 'Column 3'],
            ['', '', '']
        ];
        this.originalData = JSON.parse(JSON.stringify(this.data));
        this.isModified = false;
        this.totalDataRows = 1;
        this.currentPage = 1;
        
        this.displayData();
        this.updateFileInfo();
        this.updateStats();
        this.updatePagination();
        
        this.toast.info('Empty CSV file loaded. A default structure has been created.', 'Empty File');
    }

    handleHeaderOnlyCSV(headers) {
        // Add an empty data row to the headers
        this.data = [
            headers,
            new Array(headers.length).fill('')
        ];
        this.originalData = JSON.parse(JSON.stringify(this.data));
        this.isModified = false;
        this.totalDataRows = 1;
        this.currentPage = 1;
        
        this.displayData();
        this.updateFileInfo();
        this.updateStats();
        this.updatePagination();
        
        this.toast.info('CSV contains only headers. An empty row has been added for editing.', 'Headers Only');
    }

    handleEmptyDataCSV(headers) {
        // Keep headers but ensure at least one empty row for editing
        this.data = [
            headers,
            new Array(headers.length).fill('')
        ];
        this.originalData = JSON.parse(JSON.stringify(this.data));
        this.isModified = false;
        this.totalDataRows = 1;
        this.currentPage = 1;
        
        this.displayData();
        this.updateFileInfo();
        this.updateStats();
        this.updatePagination();
        
        this.toast.info('CSV contains no data rows. An empty row has been added for editing.', 'No Data');
    }

    parseCSV(text) {
        const lines = text.trim().split('\n');
        if (lines.length === 0) return [];

        // Detect delimiter
        const firstLine = lines[0];
        let delimiter = ',';
        const delimiters = [',', '\t', ';', '|'];
        let maxCount = 0;

        for (const del of delimiters) {
            const count = (firstLine.match(new RegExp('\\' + del, 'g')) || []).length;
            if (count > maxCount) {
                maxCount = count;
                delimiter = del;
            }
        }

        // Enhanced CSV parsing with better quote handling
        return lines.map(line => {
            const result = [];
            let current = '';
            let inQuotes = false;
            let i = 0;
            
            while (i < line.length) {
                const char = line[i];
                const nextChar = line[i + 1];
                
                if (char === '"') {
                    if (inQuotes && nextChar === '"') {
                        // Escaped quote
                        current += '"';
                        i += 2;
                        continue;
                    } else if (inQuotes) {
                        // End quote
                        inQuotes = false;
                    } else {
                        // Start quote
                        inQuotes = true;
                    }
                } else if (char === delimiter && !inQuotes) {
                    result.push(current.trim());
                    current = '';
                } else {
                    current += char;
                }
                i++;
            }
            
            result.push(current.trim());
            return result;
        });
    }

    displayData() {
        this.tableHead.innerHTML = '';
        this.tableBody.innerHTML = '';

        if (this.data.length === 0) return;

        // Apply table-layout fixed when column widths are set
        if (this.columnWidths.some(w => w)) {
            this.table.style.tableLayout = 'fixed';
        } else {
            this.table.style.tableLayout = '';
        }

        // Create header
        const headerRow = document.createElement('tr');
        this.data[0].forEach((header, index) => {
            const th = document.createElement('th');
            th.textContent = header || `Column ${index + 1}`;
            th.title = th.textContent;

            // Apply stored column width
            if (this.columnWidths[index]) {
                th.style.width = this.columnWidths[index] + 'px';
            }

            // Add resize handle
            const handle = document.createElement('div');
            handle.className = 'resize-handle';
            handle.addEventListener('mousedown', (e) => {
                e.preventDefault();
                this.initResize(index, e.clientX);
            });
            th.appendChild(handle);

            headerRow.appendChild(th);
        });
        this.tableHead.appendChild(headerRow);

        // Calculate pagination
        const startRow = (this.currentPage - 1) * this.rowsPerPage + 1;
        const endRow = Math.min(startRow + this.rowsPerPage - 1, this.totalDataRows);

        // Create body rows with editable cells (only for current page)
        for (let i = startRow; i <= endRow; i++) {
            const row = document.createElement('tr');
            const rowData = this.data[i] || [];
            
            for (let j = 0; j < this.data[0].length; j++) {
                const td = document.createElement('td');
                const input = document.createElement('input');
                
                input.className = 'cell-input';
                input.type = 'text';
                input.value = rowData[j] || '';
                input.dataset.row = i;
                input.dataset.col = j;
                
                // Add event listeners for editing
                input.addEventListener('input', (e) => this.handleCellEdit(e));
                input.addEventListener('keydown', (e) => this.handleCellKeydown(e));
                
                td.appendChild(input);
                row.appendChild(td);
            }
            
            this.tableBody.appendChild(row);
        }

        this.showTable();
    }

    handleCellEdit(event) {
        const input = event.target;
        const row = parseInt(input.dataset.row);
        const col = parseInt(input.dataset.col);
        const newValue = input.value;
        
        // Ensure the row exists in data
        if (!this.data[row]) {
            this.data[row] = new Array(this.data[0].length).fill('');
        }
        
        // Update data
        this.data[row][col] = newValue;
        
        // Mark as modified
        if (!this.isModified) {
            this.isModified = true;
            this.modifiedStat.style.display = 'flex';
            this.exportBtn.style.display = 'inline-flex';
        }
    }

    handleCellKeydown(event) {
        const input = event.target;
        const row = parseInt(input.dataset.row);
        const col = parseInt(input.dataset.col);
        
        switch (event.key) {
            case 'Tab':
                event.preventDefault();
                this.focusNextCell(row, col, event.shiftKey ? -1 : 1);
                break;
            case 'Enter':
                event.preventDefault();
                this.focusNextCell(row + 1, col, 0);
                break;
            case 'ArrowUp':
                if (event.ctrlKey) {
                    event.preventDefault();
                    this.focusNextCell(row - 1, col, 0);
                }
                break;
            case 'ArrowDown':
                if (event.ctrlKey) {
                    event.preventDefault();
                    this.focusNextCell(row + 1, col, 0);
                }
                break;
        }
    }

    focusNextCell(targetRow, targetCol, colDelta) {
        // Calculate next position
        let nextRow = targetRow;
        let nextCol = targetCol + colDelta;
        
        // Handle column overflow
        if (nextCol >= this.data[0].length) {
            nextCol = 0;
            nextRow++;
        } else if (nextCol < 0) {
            nextCol = this.data[0].length - 1;
            nextRow--;
        }
        
        // Find and focus the target cell
        const targetInput = document.querySelector(`input[data-row="${nextRow}"][data-col="${nextCol}"]`);
        if (targetInput) {
            targetInput.focus();
            targetInput.select();
        }
    }

    handlePaste(event) {
        if (document.activeElement.classList.contains('cell-input')) {
            const pastedData = event.clipboardData.getData('text');
            if (pastedData.includes('\n') || pastedData.includes('\t')) {
                event.preventDefault();
                this.pasteBulkData(pastedData, document.activeElement);
            }
        }
    }

    pasteBulkData(pastedData, startCell) {
        const startRow = parseInt(startCell.dataset.row);
        const startCol = parseInt(startCell.dataset.col);
        const lines = pastedData.trim().split('\n');
        
        lines.forEach((line, rowOffset) => {
            const cells = line.split('\t').length > 1 ? line.split('\t') : line.split(',');
            cells.forEach((cellValue, colOffset) => {
                const targetRow = startRow + rowOffset;
                const targetCol = startCol + colOffset;
                
                if (targetCol < this.data[0].length) {
                    // Ensure row exists
                    if (!this.data[targetRow]) {
                        this.data[targetRow] = new Array(this.data[0].length).fill('');
                    }
                    
                    // Update data
                    this.data[targetRow][targetCol] = cellValue.trim();
                    
                    // Update input if it exists
                    const targetInput = document.querySelector(`input[data-row="${targetRow}"][data-col="${targetCol}"]`);
                    if (targetInput) {
                        targetInput.value = cellValue.trim();
                    }
                }
            });
        });
        
        this.isModified = true;
        this.modifiedStat.style.display = 'flex';
        this.exportBtn.style.display = 'inline-flex';
    }

    exportCSV() {
        try {
            const csvContent = this.generateCSVContent();
            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement('a');
            
            if (link.download !== undefined) {
                const url = URL.createObjectURL(blob);
                link.setAttribute('href', url);
                link.setAttribute('download', this.filename || 'edited_data.csv');
                link.style.visibility = 'hidden';
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                
                this.toast.success('CSV exported successfully!');
            }
        } catch (error) {
            this.toast.error(`Error exporting CSV: ${error.message}`);
        }
    }

    generateCSVContent() {
        return this.data.map(row => {
            return row.map(cell => {
                // Escape quotes and wrap in quotes if necessary
                const cellStr = String(cell || '');
                if (cellStr.includes(',') || cellStr.includes('"') || cellStr.includes('\n')) {
                    return '"' + cellStr.replace(/"/g, '""') + '"';
                }
                return cellStr;
            }).join(',');
        }).join('\n');
    }

    updateFileInfo() {
        if (this.filename) {
            this.fileInfo.innerHTML = `
                <span><i class="bi bi-file-earmark-text"></i> ${this.filename}</span>
            `;
        }
    }

    // Pagination methods
    getTotalPages() {
        return Math.ceil(this.totalDataRows / this.rowsPerPage);
    }

    goToPage(page) {
        const totalPages = this.getTotalPages();
        if (page >= 1 && page <= totalPages && page !== this.currentPage) {
            this.currentPage = page;
            this.displayData();
            this.updatePagination();
        }
    }

    changeRowsPerPage(event) {
        this.rowsPerPage = parseInt(event.target.value);
        this.currentPage = 1; // Reset to first page
        this.displayData();
        this.updatePagination();
    }

    updatePagination() {
        if (this.totalDataRows === 0) return;

        const totalPages = this.getTotalPages();
        const startRow = (this.currentPage - 1) * this.rowsPerPage + 1;
        const endRow = Math.min(startRow + this.rowsPerPage - 1, this.totalDataRows);

        // Update pagination info
        this.paginationInfo.textContent = `Showing ${startRow}-${endRow} of ${this.totalDataRows} rows`;

        // Update button states
        this.firstPageBtn.disabled = this.currentPage === 1;
        this.prevPageBtn.disabled = this.currentPage === 1;
        this.nextPageBtn.disabled = this.currentPage === totalPages;
        this.lastPageBtn.disabled = this.currentPage === totalPages;

        // Update page numbers
        this.updatePageNumbers(totalPages);
    }

    updatePageNumbers(totalPages) {
        this.pageNumbers.innerHTML = '';

        if (totalPages <= 1) return;

        // Determine which page numbers to show
        let startPage = Math.max(1, this.currentPage - 2);
        let endPage = Math.min(totalPages, this.currentPage + 2);

        // Adjust if we're near the beginning or end
        if (endPage - startPage < 4) {
            if (startPage === 1) {
                endPage = Math.min(totalPages, startPage + 4);
            } else if (endPage === totalPages) {
                startPage = Math.max(1, endPage - 4);
            }
        }

        // Add ellipsis and first page if needed
        if (startPage > 1) {
            this.addPageButton(1);
            if (startPage > 2) {
                this.addEllipsis();
            }
        }

        // Add page numbers
        for (let i = startPage; i <= endPage; i++) {
            this.addPageButton(i, i === this.currentPage);
        }

        // Add ellipsis and last page if needed
        if (endPage < totalPages) {
            if (endPage < totalPages - 1) {
                this.addEllipsis();
            }
            this.addPageButton(totalPages);
        }
    }

    addPageButton(pageNum, isActive = false) {
        const button = document.createElement('button');
        button.className = `pagination-btn ${isActive ? 'active' : ''}`;
        button.textContent = pageNum;
        button.addEventListener('click', () => this.goToPage(pageNum));
        this.pageNumbers.appendChild(button);
    }

    addEllipsis() {
        const ellipsis = document.createElement('span');
        ellipsis.className = 'pagination-btn';
        ellipsis.textContent = '...';
        ellipsis.style.cursor = 'default';
        ellipsis.style.border = 'none';
        ellipsis.style.background = 'transparent';
        this.pageNumbers.appendChild(ellipsis);
    }

    updateStats() {
        if (this.data.length > 0) {
            this.rowCount.textContent = `${this.totalDataRows} rows`;
            this.colCount.textContent = `${this.data[0].length} columns`;
            this.stats.style.display = 'flex';
        }
    }

    initResize(colIndex, startX) {
        const th = this.tableHead.querySelectorAll('th')[colIndex];
        const startWidth = th.offsetWidth;

        // Switch to fixed layout on first resize
        if (!this.columnWidths.some(w => w)) {
            // Capture all current column widths before switching to fixed layout
            const allThs = this.tableHead.querySelectorAll('th');
            allThs.forEach((header, i) => {
                this.columnWidths[i] = header.offsetWidth;
                header.style.width = header.offsetWidth + 'px';
            });
            this.table.style.tableLayout = 'fixed';
        }

        document.body.classList.add('col-resizing');

        const onMouseMove = (e) => {
            const delta = e.clientX - startX;
            const newWidth = Math.max(60, startWidth + delta);
            this.columnWidths[colIndex] = newWidth;

            // Update header width
            th.style.width = newWidth + 'px';

            // Update body cell widths for this column
            const rows = this.tableBody.querySelectorAll('tr');
            rows.forEach(row => {
                const cell = row.children[colIndex];
                if (cell) {
                    cell.style.width = newWidth + 'px';
                }
            });
        };

        const onMouseUp = () => {
            document.removeEventListener('mousemove', onMouseMove);
            document.removeEventListener('mouseup', onMouseUp);
            document.body.classList.remove('col-resizing');
        };

        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup', onMouseUp);
    }

    showTable() {
        this.emptyState.style.display = 'none';
        this.tableContainer.style.display = 'block';
        this.exportBtn.style.display = 'inline-flex';
    }

    hideTable() {
        this.tableContainer.style.display = 'none';
        this.emptyState.style.display = 'flex';
        this.exportBtn.style.display = 'none';
        this.stats.style.display = 'none';
        this.modifiedStat.style.display = 'none';
    }
}

// Initialize the CSV editor when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new CSVEditor();
});
