export default function SectionHeader({ kicker, title, description, actions, className = "" }) {
  return (
    <div className={`section-header ${className}`.trim()}>
      <header>
        {kicker && <p className="kicker mb-1">{kicker}</p>}
        {title && <h2 className="section-title">{title}</h2>}
        {description && <p className="page-description mt-1">{description}</p>}
      </header>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}
