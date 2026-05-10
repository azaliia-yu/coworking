import React, { forwardRef } from 'react'

const Textarea = forwardRef(({
  label,
  name,
  value,
  onChange,
  onBlur,
  error,
  touched,
  placeholder,
  rows = 4,
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
      <textarea
        ref={ref}
        id={name}
        name={name}
        value={value}
        onChange={onChange}
        onBlur={onBlur}
        placeholder={placeholder}
        rows={rows}
        disabled={disabled}
        className={`form-input ${hasError ? 'border-[#c27765] focus:ring-[#c27765]' : ''}`}

        {...props}
      />
      {hasError && <div className="form-error">{error}</div>}
    </div>
  )
})

Textarea.displayName = 'Textarea'

export default Textarea
