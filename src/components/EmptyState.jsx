import { DropZone } from './DropZone'

export function EmptyState({
  icon = 'bi-file-earmark-spreadsheet',
  title = 'FileLens',
  description = 'Open a file to view and edit its contents. You can also click on any supported file link on the web and it will automatically open in this viewer.',
  onFileDrop,
  onOpenFile,
  acceptedExtensions = ['.csv', '.txt', '.json', '.md'],
  dropZoneText = 'Drop your file here',
  dropZoneSubtext = 'or click to browse files',
  dropZoneButtonText = 'Choose File',
  showCoffeeLink = true
}) {
  return (
    <div className="empty-state">
      <div className="empty-icon"><i className={`bi ${icon}`}></i></div>
      <div className="empty-title">{title}</div>
      <div className="empty-description">{description}</div>

      <DropZone
        onFileDrop={onFileDrop}
        onClick={onOpenFile}
        acceptedExtensions={acceptedExtensions}
      >
        <div className="drop-zone-content">
          <div className="drop-icon"><i className="bi bi-cloud-upload"></i></div>
          <div className="drop-text">{dropZoneText}</div>
          <div className="drop-subtext">{dropZoneSubtext}</div>
          <div className="btn btn-primary">
            <i className="bi bi-file-earmark-plus"></i> {dropZoneButtonText}
          </div>
        </div>
      </DropZone>

      {showCoffeeLink && (
        <div style={{ marginTop: '32px' }}>
          <a
            href="https://paypal.me/joshuadarron?country.x=US&locale.x=en_US"
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-outline"
            style={{ textDecoration: 'none' }}
          >
            <i className="bi bi-cup-hot"></i> Buy me a cup of coffee
          </a>
        </div>
      )}
    </div>
  )
}
