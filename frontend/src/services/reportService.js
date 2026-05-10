import api from './api';

export const reportService = {
  // Создание отчета
  createReport: (data) => api.post('/reports/create_report/', data),
  
  // Получение списка отчетов
  getReports: (params) => api.get('/reports/', { params }),
  
  // Получение статуса отчета
  getReportStatus: (id) => api.get(`/reports/${id}/`),
  
  // Скачивание отчета
  downloadReport: (id) => api.get(`/reports/${id}/download/`, { responseType: 'blob' }),
  
  // Получение доступных типов отчетов
  getReportTypes: () => api.get('/reports/types/'),
  
  // Удаление отчета
  deleteReport: (id) => api.delete(`/reports/${id}/`),
};

export default reportService;
