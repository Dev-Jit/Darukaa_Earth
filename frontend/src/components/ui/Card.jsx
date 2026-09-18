export default function Card({ as: Tag = "div", className = "", children, ...props }) {
  return (
    <Tag className={`card ${className}`.trim()} {...props}>
      {children}
    </Tag>
  );
}
