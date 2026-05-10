import React, { useState, useEffect, useCallback } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import {
  fetchSpaces, createSpace, updateSpace, deleteSpace,
  fetchPlaces, createPlace, updatePlace, deletePlace
} from '../../store/slices/spaceSlice'
import { fetchTariffs } from '../../store/slices/tariffSlice'
import { Button, Modal, ConfirmDialog, Table, Badge, Loader } from '../../components/common'
import SpaceForm from '../../components/admin/SpaceForm'
import PlaceForm from '../../components/admin/PlaceForm'
import { toast } from 'react-hot-toast'

const Spaces = () => {
  const dispatch = useDispatch()
  const { spaces, places, loading } = useSelector((state) => state.spaces)
  const { tariffs } = useSelector((state) => state.tariffs)
  const [selectedSpace, setSelectedSpace] = useState(null)
  const [selectedPlace, setSelectedPlace] = useState(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [modalType, setModalType] = useState('space')
  const [deleteConfirm, setDeleteConfirm] = useState(null)
  const [activeSpaceId, setActiveSpaceId] = useState(null)
  
  // Локальный кэш активного помещения для немедленного отображения
  const [currentSpace, setCurrentSpace] = useState(null)

  // Синхронизируем локальный currentSpace с данными из Redux
  useEffect(() => {
    if (activeSpaceId) {
      const found = spaces.find(s => s.id === activeSpaceId)
      if (found) {
        setCurrentSpace(found)
      }
    } else {
      setCurrentSpace(null)
    }
  }, [activeSpaceId, spaces])

  useEffect(() => {
    dispatch(fetchSpaces())
    dispatch(fetchTariffs())
  }, [dispatch])

  useEffect(() => {
    if (activeSpaceId) {
      dispatch(fetchPlaces({ space: activeSpaceId }))
    }
  }, [dispatch, activeSpaceId])

  const handleCreateSpace = () => {
    setSelectedSpace(null)
    setModalType('space')
    setModalOpen(true)
  }

  const handleEditSpace = (space) => {
    setSelectedSpace(space)
    setModalType('space')
    setModalOpen(true)
  }

  const handleDeleteSpace = async (id) => {
    await dispatch(deleteSpace(id))
    toast.success('Помещение удалено')
    if (activeSpaceId === id) {
      setActiveSpaceId(null)
    }
  }

  const handleCreatePlace = () => {
    if (!activeSpaceId) {
      toast.error('Сначала выберите помещение')
      return
    }
    setSelectedPlace(null)
    setModalType('place')
    setModalOpen(true)
  }

  const handleEditPlace = (place) => {
    setSelectedPlace(place)
    setModalType('place')
    setModalOpen(true)
  }

  const handleDeletePlace = async (id) => {
    await dispatch(deletePlace(id))
    toast.success('Место удалено')
  }
  
  const handleSaveSpace = async (data) => {
    try {
      let result
      if (selectedSpace) {
        result = await dispatch(updateSpace({ id: selectedSpace.id, data })).unwrap()
        toast.success('Помещение обновлено')
      } else {
        result = await dispatch(createSpace(data)).unwrap()
        toast.success('Помещение создано')
      }
      // Обновляем список помещений
      await dispatch(fetchSpaces())
      // Немедленно обновляем currentSpace из результата сохранения
      if (result?.id) {
        setCurrentSpace(result)
      }
      setModalOpen(false)
    } catch (error) {
      if (error?.response?.status === 409) {
        toast.error('Запись была изменена другим администратором. Обновите страницу и попробуйте снова.')
      } else {
        toast.error(error?.message || 'Ошибка сохранения')
      }
    }
  }

  const handleSavePlace = async (data) => {
    try {
      if (selectedPlace) {
        await dispatch(updatePlace({ id: selectedPlace.id, data })).unwrap()
        toast.success('Место обновлено')
      } else {
        await dispatch(createPlace(data)).unwrap()
        toast.success('Место создано')
      }
      setModalOpen(false)
      // Обновляем список мест
      if (activeSpaceId) {
        dispatch(fetchPlaces({ space: activeSpaceId }))
      }
    } catch (error) {
      if (error?.response?.status === 409) {
        toast.error('Запись была изменена другим администратором. Обновите страницу и попробуйте снова.')
      } else {
        toast.error(error?.message || 'Ошибка сохранения места')
      }
    }
  }

  const spaceColumns = [
    { header: 'Название', accessor: 'name' },
    { header: 'Адрес', accessor: 'address' },
    { header: 'Всего мест', accessor: 'total_places' },
    {
      header: 'Статус',
      accessor: 'is_active',
      render: (value) => (
        <Badge variant={value ? 'success' : 'danger'}>
          {value ? 'Активно' : 'Неактивно'}
        </Badge>
      ),
    },
    {
      header: 'Действия',
      accessor: 'id',
      render: (_, row) => (
        <div className="flex gap-2">
          <button
            onClick={() => setActiveSpaceId(row.id)}
            className="text-[#5bb8a8] hover:text-[#84d2c5] flex items-center gap-1 transition-colors"
            title="Показать места"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            Места
          </button>
          <button
            onClick={() => handleEditSpace(row)}
            className="text-[#5bb8a8] hover:text-[#84d2c5] transition-colors"
            title="Редактировать"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </button>
          <button
            onClick={() => setDeleteConfirm({ type: 'space', id: row.id })}
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

  const placeColumns = [
    { header: 'Название', accessor: 'name' },
    {
      header: 'Тип',
      accessor: 'place_type',
      render: (value) => value === 'desk' ? 'Рабочее место' : 'Переговорная',
    },
    { header: 'Вместимость', accessor: 'capacity' },
    {
      header: 'Координаты',
      accessor: (row) => `${row.x || '-'}, ${row.y || '-'}`,
    },
    {
      header: 'Статус',
      accessor: 'is_active',
      render: (value) => (
        <Badge variant={value ? 'success' : 'danger'}>
          {value ? 'Активно' : 'Неактивно'}
        </Badge>
      ),
    },
    {
      header: 'Действия',
      accessor: 'id',
      render: (_, row) => (
        <div className="flex gap-2">
          <button 
            onClick={() => handleEditPlace(row)} 
            className="text-[#5bb8a8] hover:text-[#84d2c5] transition-colors"
            title="Редактировать"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </button>
          <button
            onClick={() => setDeleteConfirm({ type: 'place', id: row.id })}
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
        <h1 className="text-2xl font-bold text-gray-800">Управление помещениями</h1>
        <Button onClick={handleCreateSpace}>+ Добавить помещение</Button>
      </div>

      <Table
        columns={spaceColumns}
        data={spaces}
        loading={loading}
        emptyMessage="Нет помещений"
      />

      {activeSpaceId && currentSpace && (
        <div className="mt-8">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-800">
              Места в помещении "{currentSpace.name}"
            </h2>
            <Button variant="secondary" onClick={handleCreatePlace}>
              + Добавить место
            </Button>
          </div>
          <Table
            columns={placeColumns}
            data={places}
            loading={loading}
            emptyMessage="Нет мест в этом помещении"
          />
        </div>
      )}

      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={modalType === 'space' 
          ? (selectedSpace ? 'Редактировать помещение' : 'Новое помещение')
          : (selectedPlace ? 'Редактировать место' : 'Новое место')
        }
        size="lg"
      >
        {modalType === 'space' ? (
          <SpaceForm
            initialData={selectedSpace}
            onSubmit={handleSaveSpace}
            onCancel={() => setModalOpen(false)}
          />
        ) : (
          <PlaceForm
            initialData={selectedPlace}
            spaceId={activeSpaceId}
            space={currentSpace}
            tariffs={tariffs}
            onSubmit={handleSavePlace}
            onCancel={() => setModalOpen(false)}
          />
        )}
      </Modal>

      <ConfirmDialog
        isOpen={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        onConfirm={() => {
          if (deleteConfirm?.type === 'space') {
            handleDeleteSpace(deleteConfirm.id)
          } else if (deleteConfirm?.type === 'place') {
            handleDeletePlace(deleteConfirm.id)
          }
          setDeleteConfirm(null)
        }}
        title="Подтверждение удаления"
        message="Вы уверены, что хотите удалить этот элемент? Это действие нельзя отменить."
        confirmText="Удалить"
        variant="danger"
      />
    </div>
  )
}

export default Spaces