import React from 'react'

const Footer = () => {
  const currentYear = new Date().getFullYear()
  
  return (
    <footer className="bg-white border-t border-gray-200 py-4">
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row justify-between items-center text-sm text-gray-500">
          <p>&copy; {currentYear} Коворкинг. Все права защищены.</p>
          <div className="flex space-x-4 mt-2 sm:mt-0">
<a href="#" className="hover:text-[#5bb8a8]">О проекте</a>
<a href="#" className="hover:text-[#5bb8a8]">Помощь</a>
<a href="#" className="hover:text-[#5bb8a8]">Контакты</a>
          </div>
        </div>
      </div>
    </footer>
  )
}

export default Footer
