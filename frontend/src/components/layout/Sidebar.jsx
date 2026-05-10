import React from 'react'
import { NavLink } from 'react-router-dom'
import { useSelector } from 'react-redux'

const Sidebar = ({ isOpen, onClose }) => {
  const { user } = useSelector((state) => state.auth)
  const isAdmin = user?.role === 'admin'

  const publicMenuItems = [
    { to: '/', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6', label: 'Главная' },
  ]

  const clientMenuItems = [
    { to: '/', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6', label: 'Главная' },
    { to: '/bookings', icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z', label: 'Мои бронирования' },
  ]

  const adminMenuItems = [
    { to: '/admin', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6', label: 'Дашборд' },
    { to: '/admin/spaces', icon: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4', label: 'Помещения' },
    { to: '/admin/tariffs', icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z', label: 'Тарифы' },
    { to: '/admin/users', icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z', label: 'Пользователи' },
    { to: '/admin/reports', icon: 'M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z', label: 'Отчёты' },
  ]

  const menuItems = user
    ? (isAdmin ? adminMenuItems : clientMenuItems)
    : publicMenuItems

  const NavItem = ({ item }) => (
    <NavLink
      to={item.to}
      className={({ isActive }) =>
        `flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
          isActive
            ? 'bg-[#84d2c5] bg-opacity-20 text-[#5bb8a8]'
            : 'text-gray-700 hover:bg-[#ffffe8]'
        }`
      }
      onClick={onClose}
    >
      <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={item.icon} />
      </svg>
      {item.label}
    </NavLink>
  )

  const sidebarContent = (
    <div className="h-full flex flex-col bg-white">
      <div className="flex-1 py-4 overflow-y-auto">
        <nav className="px-2 space-y-1">
          {menuItems.map((item, index) => (
            <NavItem key={index} item={item} />
          ))}
        </nav>
      </div>
      
      {/* Нижняя часть сайдбара */}
      <div className="p-4 border-t border-gray-200">
        <div className="text-xs text-gray-500 text-center">
          Версия 1.0.0
        </div>
      </div>
    </div>
  )

  return (
    <>
      {/* Десктопная версия */}
      <aside className="hidden lg:block w-64 bg-white border-r border-gray-200 fixed h-full">
        {sidebarContent}
      </aside>
      
      {/* Мобильная версия (оверлей) */}
      {isOpen && (
        <>
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
            onClick={onClose}
          />
          <aside className="fixed left-0 top-0 w-64 h-full bg-white shadow-xl z-50 lg:hidden">
            {sidebarContent}
          </aside>
        </>
      )}
    </>
  )
}

export default Sidebar