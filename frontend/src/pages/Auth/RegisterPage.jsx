import React, { useState } from 'react';
import { useFormik } from 'formik';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useNavigate, Navigate } from 'react-router-dom';
import { register, login } from '../../store/slices/authSlice';
import { registerSchema } from '../../utils/validators';
import { Input, Button } from '../../components/common';
import { toast } from 'react-hot-toast';

const RegisterPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user, loading } = useSelector((state) => state.auth);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const formik = useFormik({
    initialValues: {
      email: '',
      password: '',
      confirmPassword: '',
      first_name: '',
      last_name: '',
      phone: '',
    },
    validationSchema: registerSchema,
    onSubmit: async (values) => {
      try {
        const { confirmPassword, ...userData } = values;
        const submitData = { ...userData, password_confirm: confirmPassword };

        // 1. Регистрируем пользователя
        await dispatch(register(submitData)).unwrap();

        // 2. Сразу выполняем вход
        await dispatch(login({ email: values.email, password: values.password })).unwrap();

        toast.success('Регистрация успешна! Добро пожаловать!');
        // Редирект произойдёт автоматически благодаря проверке if (user) ниже
      } catch (error) {
        const errorMsg = typeof error === 'object'
          ? Object.values(error).flat().join(', ')
          : error || 'Ошибка регистрации';
        toast.error(errorMsg);
      }
    },
  });

  // Автоматический редирект после авторизации
  if (user) {
    const pendingBooking = localStorage.getItem('pending_booking');
    if (pendingBooking) {
      const booking = JSON.parse(pendingBooking);
      localStorage.removeItem('pending_booking');
      sessionStorage.removeItem('redirect_after_login');
      return <Navigate to={`/booking/${booking.placeId}`} state={{ startTime: booking.startTime, endTime: booking.endTime }} />;
    }
    return <Navigate to="/" />;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#ffffe8] to-[#e4c988] py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="flex justify-center">
            <div className="w-16 h-16 bg-[#84d2c5] rounded-full flex items-center justify-center">
              <svg className="w-10 h-10 text-gray-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
              </svg>
            </div>
          </div>
          <h2 className="mt-6 text-3xl font-extrabold text-gray-800">
            Регистрация
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Создайте новый аккаунт
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={formik.handleSubmit}>
          <div className="rounded-md shadow-sm space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Имя"
                type="text"
                name="first_name"
                placeholder="Иван"
                value={formik.values.first_name}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={formik.errors.first_name}
                touched={formik.touched.first_name}
              />
              <Input
                label="Фамилия"
                type="text"
                name="last_name"
                placeholder="Иванов"
                value={formik.values.last_name}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={formik.errors.last_name}
                touched={formik.touched.last_name}
              />
            </div>

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

            <Input
              label="Телефон"
              type="tel"
              name="phone"
              placeholder="+7 (999) 123-45-67"
              value={formik.values.phone}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={formik.errors.phone}
              touched={formik.touched.phone}
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
                autoComplete="new-password"
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

            <div className="relative">
              <Input
                label="Подтверждение пароля"
                type={showConfirmPassword ? 'text' : 'password'}
                name="confirmPassword"
                placeholder="••••••••"
                value={formik.values.confirmPassword}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={formik.errors.confirmPassword}
                touched={formik.touched.confirmPassword}
                required
                autoComplete="new-password"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-9 text-gray-500 hover:text-[#5bb8a8]"
              >
                {showConfirmPassword ? (
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

          <div className="text-sm text-gray-600 bg-[#ffffe8] p-3 rounded-lg border border-[#84d2c5] border-opacity-30">
            <p className="font-medium mb-1">Регистрируясь, вы соглашаетесь с:</p>
            <ul className="text-xs space-y-1">
              <li>• Политикой обработки персональных данных</li>
              <li>• Пользовательским соглашением</li>
              <li>• Правилами использования коворкинга</li>
            </ul>
          </div>

          <Button
            type="submit"
            variant="primary"
            fullWidth
            loading={loading}
            disabled={loading}
          >
            {loading ? 'Регистрация...' : 'Зарегистрироваться'}
          </Button>

          <div className="text-center text-sm">
            <span className="text-gray-600">Уже есть аккаунт?</span>{' '}
            <Link to="/login" className="font-medium text-[#5bb8a8] hover:text-[#84d2c5]">
              Войдите
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RegisterPage;