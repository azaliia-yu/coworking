import React, { useState } from 'react'
import { Outlet } from 'react-router-dom'
import { useSelector } from 'react-redux'
import Header from './Header'
import Footer from './Footer'
import Sidebar from './Sidebar'

const MainLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { sidebarOpen: reduxSidebarOpen } = useSelector((state) => state.ui)
  
  // Используем локальное состояние для мобильной версии
  const isSidebarOpen = sidebarOpen || reduxSidebarOpen
  
  const handleSidebarClose = () => {
    setSidebarOpen(false)
  }
  
  return (
<div className="min-h-screen bg-[#ffffe8]">
  <Header />
  <Sidebar isOpen={isSidebarOpen} onClose={handleSidebarClose} />
  <div className="lg:pl-64 flex flex-col min-h-screen">
    <main className="flex-1 py-6 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <Outlet />
      </div>
    </main>
    <Footer />
  </div>
</div>
  )
}

export default MainLayout
