import React, { useState, useEffect } from 'react'
import { Outlet, Link, useLocation } from 'react-router-dom'
import { useSelector, useDispatch } from 'react-redux'
import { logout } from '../../store/slices/authSlice'
import { toggleSidebar } from '../../store/slices/uiSlice'
import { toast } from 'react-hot-toast'

const AdminLayout = () => {
  const dispatch = useDispatch()
  const location = useLocation()
  const { user } = useSelector((state) => state.auth)
  const { sidebarOpen } = useSelector((state) => state.ui)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  
  const handleLogout = () => {
    dispatch(logout())
    toast.success('Вы вышли из системы')
  }
  
  const menuItems = [
    { path: '/admin', label: 'Дашборд', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
    { path: '/admin/spaces', label: 'Помещения', icon: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4' },
    { path: '/admin/tariffs', label: 'Тарифы', icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
    { path: '/admin/users', label: 'Пользователи', icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z' },
    { path: '/admin/reports', label: 'Отчёты', icon: 'M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' },
    { path: '/admin/settings', label: 'Настройки', icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z' },
  ]
  
  const isActive = (path) => {
    if (path === '/admin' && location.pathname === '/admin') return true
    if (path !== '/admin' && location.pathname.startsWith(path)) return true
    return false
  }
  
  return (
    /* Изменение 1: фон страницы — БЫЛО bg-gray-100 → СТАЛО bg-[#ffffe8] */
    <div className="min-h-screen bg-[#ffffe8]">
      {/* Верхняя панель */}
      <nav className="bg-white shadow-sm border-b border-gray-200 fixed w-full z-20 top-0">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <button
                onClick={() => dispatch(toggleSidebar())}
                /* Изменение 2: кнопка гамбургера — БЫЛО hover:text-gray-600 hover:bg-gray-100 → СТАЛО hover:text-[#5bb8a8] hover:bg-[#ffffe8] */
                className="p-2 rounded-md text-gray-500 hover:text-[#5bb8a8] hover:bg-[#ffffe8] focus:outline-none lg:hidden"
              >
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
              <Link to="/admin" className="ml-2 lg:ml-0">
                {/* Изменение 3: заголовок — БЫЛО text-gray-900 → СТАЛО text-gray-800 (для лучшей читаемости на теплом фоне) */}
                <h1 className="text-xl font-bold text-gray-800">Админ-панель</h1>
              </Link>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                {/* Изменение 4: аватар — БЫЛО bg-blue-600 text-white → СТАЛО bg-[#84d2c5] text-gray-800 */}
                <div className="w-8 h-8 bg-[#84d2c5] rounded-full flex items-center justify-center text-gray-800 font-semibold">
                  {user?.first_name?.charAt(0) || user?.email?.charAt(0)?.toUpperCase() || 'A'}
                </div>
                {/* Изменение 5: имя пользователя — БЫЛО text-gray-700 → СТАЛО text-gray-800 */}
                <span className="hidden md:block text-sm font-medium text-gray-800">
                  {user?.first_name || user?.email}
                </span>
                <button
                  onClick={handleLogout}
                  /* Изменение 6: кнопка выхода — БЫЛО hover:text-gray-600 hover:bg-gray-100 → СТАЛО hover:text-[#c27765] hover:bg-[#ffffe8] */
                  className="p-2 rounded-md text-gray-500 hover:text-[#c27765] hover:bg-[#ffffe8]"
                >
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      </nav>
      
      {/* Боковое меню */}
      <aside className={`fixed left-0 top-16 h-full bg-white shadow-lg transition-transform duration-300 z-10 ${
        sidebarOpen ? 'translate-x-0 w-64' : '-translate-x-full w-64'
      } lg:translate-x-0 lg:w-64`}>
        <nav className="p-4 space-y-1">
          {menuItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              /* Изменение 7: пункты меню */
              /* БЫЛО: isActive ? 'bg-blue-50 text-blue-700' : 'text-gray-700 hover:bg-gray-100' */
              /* СТАЛО: isActive ? 'bg-[#84d2c5] bg-opacity-20 text-[#5bb8a8]' : 'text-gray-700 hover:bg-[#ffffe8]' */
              className={`flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                isActive(item.path)
                  ? 'bg-[#84d2c5] bg-opacity-20 text-[#5bb8a8]'
                  : 'text-gray-700 hover:bg-[#ffffe8]'
              }`}
            >
              <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={item.icon} />
              </svg>
              {item.label}
            </Link>
          ))}
        </nav>
      </aside>
      
      {/* Основной контент */}
      {/* Изменение 8 и 9: в этом блоке изменений нет, но padding и отступы остаются прежними */}
      <main className={`pt-16 transition-all duration-300 ${
        sidebarOpen ? 'lg:pl-64' : 'pl-0 lg:pl-64'
      }`}>
        <div className="p-4 sm:p-6 lg:p-8">
          <Outlet />
        </div>
      </main>
    </div>
  )
}

export default AdminLayout
