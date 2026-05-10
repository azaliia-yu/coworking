import React, { useState } from 'react';
import { Button, Modal, Select } from '../common';
import { toast } from 'react-hot-toast';

const ReportExport = ({ isOpen, onClose, onExport, reportTypes }) => {
  const [selectedType, setSelectedType] = useState('');
  const [format, setFormat] = useState('json');
  const [dateRange, setDateRange] = useState({
    start: new Date(new Date().setDate(1)).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0],
  });
  const [loading, setLoading] = useState(false);

  const handleExport = async () => {
    if (!selectedType) {
      toast.error('Выберите тип отчета');
      return;
    }

    setLoading(true);
    try {
      await onExport({
        type: selectedType,
        format,
        start_date: dateRange.start,
        end_date: dateRange.end,
      });
      toast.success('Отчет создан и поставлен в очередь');
      onClose();
    } catch (error) {
      toast.error('Ошибка при создании отчета');
    } finally {
      setLoading(false);
    }
  };

  const formatOptions = [
    { value: 'json', label: 'JSON' },
    { value: 'csv', label: 'CSV' },
  ];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Экспорт отчета"
      size="md"
      footer={
        <div className="flex justify-end gap-3">
          <Button variant="secondary" onClick={onClose}>
            Отмена
          </Button>
          <Button onClick={handleExport} loading={loading}>
            Экспортировать
          </Button>
        </div>
      }
    >
      <div className="space-y-4">
        <Select
          label="Тип отчета"
          value={selectedType}
          onChange={(e) => setSelectedType(e.target.value)}
          options={reportTypes}
          placeholder="Выберите тип отчета"
          required
        />

        <Select
          label="Формат"
          value={format}
          onChange={(e) => setFormat(e.target.value)}
          options={formatOptions}
          required
        />

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="form-label">Дата начала</label>
            <input
              type="date"
              value={dateRange.start}
              onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
              className="form-input"
            />
          </div>
          <div>
            <label className="form-label">Дата окончания</label>
            <input
              type="date"
              value={dateRange.end}
              onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
              className="form-input"
            />
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default ReportExport;
