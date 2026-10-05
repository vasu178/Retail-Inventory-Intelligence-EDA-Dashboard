import { SearchIcon } from './Icons.jsx'

export function SearchInput({ value, onChange, placeholder = 'Search products or stores...' }) {
  return (
    <div className="search">
      <SearchIcon size={16} className="search__icon" />
      <input
        type="search"
        className="search__input"
        value={value}
        placeholder={placeholder}
        aria-label={placeholder}
        onChange={(event) => onChange(event.target.value)}
      />
    </div>
  )
}
