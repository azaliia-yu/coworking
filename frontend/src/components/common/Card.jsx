import React from 'react';

const Card = ({ 
  children, 
  className = '', 
  onClick = null,
  hoverable = false 
}) => {
  return (
    <div
      className={`
        bg-white rounded-lg shadow-md p-6 border border-gray-100
        ${hoverable ? 'hover:shadow-lg hover:border-[#84d2c5] transition-all duration-200 cursor-pointer' : ''}
        ${className}
      `}
      onClick={onClick}
    >
      {children}
    </div>
  );
};

export default Card;