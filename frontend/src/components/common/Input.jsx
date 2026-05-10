import React, { forwardRef } from 'react'

const Input = forwardRef(({
  label,
  type = 'text',
  name,
  id,
  value,
  onChange,
  onBlur,
  error,
  touched,
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
      <input
        ref={ref}
        id={name}
        name={name}
        type={type}
        value={value}
        onChange={onChange}
        onBlur={onBlur}
        placeholder={placeholder}
        disabled={disabled}
        className={`form-input ${hasError ? 'border-[#c27765] focus:ring-[#c27765]' : ''}`}

        {...props}
      />
      {hasError && <div className="form-error">{error}</div>}
    </div>
  )
})

Input.displayName = 'Input'

export default Input
