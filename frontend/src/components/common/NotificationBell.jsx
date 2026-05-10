import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchUnreadCount, fetchNotifications, markAsRead } from '../../store/slices/notificationSlice';
import { formatDateTime } from '../../utils/dateUtils';

const NotificationBell = () => {
  const dispatch = useDispatch();
  const { unreadCount, notifications, loading } = useSelector((state) => state.notifications);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Безопасная загрузка количества непрочитанных: только если есть токен
  useEffect(() => {
    const token = localStorage.getItem('access');
    if (token) {
      dispatch(fetchUnreadCount());
    }
  }, [dispatch]);

  // Загрузка списка уведомлений при открытии дропдауна (тоже с проверкой токена)
  useEffect(() => {
    if (isOpen) {
      const token = localStorage.getItem('access');
      if (token) {
        dispatch(fetchNotifications({ limit: 5, ordering: '-created_at' }));
      }
    }
  }, [dispatch, isOpen]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleMarkAsRead = async (id, e) => {
    e.stopPropagation();
    await dispatch(markAsRead(id));
  };

  const getNotificationIcon = (type) => {
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
      default:
        return (
          <svg className="w-5 h-5 text-[#e4c988]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
        );
    }
  };

  // Если нет токена, вообще не показываем колокольчик
  const token = localStorage.getItem('access');
  if (!token) return null;

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-md text-gray-500 hover:text-[#5bb8a8] hover:bg-[#ffffe8] transition-colors"
      >
        <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 w-4 h-4 bg-[#c27765] rounded-full text-white text-xs flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
          <div className="p-3 border-b border-gray-200 flex justify-between items-center">
            <h3 className="font-semibold text-gray-800">Уведомления</h3>
            <Link
              to="/notifications"
              className="text-xs text-[#5bb8a8] hover:text-[#84d2c5] transition-colors"
              onClick={() => setIsOpen(false)}
            >
              Все уведомления
            </Link>
          </div>
          <div className="max-h-96 overflow-y-auto">
            {loading ? (
              <div className="p-4 text-center text-gray-500">Загрузка...</div>
            ) : notifications.length === 0 ? (
              <div className="p-4 text-center text-gray-500">Нет уведомлений</div>
            ) : (
              notifications.slice(0, 5).map((notification) => (
                <div
                  key={notification.id}
                  className={`p-3 border-b border-gray-100 hover:bg-[#ffffe8] transition-colors ${
                    !notification.is_read ? 'bg-[#84d2c5] bg-opacity-10' : ''
                  }`}
                >
                  <div className="flex items-start gap-2">
                    <div className="text-xl">{getNotificationIcon(notification.type)}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start">
                        <p className="text-sm font-medium text-gray-800 truncate">
                          {notification.subject || 'Уведомление'}
                        </p>
                        {!notification.is_read && (
                          <button
                            onClick={(e) => handleMarkAsRead(notification.id, e)}
                            className="text-xs text-[#5bb8a8] hover:text-[#84d2c5] ml-2 transition-colors"
                          >
                            ✓
                          </button>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                        {notification.content}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        {formatDateTime(notification.created_at)}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
          {notifications.length > 5 && (
            <div className="p-2 text-center border-t border-gray-200">
              <Link
                to="/notifications"
                className="text-sm text-[#5bb8a8] hover:text-[#84d2c5] transition-colors"
                onClick={() => setIsOpen(false)}
              >
                Показать все ({notifications.length})
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default NotificationBell;