import { SearchIcon } from "./icons.jsx";

export default function SearchField({ className = "", id = "app-search", ...props }) {
  return (
    <div className={`search-field-wrap ${className}`.trim()}>
      <span className="search-field-icon">
        <SearchIcon />
      </span>
      <input id={id} type="search" className="search-field" {...props} />
    </div>
  );
}
