import * as Yup from 'yup'

export const loginSchema = Yup.object({
  email: Yup.string()
    .email('Неверный формат email')
    .required('Email обязателен'),
  password: Yup.string()
    .min(6, 'Пароль должен содержать минимум 6 символов')
    .required('Пароль обязателен'),
})

export const registerSchema = Yup.object({
  email: Yup.string()
    .email('Неверный формат email')
    .required('Email обязателен'),
  password: Yup.string()
    .min(6, 'Пароль должен содержать минимум 6 символов')
    .required('Пароль обязателен'),
  confirmPassword: Yup.string()
    .oneOf([Yup.ref('password'), null], 'Пароли не совпадают')
    .required('Подтверждение пароля обязательно'),
  first_name: Yup.string()
    .min(2, 'Имя должно содержать минимум 2 символа')
    .max(50, 'Имя слишком длинное'),
  last_name: Yup.string()
    .min(2, 'Фамилия должна содержать минимум 2 символа')
    .max(50, 'Фамилия слишком длинная'),
  phone: Yup.string()
    .matches(/^[\d\s\-+()]+$/, 'Неверный формат телефона')
    .min(10, 'Телефон должен содержать минимум 10 символов'),
})

export const bookingSchema = Yup.object({
  place_id: Yup.number().required('Выберите место'),
  tariff_id: Yup.number().required('Выберите тариф'),
  start_time: Yup.date().required('Выберите дату и время начала').min(new Date(), 'Время начала не может быть в прошлом'),
  end_time: Yup.date()
    .required('Выберите дату и время окончания')
    .min(Yup.ref('start_time'), 'Время окончания должно быть позже времени начала'),
})

export const spaceSchema = Yup.object({
  name: Yup.string().required('Название обязательно').min(2, 'Минимум 2 символа'),
  address: Yup.string().required('Адрес обязателен'),
  description: Yup.string(),
  total_places: Yup.number().min(1, 'Минимум 1 место').required('Количество мест обязательно'),
})

export const tariffSchema = Yup.object({
  name: Yup.string().required('Название обязательно'),
  type: Yup.string().required('Тип тарифа обязателен'),
  price: Yup.number().min(0, 'Цена не может быть отрицательной').required('Цена обязательна'),
  description: Yup.string(),
})
export const placeSchema = Yup.object({
  name: Yup.string().required('Название обязательно'),
  place_type: Yup.string().required('Тип места обязателен'),
  capacity: Yup.number().min(1, 'Вместимость должна быть не менее 1').required('Вместимость обязательна'),
  x: Yup.number().nullable(),
  y: Yup.number().nullable(),
  is_active: Yup.boolean(),
  base_tariff_id: Yup.number().nullable(), // добавлено
  characteristics: Yup.object({
    has_power: Yup.boolean(),
    has_projector: Yup.boolean(),
    has_wifi: Yup.boolean(),
    has_whiteboard: Yup.boolean(),
    has_air_conditioning: Yup.boolean(),
  }),
});
