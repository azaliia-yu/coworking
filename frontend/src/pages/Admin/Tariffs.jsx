import React, { useState, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { fetchTariffs, createTariff, updateTariff, deleteTariff } from '../../store/slices/tariffSlice'
import { Button, Modal, ConfirmDialog, Table, Badge, Input, Select, Textarea } from '../../components/common'
import { useFormik } from 'formik'
import { tariffSchema } from '../../utils/validators'
import { toast } from 'react-hot-toast'

const TariffForm = ({ initialData, onSubmit, onCancel }) => {
  const formik = useFormik({
    initialValues: {
      name: initialData?.name || '',
      type: initialData?.type || 'hourly',
      price: initialData?.price || '',
      package_hours: initialData?.package_hours || '',
      description: initialData?.description || '',
      is_active: initialData?.is_active !== undefined ? initialData.is_active : true,
      version: initialData?.version || 0,
    },
    validationSchema: tariffSchema,
    onSubmit: (values) => {
      const submitData = {
        name: values.name,
        type: values.type,
        price: values.price ? parseFloat(values.price) : 0,
        description: values.description || '',
        is_active: values.is_active,
        version: values.version || 0,
      };
      
      if (values.type === 'package') {
        submitData.package_hours = values.package_hours ? parseInt(values.package_hours) : 0;
      }
  
      onSubmit(submitData);
    },
  })

  const tariffTypes = [
    { value: 'hourly', label: 'Почасовой' },
    { value: 'daily', label: 'Дневной' },
    { value: 'monthly', label: 'Месячный' },
    { value: 'package', label: 'Пакет часов' },
  ]

  return (
    <form onSubmit={formik.handleSubmit} className="space-y-4">
      <Input
        label="Название тарифа"
        name="name"
        value={formik.values.name}
        onChange={formik.handleChange}
        error={formik.errors.name}
        touched={formik.touched.name}
        required
      />
      
      <Select
        label="Тип тарифа"
        name="type"
        value={formik.values.type}
        onChange={formik.handleChange}
        options={tariffTypes}
        required
      />
      
      <Input
        label="Цена (₽)"
        type="number"
        name="price"
        value={formik.values.price}
        onChange={formik.handleChange}
        error={formik.errors.price}
        touched={formik.touched.price}
        required
      />
      
      {formik.values.type === 'package' && (
        <Input
          label="Количество часов в пакете"
          type="number"
          name="package_hours"
          value={formik.values.package_hours}
          onChange={formik.handleChange}
          error={formik.errors.package_hours}
          touched={formik.touched.package_hours}
        />
      )}
      
      <Textarea
        label="Описание"
        name="description"
        value={formik.values.description}
        onChange={formik.handleChange}
        rows={3}
      />
      
      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          name="is_active"
          checked={formik.values.is_active}
          onChange={formik.handleChange}
          className="w-4 h-4 text-[#84d2c5] focus:ring-[#84d2c5] border-gray-300 rounded"
        />
        <label className="text-sm text-gray-700">Активен</label>
      </div>
      
      <div className="flex gap-3 pt-4">
        <Button type="submit">Сохранить</Button>
        <Button type="button" variant="secondary" onClick={onCancel}>
          Отмена
        </Button>
      </div>
    </form>
  )
}

const Tariffs = () => {
  const dispatch = useDispatch()
  const { tariffs, loading } = useSelector((state) => state.tariffs)
  const [modalOpen, setModalOpen] = useState(false)
  const [selectedTariff, setSelectedTariff] = useState(null)
  const [deleteConfirm, setDeleteConfirm] = useState(null)

  useEffect(() => {
    dispatch(fetchTariffs())
  }, [dispatch])

  const handleCreate = () => {
    setSelectedTariff(null)
    setModalOpen(true)
  }

  const handleEdit = (tariff) => {
    setSelectedTariff(tariff)
    setModalOpen(true)
  }

  const handleDelete = async (id) => {
    await dispatch(deleteTariff(id))
    toast.success('Тариф удален')
    setDeleteConfirm(null)
  }


  const handleSave = async (data) => {
    try {
      if (selectedTariff) {
        await dispatch(updateTariff({ id: selectedTariff.id, data })).unwrap();
        toast.success('Тариф обновлен');
      } else {
        await dispatch(createTariff(data)).unwrap();
        toast.success('Тариф создан');
      }
      setModalOpen(false);
    } catch (error) {
      if (error?.response?.status === 409) {
        toast.error('Запись была изменена другим администратором. Обновите страницу и повторите.');
      } else {
        toast.error(error?.message || 'Ошибка сохранения тарифа');
      }
    }
  };

  
  const getTypeLabel = (type) => {
    const types = {
      hourly: 'Почасовой',
      daily: 'Дневной',
      monthly: 'Месячный',
      package: 'Пакет часов',
    }
    return types[type] || type
  }

  const columns = [
    { header: 'Название', accessor: 'name' },
    {
      header: 'Тип',
      accessor: 'type',
      render: (value) => getTypeLabel(value),
    },
    {
      header: 'Цена',
      accessor: 'price',
      render: (value, row) => {
        if (row.type === 'hourly') return `${value} ₽/час`
        if (row.type === 'daily') return `${value} ₽/день`
        if (row.type === 'monthly') return `${value} ₽/мес`
        if (row.type === 'package') return `${value} ₽ за ${row.package_hours} ч`
        return `${value} ₽`
      },
    },
    {
      header: 'Статус',
      accessor: 'is_active',
      render: (value) => (
        <Badge variant={value ? 'success' : 'danger'}>
          {value ? 'Активен' : 'Неактивен'}
        </Badge>
      ),
    },
    {
      header: 'Действия',
      accessor: 'id',
      render: (_, row) => (
        <div className="flex gap-2">
          <button 
            onClick={() => handleEdit(row)} 
            className="text-[#5bb8a8] hover:text-[#84d2c5] transition-colors"
            title="Редактировать"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </button>
          <button
            onClick={() => setDeleteConfirm(row.id)}
            className="text-[#c27765] hover:text-red-700 transition-colors"
            title="Удалить"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">Управление тарифами</h1>
        <Button onClick={handleCreate}>+ Добавить тариф</Button>
      </div>

      <Table
        columns={columns}
        data={tariffs}
        loading={loading}
        emptyMessage="Нет тарифов"
      />

      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={selectedTariff ? 'Редактировать тариф' : 'Новый тариф'}
        size="md"
      >
        <TariffForm
          initialData={selectedTariff}
          onSubmit={handleSave}
          onCancel={() => setModalOpen(false)}
        />
      </Modal>

      <ConfirmDialog
        isOpen={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        onConfirm={() => handleDelete(deleteConfirm)}
        title="Удаление тарифа"
        message="Вы уверены, что хотите удалить этот тариф? Это действие нельзя отменить."
        confirmText="Удалить"
        variant="danger"
      />
    </div>
  )
}

export default Tariffs
