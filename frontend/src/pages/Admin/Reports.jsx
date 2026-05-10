import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchReports, createReport, downloadReport, deleteReport } from '../../store/slices/reportSlice';
import { Button, Card, Loader, Table, Badge, ConfirmDialog } from '../../components/common';
import { ReportExport } from '../../components/admin';
import { formatDateTime } from '../../utils/dateUtils';
import { toast } from 'react-hot-toast';

const Reports = () => {
  const dispatch = useDispatch();
  const { reports, loading, total } = useSelector((state) => state.reports);
  const [exportModalOpen, setExportModalOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    dispatch(fetchReports({ page: currentPage, page_size: 20 }));
  }, [dispatch, currentPage]);
  
  
  const handleCreateReport = async (data) => {
    await dispatch(createReport(data));
    dispatch(fetchReports({ page: currentPage, page_size: 20 }));
  };

  
  const handleDownloadReport = async (report) => {
    if (report.status !== 'completed') {
      toast.error('Отчет еще не готов');
      return;
    }
    const result = await dispatch(downloadReport(report.id));
    if (downloadReport.fulfilled.match(result)) {
      // Создаем ссылку для скачивания
      const url = window.URL.createObjectURL(new Blob([result.payload]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `report_${report.id}.${report.format}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    }
  };

  const handleDeleteReport = async (id) => {
    await dispatch(deleteReport(id));
    toast.success('Отчет удален');
    setDeleteConfirm(null);
  };

  const getStatusBadge = (status) => {
    const variants = {
      pending: { variant: 'warning', text: 'В очереди' },
      processing: { variant: 'info', text: 'Генерация' },
      completed: { variant: 'success', text: 'Готов' },
      failed: { variant: 'danger', text: 'Ошибка' },
    };
    const config = variants[status] || { variant: 'default', text: status };
    return <Badge variant={config.variant}>{config.text}</Badge>;
  };

  const columns = [
    { header: 'ID', accessor: 'id', className: 'w-16' },
    { header: 'Тип', accessor: 'type_display' },
    { header: 'Формат', accessor: 'format_display' },
    { header: 'Период', accessor: (row) => {
      const params = row.parameters;
      if (params?.start_date && params?.end_date) {
        return `${params.start_date} — ${params.end_date}`;
      }
      return '-';
    }},
    { header: 'Статус', accessor: 'status', render: (value) => getStatusBadge(value) },
    { header: 'Создан', accessor: 'created_at', render: (v) => formatDateTime(v) },
    {
      header: 'Действия',
      accessor: 'id',
      render: (_, row) => (
        <div className="flex gap-2">
          {row.status === 'completed' && (
            <button
              onClick={() => handleDownloadReport(row)}
              className="text-[#5bb8a8] hover:text-[#84d2c5] transition-colors"
              title="Скачать"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
            </button>
          )}
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
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">Отчёты и аналитика</h1>
        <Button onClick={() => setExportModalOpen(true)}>
          + Создать отчет
        </Button>
      </div>

      <Card>
        <Table
          columns={columns}
          data={reports}
          loading={loading}
          emptyMessage="Нет созданных отчетов"
        />
      </Card>

      <ReportExport
        isOpen={exportModalOpen}
        onClose={() => setExportModalOpen(false)}
        onExport={handleCreateReport}
        reportTypes={[
          { value: 'occupancy', label: 'Загрузка помещений' },
          { value: 'revenue', label: 'Доходы' },
          { value: 'clients', label: 'Клиенты' },
          { value: 'bookings', label: 'Бронирования' },
        ]}
      />

      <ConfirmDialog
        isOpen={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        onConfirm={() => handleDeleteReport(deleteConfirm)}
        title="Удаление отчета"
        message="Вы уверены, что хотите удалить этот отчет?"
        confirmText="Удалить"
        variant="danger"
      />
    </div>
  );
};

export default Reports;
