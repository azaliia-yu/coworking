import React from 'react';

const PlacePreview = ({ place, x, y, isVisible }) => {
  if (!isVisible || !place) return null;

  const isMeetingRoom = place.place_type === 'meeting_room';
  const previewImage = place.preview_image;
  
  return (
  <div
    className="fixed z-50 pointer-events-none"
    style={{
      left: x,
      top: y - 80,
      transform: 'translateX(-50%)'
    }}
  >
    <div className="bg-white rounded-lg shadow-xl border border-gray-200 overflow-hidden animate-fade-in">
      {/* Изображение превью 150x150 */}
      <div className="w-[150px] h-[150px] bg-gray-100 flex items-center justify-center">
        {previewImage ? (
          <img
            src={previewImage}
            alt={place.name}
            className="w-full h-full object-cover"
            onError={(e) => {
              e.target.style.display = 'none';
              e.target.parentElement.classList.add('placeholder-fallback');
            }}
          />
        ) : (
          <div className="text-center text-gray-400">
            {isMeetingRoom ? (
              <svg className="w-12 h-12 mx-auto mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} 
                      d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            ) : (
              <svg className="w-12 h-12 mx-auto mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} 
                      d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
              </svg>
            )}
            <p className="text-xs">{isMeetingRoom ? 'Переговорная' : 'Рабочее место'}</p>
          </div>
        )}
      </div>

      {/* Для переговорной — показываем название и вместимость */}
      {isMeetingRoom && (
        <div className="p-2 bg-gray-50 text-center border-t">
          <p className="text-xs font-medium text-gray-700 truncate">
            {place.name}
          </p>
          <p className="text-xs text-gray-500">
            до {place.capacity} чел.
          </p>
        </div>
      )}

      {/* Для рабочего места — краткая информация */}
      {!isMeetingRoom && (
        <div className="p-2 bg-gray-50 text-center border-t">
          <p className="text-xs font-medium text-gray-700 truncate">
            {place.name}
          </p>
          <p className="text-xs text-gray-500">
            Рабочее место
          </p>
        </div>
      )}
    </div>
  </div>
);
};

export default PlacePreview;
