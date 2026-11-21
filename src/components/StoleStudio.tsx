import { ChangeEvent, useRef, useState } from 'react';
import { Check, ImagePlus } from 'lucide-react';
import {
  STOLE_COLORS,
  THREAD_COLORS,
} from '../data/defaultStore';
import { CartItem } from '../types/store';

interface StoleStudioProps {
  title: string;
  subtitle: string;
  studioBgUrl: string;
  isAdminMode: boolean;
  onUploadStudioBg: (file: File) => void;
  onAddToCart: (item: Omit<CartItem, 'id' | 'quantity'>) => void;
}

export function StoleStudio({
  title,
  subtitle,
  studioBgUrl,
  isAdminMode,
  onUploadStudioBg,
}: StoleStudioProps) {
  
  const rightText = 'دفعة 2026';
  const leftText = 'الاسم واللقب';
  
  const [stoleColor, setStoleColor] = useState(STOLE_COLORS[0]);
  const [threadColor, setThreadColor] = useState(THREAD_COLORS[0]);

  const bgInputRef = useRef<HTMLInputElement>(null);

  const handleSelectStoleColor = (color: (typeof STOLE_COLORS)[number]) => {
    setStoleColor(color);
    const matchingThread = THREAD_COLORS.find((t) => t.hex === color.defaultThreadHex);
    if (matchingThread) {
      setThreadColor(matchingThread);
    } else {
      setThreadColor({ name: color.defaultThreadName, hex: color.defaultThreadHex });
    }
  };

  const handleBgUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onUploadStudioBg(file);
      e.target.value = '';
    }
  };

  const isLightStole = stoleColor.hex === '#f4efe6';

  return (
    <section id="studio-sec" className="py-12 sm:py-16">
      <div className="max-w-3xl mx-auto px-4 sm:px-6">
        
        <div className="text-center mb-8">
          <h2 className="font-editorial text-2xl sm:text-3xl font-bold text-[#1f1917]">
            {title}
          </h2>
          <p className="text-sm text-[#6e645e] mt-1">{subtitle}</p>
        </div>

        <div className="flex flex-col items-center gap-8">
          
          {/* المعاينة */}
          <div
            className="w-full max-w-lg rounded-2xl bg-[#f3eee8] flex flex-col items-center justify-center p-6 sm:p-8 min-h-[340px] relative overflow-hidden"
            style={
              studioBgUrl
                ? {
                    backgroundImage: `linear-gradient(rgba(250,248,245,0.68), rgba(250,248,245,0.78)), url("${studioBgUrl}")`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                  }
                : undefined
            }
          >
            {isAdminMode && (
              <div className="absolute top-3 right-3 z-20">
                <input
                  ref={bgInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleBgUpload}
                />
                <button
                  type="button"
                  onClick={() => bgInputRef.current?.click()}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/90 border border-[#e6ddd3] text-xs font-bold text-[#1f1917] shadow-sm hover:bg-white"
                >
                  <ImagePlus className="w-3.5 h-3.5 text-[#762b43]" />
                  <span>الخلفية</span>
                </button>
              </div>
            )}

            <div className="relative flex flex-col items-center">
              <div
                className="relative w-48 sm:w-56 h-72 sm:h-80 transition-colors duration-200 flex justify-between px-4 sm:px-5 pt-7 pb-10 shadow-xl"
                style={{
                  backgroundColor: stoleColor.hex,
                  color: threadColor.hex,
                  clipPath:
                    'polygon(0 0, 35% 0, 50% 38%, 65% 0, 100% 0, 86% 100%, 50% 76%, 14% 100%)',
                  border: isLightStole ? '1px solid #d6cdc2' : 'none',
                }}
              >
                <div
                  className="pointer-events-none absolute inset-1.5 opacity-60"
                  style={{
                    borderInline: `1.5px solid ${threadColor.hex}`,
                  }}
                />

                <div className="w-[38%] flex flex-col items-center justify-start pt-2 z-10">
                  <div
                    className="text-center font-bold leading-snug max-h-44 overflow-hidden select-none font-editorial text-lg sm:text-xl"
                    style={{ writingMode: 'vertical-rl' }}
                  >
                    {rightText}
                  </div>
                </div>

                <div className="w-[38%] flex flex-col items-center justify-start pt-2 z-10">
                  <div
                    className="text-center font-bold leading-snug max-h-44 overflow-hidden select-none font-editorial text-lg sm:text-xl"
                    style={{ writingMode: 'vertical-rl' }}
                  >
                    {leftText}
                  </div>
                </div>
              </div>

              <div className="mt-5 text-center">
                <p className="text-xs font-bold text-[#1f1917]">
                  {stoleColor.name} · تطريز {threadColor.name}
                </p>
              </div>
            </div>
          </div>

          {/* الألوان */}
          <div className="w-full max-w-lg space-y-6">
            
            <div className="text-center">
              <span className="block text-sm font-bold text-[#1f1917] mb-3">
                لون قماش الوشاح: <span className="text-[#762b43]">{stoleColor.name}</span>
              </span>
              <div className="flex flex-wrap items-center justify-center gap-3">
                {STOLE_COLORS.map((c) => {
                  const active = c.hex === stoleColor.hex;
                  return (
                    <button
                      key={c.hex}
                      type="button"
                      onClick={() => handleSelectStoleColor(c)}
                      title={c.name}
                      className={`w-10 h-10 rounded-full border transition-transform flex items-center justify-center cursor-pointer ${
                        active
                          ? 'ring-2 ring-[#762b43] ring-offset-2 scale-110 border-[#762b43]'
                          : 'border-[#d6cdc2] hover:scale-105'
                      }`}
                      style={{ backgroundColor: c.hex }}
                    >
                      {active && (
                        <Check
                          className={`w-5 h-5 ${
                            c.hex === '#f4efe6' ? 'text-[#762b43]' : 'text-white'
                          }`}
                        />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="text-center">
              <span className="block text-sm font-bold text-[#1f1917] mb-3">
                لون خيط التطريز: <span className="text-[#762b43]">{threadColor.name}</span>
              </span>
              <div className="flex flex-wrap items-center justify-center gap-3">
                {THREAD_COLORS.map((t) => {
                  const active = t.hex === threadColor.hex;
                  return (
                    <button
                      key={t.hex}
                      type="button"
                      onClick={() => setThreadColor(t)}
                      title={t.name}
                      className={`w-10 h-10 rounded-full border transition-transform flex items-center justify-center cursor-pointer ${
                        active
                          ? 'ring-2 ring-[#762b43] ring-offset-2 scale-110 border-[#762b43]'
                          : 'border-[#d6cdc2] hover:scale-105'
                      }`}
                      style={{ backgroundColor: t.hex }}
                    >
                      {active && (
                        <Check
                          className={`w-5 h-5 ${
                            t.hex === '#ffffff' || t.hex === '#e2e8f0'
                              ? 'text-[#1f1917]'
                              : 'text-white'
                          }`}
                        />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

          </div>
        </div>
      </div>
    </section>
  );
}
