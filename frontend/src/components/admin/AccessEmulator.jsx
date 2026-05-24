import React, { useState } from 'react';
import api from '../../services/api';
import { Card, Button, Input } from '../common';

const AccessEmulator = () => {
  const [cardNumber, setCardNumber] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const checkAccess = async () => {
    if (!cardNumber.trim()) return;
    setLoading(true);
    setResult(null);
    try {
      const response = await api.post('/access-cards/check_access/', {
        card_number: cardNumber,
        door: 'web-emulator'
      });
      setResult({ success: true, data: response.data });
    } catch (error) {
      const errData = error.response?.data || { reason: error.message };
      setResult({ success: false, error: errData });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold">СКУД</h2>
      <p className="text-gray-600">Проверка доступа по номеру карты. Симуляция запроса от турникета.</p>

      <Card>
        <div className="flex gap-4 items-end">
          <div className="flex-1">
            <Input
              label="Номер карты"
              value={cardNumber}
              onChange={(e) => setCardNumber(e.target.value)}
              placeholder="Введите номер, например TEST123"
            />
          </div>
          <Button onClick={checkAccess} loading={loading} className="mb-4">Проверить доступ</Button>
        </div>
      </Card>

      {result && (
        <Card>
          <h3 className="font-semibold mb-2">Результат проверки</h3>
          {result.success ? (
            <div className="bg-green-50 p-3 rounded border border-green-200">
              <p className="text-green-800 font-medium"> Доступ разрешён</p>
              <p><strong>Событие:</strong> {result.data.event === 'entry' ? 'Вход' : 'Выход'}</p>
              <p><strong>Место:</strong> {result.data.place || '—'}</p>
              <p><strong>ID бронирования:</strong> {result.data.booking_id}</p>
            </div>
          ) : (
            <div className="bg-red-50 p-3 rounded border border-red-200">
              <p className="text-red-800 font-medium"> Доступ запрещён</p>
              <p><strong>Причина:</strong> {result.error.reason || result.error.detail || 'Неизвестная ошибка'}</p>
            </div>
          )}
        </Card>
      )}

      <Card>
        <h3 className="font-semibold mb-2">Как это работает</h3>
        <ul className="list-disc list-inside text-sm text-gray-600">
          <li>Проверяется существование активной карты с таким номером</li>
          <li>Проверяется срок действия карты</li>
          <li>Проверяется наличие подтверждённого бронирования на текущее время</li>
        </ul>
        <p className="text-sm text-gray-600 mt-2">При успехе фиксируется вход/выход, событие записывается в журнал AccessLog.</p>
      </Card>
    </div>
  );
};

export default AccessEmulator;