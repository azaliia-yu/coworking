import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import api from '../../services/api';
import { Card, Loader } from '../common';
import { toast } from 'react-hot-toast';

const MyAccessCard = () => {
  const { user } = useSelector((state) => state.auth);
  const [card, setCard] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchCard = async () => {
    try {
      const response = await api.get('/access-cards/my_card/');
      setCard(response.data);
    } catch (err) {
      if (err.response?.status === 404) {
        setCard(null); // карты нет
      } else {
        toast.error('Ошибка загрузки пропуска');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCard();
  }, []);

  if (loading) return <Loader size="sm" />;

  // Если карты нет
  if (!card) {
    return (
      <Card>
        <h3 className="text-lg font-semibold mb-2">Электронный пропуск</h3>
        <p className="text-gray-600">
          Пропуск не выдан. Обратитесь к администратору для получения карты доступа.
        </p>
        {user?.role === 'admin' && (
          <p className="text-sm text-gray-500 mt-2">
            (Администратор может создать карту через админ-панель: раздел «СКУД → Пропуски»)
          </p>
        )}
      </Card>
    );
  }

  // Если карта есть – отображаем информацию
  return (
    <Card>
      <h3 className="text-lg font-semibold mb-3">Мой пропуск</h3>
      <div className="space-y-2 text-sm">
        <p><span className="font-medium">Номер карты:</span> {card.card_number}</p>
        <p><span className="font-medium">Статус:</span> {card.is_active ? 'Активен' : 'Заблокирован'}</p>
        {card.expires_at && (
          <p><span className="font-medium">Действителен до:</span> {new Date(card.expires_at).toLocaleDateString()}</p>
        )}
      </div>
    </Card>
  );
};

export default MyAccessCard;