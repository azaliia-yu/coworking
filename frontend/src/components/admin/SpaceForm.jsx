import React, { useState } from 'react';
import { useFormik } from 'formik';
import { spaceSchema } from '../../utils/validators';
import { Input, Textarea, Button } from '../common';

const SpaceForm = ({ initialData, onSubmit, onCancel }) => {
  const [mapImageFile, setMapImageFile] = useState(null);
  const [mapImagePreview, setMapImagePreview] = useState(
    initialData?.map_image || null
  );

  const formik = useFormik({
    initialValues: {
      name: initialData?.name || '',
      address: initialData?.address || '',
      description: initialData?.description || '',
      total_places: initialData?.total_places || 0,
      is_active: initialData?.is_active !== undefined ? initialData.is_active : true,
      version: initialData?.version || 0,
    },
    validationSchema: spaceSchema,
    onSubmit: (values) => {
      // Собираем FormData
      const formData = new FormData();
      formData.append('name', values.name);
      formData.append('address', values.address);
      formData.append('description', values.description);
      formData.append('total_places', values.total_places);
      formData.append('is_active', values.is_active);
      formData.append('version', values.version);
      if (mapImageFile) {
        formData.append('map_image', mapImageFile);
      }
      // Передаём FormData в родительский обработчик
      onSubmit(formData);
    },
  });

  const handleMapImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setMapImageFile(file);
      const reader = new FileReader();
      reader.onload = () => setMapImagePreview(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveMapImage = () => {
    setMapImageFile(null);
    setMapImagePreview(null);
  };

  return (
    <form onSubmit={formik.handleSubmit} className="space-y-4">
      <Input
        label="Название помещения"
        name="name"
        value={formik.values.name}
        onChange={formik.handleChange}
        onBlur={formik.handleBlur}
        error={formik.errors.name}
        touched={formik.touched.name}
        required
      />
      <Input
        label="Адрес"
        name="address"
        value={formik.values.address}
        onChange={formik.handleChange}
        onBlur={formik.handleBlur}
        error={formik.errors.address}
        touched={formik.touched.address}
        required
      />
      <Textarea
        label="Описание"
        name="description"
        value={formik.values.description}
        onChange={formik.handleChange}
        onBlur={formik.handleBlur}
        rows={3}
      />
      <Input
        label="Количество мест"
        type="number"
        name="total_places"
        value={formik.values.total_places}
        onChange={formik.handleChange}
        onBlur={formik.handleBlur}
        error={formik.errors.total_places}
        touched={formik.touched.total_places}
      />

      {/* План помещения */}
      <div>
        <label className="form-label">План помещения (изображение)</label>
        <input
          type="file"
          accept="image/*"
          onChange={handleMapImageChange}
        />
        {mapImagePreview && (
          <div className="mt-2 relative inline-block">
            <img
              src={mapImagePreview}
              alt="Превью плана"
              className="max-h-40 rounded border"
            />
            <button
              type="button"
              onClick={handleRemoveMapImage}
              className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs"
            >
              ×
            </button>
          </div>
        )}
      </div>

      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          name="is_active"
          checked={formik.values.is_active}
          onChange={formik.handleChange}
          className="w-4 h-4"
        />
        <label className="text-sm text-gray-700">Активно</label>
      </div>

      <div className="flex gap-3 pt-4">
        <Button type="submit">Сохранить</Button>
        <Button type="button" variant="secondary" onClick={onCancel}>
          Отмена
        </Button>
      </div>
    </form>
  );
};

export default SpaceForm;