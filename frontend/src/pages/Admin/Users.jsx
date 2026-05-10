import React, { useState, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { fetchUsers, blockUser, unblockUser } from '../../store/slices/userSlice'
import { Button, ConfirmDialog, Table, Badge, Pagination } from '../../components/common'
import { toast } from 'react-hot-toast'
import { formatDate } from '../../utils/dateUtils'

const Users = () => {
  const dispatch = useDispatch()
  const { users, loading, total } = useSelector((state) => state.users)
  const [currentPage, setCurrentPage] = useState(1)
  const [searchTerm, setSearchTerm] = useState('')
  const [blockConfirm, setBlockConfirm] = useState(null)
  const [unblockConfirm, setUnblockConfirm] = useState(null)
  const pageSize = 20

  useEffect(() => {
    dispatch(fetchUsers({
      page: currentPage,
      page_size: pageSize,
      search: searchTerm || undefined,
    }))
  }, [dispatch, currentPage, searchTerm])

  const handleBlock = async (userId) => {
    await dispatch(blockUser(userId))
    toast.success('Пользователь заблокирован')
    setBlockConfirm(null)
  }

  const handleUnblock = async (userId) => {
    await dispatch(unblockUser(userId))
    toast.success('Пользователь разблокирован')
    setUnblockConfirm(null)
  }

  const columns = [
    { header: 'ID', accessor: 'id', className: 'w-16' },
    { header: 'Email', accessor: 'email' },
    { header: 'Имя', accessor: 'first_name' },
    { header: 'Фамилия', accessor: 'last_name' },
    { header: 'Телефон', accessor: 'phone' },
    {
      header: 'Роль',
      accessor: 'role',
      render: (value) => (
        <Badge variant={value === 'admin' ? 'primary' : 'default'}>
          {value === 'admin' ? 'Админ' : 'Клиент'}
        </Badge>
      ),
    },
    {
      header: 'Статус',
      accessor: 'is_active',
      render: (value) => (
        <Badge variant={value ? 'success' : 'danger'}>
          {value ? 'Активен' : 'Заблокирован'}
        </Badge>
      ),
    },
    { header: 'Дата регистрации', accessor: 'date_joined', render: (v) => formatDate(v) },
    {
      header: 'Действия',
      accessor: 'id',
      render: (_, row) => (
        <div className="flex gap-2">
          {row.is_active ? (
            <button
              onClick={() => setBlockConfirm(row.id)}
              className="text-[#c27765] hover:text-red-700 transition-colors"
              title="Заблокировать"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </button>
          ) : (
            <button
              onClick={() => setUnblockConfirm(row.id)}
              className="text-[#5bb8a8] hover:text-[#84d2c5] transition-colors"
              title="Разблокировать"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" />
              </svg>
            </button>
          )}
        </div>
      ),
    },
  ]

  const totalPages = Math.ceil(total / pageSize)

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">Управление пользователями</h1>
        <div className="w-64">
          <input
            type="text"
            placeholder="Поиск по email или имени..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="form-input"
          />
        </div>
      </div>

      <Table
        columns={columns}
        data={users}
        loading={loading}
        emptyMessage="Пользователи не найдены"
      />

      {totalPages > 1 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
        />
      )}

      <ConfirmDialog
        isOpen={!!blockConfirm}
        onClose={() => setBlockConfirm(null)}
        onConfirm={() => handleBlock(blockConfirm)}
        title="Блокировка пользователя"
        message="Вы уверены, что хотите заблокировать этого пользователя? Он не сможет входить в систему и создавать бронирования."
        confirmText="Заблокировать"
        variant="danger"
      />

      <ConfirmDialog
        isOpen={!!unblockConfirm}
        onClose={() => setUnblockConfirm(null)}
        onConfirm={() => handleUnblock(unblockConfirm)}
        title="Разблокировка пользователя"
        message="Вы уверены, что хотите разблокировать этого пользователя?"
        confirmText="Разблокировать"
        variant="success"
      />
    </div>
  )
}

export default Users
