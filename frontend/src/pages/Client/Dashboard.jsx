import React, { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import DatePicker from 'react-datepicker'
import { format, setHours, setMinutes, isAfter, isBefore, startOfDay, endOfDay } from 'date-fns'
import { ru } from 'date-fns/locale'
import { fetchSpaces, fetchPlaces } from '../../store/slices/spaceSlice'
import { checkAvailability } from '../../store/slices/bookingSlice'
import { setLoading } from '../../store/slices/uiSlice'
import { Loader, Badge, EmptyState } from '../../components/common'
import SpaceMap from '../../components/client/SpaceMap'
import { toast } from 'react-hot-toast'
import 'react-datepicker/dist/react-datepicker.css'

const Dashboard = () => {
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const { spaces, places, loading: spacesLoading } = useSelector((state) => state.spaces)
  const { availability } = useSelector((state) => state.bookings)
  const [selectedSpace, setSelectedSpace] = useState(null)
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [startTime, setStartTime] = useState(setHours(setMinutes(new Date(), 0), 9))
  const [endTime, setEndTime] = useState(setHours(setMinutes(new Date(), 0), 18))
  const [filteredPlaces, setFilteredPlaces] = useState([])
  const [checkingAvailability, setCheckingAvailability] = useState(false)

  // Загрузка помещений при монтировании
  useEffect(() => {
    dispatch(fetchSpaces())
  }, [dispatch])

  // При выборе помещения загружаем его места
  useEffect(() => {
    if (selectedSpace) {
      setFilteredPlaces([]);
      dispatch(fetchPlaces({ space: selectedSpace.id }))
    }
  }, [dispatch, selectedSpace])

  // Фильтрация мест по доступности
  useEffect(() => {
    if (places.length > 0) {
      setFilteredPlaces(places)
    }
  }, [places])
  
  // Проверка доступности при изменении даты/времени
  useEffect(() => {
    if (selectedSpace && places.length > 0) {
      checkAvailabilityForPlaces()
    }
  }, [selectedDate, startTime, endTime, selectedSpace, places])  // ← убрали filteredPlaces
  
  const checkAvailabilityForPlaces = useCallback(async () => {
    if (!selectedSpace) return
    
      // Защита: если места относятся к другому помещению — игнорируем проверку
    if (
      places.length > 0 &&
      Number(places[0].space) !== Number(selectedSpace.id)
    ) {
      return
    }
    
    setCheckingAvailability(true)
    const startDateTime = new Date(selectedDate)
    startDateTime.setHours(startTime.getHours(), startTime.getMinutes())
    const endDateTime = new Date(selectedDate)
    endDateTime.setHours(endTime.getHours(), endTime.getMinutes())
    
    const availabilityPromises = places.map(async (place) => {
      try {
        const result = await dispatch(checkAvailability({
          place_id: place.id,
          start: startDateTime.toISOString(),
          end: endDateTime.toISOString()
        })).unwrap()
        return { ...place, available: result.available }
      } catch {
        return { ...place, available: false }
      }
    })
    
    const updatedPlaces = await Promise.all(availabilityPromises)
    setFilteredPlaces(updatedPlaces)
    setCheckingAvailability(false)
  }, [dispatch, selectedSpace, places, selectedDate, startTime, endTime])


  const handleSpaceSelect = (space) => {
    setSelectedSpace(space)
  }

  const handlePlaceSelect = (place) => {
    if (!place.available) {
      toast.error('Это место уже забронировано на выбранное время');
      return;
    }
    
    // Формируем метку времени для передачи
    const startDateTime = new Date(selectedDate);
    startDateTime.setHours(startTime.getHours(), startTime.getMinutes());
    
    const endDateTime = new Date(selectedDate);
    endDateTime.setHours(endTime.getHours(), endTime.getMinutes());
    
    // Проверяем, авторизован ли пользователь
    const token = localStorage.getItem('access');
    
    if (!token) {
      // Сохраняем выбранное место и время в localStorage для возврата после входа
      const pendingBooking = {
        placeId: place.id,
        startTime: startDateTime.toISOString(),
        endTime: endDateTime.toISOString()
      };
      localStorage.setItem('pending_booking', JSON.stringify(pendingBooking));
      
      // Перенаправляем на страницу входа
      toast('Пожалуйста, войдите или зарегистрируйтесь для бронирования');
      navigate('/login', { state: { from: 'booking' } });
      return;
    }
    
    // Если авторизован — переходим на страницу бронирования
    navigate(`/booking/${place.id}`, {
      state: {
        startTime: startDateTime.toISOString(),
        endTime: endDateTime.toISOString()
      }
    });
  }

  // Фильтрация времени (только рабочие часы: 9:00 - 22:00)
  const filterTime = (time) => {
    const hour = time.getHours()
    return hour >= 9 && hour <= 22
  }

  if (spacesLoading && spaces.length === 0) {
    return <Loader fullScreen />
  }

  return (
    <div className="space-y-6">
      {/* Заголовок */}
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Выберите рабочее место</h1>
        <p className="text-gray-600 mt-1">Забронируйте удобное место для работы или переговорную комнату</p>
      </div>

      {/* Выбор помещения */}
      <div className="bg-white rounded-lg shadow p-4 border border-[#a6e0d7] border-opacity-50">
        <h2 className="text-lg font-semibold mb-3 text-gray-800">Помещения</h2>
        <div className="flex flex-wrap gap-2">
          {spaces.map((space) => (
            <button
              key={space.id}
              onClick={() => handleSpaceSelect(space)}
              className={`px-4 py-2 rounded-lg transition-colors font-medium ${
                selectedSpace?.id === space.id
                  ? 'bg-[#84d2c5] text-gray-800 shadow-md'
                  : 'bg-[#ffffe8] text-gray-700 hover:bg-[#e4c988] hover:bg-opacity-40 border border-gray-200'
              }`}
            >
              {space.name}
            </button>
          ))}
        </div>
      </div>

      {selectedSpace && (
        <>
          {/* Выбор даты и времени */}
          <div className="bg-white rounded-lg shadow p-4 border border-[#a6e0d7] border-opacity-50">
            <h2 className="text-lg font-semibold mb-4 text-gray-800">Дата и время</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Дата</label>
                <DatePicker
                  selected={selectedDate}
                  onChange={setSelectedDate}
                  minDate={new Date()}
                  locale={ru}
                  dateFormat="dd.MM.yyyy"
                  className="form-input"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Время начала</label>
                <DatePicker
                  selected={startTime}
                  onChange={setStartTime}
                  showTimeSelect
                  showTimeSelectOnly
                  timeIntervals={30}
                  timeCaption="Время"
                  dateFormat="HH:mm"
                  filterTime={filterTime}
                  className="form-input"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Время окончания</label>
                <DatePicker
                  selected={endTime}
                  onChange={setEndTime}
                  showTimeSelect
                  showTimeSelectOnly
                  timeIntervals={30}
                  timeCaption="Время"
                  dateFormat="HH:mm"
                  filterTime={filterTime}
                  className="form-input"
                />
              </div>
            </div>
            
            {checkingAvailability && (
              <div className="mt-4 text-center text-gray-500">
                <Loader size="sm" />
                <span className="ml-2">Проверка доступности...</span>
              </div>
            )}
          </div>

          {/* Карта помещений */}
          <div className="bg-white rounded-lg shadow p-4 border border-[#a6e0d7] border-opacity-50">
            <h2 className="text-lg font-semibold mb-4 text-gray-800">
              {selectedSpace.name} - схема расположения мест
            </h2>
            <SpaceMap
              space={selectedSpace}
              places={filteredPlaces}
              onPlaceSelect={handlePlaceSelect}
              selectedDate={selectedDate}
              startTime={startTime}
              endTime={endTime}
            />
          </div>

          {/* Список мест (альтернативное отображение) */}
          <div className="bg-white rounded-lg shadow p-4 border border-[#a6e0d7] border-opacity-50">
            <h2 className="text-lg font-semibold mb-4 text-gray-800">Список мест</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
              {filteredPlaces.map((place) => (
                <button
                  key={place.id}
                  onClick={() => handlePlaceSelect(place)}
                  disabled={!place.available}
                  className={`p-3 rounded-lg border-2 transition-all ${
                    place.available
                      ? 'border-[#84d2c5] bg-[#84d2c5] bg-opacity-10 hover:bg-opacity-20 cursor-pointer hover:shadow-md'
                      : 'border-gray-200 bg-gray-50 cursor-not-allowed opacity-60'
                  }`}
                >
                  <div className="text-center">
                    <div className="text-sm font-medium text-gray-800">{place.name}</div>
                    <div className="text-xs text-gray-500 mt-1">
                      {place.place_type === 'desk' ? 'Рабочее место' : 'Переговорная'}
                    </div>
                    {place.capacity > 1 && (
                      <Badge variant="primary" className="mt-1 text-xs">
                        до {place.capacity} чел.
                      </Badge>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </>
      )}

      {!selectedSpace && spaces.length > 0 && (
        <EmptyState
          title="Выберите помещение"
          description="Нажмите на одно из помещений выше, чтобы увидеть доступные места"
          icon={
            <svg className="w-16 h-16 text-[#a6e0d7]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          }
        />
      )}
    </div>
  )
}

export default Dashboard
