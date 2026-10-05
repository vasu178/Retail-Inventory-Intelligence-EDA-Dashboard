import { ChevronIcon } from './Icons.jsx'

export function Select({ label, value, options, onChange, id, className = '', hideLabel = false }) {
  const selectId = id || `select-${label.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`

  return (
    <div className={`field ${className}`}>
      <label className={`field__label ${hideLabel ? 'sr-only' : ''}`} htmlFor={selectId}>
        {label}
      </label>
      <div className="field__control">
        <select
          id={selectId}
          className="select"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          aria-label={hideLabel ? label : undefined}
        >
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <ChevronIcon size={16} className="field__chevron" />
      </div>
    </div>
  )
}
