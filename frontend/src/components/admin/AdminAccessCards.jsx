import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { Table, Button, Modal, Input, Select, ConfirmDialog, Badge, Loader } from '../common';
import { toast } from 'react-hot-toast';

const AdminAccessCards = () => {
  const [cards, setCards] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCard, setEditingCard] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [formData, setFormData] = useState({
    user: '',
    card_number: '',
    is_active: true,
    expires_at: '',
  });

  // Загрузка списка карт и пользователей
  const fetchCards = async () => {
    try {
      const res = await api.get('/access-cards/');
      setCards(res.data.results || res.data);
    } catch (err) {
      toast.error('Ошибка загрузки карт');
    }
  };

  const fetchUsers = async () => {
    try {
      const res = await api.get('/auth/users/?limit=100');
      setUsers(res.data.results || res.data);
    } catch (err) {
      console.error('Ошибка загрузки пользователей');
    }
  };

  useEffect(() => {
    Promise.all([fetchCards(), fetchUsers()]).finally(() => setLoading(false));
  }, []);

  // Открытие модалки для создания/редактирования
  const openModal = (card = null) => {
    if (card) {
      setEditingCard(card);
      setFormData({
        user: card.user,
        card_number: card.card_number,
        is_active: card.is_active,
        expires_at: card.expires_at ? card.expires_at.slice(0, 10) : '',
      });
    } else {
      setEditingCard(null);
      setFormData({
        user: '',
        card_number: '',
        is_active: true,
        expires_at: '',
      });
    }
    setModalOpen(true);
  };

  // Сохранение (создание или обновление)
  const handleSave = async () => {
    if (!formData.user) {
        toast.error('Выберите пользователя');
        return;
    }
    try {
        if (editingCard) {
            await api.patch(`/access-cards/${editingCard.id}/`, {
                is_active: formData.is_active,
                expires_at: formData.expires_at || null,
            });
            toast.success('Карта обновлена');
        } else {
            const dataToSend = {// Формируем данные для отправки
                user: formData.user,
                is_active: formData.is_active,
                expires_at: formData.expires_at || null,
            };// Отправляем card_number только если он введён
      
            if (formData.card_number && formData.card_number.trim()) {
                dataToSend.card_number = formData.card_number;
            }
            await api.post('/access-cards/', dataToSend);
            toast.success('Карта создана');
        }
        setModalOpen(false);
        fetchCards();
    } catch (err) {
        toast.error(err.response?.data?.detail || 'Ошибка сохранения');
    }
  };

  // Удаление карты
  const handleDelete = async () => {
    try {
      await api.delete(`/access-cards/${deleteConfirm}/`);
      toast.success('Карта удалена');
      setDeleteConfirm(null);
      fetchCards();
    } catch (err) {
      toast.error('Ошибка удаления');
    }
  };

  const columns = [
    { header: 'ID', accessor: 'id', className: 'w-16' },
    { header: 'Пользователь', accessor: (row) => row.user_email || row.user_name || row.user, render: (_, row) => `${row.user_email || ''} (${row.user_name || ''})` },
    { header: 'Номер карты', accessor: 'card_number' },
    { header: 'Статус', accessor: 'is_active', render: (val) => <Badge variant={val ? 'success' : 'danger'}>{val ? 'Активна' : 'Заблокирована'}</Badge> },
    { header: 'Срок действия', accessor: 'expires_at', render: (val) => val ? new Date(val).toLocaleDateString() : '—' },
    { header: 'Последнее использование', accessor: 'last_used_at', render: (val) => val ? new Date(val).toLocaleString() : '—' },
    {
      header: 'Действия',
      accessor: 'id',
      render: (_, row) => (
        <div className="flex gap-2">
          <button onClick={() => openModal(row)} className="text-[#5bb8a8] hover:text-[#84d2c5]" title="Редактировать">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </button>
          <button onClick={() => setDeleteConfirm(row.id)} className="text-[#c27765] hover:text-red-700" title="Удалить">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      ),
    },
  ];

  if (loading) return <Loader />;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Управление пропусками</h2>
        <Button onClick={() => openModal()}>+ Выдать пропуск</Button>
      </div>

      <Table columns={columns} data={cards} emptyMessage="Пропусков не найдено" />

      {/* Модальное окно создания/редактирования */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editingCard ? 'Редактировать пропуск' : 'Выдать новый пропуск'} size="md">
        <div className="space-y-4">
          {!editingCard && (
            <Select
              label="Пользователь"
              value={formData.user}
              onChange={(e) => setFormData({ ...formData, user: e.target.value })}
              options={users.map(u => ({ value: u.id, label: `${u.email} (${u.first_name} ${u.last_name})` }))}
              placeholder="Выберите пользователя"
              required
            />
          )}
          {!editingCard && (
            <Input
              label="Номер карты (оставьте пустым для автогенерации)"
              value={formData.card_number}
              onChange={(e) => setFormData({ ...formData, card_number: e.target.value })}
            />
          )}
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="is_active"
              checked={formData.is_active}
              onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
              className="w-4 h-4"
            />
            <label htmlFor="is_active" className="text-sm">Пропуск активен</label>
          </div>
          <Input
            label="Срок действия (YYYY-MM-DD, оставьте пустым — бессрочно)"
            type="date"
            value={formData.expires_at}
            onChange={(e) => setFormData({ ...formData, expires_at: e.target.value })}
          />
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="secondary" onClick={() => setModalOpen(false)}>Отмена</Button>
            <Button onClick={handleSave}>Сохранить</Button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        isOpen={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        onConfirm={handleDelete}
        title="Удаление пропуска"
        message="Вы уверены, что хотите удалить этот пропуск? Карта станет недействительной."
        confirmText="Удалить"
        variant="danger"
      />
    </div>
  );
};

export default AdminAccessCards;