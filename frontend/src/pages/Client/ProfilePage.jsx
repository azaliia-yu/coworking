import React, { useState, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useFormik } from 'formik'
import * as Yup from 'yup'
import { updateProfile, fetchProfile } from '../../store/slices/authSlice'
import { fetchBookings, cancelBooking } from '../../store/slices/bookingSlice'
import { Button, Input, Loader, Badge, ConfirmDialog, Modal } from '../../components/common'
import { formatDateTime, formatDate, calculateDuration } from '../../utils/dateUtils'
import MyAccessCard from '../../components/client/MyAccessCard';
import { toast } from 'react-hot-toast'
import { useLocation } from 'react-router-dom'
import api from '../../services/api'

const profileSchema = Yup.object({
  first_name: Yup.string().min(2, 'Минимум 2 символа'),
  last_name: Yup.string().min(2, 'Минимум 2 символа'),
  phone: Yup.string().matches(/^[\d\s\-+()]+$/, 'Неверный формат телефона'),
})

const ProfilePage = () => {
  const dispatch = useDispatch()
  const { user, loading: authLoading } = useSelector((state) => state.auth)
  const { bookings, loading: bookingsLoading } = useSelector((state) => state.bookings)
  const [editing, setEditing] = useState(false)
  const [cancelBookingId, setCancelBookingId] = useState(null)
  const location = useLocation()
  const initialTab = location.state?.activeTab || 'profile'
  const [activeTab, setActiveTab] = useState(initialTab)

  // Состояния для пополнения баланса
  const [topUpModalOpen, setTopUpModalOpen] = useState(false)
  const [topUpAmount, setTopUpAmount] = useState('')
  const [topUpLoading, setTopUpLoading] = useState(false)

  useEffect(() => {
    dispatch(fetchBookings())
  }, [dispatch])

  const formik = useFormik({
    initialValues: {
      first_name: user?.first_name || '',
      last_name: user?.last_name || '',
      phone: user?.phone || '',
    },
    validationSchema: profileSchema,
    enableReinitialize: true,
    onSubmit: async (values) => {
      const result = await dispatch(updateProfile(values))
      if (updateProfile.fulfilled.match(result)) {
        toast.success('Профиль обновлен')
        setEditing(false)
      } else {
        toast.error('Ошибка обновления профиля')
      }
    },
  })

  const handleCancelBooking = async () => {
    if (cancelBookingId) {
      const result = await dispatch(cancelBooking(cancelBookingId))
      if (cancelBooking.fulfilled.match(result)) {
        toast.success('Бронирование отменено')
        dispatch(fetchBookings())
      } else {
        toast.error('Ошибка отмены бронирования')
      }
      setCancelBookingId(null)
    }
  }

  // Пополнение баланса
  const handleTopUp = async () => {
    const amount = parseFloat(topUpAmount)
    if (isNaN(amount) || amount <= 0) {
      toast.error('Введите положительную сумму')
      return
    }
    setTopUpLoading(true)
    try {
      await api.post('/payments/top_up/', { amount })
      toast.success(`Баланс пополнен на ${amount} ₽`)
      setTopUpModalOpen(false)
      setTopUpAmount('')
      // Обновляем профиль, чтобы отобразить новый баланс
      dispatch(fetchProfile())
    } catch (error) {
      toast.error('Ошибка пополнения баланса')
    } finally {
      setTopUpLoading(false)
    }
  }

  const getStatusBadge = (status) => {
    const statusMap = {
      pending: { variant: 'warning', text: 'Ожидает оплаты' },
      confirmed: { variant: 'success', text: 'Подтверждено' },
      cancelled: { variant: 'danger', text: 'Отменено' },
      completed: { variant: 'info', text: 'Завершено' },
    }
    const config = statusMap[status] || { variant: 'default', text: status }
    return <Badge variant={config.variant}>{config.text}</Badge>
  }

  if (authLoading) {
    return <Loader fullScreen />
  }

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Личный кабинет</h1>

      {/* Табы */}
      <div className="border-b border-[#a6e0d7] mb-6">
        <nav className="flex gap-4">
          <button
            onClick={() => setActiveTab('profile')}
            className={`pb-2 px-1 transition-colors ${
              activeTab === 'profile'
                ? 'border-b-2 border-[#84d2c5] text-[#5bb8a8] font-medium'
                : 'text-gray-500 hover:text-[#5bb8a8]'
            }`}
          >
            Профиль
          </button>
          <button
            onClick={() => setActiveTab('bookings')}
            className={`pb-2 px-1 transition-colors ${
              activeTab === 'bookings'
                ? 'border-b-2 border-[#84d2c5] text-[#5bb8a8] font-medium'
                : 'text-gray-500 hover:text-[#5bb8a8]'
            }`}
          >
            Мои бронирования
          </button>
        </nav>
      </div>

      {/* Вкладка профиля */}
      {activeTab === 'profile' && (
        <div className="bg-white rounded-lg shadow p-6 border border-[#a6e0d7] border-opacity-50">
          {!editing ? (
            <div className="space-y-4">
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-xl font-semibold text-gray-800">{user?.first_name} {user?.last_name}</h2>
                  <p className="text-gray-500 mt-1">{user?.email}</p>
                </div>
                <Button onClick={() => setEditing(true)}>Редактировать</Button>
              </div>

              <div className="border-t border-[#a6e0d7] pt-4 mt-4">
                <dl className="grid grid-cols-1 gap-4">
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Телефон</dt>
                    <dd className="mt-1 text-gray-800">{user?.phone || 'Не указан'}</dd>
                  </div>
                  {/* НОВОЕ: Баланс */}
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Баланс</dt>
                    <dd className="mt-1 text-gray-800 flex items-center gap-4">
                      <span className="text-lg font-semibold text-[#5bb8a8]">
                        {user?.balance ? `${user.balance} ₽` : '0 ₽'}
                      </span>
                      <Button size="sm" variant="outline" onClick={() => setTopUpModalOpen(true)}>
                        Пополнить
                      </Button>
                    </dd>
                  </div>
                  {/* Блок пропуска */}
                  <div className="mt-6">
                    <MyAccessCard />
                    </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Роль</dt>
                    <dd className="mt-1 text-gray-800">
                      {user?.role === 'admin' ? 'Администратор' : 'Клиент'}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Дата регистрации</dt>
                    <dd className="mt-1 text-gray-800">{formatDate(user?.date_joined)}</dd>
                  </div>
                </dl>
              </div>
            </div>
          ) : (
            <form onSubmit={formik.handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Имя"
                  name="first_name"
                  value={formik.values.first_name}
                  onChange={formik.handleChange}
                  error={formik.errors.first_name}
                  touched={formik.touched.first_name}
                />
                <Input
                  label="Фамилия"
                  name="last_name"
                  value={formik.values.last_name}
                  onChange={formik.handleChange}
                  error={formik.errors.last_name}
                  touched={formik.touched.last_name}
                />
              </div>
              <Input
                label="Телефон"
                name="phone"
                value={formik.values.phone}
                onChange={formik.handleChange}
                error={formik.errors.phone}
                touched={formik.touched.phone}
              />
              <div className="flex gap-3 pt-2">
                <Button type="submit" loading={authLoading}>Сохранить</Button>
                <Button type="button" variant="secondary" onClick={() => setEditing(false)}>
                  Отмена
                </Button>
              </div>
            </form>
          )}
        </div>
      )}

      {/* Вкладка бронирований */}
      {activeTab === 'bookings' && (
        <div className="bg-white rounded-lg shadow overflow-hidden border border-[#a6e0d7] border-opacity-50">
          {bookingsLoading ? (
            <div className="p-8 text-center"><Loader /></div>
          ) : bookings.length === 0 ? (
            <div className="p-8 text-center text-gray-500">У вас пока нет бронирований</div>
          ) : (
            <div className="divide-y divide-[#a6e0d7] divide-opacity-50">
              {bookings.map((booking) => (
                <div key={booking.id} className="p-4 hover:bg-[#ffffe8] transition-colors">
                  <div className="flex flex-wrap justify-between items-start gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-semibold text-gray-800">{booking.place_name}</h3>
                        {getStatusBadge(booking.status)}
                      </div>
                      <div className="text-sm text-gray-600 space-y-1">
                        <p className="flex items-center gap-1">
                          <svg className="w-4 h-4 text-[#84d2c5]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          {formatDateTime(booking.start_time)} - {formatDateTime(booking.end_time)}
                        </p>
                        <p className="flex items-center gap-1">
                          <svg className="w-4 h-4 text-[#84d2c5]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          Продолжительность: {calculateDuration(booking.start_time, booking.end_time)}
                        </p>
                        <p className="flex items-center gap-1">
                          <svg className="w-4 h-4 text-[#84d2c5]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          Стоимость: {booking.total_cost} ₽
                        </p>
                        {booking.tariff_name && (
                          <p className="flex items-center gap-1">
                            <svg className="w-4 h-4 text-[#84d2c5]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                            </svg>
                            Тариф: {booking.tariff_name}
                          </p>
                        )}
                      </div>
                    </div>
                    {(booking.status === 'pending' || booking.status === 'confirmed') && (
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => setCancelBookingId(booking.id)}
                      >
                        Отменить
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Диалог подтверждения отмены */}
      <ConfirmDialog
        isOpen={!!cancelBookingId}
        onClose={() => setCancelBookingId(null)}
        onConfirm={handleCancelBooking}
        title="Отмена бронирования"
        message="Вы уверены, что хотите отменить это бронирование? Средства будут возвращены на ваш счет."
        confirmText="Отменить бронирование"
        variant="danger"
      />

      {/* Модальное окно пополнения баланса */}
      <Modal
        isOpen={topUpModalOpen}
        onClose={() => setTopUpModalOpen(false)}
        title="Пополнение баланса"
        size="sm"
        footer={
          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={() => setTopUpModalOpen(false)}>Отмена</Button>
            <Button onClick={handleTopUp} loading={topUpLoading}>Пополнить</Button>
          </div>
        }
      >
        <div className="space-y-3">
          <p className="text-sm text-gray-600">
            Введите сумму для пополнения (демонстрационный режим).
          </p>
          <Input
            label="Сумма (₽)"
            type="number"
            value={topUpAmount}
            onChange={(e) => setTopUpAmount(e.target.value)}
            placeholder="Например, 1000"
            required
          />
        </div>
      </Modal>
    </div>
  )
}

export default ProfilePage