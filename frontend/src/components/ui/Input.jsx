export default function Input({ className = "", ...props }) {
  return <input className={`input-field ${className}`.trim()} {...props} />;
}

export function TextArea({ className = "", ...props }) {
  return <textarea className={`input-field min-h-24 ${className}`.trim()} {...props} />;
}

export function Select({ className = "", children, ...props }) {
  return (
    <select className={`input-field ${className}`.trim()} {...props}>
      {children}
    </select>
  );
}
