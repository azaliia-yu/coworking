import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useEffect, Suspense, lazy } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { fetchProfile } from './store/slices/authSlice'
import PrivateRoute from './components/common/PrivateRoute'
import Loader from './components/common/Loader'
import MainLayout from './components/layout/MainLayout'
import AdminLayout from './components/layout/AdminLayout'
import NotificationsPage from './pages/Client/NotificationsPage'

// Ленивая загрузка страниц для оптимизации
const LoginPage = lazy(() => import('./pages/Auth/LoginPage'))
const RegisterPage = lazy(() => import('./pages/Auth/RegisterPage'))
const ClientDashboard = lazy(() => import('./pages/Client/Dashboard'))
const BookingPage = lazy(() => import('./pages/Client/BookingPage'))
const ProfilePage = lazy(() => import('./pages/Client/ProfilePage'))
const AdminDashboard = lazy(() => import('./pages/Admin/Dashboard'))
const AdminSpaces = lazy(() => import('./pages/Admin/Spaces'))
const AdminTariffs = lazy(() => import('./pages/Admin/Tariffs'))
const AdminUsers = lazy(() => import('./pages/Admin/Users'))
const AdminReports = lazy(() => import('./pages/Admin/Reports'))
const AdminSettings = lazy(() => import('./pages/Admin/Settings'))
const AccessEmulatorPage = lazy(() => import('./pages/Admin/AccessEmulatorPage')) 
const NotFoundPage = lazy(() => import('./pages/NotFound/NotFoundPage'))
const AdminAccessCardsPage = lazy(() => import('./pages/Admin/AdminAccessCardsPage'));

function App() {
  const dispatch = useDispatch()
  const { user, loading } = useSelector((state) => state.auth)

  useEffect(() => {
    // При загрузке приложения проверяем наличие токена и получаем профиль
    const token = localStorage.getItem('access')
    if (token && !user) {
      dispatch(fetchProfile())
    }
  }, [dispatch, user])

  if (loading) {
    return <Loader fullScreen />
  }

  return (
    <BrowserRouter>
      <Suspense fallback={<Loader fullScreen />}>
        <Routes>
          {/* Публичные маршруты (без MainLayout) */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          {/* Основной лейаут с публичной главной и защищёнными страницами */}
          <Route path="/" element={<MainLayout />}>
            <Route index element={<ClientDashboard />} />

            {/* Защищённые клиентские маршруты */}
            <Route
              path="booking/:placeId?"
              element={
                <PrivateRoute>
                  <BookingPage />
                </PrivateRoute>
              }
            />
            <Route
              path="profile"
              element={
                <PrivateRoute>
                  <ProfilePage />
                </PrivateRoute>
              }
            />
            <Route
              path="notifications"
              element={
                <PrivateRoute>
                  <NotificationsPage />
                </PrivateRoute>
              }
            />
            <Route
              path="bookings"
              element={
                <PrivateRoute>
                  <Navigate to="/profile" state={{ activeTab: 'bookings' }} replace />
                </PrivateRoute>
              }
            />
          </Route>

          {/* Защищённые маршруты для администраторов */}
          <Route
            path="/admin"
            element={
              <PrivateRoute allowedRoles={['admin']}>
                <AdminLayout />
              </PrivateRoute>
            }
          >
            <Route index element={<AdminDashboard />} />
            <Route path="spaces" element={<AdminSpaces />} />
            <Route path="tariffs" element={<AdminTariffs />} />
            <Route path="users" element={<AdminUsers />} />
            <Route path="reports" element={<AdminReports />} />
            <Route path="settings" element={<AdminSettings />} />
            <Route path="access-emulator" element={<AccessEmulatorPage />} /> 
            <Route path="access-cards" element={<AdminAccessCardsPage />} />
          </Route>

          {/* 404 */}
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  )
}

export default App