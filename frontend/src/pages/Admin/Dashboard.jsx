import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { 
  LineChart, Line, BarChart, Bar, 
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from 'recharts';
import { Loader, Card } from '../../components/common';
import api from '../../services/api';

const AdminDashboard = () => {
  const dispatch = useDispatch();
  const { spaces } = useSelector((state) => state.spaces);
  
  const [stats, setStats] = useState(null);
  const [revenueStats, setRevenueStats] = useState(null);
  const [occupancyChart, setOccupancyChart] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSpace, setSelectedSpace] = useState('all');
  const [dateRange, setDateRange] = useState({
    start: new Date(new Date().setDate(1)).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0],
  });

  useEffect(() => {
    fetchDashboardData();
    fetchRevenueData();
    fetchOccupancyChart();
  }, [selectedSpace, dateRange]);

  const fetchDashboardData = async () => {
    try {
      const response = await api.get('/dashboard/stats/');
      setStats(response.data);
    } catch (error) {
      console.error('Failed to fetch dashboard stats', error);
    }
  };

  const fetchRevenueData = async () => {
    try {
      const response = await api.get('/dashboard/revenue/');
      setRevenueStats(response.data);
    } catch (error) {
      console.error('Failed to fetch revenue stats', error);
    }
  };

  const fetchOccupancyChart = async () => {
    try {
      const response = await api.get('/dashboard/occupancy-chart/');
      setOccupancyChart(response.data.chart_data);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value) => `${value?.toLocaleString() || 0} ₽`;

  const statCards = [
    {
      title: 'Помещений',
      value: stats?.total_spaces || 0,
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
        </svg>
      ),
      color: 'bg-[#84d2c5]',
    },
    {
      title: 'Всего мест',
      value: stats?.total_places || 0,
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
        </svg>
      ),
      color: 'bg-[#5bb8a8]',
    },
    {
      title: 'Бронирований сегодня',
      value: stats?.total_bookings_today || 0,
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      ),
      color: 'bg-[#b05b7b]',
    },
    {
      title: 'Выручка сегодня',
      value: formatCurrency(stats?.total_revenue_today),
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      color: 'bg-[#c27765]',
    },
  ];

  const revenueCards = [
    {
      title: 'Выручка за неделю',
      value: formatCurrency(revenueStats?.week_revenue),
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      ),
      color: 'bg-[#84d2c5]',
    },
    {
      title: 'Выручка за месяц',
      value: formatCurrency(revenueStats?.month_revenue),
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
        </svg>
      ),
      color: 'bg-[#e4c988]',
    },
    {
      title: 'Средний чек',
      value: formatCurrency(revenueStats?.avg_check),
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
        </svg>
      ),
      color: 'bg-[#5bb8a8]',
    },
  ];

  if (loading && !stats) {
    return <Loader fullScreen />;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">Дашборд</h1>
        <div className="flex gap-3">
          <select
            value={selectedSpace}
            onChange={(e) => setSelectedSpace(e.target.value)}
            className="form-input w-48"
          >
            <option value="all">Все помещения</option>
            {spaces.map((space) => (
              <option key={space.id} value={space.id}>{space.name}</option>
            ))}
          </select>
          <input
            type="date"
            value={dateRange.start}
            onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
            className="form-input w-36"
          />
          <input
            type="date"
            value={dateRange.end}
            onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
            className="form-input w-36"
          />
        </div>
      </div>

      {/* Основная статистика */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat, index) => (
          <Card key={index} className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">{stat.title}</p>
                <p className="text-2xl font-bold mt-1 text-gray-800">{stat.value}</p>
              </div>
              <div className={`w-12 h-12 ${stat.color} rounded-full flex items-center justify-center text-white`}>
                {stat.icon}
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Выручка */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {revenueCards.map((card, index) => (
          <Card key={index} className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">{card.title}</p>
                <p className="text-2xl font-bold mt-1 text-gray-800">{card.value}</p>
              </div>
              <div className={`w-12 h-12 ${card.color} rounded-full flex items-center justify-center text-white`}>
                {card.icon}
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* График выручки */}
      {revenueStats?.chart_data && (
        <Card>
          <h2 className="text-lg font-semibold mb-4 text-gray-800">Динамика выручки (последние 7 дней)</h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={revenueStats.chart_data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis tickFormatter={(v) => `${v / 1000}K`} />
              <Tooltip formatter={(v) => `${v?.toLocaleString()} ₽`} />
              <Legend />
              <Line type="monotone" dataKey="revenue" stroke="#84d2c5" name="Выручка (₽)" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </Card>
      )}

      {/* График загрузки */}
      {occupancyChart.length > 0 && (
        <Card>
          <h2 className="text-lg font-semibold mb-4 text-gray-800">Загрузка помещений (последние 7 дней)</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={occupancyChart}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip formatter={(v) => `${v}%`} />
              <Legend />
              <Bar dataKey="occupancy" fill="#5bb8a8" name="Загрузка (%)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      )}

      {/* Последние бронирования */}
      {stats?.recent_bookings && stats.recent_bookings.length > 0 && (
        <Card>
          <h2 className="text-lg font-semibold mb-4 text-gray-800">Последние бронирования</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-[#ffffe8]">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Клиент</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Место</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Время</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Статус</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Сумма</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {stats.recent_bookings.map((booking) => (
                  <tr key={booking.id} className="hover:bg-[#ffffe8]">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">
                      {booking.user_name || booking.user_email}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">
                      {booking.place_name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(booking.start_time).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                        ${booking.status === 'confirmed' ? 'bg-[#DCFCE7] text-[#166534]' : 
                          booking.status === 'pending' ? 'bg-[#FEF9C3] text-[#854D0E]' : 
                          'bg-[#F3F4F6] text-[#1F2937]'}`}>
                        {booking.status === 'confirmed' ? 'Подтверждено' : 
                         booking.status === 'pending' ? 'Ожидает' : 'Отменено'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">
                      {booking.total_cost} ₽
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
};

export default AdminDashboard;
