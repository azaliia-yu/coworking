import React, { useState, useEffect } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { useFormik } from 'formik'
import { format, parseISO, setHours, setMinutes } from 'date-fns'
import { bookingSchema } from '../../utils/validators'
import { fetchPlace } from '../../store/slices/spaceSlice'
import { fetchTariffs } from '../../store/slices/tariffSlice'
import { createBooking, checkAvailability } from '../../store/slices/bookingSlice'
import { Button, Input, Select, Loader } from '../../components/common'
import api from '../../services/api'
import { toast } from 'react-hot-toast'
import { fetchProfile } from '../../store/slices/authSlice';

const BookingPage = () => {
  const { placeId } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const dispatch = useDispatch()
  
  const { currentPlace, loading: placeLoading } = useSelector((state) => state.spaces)
  const { tariffs, loading: tariffsLoading } = useSelector((state) => state.tariffs)
  const { loading: bookingLoading } = useSelector((state) => state.bookings)
  
  const [selectedTariff, setSelectedTariff] = useState(null)
  const [isAvailable, setIsAvailable] = useState(null)
  const [checkingAvailability, setCheckingAvailability] = useState(false)
  const [calculatedPrice, setCalculatedPrice] = useState(0)
  const [currentBookingId, setCurrentBookingId] = useState(null)
  
  // Состояния для оплаты с баланса
  const [balance, setBalance] = useState(0)
  const [useBalance, setUseBalance] = useState(false)
  
  /**
   * Преобразует любой входной формат в строку для datetime-local
   * Формат: YYYY-MM-DDTHH:mm (например: 2024-01-15T14:30)
   */
  const toDateTimeLocalString = (value) => {
    if (!value) return null
    
    let date
    
    // Если timestamp (число)
    if (typeof value === 'number') {
      date = new Date(value)
    }
    // Если ISO строка
    else if (typeof value === 'string') {
      date = parseISO(value)
    }
    // Если уже Date
    else if (value instanceof Date) {
      date = value
    }
    else {
      return null
    }
    
    // Проверка валидности
    if (isNaN(date.getTime())) return null
    
    // Формат для datetime-local: YYYY-MM-DDTHH:mm
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    const hours = String(date.getHours()).padStart(2, '0')
    const minutes = String(date.getMinutes()).padStart(2, '0')
    
    return `${year}-${month}-${day}T${hours}:${minutes}`
  }
  
  /**
   * Получение начальной даты (приоритет: location.state > значение по умолчанию)
   */
  const getInitialStartTime = () => {
    // Если есть переданные данные
    if (location.state?.startTime) {
      const formatted = toDateTimeLocalString(location.state.startTime)
      if (formatted) return formatted
    }
    
    // Значение по умолчанию: сегодня в 09:00
    const defaultDate = setHours(setMinutes(new Date(), 0), 9)
    return toDateTimeLocalString(defaultDate)
  }
  
  const getInitialEndTime = () => {
    // Если есть переданные данные
    if (location.state?.endTime) {
      const formatted = toDateTimeLocalString(location.state.endTime)
      if (formatted) return formatted
    }
    
    // Значение по умолчанию: сегодня в 18:00
    const defaultDate = setHours(setMinutes(new Date(), 0), 18)
    return toDateTimeLocalString(defaultDate)
  }
  
  const formik = useFormik({
    initialValues: {
      place_id: parseInt(placeId),
      tariff_id: '',
      start_time: getInitialStartTime(),
      end_time: getInitialEndTime(),
    },
    validationSchema: bookingSchema,
    onSubmit: async (values) => {
      try {
        const submitData = {
          ...values,
          place: parseInt(values.place_id),
          tariff: values.tariff_id ? parseInt(values.tariff_id) : null,
          start_time: new Date(values.start_time).toISOString(),
          end_time: new Date(values.end_time).toISOString(),
        };
        
        // Создаем бронирование
        const bookingResult = await dispatch(createBooking(submitData)).unwrap()
        setCurrentBookingId(bookingResult.id)
        
        // Если выбран способ оплаты с баланса
        if (useBalance) {
          await handlePayWithBalance(bookingResult.id)
        } else {
          // Создаем платеж через карту
          const paymentResponse = await api.post('/payments/create_payment/', {
            booking_id: bookingResult.id
          })
          
          // Перенаправляем на страницу оплаты
          if (paymentResponse.data.confirmation_url) {
            window.location.href = paymentResponse.data.confirmation_url
          } else {
            toast.success('Бронирование создано! Ожидайте подтверждения.')
            navigate('/')
          }
        }
      } catch (error) {
        toast.error(error.message || 'Ошибка при создании бронирования')
      }
    },
  })
  
  // Загрузка баланса пользователя
  useEffect(() => {
    const fetchBalance = async () => {
      try {
        const response = await api.get('/payments/balance/')
        setBalance(response.data.balance)
      } catch (error) {
        console.error('Failed to fetch balance', error)
      }
    }
    fetchBalance()
  }, [])
  
  
  const handlePayWithBalance = async (bookingId) => {
    try {
      const response = await api.post('/payments/pay_from_balance/', {
        booking_id: bookingId
      });
      
      if (response.data.success) {
        // Обновляем профиль, чтобы баланс в Redux обновился
        dispatch(fetchProfile());
        toast.success('Оплата с баланса прошла успешно');
        navigate('/profile');
      } else {
        toast.error(response.data.error || 'Недостаточно средств');
        await api.post(`/bookings/${bookingId}/cancel/`);
      }
    } catch (error) {
      toast.error('Ошибка при оплате с баланса');
      if (bookingId) {
        await api.post(`/bookings/${bookingId}/cancel/`);
      }
    }
  }
  
  // Загрузка данных о месте и тарифах
  useEffect(() => {
    if (placeId) {
      dispatch(fetchPlace(placeId))
    }
    dispatch(fetchTariffs())
  }, [dispatch, placeId])
  
  // Выбор тарифа
  useEffect(() => {
    if (formik.values.tariff_id && tariffs.length > 0) {
      const tariff = tariffs.find(t => t.id === parseInt(formik.values.tariff_id))
      setSelectedTariff(tariff)
    } else {
      setSelectedTariff(null)
    }
  }, [formik.values.tariff_id, tariffs])
  
    // Расчет стоимости

  useEffect(() => {
    if (selectedTariff && formik.values.start_time && formik.values.end_time) {
      const start = new Date(formik.values.start_time);
      const end = new Date(formik.values.end_time);
      const hours = (end - start) / (1000 * 60 * 60);
      
      // Если дата окончания раньше даты начала — не считаем
      if (hours <= 0) {
        setCalculatedPrice(0);
        return;
      }
      
      if (selectedTariff.type === 'hourly') {
        setCalculatedPrice(Math.ceil(hours) * selectedTariff.price);
      } else if (selectedTariff.type === 'daily') {
        const days = Math.ceil(hours / 24);
        setCalculatedPrice(days * selectedTariff.price);
      } else {
        setCalculatedPrice(selectedTariff.price);
      }
    }
}, [selectedTariff, formik.values.start_time, formik.values.end_time]);
  
  // Проверка доступности при изменении времени
  useEffect(() => {
    const checkAvailabilityDebounce = setTimeout(async () => {
      if (formik.values.start_time && formik.values.end_time && placeId) {
        setCheckingAvailability(true)
        try {
          const result = await dispatch(checkAvailability({
            place_id: placeId,
            start: new Date(formik.values.start_time).toISOString(),
            end: new Date(formik.values.end_time).toISOString()
          })).unwrap()
          setIsAvailable(result.available)
          if (!result.available) {
            toast.error('Выбранное время уже занято')
          }
        } catch (error) {
          setIsAvailable(false)
        } finally {
          setCheckingAvailability(false)
        }
      }
    }, 500)
    
    return () => clearTimeout(checkAvailabilityDebounce)
  }, [dispatch, placeId, formik.values.start_time, formik.values.end_time])
  
  if (placeLoading || tariffsLoading) {
    return <Loader fullScreen />
  }
  
  if (!currentPlace) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Место не найдено</p>
        <Button onClick={() => navigate('/')} className="mt-4">
          Вернуться на главную
        </Button>
      </div>
    )
  }
  
  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Бронирование места</h1>
      
      <div className="bg-white rounded-lg shadow p-6 border border-[#a6e0d7] border-opacity-50">
        {/* Информация о месте */}
        <div className="mb-6 p-4 bg-[#ffffe8] rounded-lg border border-[#e4c988] border-opacity-40">
          <h2 className="text-lg font-semibold mb-2 text-gray-800">{currentPlace.name}</h2>
          <p className="text-gray-600">
            {currentPlace.place_type === 'desk' ? 'Рабочее место' : 'Переговорная комната'}
            {currentPlace.capacity > 1 && ` • до ${currentPlace.capacity} человек`}
          </p>
          {currentPlace.characteristics && Object.keys(currentPlace.characteristics).length > 0 && (
            <div className="mt-2 flex flex-wrap gap-2">
              {currentPlace.characteristics.has_power && (
                <span className="text-xs bg-[#84d2c5] bg-opacity-20 text-gray-700 px-2 py-1 rounded flex items-center gap-1">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  Розетки
                </span>
              )}
              {currentPlace.characteristics.has_projector && (
                <span className="text-xs bg-[#84d2c5] bg-opacity-20 text-gray-700 px-2 py-1 rounded flex items-center gap-1">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z" />
                  </svg>
                  Проектор
                </span>
              )}
              {currentPlace.characteristics.has_wifi && (
                <span className="text-xs bg-[#84d2c5] bg-opacity-20 text-gray-700 px-2 py-1 rounded flex items-center gap-1">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.141 0M1.394 9.393c5.857-5.858 15.355-5.858 21.213 0" />
                  </svg>
                  Wi-Fi
                </span>
              )}
            </div>
          )}
        </div>
        
        <form onSubmit={formik.handleSubmit} className="space-y-6">
          {/* Выбор тарифа */}
          <Select
            label="Тариф"
            name="tariff_id"
            value={formik.values.tariff_id}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            error={formik.errors.tariff_id}
            touched={formik.touched.tariff_id}
            options={tariffs.map(tariff => ({
              value: tariff.id,
              label: `${tariff.name} - ${tariff.price} ₽${tariff.type === 'hourly' ? '/час' : tariff.type === 'daily' ? '/день' : ''}`
            }))}
            placeholder="Выберите тариф"
            required
          />
          
          {/* Дата и время */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="form-label">Дата и время начала</label>
              <input
                type="datetime-local"
                name="start_time"
                value={formik.values.start_time}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                className={`form-input ${formik.errors.start_time && formik.touched.start_time ? 'border-[#c27765]' : ''}`}
              />
              {formik.errors.start_time && formik.touched.start_time && (
                <div className="form-error">{formik.errors.start_time}</div>
              )}
            </div>
            <div>
              <label className="form-label">Дата и время окончания</label>
              <input
                type="datetime-local"
                name="end_time"
                value={formik.values.end_time}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                className={`form-input ${formik.errors.end_time && formik.touched.end_time ? 'border-[#c27765]' : ''}`}
              />
              {formik.errors.end_time && formik.touched.end_time && (
                <div className="form-error">{formik.errors.end_time}</div>
              )}
            </div>
          </div>
          
          {/* Статус доступности */}
          {checkingAvailability && (
            <div className="text-center text-gray-500">
              <Loader size="sm" />
              <span className="ml-2">Проверка доступности...</span>
            </div>
          )}
          
          {!checkingAvailability && isAvailable === false && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
              Выбранное время уже занято. Пожалуйста, выберите другое время.
            </div>
          )}
          
          {/* Расчет стоимости */}
          {selectedTariff && isAvailable && (
            <div className="bg-[#84d2c5] bg-opacity-10 border border-[#84d2c5] rounded-lg p-4">
              <div className="flex justify-between items-center">
                <span className="text-[#5bb8a8] font-medium">Предварительная стоимость:</span>
                <span className="text-2xl font-bold text-[#5bb8a8]">{calculatedPrice} ₽</span>
              </div>
              {selectedTariff.type === 'hourly' && (
                <p className="text-sm text-gray-600 mt-1">* Округление до полного часа</p>
              )}
            </div>
          )}
          
          {/* Выбор способа оплаты */}
          {selectedTariff && isAvailable && (
            <div className="mt-4 p-4 bg-[#ffffe8] rounded-lg border border-[#e4c988] border-opacity-40">
              <h3 className="font-medium mb-3 text-gray-800">Способ оплаты</h3>
              <div className="space-y-3">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="payment_method"
                    value="card"
                    checked={!useBalance}
                    onChange={() => setUseBalance(false)}
                    className="w-4 h-4 text-[#84d2c5] focus:ring-[#84d2c5]"
                  />
                  <span>Банковская карта (ЮKassa)</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="payment_method"
                    value="balance"
                    checked={useBalance}
                    onChange={() => setUseBalance(true)}
                    className="w-4 h-4 text-[#84d2c5] focus:ring-[#84d2c5]"
                  />
                  <span>Оплата с баланса</span>
                  <span className="text-sm text-gray-500">(Доступно: {balance} ₽)</span>
                </label>
              </div>
              
              {useBalance && (
                <div className="mt-3">
                  {balance >= calculatedPrice ? (
                    <Button 
                      type="button"
                      onClick={() => formik.handleSubmit()}
                      variant="primary"
                      className="w-full"
                    >
                      Оплатить с баланса ({calculatedPrice} ₽)
                    </Button>
                  ) : (
                    <div className="space-y-2">
                      <p className="text-red-500 text-sm">
                        Недостаточно средств на балансе. 
                        Не хватает: {calculatedPrice - balance} ₽
                      </p>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setUseBalance(false)}
                        className="w-full"
                      >
                        Оплатить картой
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
          
          {/* Кнопки действий */}
          {selectedTariff && isAvailable && !useBalance && (
            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="secondary"
                onClick={() => navigate(-1)}
              >
                Отмена
              </Button>
              <Button
                type="submit"
                variant="primary"
                disabled={bookingLoading || checkingAvailability || !isAvailable}
                loading={bookingLoading}
              >
                {bookingLoading ? 'Создание...' : 'Забронировать и оплатить картой'}
              </Button>
            </div>
          )}
        </form>
      </div>
    </div>
  )
}

export default BookingPage
