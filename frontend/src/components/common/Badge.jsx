import React from 'react'

const Badge = ({ children, variant = 'default' }) => {
const variants = {
  default: 'bg-[#F3F4F6] text-[#1F2937]',       // neutral
  success: 'bg-[#DCFCE7] text-[#166534]',       // status-success
  warning: 'bg-[#FEF9C3] text-[#854D0E]',       // status-warning
  danger: 'bg-[#FEE2E2] text-[#991B1B]',        // status-error
  info: 'bg-[#DBEAFE] text-[#1E40AF]',          // status-info
  primary: 'bg-[#84d2c5] text-gray-800',        // основной акцент
}
  
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${variants[variant]}`}>
      {children}
    </span>
  )
}

export default Badge
