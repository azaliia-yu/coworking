import React from 'react'
import { Link } from 'react-router-dom'
import Button from '../../components/common/Button'

const NotFoundPage = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#ffffe8] to-[#84d2c5]">
      <div className="text-center px-4">
        {/* 404 иллюстрация */}
        <div className="mb-8">
          <div className="relative inline-block">
            <div className="text-9xl font-bold text-[#a6e0d7]">404</div>
            <div className="absolute inset-0 flex items-center justify-center">
              <svg className="w-32 h-32 text-[#e4c988]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>

        {/* Сообщение об ошибке */}
        <h1 className="text-3xl font-bold text-gray-800 mb-2">
          Страница не найдена
        </h1>
        <p className="text-gray-600 mb-8 max-w-md mx-auto">
          К сожалению, запрашиваемая страница не существует или была перемещена.
        </p>

        {/* Кнопки действий */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link to="/">
            <Button variant="primary" className="w-full sm:w-auto">
              <svg className="w-5 h-5 mr-2 inline-block" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
              На главную
            </Button>
          </Link>
          
          <button
            onClick={() => window.history.back()}
            className="inline-flex items-center justify-center px-4 py-2 border border-[#84d2c5] rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-[#ffffe8] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#84d2c5]"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Вернуться назад
          </button>
        </div>

        {/* Дополнительная информация */}
        <div className="mt-12 pt-8 border-t border-[#a6e0d7]">
          <p className="text-sm text-gray-500">
            Если вы уверены, что это ошибка, пожалуйста,{' '}
            <a href="#" className="text-[#5bb8a8] hover:text-[#b05b7b] font-medium">
              свяжитесь с поддержкой
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}

export default NotFoundPage
