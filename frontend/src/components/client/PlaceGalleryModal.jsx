import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { Button, Badge } from '../common';
import api from '../../services/api';
import { toast } from 'react-hot-toast';

// SVG-заглушки для отсутствующих фото
const MeetingRoomPlaceholder = () => (
  <svg className="w-20 h-20 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1}
      d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
  </svg>
);

const DeskPlaceholder = () => (
  <svg className="w-20 h-20 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1}
      d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
  </svg>
);

const StarRating = ({ rating = 5, onRate }) => {
  const [hover, setHover] = useState(0);
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          className={`text-xl ${star <= (hover || rating) ? 'text-[#e4c988]' : 'text-gray-300'}`}
          onClick={() => onRate && onRate(star)}
          onMouseEnter={() => onRate && setHover(star)}
          onMouseLeave={() => onRate && setHover(0)}
          disabled={!onRate}
        >
          ★
        </button>
      ))}
    </div>
  );
};

const PlaceGalleryModal = ({ place, isOpen, onClose, onBook }) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isMobile, setIsMobile] = useState(false);
  const [reviews, setReviews] = useState([]);
  const [newReviewText, setNewReviewText] = useState('');
  const [newRating, setNewRating] = useState(5);
  const [loadingReviews, setLoadingReviews] = useState(false);
  const [submittingReview, setSubmittingReview] = useState(false);

  const { user } = useSelector((state) => state.auth);
  const isAuthenticated = !!user;

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  useEffect(() => {
    setCurrentImageIndex(0);
  }, [place]);

  // Загрузка отзывов при открытии модального окна
  useEffect(() => {
    if (isOpen && place) {
      setLoadingReviews(true);
      api.get(`/places/${place.id}/reviews/`)
        .then((response) => setReviews(response.data))
        .catch(() => toast.error('Не удалось загрузить отзывы'))
        .finally(() => setLoadingReviews(false));
    }
  }, [isOpen, place]);

  const handleSubmitReview = async () => {
    if (!newReviewText.trim()) {
      toast.error('Введите текст отзыва');
      return;
    }
    setSubmittingReview(true);
    try {
      const response = await api.post(`/places/${place.id}/reviews/`, {
        text: newReviewText,
        rating: newRating,
      });
      setReviews([response.data, ...reviews]);
      setNewReviewText('');
      setNewRating(5);
      toast.success('Отзыв добавлен');
    } catch (error) {
      toast.error(error.response?.data?.error || 'Ошибка при добавлении отзыва');
    } finally {
      setSubmittingReview(false);
    }
  };

  if (!isOpen || !place) return null;

  const galleryImages = place.photos?.map(p => p.image_url).filter(Boolean) || [];
  const previewImage = place.preview_image;
  const allImages = galleryImages.length > 0 ? galleryImages : (previewImage ? [previewImage] : []);

  const DefaultPlaceholder = place.place_type === 'meeting_room' ? MeetingRoomPlaceholder : DeskPlaceholder;
  const currentImage = allImages[currentImageIndex] || null;
  const hasImages = allImages.length > 0;

  const handlePrev = () => {
    if (!hasImages) return;
    setCurrentImageIndex((prev) => (prev === 0 ? allImages.length - 1 : prev - 1));
  };

  const handleNext = () => {
    if (!hasImages) return;
    setCurrentImageIndex((prev) => (prev === allImages.length - 1 ? 0 : prev + 1));
  };

  const getTypeLabel = () => place.place_type === 'meeting_room' ? 'Переговорная' : 'Рабочее место';

  const getCharacteristicsList = () => {
    const chars = place.characteristics || {};
    const list = [];
    if (chars.has_power) list.push(' Розетки');
    if (chars.has_wifi) list.push(' Wi-Fi');
    if (chars.has_projector) list.push(' Проектор');
    if (chars.has_whiteboard) list.push(' Маркерная доска');
    if (chars.has_air_conditioning) list.push(' Кондиционер');
    return list;
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75 p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Заголовок */}
        <div className="sticky top-0 bg-white border-b p-4 flex justify-between items-center">
          <h2 className="text-xl font-bold text-gray-800">{place.name}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-[#c27765] transition-colors">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Галерея */}
        <div className="relative bg-[#ffffe8]">
          {hasImages ? (
            <img
              src={currentImage}
              alt={place.name}
              className="w-full h-64 md:h-96 object-contain bg-[#ffffe8]"
              onError={(e) => { e.target.style.display = 'none'; e.target.nextElementSibling?.classList.remove('hidden'); }}
            />
          ) : null}
          <div className={`w-full h-64 md:h-96 flex items-center justify-center bg-[#ffffe8] ${hasImages ? 'hidden' : ''}`}>
            <DefaultPlaceholder />
          </div>
          {hasImages && allImages.length > 1 && (
            <>
              <button onClick={handlePrev} className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-[#84d2c5] bg-opacity-80 hover:bg-opacity-100 text-gray-800 rounded-full p-2 transition-all">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <button onClick={handleNext} className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-[#84d2c5] bg-opacity-80 hover:bg-opacity-100 text-gray-800 rounded-full p-2 transition-all">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
              <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 bg-[#84d2c5] bg-opacity-80 text-gray-800 text-xs px-2 py-1 rounded-full">
                {currentImageIndex + 1} / {allImages.length}
              </div>
            </>
          )}
        </div>

        {/* Информация о месте и кнопка бронирования */}
        <div className="p-6 space-y-4 border-b">
          <div className="flex flex-wrap gap-2 items-center">
            <Badge variant="primary">{getTypeLabel()}</Badge>
            {place.capacity > 1 && <Badge variant="info"> до {place.capacity} человек</Badge>}
          </div>
          <div>
            <h3 className="font-semibold text-gray-800 mb-2">Характеристики</h3>
            <div className="flex flex-wrap gap-2">
              {getCharacteristicsList().map((item, idx) => (
                <span key={idx} className="text-sm bg-[#84d2c5] bg-opacity-15 text-gray-700 px-3 py-1 rounded-full">{item}</span>
              ))}
              {getCharacteristicsList().length === 0 && (
                <span className="text-sm text-gray-500">Нет дополнительной информации</span>
              )}
            </div>
          </div>
          <Button variant="primary" size="lg" fullWidth onClick={() => onBook(place)}>
            Забронировать
          </Button>
          <p className="text-xs text-gray-500 text-center">
            Нажмите для перехода к оформлению бронирования
          </p>
        </div>

        {/* Комментарии */}
        <div className="p-6 space-y-4">
          <h3 className="font-semibold text-gray-800 text-lg">Отзывы</h3>

          {/* Форма для авторизованных */}
          {isAuthenticated && (
            <div className="bg-[#ffffe8] p-4 rounded-lg border border-[#84d2c5] border-opacity-30">
              <p className="text-sm font-medium mb-2">Оставить отзыв</p>
              <div className="mb-2">
                <label className="text-xs text-gray-600">Оценка:</label>
                <StarRating rating={newRating} onRate={setNewRating} />
              </div>
              <textarea
                rows={3}
                className="form-input mb-2"
                placeholder="Поделитесь впечатлениями..."
                value={newReviewText}
                onChange={(e) => setNewReviewText(e.target.value)}
              />
              <Button
                variant="primary"
                size="sm"
                onClick={handleSubmitReview}
                loading={submittingReview}
                disabled={submittingReview}
              >
                Отправить
              </Button>
            </div>
          )}

          {/* Список отзывов */}
          {loadingReviews ? (
            <p className="text-center text-gray-500">Загрузка...</p>
          ) : reviews.length === 0 ? (
            <p className="text-center text-gray-400">Пока нет отзывов. Будьте первым!</p>
          ) : (
            <div className="space-y-3">
              {reviews.map((review) => (
                <div key={review.id} className="bg-gray-50 p-3 rounded-lg">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-gray-800">{review.user_name || review.user_email}</span>
                    <StarRating rating={review.rating} />
                    <span className="text-xs text-gray-400 ml-auto">{review.created_at}</span>
                  </div>
                  <p className="text-gray-600 text-sm">{review.text}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PlaceGalleryModal;