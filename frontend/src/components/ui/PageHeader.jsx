export default function PageHeader({ kicker, title, description, actions, className = "" }) {
  return (
    <div className={`page-header ${className}`.trim()}>
      <header>
        {kicker && <p className="kicker mb-1">{kicker}</p>}
        {title && <h1 className="page-title">{title}</h1>}
        {description && <p className="page-description">{description}</p>}
      </header>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}
