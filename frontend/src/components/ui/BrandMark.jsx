export default function BrandMark({ size = 36, className = "" }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <circle cx="16" cy="16" r="15" fill="#1B4332" />
      <path
        d="M16.2 7.2c-1.8 3.2-5.6 6.6-6.7 10.4a6.6 6.6 0 1 0 12.8-2.1c-.9-3.3-3.8-6.3-6.1-8.3Z"
        fill="#EFF2ED"
      />
      <path d="M16 12.5v9.2" stroke="#1B4332" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}
