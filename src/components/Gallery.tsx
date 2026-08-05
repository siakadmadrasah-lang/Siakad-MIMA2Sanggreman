"use client";

import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { X, Maximize2, Camera, ChevronDown, ChevronUp, Play, Video, Image as ImageIcon, Film } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { useIsMobile } from '@/hooks/use-mobile';
import ImageSlideshow from './ImageSlideshow';
import { getYouTubeEmbedUrl, getYouTubeThumbnail } from '@/utils/imageCompression';

const Gallery = () => {
  const [gallery, setGallery] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [showAll, setShowAll] = useState(false);
  const [filterType, setFilterType] = useState<'all' | 'image' | 'video'>('all');
  const isMobile = useIsMobile();

  useEffect(() => {
    const fetchGallery = async () => {
      try {
        const { data: res } = await supabase.from('site_settings').select('value').eq('id', 'gallery_data_list').maybeSingle();
        if (res?.value) setGallery(res.value as any[]);
      } catch (error) { console.error(error); } finally { setLoading(false); }
    };
    fetchGallery();
  }, []);

  const filteredGallery = gallery.filter(item => {
    if (filterType === 'image') return item.media_type === 'image' || (!item.media_type && !item.video_url);
    if (filterType === 'video') return item.media_type === 'video' || Boolean(item.video_url);
    return true;
  });

  const initialLimit = isMobile ? 2 : 4;
  const displayedGallery = showAll ? filteredGallery : filteredGallery.slice(0, initialLimit);

  const photoCount = gallery.filter(i => i.media_type !== 'video' && !i.video_url).length;
  const videoCount = gallery.filter(i => i.media_type === 'video' || Boolean(i.video_url)).length;

  return (
    <section id="gallery" className="py-16 bg-slate-50">
      <div className="container mx-auto px-6">
        <div className="text-center max-w-2xl mx-auto mb-8 space-y-3">
          <div className="inline-flex items-center gap-2 bg-emerald-100 text-emerald-700 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest">
            <Camera className="w-3.5 h-3.5" /> Momen & Dokumentasi
          </div>
          <h2 className="text-xl md:text-3xl font-black text-slate-900 flex items-center justify-center gap-3">
            <div className="w-5 h-5 bg-emerald-600 rounded-sm rotate-45 flex-shrink-0"></div>
            <span>
              Galeri <span className="text-emerald-600 font-serif-premium italic">Kegiatan & Video</span>
            </span>
          </h2>
        </div>

        {/* Filter Tabs */}
        {gallery.length > 0 && (
          <div className="flex justify-center mb-8">
            <div className="inline-flex items-center gap-1.5 bg-white p-1.5 rounded-2xl border border-slate-200/80 shadow-xs">
              <button
                type="button"
                onClick={() => setFilterType('all')}
                className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all ${
                  filterType === 'all'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                Semua ({gallery.length})
              </button>
              {photoCount > 0 && (
                <button
                  type="button"
                  onClick={() => setFilterType('image')}
                  className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all inline-flex items-center gap-1.5 ${
                    filterType === 'image'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  <ImageIcon className="w-3.5 h-3.5" /> Foto ({photoCount})
                </button>
              )}
              {videoCount > 0 && (
                <button
                  type="button"
                  onClick={() => setFilterType('video')}
                  className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all inline-flex items-center gap-1.5 ${
                    filterType === 'video'
                      ? 'bg-rose-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  <Video className="w-3.5 h-3.5" /> Video ({videoCount})
                </button>
              )}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
          {loading ? [1, 2, 3, 4].map(i => <Skeleton key={i} className="aspect-[3/2] rounded-2xl" />) : 
            displayedGallery.map((item) => {
              const isVideo = item.media_type === 'video' || Boolean(item.video_url);
              const thumbImage = item.thumbnail_url || item.images?.[0] || item.image_url || getYouTubeThumbnail(item.video_url) || '/placeholder.svg';

              return (
                <div key={item.id} className="flex flex-col gap-3 group cursor-pointer" onClick={() => setSelectedItem(item)}>
                  <div className="relative rounded-2xl overflow-hidden shadow-sm aspect-[3/2] bg-slate-900">
                    {isVideo ? (
                      <div className="relative w-full h-full">
                        <img src={thumbImage} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                        
                        {/* Play Badge Overlay */}
                        <div className="absolute inset-0 flex items-center justify-center bg-black/30 group-hover:bg-black/50 transition-colors z-10">
                          <div className="w-12 h-12 rounded-full bg-rose-600 text-white flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                            <Play className="w-6 h-6 fill-white ml-0.5" />
                          </div>
                        </div>

                        <div className="absolute top-2.5 left-2.5 bg-rose-600/95 text-white text-[10px] font-black px-2.5 py-0.5 rounded-full backdrop-blur-sm z-20 flex items-center gap-1 shadow-xs">
                          <Play className="w-2.5 h-2.5 fill-white" /> VIDEO
                        </div>
                      </div>
                    ) : (
                      <>
                        <ImageSlideshow 
                          images={item.images || (item.image_url ? [item.image_url] : [])} 
                          className="w-full h-full" 
                          alt={item.title}
                          overlayTitle={item.title}
                          overlaySubtitle={item.description}
                          overlayBadge="DOKUMENTASI"
                        />
                        <div className="absolute inset-0 bg-emerald-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-[2px] z-20">
                          <Maximize2 className="text-white w-5 h-5" />
                        </div>
                        {item.images && item.images.length > 1 && (
                          <div className="absolute top-2.5 right-2.5 bg-black/60 text-white text-[10px] font-black px-2.5 py-0.5 rounded-full backdrop-blur-sm z-20">
                            {item.images.length} Foto
                          </div>
                        )}
                      </>
                    )}
                  </div>
                  <div className="px-1">
                    <h3 className="text-sm font-extrabold text-slate-900 line-clamp-1 group-hover:text-emerald-600 transition-colors">{item.title}</h3>
                    {item.description && <p className="text-xs text-slate-500 line-clamp-1 mt-0.5">{item.description}</p>}
                  </div>
                </div>
              );
            })
          }
        </div>

        {!loading && filteredGallery.length > initialLimit && (
          <div className="mt-12 text-center">
            <Button 
              onClick={() => setShowAll(!showAll)}
              variant="outline"
              className="rounded-xl border-emerald-200 text-emerald-700 hover:bg-emerald-50 font-bold px-8 shadow-xs"
            >
              {showAll ? (
                <><ChevronUp className="w-4 h-4 mr-2" /> Tampilkan Lebih Sedikit</>
              ) : (
                <><ChevronDown className="w-4 h-4 mr-2" /> Lihat Semua ({filteredGallery.length})</>
              )}
            </Button>
          </div>
        )}
      </div>

      {/* Modal Lightbox Popup */}
      {selectedItem && (
        <div className="fixed inset-0 bg-slate-950/90 z-[100] flex items-center justify-center p-4 sm:p-6" onClick={() => setSelectedItem(null)}>
          <div className="relative max-w-4xl w-full" onClick={e => e.stopPropagation()}>
            <div className="bg-white rounded-3xl overflow-hidden shadow-2xl border border-slate-200">
              {(selectedItem.media_type === 'video' || selectedItem.video_url) ? (
                <div className="w-full aspect-video bg-black flex items-center justify-center relative">
                  {getYouTubeEmbedUrl(selectedItem.video_url) ? (
                    <iframe
                      src={getYouTubeEmbedUrl(selectedItem.video_url)!}
                      className="w-full h-full"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    ></iframe>
                  ) : selectedItem.video_url ? (
                    <video
                      src={selectedItem.video_url}
                      controls
                      autoPlay
                      poster={selectedItem.thumbnail_url || selectedItem.images?.[0]}
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    <ImageSlideshow 
                      images={selectedItem.images || [selectedItem.image_url]} 
                      className="w-full aspect-video" 
                      alt={selectedItem.title}
                    />
                  )}
                </div>
              ) : (
                <ImageSlideshow 
                  images={selectedItem.images || [selectedItem.image_url]} 
                  className="w-full aspect-video" 
                  alt={selectedItem.title}
                  overlayTitle={selectedItem.title}
                  overlaySubtitle={selectedItem.description}
                  overlayBadge="GALERI MADRASAH"
                />
              )}

              <div className="p-6">
                <div className="flex items-center gap-2 mb-1.5">
                  {(selectedItem.media_type === 'video' || selectedItem.video_url) ? (
                    <span className="bg-rose-100 text-rose-800 text-[10px] font-black px-2.5 py-0.5 rounded-full flex items-center gap-1">
                      <Play className="w-3 h-3 fill-rose-800" /> VIDEO MADRASAH
                    </span>
                  ) : (
                    <span className="bg-emerald-100 text-emerald-800 text-[10px] font-black px-2.5 py-0.5 rounded-full flex items-center gap-1">
                      <Camera className="w-3 h-3" /> FOTO GALERI
                    </span>
                  )}
                </div>
                <h3 className="text-xl font-extrabold text-slate-900">{selectedItem.title}</h3>
                {selectedItem.description && (
                  <p className="text-slate-600 text-sm mt-2 leading-relaxed">{selectedItem.description}</p>
                )}
              </div>
            </div>
            <button 
              className="absolute -top-12 right-0 text-white hover:text-emerald-400 transition-colors bg-white/10 p-2 rounded-full backdrop-blur-md" 
              onClick={() => setSelectedItem(null)}
            >
              <X size={20} />
            </button>
          </div>
        </div>
      )}
    </section>
  );
};

export default Gallery;