import React, { useState, useRef, useEffect } from 'react';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import Draggable from 'react-draggable';
import { Input, Select, Textarea, Button } from '../common';

const placeSchema = Yup.object({
  name: Yup.string().required('Название обязательно'),
  place_type: Yup.string().required('Тип места обязателен'),
  capacity: Yup.number().min(1, 'Вместимость должна быть не менее 1').required('Вместимость обязательна'),
  x: Yup.number().nullable(),
  y: Yup.number().nullable(),
  is_active: Yup.boolean(),
  base_tariff_id: Yup.number().nullable(),
  characteristics: Yup.object({
    has_power: Yup.boolean(),
    has_projector: Yup.boolean(),
    has_wifi: Yup.boolean(),
    has_whiteboard: Yup.boolean(),
    has_air_conditioning: Yup.boolean(),
  }),
});

const PlaceForm = ({ initialData, spaceId, space, tariffs, onSubmit, onCancel }) => {
  // Характеристики
  const [characteristics, setCharacteristics] = useState({
    has_power: initialData?.characteristics?.has_power || false,
    has_projector: initialData?.characteristics?.has_projector || false,
    has_wifi: initialData?.characteristics?.has_wifi || false,
    has_whiteboard: initialData?.characteristics?.has_whiteboard || false,
    has_air_conditioning: initialData?.characteristics?.has_air_conditioning || false,
  });

  // Превью
  const [previewImage, setPreviewImage] = useState(initialData?.preview_image || null);
  const [previewFile, setPreviewFile] = useState(null);

  // ────────────────────────────────────────────
  // Галерея: объединяем photos (старая модель) и gallery_images (новый JSON)
  const photosFromModel = (initialData?.photos || []).map(p => p.image_url).filter(Boolean);
  const galleryFromJson = initialData?.gallery_images || [];
  const existingGallery = [...photosFromModel, ...galleryFromJson];      // все существующие URL
  const existingCount = existingGallery.length;                         // запомним для различения

  const [galleryFiles, setGalleryFiles] = useState([]);                 // только новые файлы
  const [galleryPreviews, setGalleryPreviews] = useState(existingGallery); // отображаемый массив URL
  // ────────────────────────────────────────────

  // Естественные размеры изображения плана
  const [imgNaturalSize, setImgNaturalSize] = useState({ w: 800, h: 600 });
  const containerRef = useRef(null);
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    if (space?.map_image) {
      const img = new Image();
      img.onload = () => setImgNaturalSize({ w: img.naturalWidth, h: img.naturalHeight });
      img.src = space.map_image;
    }
  }, [space?.map_image]);

  useEffect(() => {
    if (!containerRef.current) return;
    const updateContainerSize = () => {
      setContainerSize({
        width: containerRef.current.clientWidth,
        height: containerRef.current.clientHeight,
      });
    };
    updateContainerSize();
    window.addEventListener('resize', updateContainerSize);
    return () => window.removeEventListener('resize', updateContainerSize);
  }, []);

  // Пиксельные координаты маркера
  const initialXPercent = Number(initialData?.x) || 0;
  const initialYPercent = Number(initialData?.y) || 0;
  const [markerX, setMarkerX] = useState(0);
  const [markerY, setMarkerY] = useState(0);

  useEffect(() => {
    if (!containerRef.current || imgNaturalSize.w === 0) return;
    const rect = getImageRect();
    setMarkerX(rect.left + (initialXPercent / 100) * rect.width);
    setMarkerY(rect.top + (initialYPercent / 100) * rect.height);
  }, [initialXPercent, initialYPercent, imgNaturalSize, containerSize]);

  const formik = useFormik({
    initialValues: {
      name: initialData?.name || '',
      place_type: initialData?.place_type || 'desk',
      capacity: initialData?.capacity || 1,
      x: initialXPercent,
      y: initialYPercent,
      is_active: initialData?.is_active !== undefined ? initialData.is_active : true,
      base_tariff_id: initialData?.base_tariff || '',
      version: initialData?.version || 0,
    },
    validationSchema: placeSchema,
    onSubmit: (values) => {
      const xPercent = Math.round(Number(values.x) || 0);
      const yPercent = Math.round(Number(values.y) || 0);

      const formData = new FormData();
      formData.append('name', values.name);
      formData.append('place_type', values.place_type);
      formData.append('capacity', values.capacity);
      formData.append('x', xPercent);
      formData.append('y', yPercent);
      formData.append('is_active', values.is_active);
      formData.append('base_tariff_id', values.base_tariff_id || '');
      formData.append('space', spaceId);
      formData.append('version', values.version || 0);
      formData.append(
        'characteristics',
        JSON.stringify({
          has_power: characteristics.has_power,
          has_projector: characteristics.has_projector,
          has_wifi: characteristics.has_wifi,
          has_whiteboard: characteristics.has_whiteboard,
          has_air_conditioning: characteristics.has_air_conditioning,
        })
      );
      if (previewFile) formData.append('preview_image', previewFile);
      galleryFiles.forEach((file) => formData.append('gallery_uploads', file));

      onSubmit(formData);
    },
  });

  const getImageRect = () => {
    if (!containerRef.current) return { left: 0, top: 0, width: 0, height: 0 };
    const cw = containerRef.current.clientWidth;
    const ch = containerRef.current.clientHeight;
    const { w: iw, h: ih } = imgNaturalSize;
    if (iw === 0 || ih === 0) return { left: 0, top: 0, width: cw, height: ch };
    const scale = Math.min(cw / iw, ch / ih);
    const width = iw * scale;
    const height = ih * scale;
    const left = (cw - width) / 2;
    const top = (ch - height) / 2;
    return { left, top, width, height };
  };

  const syncMarkerFromPercent = (xPercent, yPercent) => {
    const rect = getImageRect();
    setMarkerX(rect.left + (xPercent / 100) * rect.width);
    setMarkerY(rect.top + (yPercent / 100) * rect.height);
  };

  useEffect(() => {
    syncMarkerFromPercent(Number(formik.values.x) || 0, Number(formik.values.y) || 0);
  }, [formik.values.x, formik.values.y, containerSize, imgNaturalSize]);

  const handleDrag = (e, data) => {
    const rect = getImageRect();
    const xInImage = data.x - rect.left;
    const yInImage = data.y - rect.top;
    const xPercent = Math.max(0, Math.min(100, Math.round((xInImage / rect.width) * 100)));
    const yPercent = Math.max(0, Math.min(100, Math.round((yInImage / rect.height) * 100)));
    formik.setFieldValue('x', xPercent);
    formik.setFieldValue('y', yPercent);
  };

  const handlePreviewChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setPreviewFile(file);
      const reader = new FileReader();
      reader.onload = () => setPreviewImage(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const handleGalleryChange = (e) => {
    const files = Array.from(e.target.files);
    setGalleryFiles((prev) => [...prev, ...files]);
    files.forEach((file) => {
      const reader = new FileReader();
      reader.onload = () => {
        setGalleryPreviews((prev) => [...prev, reader.result]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeGalleryItem = (index) => {
    // существующие фото не удаляем (индекс < existingCount)
    if (index < existingCount) return;
    const newIndex = index - existingCount;
    setGalleryFiles((prev) => prev.filter((_, i) => i !== newIndex));
    setGalleryPreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const removePreview = () => {
    setPreviewFile(null);
    setPreviewImage(null);
  };

  const placeTypes = [
    { value: 'desk', label: 'Рабочее место' },
    { value: 'meeting_room', label: 'Переговорная' },
  ];

  const tariffOptions = [
    { value: '', label: 'Не выбран' },
    ...(tariffs || []).map((t) => ({
      value: t.id,
      label: `${t.name} (${t.price} ₽)`,
    })),
  ];

  return (
    <form onSubmit={formik.handleSubmit} className="space-y-4">
      <Input label="Название места" name="name" value={formik.values.name} onChange={formik.handleChange} onBlur={formik.handleBlur} error={formik.errors.name} touched={formik.touched.name} required />
      <Select label="Тип места" name="place_type" value={formik.values.place_type} onChange={formik.handleChange} options={placeTypes} required />
      <Input label="Вместимость" type="number" name="capacity" value={formik.values.capacity} onChange={formik.handleChange} onBlur={formik.handleBlur} error={formik.errors.capacity} touched={formik.touched.capacity} />
      <Select label="Базовый тариф" name="base_tariff_id" value={formik.values.base_tariff_id} onChange={formik.handleChange} options={tariffOptions} />

      {/* Характеристики */}
      <div className="border border-[#84d2c5] rounded-lg p-4 bg-[#84d2c5] bg-opacity-5">
        <label className="form-label mb-2 block">Характеристики</label>
        <div className="grid grid-cols-2 gap-3">
          {Object.entries({
            has_power: 'Розетки',
            has_projector: 'Проектор',
            has_wifi: 'Wi-Fi',
            has_whiteboard: 'Маркерная доска',
            has_air_conditioning: 'Кондиционер',
          }).map(([key, label]) => (
            <label key={key} className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={characteristics[key]} onChange={(e) => setCharacteristics({ ...characteristics, [key]: e.target.checked })} className="w-4 h-4 text-[#84d2c5]" />
              <span className="text-sm text-gray-700">{label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Превью */}
      <div>
        <label className="form-label">Превью (150×150)</label>
        <input type="file" accept="image/*" onChange={handlePreviewChange} />
        {previewImage && (
          <div className="mt-2 inline-block relative">
            <img src={previewImage} alt="Превью" className="h-20 rounded border" />
            <button type="button" onClick={removePreview} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs">×</button>
          </div>
        )}
      </div>

      {/* Галерея (объединённая) */}
      <div>
        <label className="form-label">Галерея (несколько фото)</label>
        {(galleryPreviews.length > 0) && (
          <div className="flex flex-wrap gap-2 mt-2 mb-2">
            {galleryPreviews.map((preview, idx) => (
              <div key={idx} className="relative">
                <img src={preview} className="h-16 rounded border" alt={`Фото ${idx + 1}`} />
                {/* Кнопка удаления только для новых файлов (индекс >= existingCount) */}
                {idx >= existingCount && (
                  <button
                    type="button"
                    onClick={() => removeGalleryItem(idx)}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs"
                  >
                    ×
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
        <input type="file" accept="image/*" multiple onChange={handleGalleryChange} />
      </div>

      {/* Карта с перетаскиванием */}
      {space?.map_image && (
        <div className="border rounded-lg p-4 bg-[#ffffe8]">
          <label className="form-label mb-2">Позиция на плане</label>
          <div
            ref={containerRef}
            className="relative w-full h-[500px] bg-gray-100 border rounded overflow-hidden"
            style={{
              backgroundImage: `url(${space.map_image})`,
              backgroundSize: 'contain',
              backgroundRepeat: 'no-repeat',
              backgroundPosition: 'center',
            }}
          >
            {containerSize.width > 0 && imgNaturalSize.w > 0 && (
              <Draggable
                bounds={{
                  left: getImageRect().left,
                  right: getImageRect().left + getImageRect().width - 80,
                  top: getImageRect().top,
                  bottom: getImageRect().top + getImageRect().height - 80,
                }}
                position={{ x: markerX, y: markerY }}
                onDrag={(e, data) => {
                  const rect = getImageRect();
                  const xInImage = data.x - rect.left;
                  const yInImage = data.y - rect.top;
                  const xPercent = Math.max(0, Math.min(100, Math.round((xInImage / rect.width) * 100)));
                  const yPercent = Math.max(0, Math.min(100, Math.round((yInImage / rect.height) * 100)));
                  formik.setFieldValue('x', xPercent);
                  formik.setFieldValue('y', yPercent);
                }}
              >
                <div className="absolute cursor-grab active:cursor-grabbing bg-[#84d2c5] border-2 border-[#5bb8a8] rounded-lg w-20 h-20 flex items-center justify-center text-xs font-bold text-gray-800 shadow-lg z-50 select-none">
                  {formik.values.name || 'Место'}
                </div>
              </Draggable>
            )}
          </div>
          <div className="flex gap-4 mt-2 text-sm text-gray-600 items-center">
            <span>X: {formik.values.x}%</span>
            <span>Y: {formik.values.y}%</span>
            <button type="button" onClick={() => { formik.setFieldValue('x', 0); formik.setFieldValue('y', 0); }} className="text-[#5bb8a8] hover:underline ml-auto">Сбросить позицию</button>
          </div>
          <div className="grid grid-cols-2 gap-4 mt-2">
            <Input label="X (%)" name="x" type="number" value={formik.values.x} onChange={formik.handleChange} onBlur={formik.handleBlur} error={formik.errors.x} touched={formik.touched.x} />
            <Input label="Y (%)" name="y" type="number" value={formik.values.y} onChange={formik.handleChange} onBlur={formik.handleBlur} error={formik.errors.y} touched={formik.touched.y} />
          </div>
        </div>
      )}

      <div className="flex items-center gap-2">
        <input type="checkbox" name="is_active" checked={formik.values.is_active} onChange={formik.handleChange} className="w-4 h-4" />
        <label className="text-sm text-gray-700">Активно</label>
      </div>

      <div className="flex gap-3 pt-4">
        <Button type="submit">Сохранить</Button>
        <Button type="button" variant="secondary" onClick={onCancel}>Отмена</Button>
      </div>
    </form>
  );
};

export default PlaceForm;