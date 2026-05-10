import React from 'react'

const Loader = ({ fullScreen = false, size = 'md' }) => {
  const sizes = {
    sm: 'w-5 h-5',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
  }
  
  const spinner = (
    <div className="flex items-center justify-center">
<div
  className={`${sizes[size]} border-4 border-[#a6e0d7] border-t-[#84d2c5] rounded-full animate-spin`}
/>
    </div>
  )
  
  if (fullScreen) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-white bg-opacity-80 z-50">
        {spinner}
      </div>
    )
  }
  
  return spinner
}

export default Loader
