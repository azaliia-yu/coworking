import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Badge } from '../common';
import PlacePreview from './PlacePreview';
import PlaceGalleryModal from './PlaceGalleryModal';

const SpaceMap = ({ space, places, onPlaceSelect, selectedDate, startTime, endTime }) => {
  const [hoveredPlace, setHoveredPlace] = useState(null);
  const [hoverPosition, setHoverPosition] = useState({ x: 0, y: 0 });
  const [galleryModalOpen, setGalleryModalOpen] = useState(false);
  const [selectedForGallery, setSelectedForGallery] = useState(null);
  const [isMobile, setIsMobile] = useState(false);
  const mapContainerRef = useRef(null);
  const hoverTimeoutRef = useRef(null);

  const [imgNaturalSize, setImgNaturalSize] = useState({ w: 800, h: 600 });
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });

  // Загрузка натуральных размеров изображения
  useEffect(() => {
    if (space?.map_image) {
      const img = new Image();
      img.onload = () => setImgNaturalSize({ w: img.naturalWidth, h: img.naturalHeight });
      img.src = space.map_image;
    }
  }, [space?.map_image]);

  // Отслеживание размера контейнера
  useEffect(() => {
    const updateSize = () => {
      if (mapContainerRef.current) {
        setContainerSize({
          width: mapContainerRef.current.clientWidth,
          height: mapContainerRef.current.clientHeight,
        });
      }
    };
    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  const getImageRect = useCallback(() => {
    if (!mapContainerRef.current) return { left: 0, top: 0, width: 0, height: 0 };
    const cw = mapContainerRef.current.clientWidth;
    const ch = mapContainerRef.current.clientHeight;
    const { w: iw, h: ih } = imgNaturalSize;
    if (iw === 0 || ih === 0) return { left: 0, top: 0, width: cw, height: ch };
    const scale = Math.min(cw / iw, ch / ih);
    const width = iw * scale;
    const height = ih * scale;
    const left = (cw - width) / 2;
    const top = (ch - height) / 2;
    return { left, top, width, height };
  }, [imgNaturalSize, containerSize]);

  useEffect(() => {
    setIsMobile(window.innerWidth < 768);
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const getPixelPosition = (place) => {
    const rect = getImageRect();
    const xPercent = place.x || 0;
    const yPercent = place.y || 0;
    return {
      left: rect.left + (xPercent / 100) * rect.width,
      top: rect.top + (yPercent / 100) * rect.height,
    };
  };

  const getPlaceColor = (place) => {
    if (!place.available) return 'bg-gray-300 border-gray-400 cursor-not-allowed opacity-60';
    if (place.place_type === 'meeting_room') return 'bg-[#b05b7b] bg-opacity-20 border-[#b05b7b] hover:bg-opacity-30 cursor-pointer';
    return 'bg-[#84d2c5] bg-opacity-20 border-[#84d2c5] hover:bg-opacity-30 cursor-pointer';
  };

  const getPlaceIcon = (place) => {
    if (place.place_type === 'meeting_room') {
      return <svg className="w-6 h-6 mx-auto text-[#b05b7b]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>;
    }
    return <svg className="w-6 h-6 mx-auto text-[#84d2c5]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" /></svg>;
  };

  const handleMouseEnter = (place, event) => {
    if (isMobile || !place.available) return;
    if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    const rect = event.currentTarget.getBoundingClientRect();
    setHoverPosition({ x: rect.left + rect.width / 2, y: rect.top });
    setHoveredPlace(place);
  };

  const handleMouseLeave = () => {
    hoverTimeoutRef.current = setTimeout(() => setHoveredPlace(null), 100);
  };

  const handlePlaceClick = (place, event) => {
    if (!place.available) return;
    event.stopPropagation();
    setSelectedForGallery(place);
    setGalleryModalOpen(true);
  };

  if (!places.length) {
    return <div className="bg-[#ffffe8] rounded-lg p-8 text-center text-gray-500">Нет данных о расположении мест</div>;
  }

  const rect = getImageRect();

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-4 text-sm">
        <div className="flex items-center gap-2"><div className="w-4 h-4 bg-[#84d2c5] bg-opacity-20 border border-[#84d2c5] rounded" /><span>Рабочее место (свободно)</span></div>
        <div className="flex items-center gap-2"><div className="w-4 h-4 bg-[#b05b7b] bg-opacity-20 border border-[#b05b7b] rounded" /><span>Переговорная (свободна)</span></div>
        <div className="flex items-center gap-2"><div className="w-4 h-4 bg-gray-300 border border-gray-400 rounded" /><span>Занято</span></div>
      </div>

      <div ref={mapContainerRef} className="relative bg-[#ffffe8] rounded-lg border border-gray-200 overflow-hidden" style={{ minHeight: '500px', maxHeight: '600px' }}>
        {space?.map_image && (
          <img
          src={`${space.map_image}?v=${space.updated_at || space.version || Date.now()}`}
          alt="План помещения"
          style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'contain', pointerEvents: 'none', opacity: 0.8 }}
          />
        )}
        {places.map((place) => {
          const { left, top } = getPixelPosition(place);
          return (
            <div key={place.id} onClick={(e) => handlePlaceClick(place, e)} onMouseEnter={(e) => handleMouseEnter(place, e)} onMouseLeave={handleMouseLeave}
              className={`absolute transition-all hover:scale-105 ${place.available ? 'hover:shadow-lg' : ''}`}
              style={{ left: left, top: top, width: place.place_type === 'meeting_room' ? '120px' : '80px', transform: 'translate(-50%, -50%)' }}>
              <div className={`p-2 rounded-lg border-2 ${getPlaceColor(place)} shadow-sm`}>
                <div className="text-center">
                  <div className="mb-1">{getPlaceIcon(place)}</div>
                  <div className="font-medium text-sm truncate">{place.name}</div>
                  {place.place_type === 'meeting_room' && <div className="text-xs text-gray-600">{place.capacity} чел.</div>}
                  {place.place_type === 'desk' && <div className="text-xs text-gray-600">Рабочее место</div>}
                  <div className="flex flex-wrap gap-1 justify-center mt-1">
                    {place.characteristics?.has_power && <span title="Розетки"><svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg></span>}
                    {place.characteristics?.has_wifi && <span title="Wi-Fi"><svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.141 0M1.394 9.393c5.857-5.858 15.355-5.858 21.213 0" /></svg></span>}
                    {place.characteristics?.has_projector && <span title="Проектор"><svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z" /></svg></span>}
                  </div>
                  {!place.available && <Badge variant="danger" className="mt-1 text-xs">Занято</Badge>}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Превью при наведении (только десктоп) */}
      {!isMobile && hoveredPlace && <PlacePreview place={hoveredPlace} x={hoverPosition.x} y={hoverPosition.y} isVisible={true} />}

      {/* Модальное окно с галереей при клике */}
      {selectedForGallery && <PlaceGalleryModal place={selectedForGallery} isOpen={galleryModalOpen} onClose={() => setGalleryModalOpen(false)} onBook={(place) => { setGalleryModalOpen(false); if (onPlaceSelect) onPlaceSelect(place); }} />}

      {/* Легенда характеристик */}
      <div className="flex flex-wrap gap-4 text-xs text-gray-500 border-t border-gray-200 pt-3">
        <span className="flex items-center gap-1">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
          - Розетки
        </span>
        <span className="flex items-center gap-1">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.141 0M1.394 9.393c5.857-5.858 15.355-5.858 21.213 0" />
          </svg>
          - Wi-Fi
        </span>
        <span className="flex items-center gap-1">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z" />
          </svg>
          - Проектор
        </span>
        <span className="flex items-center gap-1">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
          - Переговорная
        </span>
        <span className="flex items-center gap-1">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
          </svg>
          - Рабочее место
        </span>
      </div>
    </div>
  );
};

export default SpaceMap;