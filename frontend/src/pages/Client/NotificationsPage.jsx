import React, { useState, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { fetchNotifications, markAsRead, markAllRead } from '../../store/slices/notificationSlice'
import { Button, Loader, Badge, Pagination } from '../../components/common'
import { formatDateTime } from '../../utils/dateUtils'
import { toast } from 'react-hot-toast'

const NotificationsPage = () => {
  const dispatch = useDispatch()
  const { notifications, loading, total, unreadCount } = useSelector((state) => state.notifications)
  const [currentPage, setCurrentPage] = useState(1)
  const [selectedFilter, setSelectedFilter] = useState('all')
  const pageSize = 20

  useEffect(() => {
    dispatch(fetchNotifications({
      page: currentPage,
      page_size: pageSize,
      ...(selectedFilter !== 'all' && { is_read: selectedFilter === 'unread' ? false : true })
    }))
  }, [dispatch, currentPage, selectedFilter])

  const handleMarkRead = async (id) => {
    await dispatch(markAsRead(id))
    toast.success('Уведомление отмечено как прочитанное')
  }

  const handleMarkAllRead = async () => {
    await dispatch(markAllRead())
    toast.success('Все уведомления отмечены как прочитанные')
  }

  const getTypeIcon = (type) => {
    switch (type) {
      case 'email':
        return (
          <svg className="w-5 h-5 text-[#84d2c5]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                  d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        );
      case 'sms':
        return (
          <svg className="w-5 h-5 text-[#5bb8a8]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                  d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
          </svg>
        );
      case 'push':
        return (
          <svg className="w-5 h-5 text-[#b05b7b]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                  d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
        );
      default:
        return (
          <svg className="w-5 h-5 text-[#a6e0d7]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                  d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
          </svg>
        );
    }
  };

  const getStatusBadge = (isRead) => {
    return isRead 
      ? <Badge variant="default">Прочитано</Badge>
      : <Badge variant="primary">Новое</Badge>
  }

  const totalPages = Math.ceil(total / pageSize)

  if (loading && notifications.length === 0) {
    return <Loader fullScreen />
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Уведомления</h1>
          {unreadCount > 0 && (
            <p className="text-sm text-gray-500 mt-1">
              У вас {unreadCount} непрочитанных уведомлений
            </p>
          )}
        </div>
        <div className="flex gap-3">
          <select
            value={selectedFilter}
            onChange={(e) => setSelectedFilter(e.target.value)}
            className="form-input w-32"
          >
            <option value="all">Все</option>
            <option value="unread">Непрочитанные</option>
            <option value="read">Прочитанные</option>
          </select>
          <Button variant="secondary" onClick={handleMarkAllRead} disabled={unreadCount === 0}>
            Прочитать все
          </Button>
        </div>
      </div>

      <div className="space-y-3">
        {notifications.map((notification) => (
          <div
            key={notification.id}
            className={`bg-white rounded-lg shadow p-4 transition-all hover:shadow-md border ${
              !notification.is_read 
                ? 'border-l-4 border-l-[#84d2c5] border-[#a6e0d7] border-opacity-50' 
                : 'border-[#a6e0d7] border-opacity-50'
            }`}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3 flex-1">
                <div className="text-2xl">{getTypeIcon(notification.type)}</div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-gray-800">{notification.subject || 'Уведомление'}</h3>
                    {getStatusBadge(notification.is_read)}
                  </div>
                  <p className="text-gray-600 mb-2">{notification.content}</p>
                  <div className="flex items-center gap-4 text-xs text-gray-400">
                    <span>{formatDateTime(notification.created_at)}</span>
                    {notification.type === 'email' && notification.status === 'sent' && (
                      <span className="text-[#5bb8a8]">✓ Отправлено</span>
                    )}
                    {notification.type === 'email' && notification.status === 'failed' && (
                      <span className="text-red-500">✗ Ошибка отправки</span>
                    )}
                  </div>
                </div>
              </div>
              {!notification.is_read && (
                <button
                  onClick={() => handleMarkRead(notification.id)}
                  className="text-[#5bb8a8] hover:text-[#b05b7b] text-sm font-medium transition-colors"
                >
                  Отметить прочитанным
                </button>
              )}
            </div>
          </div>
        ))}

        {notifications.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            <svg className="w-12 h-12 mx-auto mb-3 text-[#a6e0d7]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} 
                    d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
            </svg>
            <p>У вас нет уведомлений</p>
          </div>
        )}

        {totalPages > 1 && (
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
          />
        )}
      </div>
    </div>
  )
}

export default NotificationsPage
