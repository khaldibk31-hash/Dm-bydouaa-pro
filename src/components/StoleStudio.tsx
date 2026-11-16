import { ChangeEvent, useRef, useState } from 'react';
import { Check, ImagePlus, ShoppingBag } from 'lucide-react';
import {
  STOLE_COLORS,
  STOLE_STUDIO_MODELS,
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

const EMBLEM_OPTIONS = [
  { id: 'none', label: 'بدون رمز', glyph: '' },
  { id: 'cap', label: 'قبعة تخرج', glyph: '🎓' },
  { id: 'med', label: 'طب / صيدلة', glyph: '⚕' },
  { id: 'law', label: 'حقوق', glyph: '⚖' },
  { id: 'eng', label: 'هندسة', glyph: '◈' },
];

export function StoleStudio({
  title,
  subtitle,
  studioBgUrl,
  isAdminMode,
  onUploadStudioBg,
  onAddToCart,
}: StoleStudioProps) {
  const [selectedModelId, setSelectedModelId] = useState(STOLE_STUDIO_MODELS[0].id);
  const [rightText, setRightText] = useState('دفعة 2026');
  const [leftText, setLeftText] = useState('الاسم واللقب');
  const [stoleColor, setStoleColor] = useState(STOLE_COLORS[0]);
  const [threadColor, setThreadColor] = useState(THREAD_COLORS[0]);
  const [capStyle, setCapStyle] = useState<'standard' | 'tuxedo'>('standard');
  const [fontStyle, setFontStyle] = useState<'amiri' | 'cairo'>('amiri');
  const [emblemId, setEmblemId] = useState('cap');
  const [withGoldBorder, setWithGoldBorder] = useState(true);

  const bgInputRef = useRef<HTMLInputElement>(null);

  const selectedModel =
    STOLE_STUDIO_MODELS.find((m) => m.id === selectedModelId) ||
    STOLE_STUDIO_MODELS[0];

  const finalPrice = selectedModel.price + (capStyle === 'tuxedo' ? 100 : 0);
  const activeEmblem = EMBLEM_OPTIONS.find((e) => e.id === emblemId);

  const handleSelectStoleColor = (color: (typeof STOLE_COLORS)[number]) => {
    setStoleColor(color);
    const matchingThread = THREAD_COLORS.find((t) => t.hex === color.defaultThreadHex);
    if (matchingThread) {
      setThreadColor(matchingThread);
    } else {
      setThreadColor({ name: color.defaultThreadName, hex: color.defaultThreadHex });
    }
  };

  const handleAddStole = () => {
    const capLabel = capStyle === 'tuxedo' ? 'قبعة توكسيدو' : 'قبعة عادية';
    const fontLabel = fontStyle === 'amiri' ? 'خط الثلث' : 'خط نسخي حديث';
    const borderLabel = withGoldBorder ? 'بإطار مطرز' : 'بدون إطار';
    const emblemText =
      activeEmblem && activeEmblem.id !== 'none' ? ` · رمز: ${activeEmblem.label}` : '';

    onAddToCart({
      category: 'custom-stole',
      title: `${selectedModel.label} (تصميم خاص)`,
      details: `اللون: ${stoleColor.name} · التطريز: ${threadColor.name} · ${capLabel} · ${fontLabel} · ${borderLabel}${emblemText} · يمين: "${rightText || '-'}" / يسار: "${leftText || '-'}"`,
      unitPrice: finalPrice,
    });
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
    <section id="studio-sec" className="py-12 sm:py-16 border-b border-[#e6ddd3]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
          <div>
            <p className="text-xs font-bold text-[#762b43] mb-1.5">
              معاينة تفاعلية مباشرة
            </p>
            <h2 className="font-editorial text-2xl sm:text-3xl font-bold text-[#1f1917]">
              {title}
            </h2>
            <p className="text-sm text-[#6e645e] mt-1 max-w-2xl">{subtitle}</p>
          </div>

          {isAdminMode && (
            <div>
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
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-white border border-[#e6ddd3] hover:bg-[#f3eee8] text-xs font-bold text-[#1f1917] transition-colors cursor-pointer"
              >
                <ImagePlus className="w-3.5 h-3.5 text-[#762b43]" />
                <span>تغيير خلفية الاستوديو</span>
              </button>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 bg-white border border-[#e6ddd3] rounded-2xl p-5 sm:p-8">
          {/* Interactive Stole Preview Canvas */}
          <div
            className="lg:col-span-5 rounded-xl border border-[#e6ddd3] bg-[#f3eee8] flex flex-col items-center justify-center p-6 sm:p-8 min-h-[340px] relative overflow-hidden"
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
            {/* Bespoke Stole Visual */}
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
                {/* Subtle Gold/Thread Outer Trim Line */}
                {withGoldBorder && (
                  <div
                    className="pointer-events-none absolute inset-1.5 opacity-60"
                    style={{
                      borderInline: `1.5px solid ${threadColor.hex}`,
                    }}
                  />
                )}

                {/* Right Stole Wing (in RTL, first child is on the right) */}
                <div className="w-[38%] flex flex-col items-center justify-start pt-2 z-10">
                  {activeEmblem && activeEmblem.glyph && (
                    <span className="text-sm mb-2 opacity-90" aria-hidden="true">
                      {activeEmblem.glyph}
                    </span>
                  )}
                  <div
                    className={`text-center font-bold leading-snug max-h-44 overflow-hidden select-none ${
                      fontStyle === 'amiri' ? 'font-editorial text-lg sm:text-xl' : 'text-sm sm:text-base'
                    }`}
                    style={{ writingMode: 'vertical-rl' }}
                  >
                    {rightText || 'دفعة 2026'}
                  </div>
                </div>

                {/* Left Stole Wing */}
                <div className="w-[38%] flex flex-col items-center justify-start pt-2 z-10">
                  {activeEmblem && activeEmblem.glyph && (
                    <span className="text-sm mb-2 opacity-90" aria-hidden="true">
                      {activeEmblem.glyph}
                    </span>
                  )}
                  <div
                    className={`text-center font-bold leading-snug max-h-44 overflow-hidden select-none ${
                      fontStyle === 'amiri' ? 'font-editorial text-lg sm:text-xl' : 'text-sm sm:text-base'
                    }`}
                    style={{ writingMode: 'vertical-rl' }}
                  >
                    {leftText || 'الاسم واللقب'}
                  </div>
                </div>
              </div>

              <div className="mt-5 text-center">
                <p className="text-xs font-bold text-[#1f1917]">
                  {stoleColor.name} · تطريز {threadColor.name}
                </p>
                <p className="text-xs text-[#6e645e] mt-0.5">
                  معاينة تقريبية للتطريز والخط المختار
                </p>
              </div>
            </div>
          </div>

          {/* Configurator Controls */}
          <div className="lg:col-span-7 flex flex-col justify-between gap-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Model & Fabric */}
              <div className="sm:col-span-2">
                <label
                  htmlFor="studio-model"
                  className="block text-xs font-bold text-[#1f1917] mb-1.5"
                >
                  نوع الوشاح والقماش (يشمل القبعة)
                </label>
                <select
                  id="studio-model"
                  value={selectedModelId}
                  onChange={(e) => setSelectedModelId(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-lg border border-[#e6ddd3] bg-[#faf8f5] text-sm font-semibold text-[#1f1917]"
                >
                  {STOLE_STUDIO_MODELS.map((model) => (
                    <option key={model.id} value={model.id}>
                      {model.label} ({model.price.toLocaleString('en-US')} دج)
                    </option>
                  ))}
                </select>
              </div>

              {/* Right Text */}
              <div>
                <label
                  htmlFor="studio-right-txt"
                  className="block text-xs font-bold text-[#1f1917] mb-1.5"
                >
                  الجهة اليمنى (الدفعة أو التخصص)
                </label>
                <input
                  id="studio-right-txt"
                  type="text"
                  maxLength={32}
                  value={rightText}
                  onChange={(e) => setRightText(e.target.value)}
                  placeholder="مثال: دفعة 2026"
                  className="w-full px-3.5 py-2.5 rounded-lg border border-[#e6ddd3] bg-[#faf8f5] text-sm text-[#1f1917]"
                />
              </div>

              {/* Left Text */}
              <div>
                <label
                  htmlFor="studio-left-txt"
                  className="block text-xs font-bold text-[#1f1917] mb-1.5"
                >
                  الجهة اليسرى (الاسم أو الجامعة)
                </label>
                <input
                  id="studio-left-txt"
                  type="text"
                  maxLength={32}
                  value={leftText}
                  onChange={(e) => setLeftText(e.target.value)}
                  placeholder="مثال: دعاء بن علي"
                  className="w-full px-3.5 py-2.5 rounded-lg border border-[#e6ddd3] bg-[#faf8f5] text-sm text-[#1f1917]"
                />
              </div>

              {/* Cap Style & Font Style */}
              <div>
                <label
                  htmlFor="studio-cap"
                  className="block text-xs font-bold text-[#1f1917] mb-1.5"
                >
                  تصميم القبعة المرفقة
                </label>
                <select
                  id="studio-cap"
                  value={capStyle}
                  onChange={(e) =>
                    setCapStyle(e.target.value as 'standard' | 'tuxedo')
                  }
                  className="w-full px-3.5 py-2.5 rounded-lg border border-[#e6ddd3] bg-[#faf8f5] text-sm text-[#1f1917]"
                >
                  <option value="standard">قبعة عادية (مشمولة مجاناً)</option>
                  <option value="tuxedo">قبعة توكسيدو (+100 دج)</option>
                </select>
              </div>

              <div>
                <label
                  htmlFor="studio-font"
                  className="block text-xs font-bold text-[#1f1917] mb-1.5"
                >
                  نوع خط التطريز
                </label>
                <select
                  id="studio-font"
                  value={fontStyle}
                  onChange={(e) => setFontStyle(e.target.value as 'amiri' | 'cairo')}
                  className="w-full px-3.5 py-2.5 rounded-lg border border-[#e6ddd3] bg-[#faf8f5] text-sm text-[#1f1917]"
                >
                  <option value="amiri">خط الثلث الكلاسيكي (الأكثر طلباً)</option>
                  <option value="cairo">خط نسخي حديث</option>
                </select>
              </div>
            </div>

            {/* Color Swatches & Emblem Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-[#e6ddd3]">
              <div>
                <span className="block text-xs font-bold text-[#1f1917] mb-2">
                  لون قماش الوشاح: <span className="text-[#762b43]">{stoleColor.name}</span>
                </span>
                <div className="flex flex-wrap items-center gap-2">
                  {STOLE_COLORS.map((c) => {
                    const active = c.hex === stoleColor.hex;
                    return (
                      <button
                        key={c.hex}
                        type="button"
                        onClick={() => handleSelectStoleColor(c)}
                        title={c.name}
                        aria-label={c.name}
                        className={`w-8 h-8 rounded-full border transition-transform flex items-center justify-center cursor-pointer ${
                          active
                            ? 'ring-2 ring-[#762b43] ring-offset-2 scale-105 border-[#762b43]'
                            : 'border-[#d6cdc2] hover:scale-105'
                        }`}
                        style={{ backgroundColor: c.hex }}
                      >
                        {active && (
                          <Check
                            className={`w-3.5 h-3.5 ${
                              c.hex === '#f4efe6' ? 'text-[#762b43]' : 'text-white'
                            }`}
                          />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <span className="block text-xs font-bold text-[#1f1917] mb-2">
                  لون خيط التطريز: <span className="text-[#762b43]">{threadColor.name}</span>
                </span>
                <div className="flex flex-wrap items-center gap-2">
                  {THREAD_COLORS.map((t) => {
                    const active = t.hex === threadColor.hex;
                    return (
                      <button
                        key={t.hex}
                        type="button"
                        onClick={() => setThreadColor(t)}
                        title={t.name}
                        aria-label={t.name}
                        className={`w-8 h-8 rounded-full border transition-transform flex items-center justify-center cursor-pointer ${
                          active
                            ? 'ring-2 ring-[#762b43] ring-offset-2 scale-105 border-[#762b43]'
                            : 'border-[#d6cdc2] hover:scale-105'
                        }`}
                        style={{ backgroundColor: t.hex }}
                      >
                        {active && (
                          <Check
                            className={`w-3.5 h-3.5 ${
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

            {/* Emblem & Trim Options */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-[#e6ddd3]">
              <div className="flex flex-wrap items-center gap-1.5">
                {EMBLEM_OPTIONS.map((em) => (
                  <button
                    key={em.id}
                    type="button"
                    onClick={() => setEmblemId(em.id)}
                    className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                      emblemId === em.id
                        ? 'bg-[#1f1917] text-white'
                        : 'bg-[#f3eee8] text-[#6e645e] hover:text-[#1f1917]'
                    }`}
                  >
                    {em.glyph ? `${em.glyph} ` : ''}
                    {em.label}
                  </button>
                ))}
              </div>

              <label className="inline-flex items-center gap-2 text-xs font-semibold text-[#1f1917] cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={withGoldBorder}
                  onChange={(e) => setWithGoldBorder(e.target.checked)}
                  className="accent-[#762b43] w-4 h-4 rounded"
                />
                <span>إطار تطريز جانبي</span>
              </label>
            </div>

            {/* Action & Price Footer */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-4 border-t border-[#e6ddd3]">
              <div>
                <span className="block text-xs text-[#6e645e]">
                  السعر الإجمالي للوشاح المصمم
                </span>
                <span className="text-2xl font-extrabold text-[#762b43] tabular-nums">
                  {finalPrice.toLocaleString('en-US')} دج
                </span>
              </div>

              <button
                type="button"
                onClick={handleAddStole}
                className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg bg-[#762b43] hover:bg-[#581e31] text-white text-sm font-bold transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                <ShoppingBag className="w-4 h-4" />
                <span>أضف هذا الوشاح للحقيبة</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
