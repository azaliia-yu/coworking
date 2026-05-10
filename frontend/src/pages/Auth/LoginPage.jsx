import React, { useState } from 'react';
import { useFormik } from 'formik';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useNavigate, Navigate } from 'react-router-dom';
import { login } from '../../store/slices/authSlice';
import { loginSchema } from '../../utils/validators';
import { Input, Button } from '../../components/common';
import { toast } from 'react-hot-toast';

const LoginPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
const { user, loading } = useSelector((state) => state.auth);  const [showPassword, setShowPassword] = useState(false);

  const formik = useFormik({
    initialValues: {
      email: '',
      password: '',
    },
    validationSchema: loginSchema,
    onSubmit: async (values) => {
      try {
        // Используем unwrap() для получения результата или ошибки
        const result = await dispatch(login(values)).unwrap();
        
        toast.success('Добро пожаловать!');

        // Проверяем прямое бронирование из localStorage
        const pendingBooking = localStorage.getItem('pending_booking');
        const redirectAfterLogin = sessionStorage.getItem('redirect_after_login');

        // Если есть прямое бронирование
        if (pendingBooking) {
          const booking = JSON.parse(pendingBooking);
          localStorage.removeItem('pending_booking');
          sessionStorage.removeItem('redirect_after_login');
          navigate(`/booking/${booking.placeId}`, {
            state: {
              startTime: booking.startTime,
              endTime: booking.endTime
            }
          });
          return;
        }

        // Если есть флаг после регистрации
        if (redirectAfterLogin === 'booking') {
          sessionStorage.removeItem('redirect_after_login');
          navigate('/');
          toast.info('Выберите место для бронирования');
          return;
        }

        // Обычное перенаправление по роли
        if (result?.role === 'admin') {
          navigate('/admin');
        } else {
          navigate('/');
        }
      } catch (error) {
        // unwrap() выбросит ошибку с payload из rejectWithValue
        toast.error(error || 'Ошибка входа. Проверьте email и пароль.');
      }
    },
  });

  if (user) {
    const pendingBooking = localStorage.getItem('pending_booking');
    if (pendingBooking) {
      const booking = JSON.parse(pendingBooking);
      localStorage.removeItem('pending_booking');
      sessionStorage.removeItem('redirect_after_login');
      return <Navigate to={`/booking/${booking.placeId}`} state={{ startTime: booking.startTime, endTime: booking.endTime }} />;
    }
    return <Navigate to={user.role === 'admin' ? '/admin' : '/'} />;
  }


  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#ffffe8] to-[#e4c988] py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Логотип и заголовок */}
        <div className="text-center">
          <div className="flex justify-center">
            <div className="w-16 h-16 bg-[#84d2c5] rounded-full flex items-center justify-center">
              <svg className="w-10 h-10 text-gray-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
          </div>
          <h2 className="mt-6 text-3xl font-extrabold text-gray-800">Коворкинг</h2>
          <p className="mt-2 text-sm text-gray-600">Войдите в свой аккаунт</p>
        </div>

        {/* Форма входа */}
        <form className="mt-8 space-y-6" onSubmit={formik.handleSubmit}>
          <div className="rounded-md shadow-sm space-y-4">
            <Input
              label="Email"
              type="email"
              name="email"
              placeholder="example@mail.com"
              value={formik.values.email}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={formik.errors.email}
              touched={formik.touched.email}
              required
              autoComplete="email"
            />

            <div className="relative">
              <Input
                label="Пароль"
                type={showPassword ? 'text' : 'password'}
                name="password"
                placeholder="••••••••"
                value={formik.values.password}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={formik.errors.password}
                touched={formik.touched.password}
                required
                autoComplete="current-password"
              />

              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-9 text-gray-500 hover:text-[#5bb8a8]"
              >
                {showPassword ? (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <input
                id="remember-me"
                name="remember-me"
                type="checkbox"
                className="h-4 w-4 text-[#84d2c5] focus:ring-[#84d2c5] border-gray-300 rounded"
              />
              <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-800">
                Запомнить меня
              </label>
            </div>
            <div className="text-sm">
              <a href="#" className="font-medium text-[#5bb8a8] hover:text-[#84d2c5]">
                Забыли пароль?
              </a>
            </div>
          </div>

          <Button type="submit" variant="primary" fullWidth loading={loading} disabled={loading}>
            {loading ? 'Вход...' : 'Войти'}
          </Button>

          <div className="text-center text-sm">
            <span className="text-gray-600">Нет аккаунта?</span>{' '}
            <Link to="/register" className="font-medium text-[#5bb8a8] hover:text-[#84d2c5]">
              Зарегистрируйтесь
            </Link>
          </div>
        </form>

        {/* Демо-данные */}
        <div className="mt-6 p-4 bg-[#ffffe8] rounded-lg">
          <p className="text-xs text-gray-500 text-center mb-2">Тестовые данные:</p>
          <div className="text-xs text-gray-400 text-center space-y-1">
            <p>Клиент: client@example.com / client123</p>
            <p>Админ: admin@example.com / admin123</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;