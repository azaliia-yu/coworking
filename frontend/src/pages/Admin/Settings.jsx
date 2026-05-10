import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchSettings, updateSettings, fetchWorkingHours, updateWorkingHours } from '../../store/slices/settingsSlice';
import { Button, Input, Select, Loader, Card } from '../../components/common';
import { toast } from 'react-hot-toast';

const Settings = () => {
  const dispatch = useDispatch();
  const { settings, workingHours, loading } = useSelector((state) => state.settings);
  const [activeTab, setActiveTab] = useState('booking');
  const [localSettings, setLocalSettings] = useState({});
  const [localWorkingHours, setLocalWorkingHours] = useState({});

  useEffect(() => {
    dispatch(fetchSettings());
    dispatch(fetchWorkingHours());
  }, [dispatch]);

  useEffect(() => {
    if (settings) {
      setLocalSettings(settings);
    }
  }, [settings]);

  useEffect(() => {
    if (workingHours.length > 0) {
      const hoursMap = {};
      workingHours.forEach(h => {
        hoursMap[h.day] = h;
      });
      setLocalWorkingHours(hoursMap);
    }
  }, [workingHours]);

  const handleSettingsChange = (field, value) => {
    setLocalSettings(prev => ({ ...prev, [field]: value }));
  };

  const handleSaveSettings = async () => {
    try {
      await dispatch(updateSettings(localSettings)).unwrap();
      toast.success('Настройки сохранены');
    } catch (error) {
      if (error?.response?.status === 409) {
        toast.error('Настройки были изменены другим администратором. Обновите страницу и попробуйте снова.');
      } else {
        toast.error(error?.message || 'Ошибка сохранения настроек');
      }
    }
  };

  const handleWorkingHoursChange = (day, field, value) => {
    setLocalWorkingHours(prev => ({
      ...prev,
      [day]: { ...prev[day], [field]: value }
    }));
  };

  const handleSaveWorkingHours = async (day) => {
    const hours = localWorkingHours[day];
    if (!hours) return;
    try {
      await dispatch(updateWorkingHours({ day, data: hours })).unwrap();
      toast.success('Рабочие часы обновлены');
    } catch (error) {
      if (error?.response?.status === 409) {
        toast.error('Данные были изменены другим администратором. Обновите страницу и попробуйте снова.');
      } else {
        toast.error(error?.message || 'Ошибка обновления');
      }
    }
  };

  const handleSaveAllWorkingHours = async () => {
    try {
      for (const day of Object.keys(localWorkingHours)) {
        await dispatch(updateWorkingHours({ day: parseInt(day), data: localWorkingHours[day] })).unwrap();
      }
      toast.success('Все рабочие часы сохранены');
    } catch (error) {
      if (error?.response?.status === 409) {
        toast.error('Один из дней был изменён другим администратором. Обновите страницу и повторите.');
      } else {
        toast.error(error?.message || 'Ошибка при сохранении рабочих часов');
      }
    }
  };

  const daysOfWeek = [
    { value: 0, label: 'Понедельник' },
    { value: 1, label: 'Вторник' },
    { value: 2, label: 'Среда' },
    { value: 3, label: 'Четверг' },
    { value: 4, label: 'Пятница' },
    { value: 5, label: 'Суббота' },
    { value: 6, label: 'Воскресенье' },
  ];

  if (loading && !settings) {
    return <Loader fullScreen />;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-800">Настройки системы</h1>

      <div className="border-b border-gray-200">
        <nav className="flex gap-4">
          <button
            onClick={() => setActiveTab('booking')}
            className={`pb-2 px-1 transition-colors ${
              activeTab === 'booking'
                ? 'border-b-2 border-[#84d2c5] text-[#5bb8a8] font-medium'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Правила бронирования
          </button>
          <button
            onClick={() => setActiveTab('working-hours')}
            className={`pb-2 px-1 transition-colors ${
              activeTab === 'working-hours'
                ? 'border-b-2 border-[#84d2c5] text-[#5bb8a8] font-medium'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Рабочие часы
          </button>
        </nav>
      </div>

      {activeTab === 'booking' && localSettings && (
        <Card>
          <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); handleSaveSettings(); }}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Минимальная длительность (минуты)"
                type="number"
                value={localSettings.min_booking_duration || ''}
                onChange={(e) => handleSettingsChange('min_booking_duration', parseInt(e.target.value))}
              />
              <Input
                label="Максимальная длительность (минуты)"
                type="number"
                value={localSettings.max_booking_duration || ''}
                onChange={(e) => handleSettingsChange('max_booking_duration', parseInt(e.target.value))}
              />
              <Input
                label="Интервал бронирования (минуты)"
                type="number"
                value={localSettings.booking_interval || ''}
                onChange={(e) => handleSettingsChange('booking_interval', parseInt(e.target.value))}
              />
              <Input
                label="Максимальный срок бронирования (дни)"
                type="number"
                value={localSettings.advance_booking_days || ''}
                onChange={(e) => handleSettingsChange('advance_booking_days', parseInt(e.target.value))}
              />
              <Input
                label="Время для отмены (минуты)"
                type="number"
                value={localSettings.cancellation_deadline_minutes || ''}
                onChange={(e) => handleSettingsChange('cancellation_deadline_minutes', parseInt(e.target.value))}
              />
              <Input
                label="Автоотмена неоплаченных (минуты)"
                type="number"
                value={localSettings.auto_cancel_unpaid_minutes || ''}
                onChange={(e) => handleSettingsChange('auto_cancel_unpaid_minutes', parseInt(e.target.value))}
              />
              <Input
                label="Напоминание за (минуты)"
                type="number"
                value={localSettings.reminder_minutes_before || ''}
                onChange={(e) => handleSettingsChange('reminder_minutes_before', parseInt(e.target.value))}
              />
              <Input
                label="Максимум одновременных бронирований"
                type="number"
                value={localSettings.max_simultaneous_bookings || ''}
                onChange={(e) => handleSettingsChange('max_simultaneous_bookings', parseInt(e.target.value))}
              />
            </div>

            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={localSettings.allow_simultaneous_bookings || false}
                  onChange={(e) => handleSettingsChange('allow_simultaneous_bookings', e.target.checked)}
                  className="w-4 h-4 text-[#84d2c5] focus:ring-[#84d2c5] border-gray-300 rounded"
                />
                <span className="text-sm text-gray-700">Разрешить одновременные бронирования</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={localSettings.enable_notifications || false}
                  onChange={(e) => handleSettingsChange('enable_notifications', e.target.checked)}
                  className="w-4 h-4 text-[#84d2c5] focus:ring-[#84d2c5] border-gray-300 rounded"
                />
                <span className="text-sm text-gray-700">Включить уведомления</span>
              </label>
            </div>

            <div className="flex gap-3 pt-4">
              <Button type="submit" loading={loading}>
                Сохранить настройки
              </Button>
            </div>
          </form>
        </Card>
      )}

      {activeTab === 'working-hours' && (
        <Card>
          <div className="space-y-4">
            {daysOfWeek.map((day) => {
              const hours = localWorkingHours[day.value];
              if (!hours) return null;
              
              return (
                <div key={day.value} className="flex items-center gap-4 p-3 border border-gray-200 rounded-lg hover:border-[#84d2c5] transition-colors">
                  <div className="w-32 font-medium text-gray-800">{day.label}</div>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={hours.is_working ?? true}
                      onChange={(e) => handleWorkingHoursChange(day.value, 'is_working', e.target.checked)}
                      className="w-4 h-4 text-[#84d2c5] focus:ring-[#84d2c5] border-gray-300 rounded"
                    />
                    <span className="text-sm text-gray-700">Рабочий день</span>
                  </label>
                  <input
                    type="time"
                    value={hours.start_time || '09:00'}
                    onChange={(e) => handleWorkingHoursChange(day.value, 'start_time', e.target.value)}
                    className="form-input w-32"
                    disabled={hours.is_working === false}
                  />
                  <span className="text-gray-500">-</span>
                  <input
                    type="time"
                    value={hours.end_time || '18:00'}
                    onChange={(e) => handleWorkingHoursChange(day.value, 'end_time', e.target.value)}
                    className="form-input w-32"
                    disabled={hours.is_working === false}
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleSaveWorkingHours(day.value)}
                  >
                    Сохранить
                  </Button>
                </div>
              );
            })}
            
            <div className="pt-4">
              <Button onClick={handleSaveAllWorkingHours}>
                Сохранить все
              </Button>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};

export default Settings;

