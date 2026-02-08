import './Breadcrumb.css'

export function Breadcrumb({ items, onNavigate }) {
  if (!items || items.length === 0) return null

  return (
    <div className="breadcrumb">
      {items.map((item, index) => {
        const isLast = index === items.length - 1
        return (
          <span key={index} className="breadcrumb-segment">
            {index > 0 && <span className="breadcrumb-separator">/</span>}
            {isLast ? (
              <span className="breadcrumb-item current">
                {item.name}
              </span>
            ) : item.url ? (
              <a className="breadcrumb-item" href={item.url}>
                {index === 0 && <i className="bi bi-folder2"></i>}
                {item.name}
              </a>
            ) : (
              <span
                className="breadcrumb-item"
                onClick={() => onNavigate && onNavigate(index)}
              >
                {index === 0 && <i className="bi bi-folder2"></i>}
                {item.name}
              </span>
            )}
          </span>
        )
      })}
    </div>
  )
}
