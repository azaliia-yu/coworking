import React, { forwardRef } from 'react'

const Select = forwardRef(({
  label,
  name,
  value,
  onChange,
  onBlur,
  error,
  touched,
  options,
  placeholder,
  required = false,
  disabled = false,
  className = '',
  ...props
}, ref) => {
  const hasError = touched && error
  
  return (
    <div className={`mb-4 ${className}`}>
      {label && (
        <label htmlFor={name} className="form-label">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <select
        ref={ref}
        id={name}
        name={name}
        value={value}
        onChange={onChange}
        onBlur={onBlur}
        disabled={disabled}
        className={`form-input ${hasError ? 'border-[#c27765] focus:ring-[#c27765]' : ''}`}

        {...props}
      >
        {placeholder && (
          <option value="" disabled>
            {placeholder}
          </option>
        )}
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {hasError && <div className="form-error">{error}</div>}
    </div>
  )
})

Select.displayName = 'Select'

export default Select

