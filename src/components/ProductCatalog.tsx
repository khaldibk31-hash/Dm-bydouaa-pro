import { ChangeEvent, useEffect, useRef, useState } from 'react';
import {
  ArrowRight,
  Check,
  ChevronLeft,
  ImageOff,
  ImagePlus,
  Pencil,
  Plus,
  ShoppingBag,
  Sparkles,
  Trash2,
} from 'lucide-react';
import {
  BOUQUET_IMAGE_PATH,
  CAP_SWATCHES,
  CATEGORY_BRANCHES,
  CATEGORY_LABELS,
  ROBE_IMAGE_PATH,
  SHAWL_IMAGE_PATH,
} from '../data/defaultStore';
import { CartItem, CategoryId, Product } from '../types/store';

interface ProductCatalogProps {
  products: Product[];
  isAdminMode: boolean;
  onAddToCart: (item: Omit<CartItem, 'id' | 'quantity'>) => void;
  onOpenAddProduct: (defaultCategory?: CategoryId) => void;
  onEditProduct: (product: Product) => void;
  onDeleteProduct: (productId: string) => void;
  onReplaceProductImage: (productId: string, file: File) => void;
  onSetProductColorImage?: (productId: string, colorName: string, file: File | null) => void;
  onToggleProductField?: (
    productId: string,
    field: 'hideSizing' | 'hideCapDetails' | 'hideAmericanShawl'
  ) => void;
  onRemoveProductImage?: (productId: string) => void;
}

const MAIN_SECTIONS = [
  {
    id: 'shawl' as CategoryId,
    title: 'الوشاح',
    subtitle: 'شال ميس أو عادي أو بالظهر مع القبعة، بقماش الكريب أو الدان، وتصمّمه باسمك وشعارك.',
    priceLabel: 'من 3,800 دج مع القبعة',
    buttonText: 'صمّم وشاحك',
    fallbackImg: SHAWL_IMAGE_PATH,
  },
  {
    id: 'robe' as CategoryId,
    title: 'الروب',
    subtitle: 'روب التخرج بألوان ملكية ومقاس رجالي أو نسائي أو بقياساتك الخاصة بدقة.',
    priceLabel: 'من 2,500 دج',
    buttonText: 'اختر روبك',
    fallbackImg: ROBE_IMAGE_PATH,
  },
  {
    id: 'accessories' as CategoryId,
    title: 'ورد وإكسسوارات',
    subtitle: 'باقات ورد التخرج الفاخرة والقبعات المنفردة لإكمال إطلالة تخرجك.',
    priceLabel: 'تشكيلة مميزة',
    buttonText: 'تصفح الإكسسوارات',
    fallbackImg: BOUQUET_IMAGE_PATH,
  },
];

const CAP_STYLES = [
  { id: 'round', label: 'القبعة الدائرية', extraPrice: 0, priceText: 'مشمولة', shape: 'round' as const },
  { id: 'triangle', label: 'القبعة المثلثة', extraPrice: 0, priceText: 'مشمولة', shape: 'triangle' as const },
  { id: 'tuxedo', label: 'قبعة توكسيدو', extraPrice: 100, priceText: '+100 دج', shape: 'tuxedo' as const },
];

function CapCardGraphic({ shape }: { shape: 'round' | 'triangle' | 'tuxedo' }) {
  return (
    <div className="w-full aspect-[4/5] rounded-xl bg-[#f9eef2] flex items-center justify-center p-2">
      <svg viewBox="0 0 120 140" className="w-full h-full">
        {/* Mannequin bust */}
        <path d="M35 135 C35 112, 85 112, 85 135 Z" fill="#ffffff" />
        <rect x="52" y="92" width="16" height="24" rx="6" fill="#ffffff" />
        <ellipse cx="60" cy="76" rx="18" ry="23" fill="#ffffff" />
        {/* Cap base */}
        <path d="M41 56 Q60 66 79 56 L77 65 Q60 74 43 65 Z" fill="#1c1917" />
        {/* Cap top */}
        {shape === 'round' && (
          <ellipse cx="60" cy="49" rx="34" ry="12" fill="#292524" />
        )}
        {shape === 'triangle' && (
          <polygon points="60,34 98,50 60,64 22,50" fill="#292524" />
        )}
        {shape === 'tuxedo' && (
          <>
            <polygon points="60,33 98,49 60,63 22,49" fill="#18181b" />
            <path d="M43 63 Q60 72 77 63" stroke="#d4af37" strokeWidth="2.5" fill="none" />
          </>
        )}
        {/* Tassel */}
        <circle cx="60" cy="49" r="2.5" fill="#d4af37" />
        <path d="M60 49 L85 56 L85 84" stroke="#d4af37" strokeWidth="2.2" fill="none" />
        <rect x="82.5" y="81" width="5" height="12" rx="2" fill="#d4af37" />
      </svg>
    </div>
  );
}

function ProductDetailView({
  product,
  isAdminMode,
  onBack,
  onAddToCart,
  onEditProduct,
  onDeleteProduct,
  onReplaceProductImage,
  onSetColorImage,
  onToggleField,
}: {
  product: Product;
  isAdminMode: boolean;
  onBack: () => void;
  onAddToCart: (item: Omit<CartItem, 'id' | 'quantity'>) => void;
  onEditProduct: (product: Product) => void;
  onDeleteProduct: (productId: string) => void;
  onReplaceProductImage: (productId: string, file: File) => void;
  onSetColorImage?: (colorName: string, file: File | null) => void;
  onToggleField?: (field: 'hideSizing' | 'hideCapDetails' | 'hideAmericanShawl') => void;
}) {
  const [selectedOptionIdx, setSelectedOptionIdx] = useState(0);
  const [selectedSecondary, setSelectedSecondary] = useState<string>(
    product.secondaryOptions?.[0] ?? ''
  );
  const [selectedColor, setSelectedColor] = useState(CAP_SWATCHES[0]);
  const [selectedCapStyle, setSelectedCapStyle] = useState(CAP_STYLES[0]);
  const [gender, setGender] = useState<'نسائي' | 'رجالي'>('نسائي');
  const [standardSize, setStandardSize] = useState('M');
  const [numericSize, setNumericSize] = useState('');
  const [fullLength, setFullLength] = useState('');
  const [shoulderAndSleeve, setShoulderAndSleeve] = useState('');
  const [capSameColor, setCapSameColor] = useState(true);
  const [capCustomColor, setCapCustomColor] = useState(CAP_SWATCHES[1]);
  const [headSize, setHeadSize] = useState('');
  const [capEmbroideryPos, setCapEmbroideryPos] = useState<'سطح القبعة' | 'جبهة القبعة'>('جبهة القبعة');
  const [capNotes, setCapNotes] = useState('');
  const [addAmericanShawl, setAddAmericanShawl] = useState(false);
  const [customNotes, setCustomNotes] = useState('');
  const [addedFeedback, setAddedFeedback] = useState(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const colorFileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    setSelectedOptionIdx(0);
    setSelectedSecondary(product.secondaryOptions?.[0] ?? '');
    setSelectedColor(CAP_SWATCHES[0]);
    setSelectedCapStyle(CAP_STYLES[0]);
    setGender('نسائي');
    setStandardSize('M');
    setNumericSize('');
    setFullLength('');
    setShoulderAndSleeve('');
    setCapSameColor(true);
    setHeadSize('');
    setCapNotes('');
    setAddAmericanShawl(false);
    setCustomNotes('');
  }, [product.id, product.secondaryOptions]);

  const currentOption = product.options[selectedOptionIdx] ?? product.options[0];
  const basePrice = currentOption ? currentOption.price : product.price;
  const showCapSection = product.category !== 'accessories' && !product.hideCapDetails;
  const capExtra = showCapSection ? selectedCapStyle.extraPrice : 0;
  const shawlExtra = !product.hideAmericanShawl && addAmericanShawl ? 900 : 0;
  const displayPrice = basePrice + capExtra + shawlExtra;

  const activeColorImage = product.colorImages?.[selectedColor.name];
  const displayedImage = activeColorImage || product.imageUrl;
  const hasDedicatedColorImg = Boolean(activeColorImage);

  const handleImageFile = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) onReplaceProductImage(product.id, file);
    e.target.value = '';
  };

  const handleColorImageFile = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && onSetColorImage) onSetColorImage(selectedColor.name, file);
    e.target.value = '';
  };

  const handleAdd = () => {
    const parts: string[] = [];
    if (selectedSecondary) parts.push(selectedSecondary);
    if (!product.hideSizing) {
      const szText = numericSize ? `مقاس ${numericSize}` : standardSize;
      parts.push(`${gender} (${szText})`);
      if (fullLength.trim()) parts.push(`الطول: ${fullLength.trim()} سم`);
      if (shoulderAndSleeve.trim()) parts.push(`الكتف/الكم: ${shoulderAndSleeve.trim()}`);
    }
    if (!product.hideCapDetails && product.category !== 'accessories') {
      parts.push(`القبعة: ${selectedCapStyle.label}`);
      parts.push(`لون القبعة: ${capSameColor ? 'نفس لون الوشاح' : capCustomColor.name}`);
      if (headSize.trim()) parts.push(`محيط الرأس: ${headSize.trim()} سم`);
      parts.push(`تطريز: ${capEmbroideryPos}`);
      if (capNotes.trim()) parts.push(`ملاحظة القبعة: ${capNotes.trim()}`);
    }
    if (!product.hideAmericanShawl && addAmericanShawl) {
      parts.push('+ الشال الأمريكي V');
    }
    if (customNotes.trim()) {
      parts.push(`ملاحظات: ${customNotes.trim()}`);
    }

    onAddToCart({
      productId: product.id,
      title: product.title,
      optionLabel: currentOption?.label ?? 'أساسي',
      secondaryLabel: parts.join(' | ') || undefined,
      colorName: selectedColor.name,
      colorHex: selectedColor.hex,
      unitPrice: displayPrice,
      imageUrl: displayedImage,
    });
    setAddedFeedback(true);
    setTimeout(() => setAddedFeedback(false), 1800);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-[#e6ddd3] text-xs font-bold text-[#1f1917] hover:border-[#762b43] transition-colors cursor-pointer"
        >
          <ArrowRight className="w-4 h-4 text-[#762b43]" />
          <span>العودة إلى {CATEGORY_LABELS[product.category]}</span>
        </button>

        {isAdminMode && (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onEditProduct(product)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-[#faf8f5] border border-[#e6ddd3] text-xs font-bold text-[#1f1917] hover:border-[#762b43] cursor-pointer"
            >
              <Pencil className="w-3.5 h-3.5 text-[#762b43]" />
              <span>تعديل المنتج</span>
            </button>
            <button
              type="button"
              onClick={() => {
                onDeleteProduct(product.id);
                onBack();
              }}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-rose-50 border border-rose-200 text-xs font-bold text-rose-700 hover:bg-rose-100 cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>حذف</span>
            </button>
          </div>
        )}
      </div>
            <div className="bg-white border border-[#e6ddd3] rounded-3xl overflow-hidden shadow-sm grid grid-cols-1 md:grid-cols-2">
        <div className="relative bg-[#faf8f5] flex items-center justify-center min-h-[340px] sm:min-h-[460px] p-4 sm:p-8">
          <img
            src={displayedImage}
            alt={product.title}
            className="w-full h-full max-h-[500px] object-contain rounded-2xl transition-all duration-300"
          />
          {product.badge && (
            <span className="absolute top-4 right-4 px-3 py-1 rounded-full bg-[#762b43] text-white text-xs font-bold shadow">
              {product.badge}
            </span>
          )}
          <span className="absolute bottom-4 right-4 px-3 py-1 rounded-full bg-white/95 border border-[#e6ddd3] text-[11px] font-bold text-[#1f1917] flex items-center gap-1.5 shadow-sm">
            <span
              className="w-3 h-3 rounded-full border border-black/15"
              style={{ backgroundColor: selectedColor.hex }}
            />
            <span>اللون المختار: {selectedColor.name}</span>
          </span>

          {isAdminMode && (
            <>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageFile}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="absolute bottom-4 left-4 inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-[#1f1917]/90 text-white text-xs font-bold shadow hover:bg-[#762b43] cursor-pointer"
              >
                <ImagePlus className="w-3.5 h-3.5" />
                <span>تغيير الصورة الأساسية</span>
              </button>
            </>
          )}
        </div>

        <div className="p-6 sm:p-8 flex flex-col justify-between space-y-6">
          <div className="space-y-5">
            <div>
              <span className="inline-block px-3 py-1 rounded-full bg-[#faf8f5] border border-[#e6ddd3] text-[11px] font-bold text-[#762b43] mb-2">
                {product.branch}
              </span>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-[#1f1917] leading-snug">
                {product.title}
              </h1>
              <p className="text-sm text-[#6e645e] leading-relaxed mt-2">
                {product.description}
              </p>
            </div>

            {product.options.length > 0 && (
              <div>
                <label className="block text-xs font-bold text-[#1f1917] mb-2">
                  اختر القماش والمقاس الأساسي:
                </label>
                <div className="grid grid-cols-2 gap-2.5">
                  {product.options.map((opt, idx) => {
                    const active = idx === selectedOptionIdx;
                    return (
                      <button
                        key={opt.label}
                        type="button"
                        onClick={() => setSelectedOptionIdx(idx)}
                        className={`p-3 rounded-2xl border text-right transition-all cursor-pointer ${
                          active
                            ? 'border-[#762b43] bg-[#faf8f5] shadow-xs'
                            : 'border-[#e6ddd3] bg-white hover:border-[#762b43]/50'
                        }`}
                      >
                        <span className="block text-xs font-bold text-[#1f1917]">{opt.label}</span>
                        <span className="text-[11px] font-extrabold text-[#762b43]">
                          {opt.price.toLocaleString('en-US')} دج
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-[#1f1917] mb-2">
                اختر اللون: <span className="text-[#762b43]">{selectedColor.name}</span>
              </label>
              <div className="flex flex-wrap gap-2.5">
                {CAP_SWATCHES.map((swatch) => {
                  const active = selectedColor.name === swatch.name;
                  return (
                    <button
                      key={swatch.name}
                      type="button"
                      title={swatch.name}
                      onClick={() => setSelectedColor(swatch)}
                      className={`relative w-8 h-8 rounded-full border transition-transform cursor-pointer flex items-center justify-center ${
                        active
                          ? 'ring-2 ring-[#762b43] ring-offset-2 scale-110'
                          : 'border-black/20 hover:scale-105'
                      }`}
                      style={{ backgroundColor: swatch.hex }}
                    >
                      {active && (
                        <Check
                          className={`w-4 h-4 ${
                            swatch.hex === '#ffffff' || swatch.hex === '#f5f0e6'
                              ? 'text-[#1f1917]'
                              : 'text-white'
                          }`}
                        />
                      )}
                    </button>
                  );
                })}
              </div>

              {isAdminMode && onSetColorImage && (
                <div className="mt-3 p-3 rounded-2xl bg-[#faf8f5] border border-[#e6ddd3] flex flex-wrap items-center justify-between gap-2">
                  <span className="text-[11px] font-bold text-[#1f1917]">
                    صورة لون "{selectedColor.name}":
                  </span>
                  <div className="flex items-center gap-2">
                    <input
                      ref={colorFileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleColorImageFile}
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => colorFileInputRef.current?.click()}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#762b43] text-white text-[11px] font-bold cursor-pointer"
                    >
                      <ImagePlus className="w-3.5 h-3.5" />
                      <span>{hasDedicatedColorImg ? 'تغيير صورة اللون' : 'رفع صورة لهذا اللون'}</span>
                    </button>
                    {hasDedicatedColorImg && (
                      <button
                        type="button"
                        onClick={() => onSetColorImage(selectedColor.name, null)}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-full bg-rose-50 border border-rose-200 text-rose-700 text-[11px] font-bold cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>حذف</span>
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>

            {(isAdminMode || !product.hideSizing) && (
              <div className={`pt-3 border-t border-[#e6ddd3] space-y-3 ${product.hideSizing ? 'opacity-50' : ''}`}>
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-[#1f1917]">المقاس:</label>
                  {isAdminMode && onToggleField && (
                    <button
                      type="button"
                      onClick={() => onToggleField('hideSizing')}
                      className={`px-2.5 py-1 rounded-full text-[11px] font-bold cursor-pointer ${
                        product.hideSizing ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-700'
                      }`}
                    >
                      {product.hideSizing ? '+ إظهار للزبائن' : '✕ حذف وإخفاء'}
                    </button>
                  )}
                </div>
                {!product.hideSizing && (
                  <>
                    <div className="grid grid-cols-2 gap-2 p-1 rounded-full bg-[#f3eee8]">
                      {(['نسائي', 'رجالي'] as const).map((g) => (
                        <button
                          key={g}
                          type="button"
                          onClick={() => setGender(g)}
                          className={`py-2 rounded-full text-xs font-bold cursor-pointer ${
                            gender === g ? 'bg-white text-[#762b43] shadow-sm' : 'text-[#6e645e]'
                          }`}
                        >
                          {g}
                        </button>
                      ))}
                    </div>
                    <div className="grid grid-cols-5 gap-1.5">
                      {['XS', 'S', 'M', 'L', 'XL'].map((sz) => (
                        <button
                          key={sz}
                          type="button"
                          onClick={() => {
                            setStandardSize(sz);
                            setNumericSize('');
                          }}
                          className={`py-2 rounded-xl border text-xs font-bold cursor-pointer ${
                            !numericSize && standardSize === sz
                              ? 'bg-[#762b43] text-white border-[#762b43]'
                              : 'bg-[#faf8f5] text-[#1f1917] border-[#e6ddd3]'
                          }`}
                        >
                          {sz}
                        </button>
                      ))}
                    </div>
                    <div className="grid grid-cols-2 gap-2.5">
                      <input
                        type="number"
                        min={34}
                        max={70}
                                              value={numericSize}

                                onChange={(e) => setNumericSize(e.target.value)}
                        placeholder="رقم المقاس (34 - 70)"
                        className="w-full px-3 py-2 rounded-xl border border-[#e6ddd3] bg-[#faf8f5] text-xs"
                      />
                      <input
                        type="number"
                        min={80}
                        max={200}
                        value={fullLength}
                        onChange={(e) => setFullLength(e.target.value)}
                        placeholder="الطول (80 - 200 سم)"
                        className="w-full px-3 py-2 rounded-xl border border-[#e6ddd3] bg-[#faf8f5] text-xs"
                      />
                    </div>
                  </>
                )}
              </div>
            )}

            {product.category !== 'accessories' && (isAdminMode || !product.hideCapDetails) && (
              <div className={`pt-3 border-t border-[#e6ddd3] space-y-3 ${product.hideCapDetails ? 'opacity-50' : ''}`}>
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-[#1f1917]">القبعة وتفاصيلها:</label>
                  {isAdminMode && onToggleField && (
                    <button
                      type="button"
                      onClick={() => onToggleField('hideCapDetails')}
                      className={`px-2.5 py-1 rounded-full text-[11px] font-bold cursor-pointer ${
                        product.hideCapDetails ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-700'
                      }`}
                    >
                      {product.hideCapDetails ? '+ إظهار للزبائن' : '✕ حذف وإخفاء'}
                    </button>
                  )}
                </div>
                {!product.hideCapDetails && (
                  <>
                    <div className="grid grid-cols-3 gap-2">
                      {CAP_STYLES.map((cap) => {
                        const active = selectedCapStyle.id === cap.id;
                        return (
                          <button
                            key={cap.id}
                            type="button"
                            onClick={() => setSelectedCapStyle(cap)}
                            className={`p-2 rounded-2xl border text-center cursor-pointer flex flex-col items-center ${
                              active ? 'border-[#762b43] ring-2 ring-[#762b43]/20 bg-[#faf8f5]' : 'border-[#e6ddd3] bg-white'
                            }`}
                          >
                            <CapCardGraphic shape={cap.shape} />
                            <span className="mt-2 block text-[11px] font-extrabold text-[#1f1917] leading-tight">
                              {cap.label}
                            </span>
                            <span className="text-[11px] font-bold text-[#762b43] mt-0.5">{cap.priceText}</span>
                          </button>
                        );
                      })}
                    </div>

                    <div className="grid grid-cols-2 gap-2 p-1 rounded-full bg-[#f3eee8]">
                      <button
                        type="button"
                        onClick={() => setCapSameColor(true)}
                        className={`py-2 rounded-full text-xs font-bold cursor-pointer ${
                          capSameColor ? 'bg-white text-[#762b43] shadow-sm' : 'text-[#6e645e]'
                        }`}
                      >
                        نفس لون الوشاح
                      </button>
                      <button
                        type="button"
                        onClick={() => setCapSameColor(false)}
                        className={`py-2 rounded-full text-xs font-bold cursor-pointer ${
                          !capSameColor ? 'bg-white text-[#762b43] shadow-sm' : 'text-[#6e645e]'
                        }`}
                      >
                        لون آخر
                      </button>
                    </div>

                    {!capSameColor && (
                      <div className="flex flex-wrap items-center gap-2 p-2.5 rounded-xl bg-[#faf8f5] border border-[#e6ddd3]">
                        {CAP_SWATCHES.map((sw) => (
                          <button
                            key={sw.name}
                            type="button"
                            title={sw.name}
                            onClick={() => setCapCustomColor(sw)}
                            className={`w-6 h-6 rounded-full border cursor-pointer ${
                              capCustomColor.name === sw.name ? 'ring-2 ring-[#762b43] ring-offset-1 scale-110' : 'border-black/20'
                            }`}
                            style={{ backgroundColor: sw.hex }}
                          />
                        ))}
                        <span className="text-[11px] font-bold text-[#762b43] mr-1">{capCustomColor.name}</span>
                      </div>
                    )}

                    <input
                      type="number"
                      min={45}
                      max={70}
                      value={headSize}
                      onChange={(e) => setHeadSize(e.target.value)}
                      placeholder="محيط الرأس (اختياري، 45 - 70 سم)"
                      className="w-full px-3 py-2 rounded-xl border border-[#e6ddd3] bg-[#faf8f5] text-xs"
                    />

                    <div className="grid grid-cols-2 gap-2">
                      {(['سطح القبعة', 'جبهة القبعة'] as const).map((pos) => (
                        <button
                          key={pos}
                          type="button"
                          onClick={() => setCapEmbroideryPos(pos)}
                          className={`py-2 px-2.5 rounded-full border text-xs font-bold cursor-pointer ${
                            capEmbroideryPos === pos ? 'bg-[#762b43] text-white border-[#762b43]' : 'bg-white text-[#1f1917] border-[#e6ddd3]'
                          }`}
                        >
                          طرّز على {pos}
                        </button>
                      ))}
                    </div>

                    <input
                      type="text"
                      value={capNotes}
                      onChange={(e) => setCapNotes(e.target.value)}
                      placeholder="ملاحظات للقبعة..."
                      className="w-full px-3 py-2 rounded-xl border border-[#e6ddd3] bg-[#faf8f5] text-xs"
                    />
                  </>
                )}
              </div>
            )}

            <div className="pt-3 border-t border-[#e6ddd3] space-y-2.5">
              {(isAdminMode || !product.hideAmericanShawl) && (
                <div className={`p-3 rounded-2xl border border-[#e6ddd3] bg-[#faf8f5] space-y-2 ${product.hideAmericanShawl ? 'opacity-50' : ''}`}>
                  {isAdminMode && onToggleField && (
                    <div className="flex justify-end">
                      <button
                        type="button"
                        onClick={() => onToggleField('hideAmericanShawl')}
                        className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold cursor-pointer ${
                          product.hideAmericanShawl ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-700'
                        }`}
                      >
                        {product.hideAmericanShawl ? '+ إظهار الشال الأمريكي' : '✕ حذف الشال الأمريكي'}
                      </button>
                    </div>
                  )}
                  {!product.hideAmericanShawl && (
                    <label className="flex items-center justify-between cursor-pointer">
                      <span className="text-xs font-bold text-[#1f1917]">إضافة الشال الأمريكي V (+900 دج)</span>
                      <input
                        type="checkbox"
                        checked={addAmericanShawl}
                        onChange={(e) => setAddAmericanShawl(e.target.checked)}
                        className="w-4 h-4 accent-[#762b43]"
                      />
                    </label>
                  )}
                </div>
              )}

              <input
                type="text"
                value={customNotes}
                onChange={(e) => setCustomNotes(e.target.value)}
                placeholder="ملاحظات إضافية للوشاح أو التطريز..."
                className="w-full px-3 py-2.5 rounded-xl border border-[#e6ddd3] bg-[#faf8f5] text-xs"
              />
            </div>
          </div>

          <div className="pt-4 border-t border-[#e6ddd3] flex items-center justify-between gap-4">
            <div>
              <span className="text-[11px] text-[#6e645e] block">الإجمالي</span>
              <span className="text-2xl font-extrabold text-[#1f1917]">{displayPrice.toLocaleString('en-US')} دج</span>
            </div>
            <button
              type="button"
              onClick={handleAdd}
              className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-full bg-[#762b43] hover:bg-[#5e2135] text-white font-bold text-sm shadow-sm cursor-pointer"
            >
              {addedFeedback ? <Check className="w-4 h-4" /> : <ShoppingBag className="w-4 h-4" />}
              <span>{addedFeedback ? 'تمت الإضافة للسلة' : 'أضف إلى السلة'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
                
function ProductGridCard({
  product,
  isAdminMode,
  onSelect,
  onEdit,
  onDelete,
  onReplaceImage,
  onRemoveImage,
}: {
  product: Product;
  isAdminMode: boolean;
  onSelect: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onReplaceImage: (file: File) => void;
  onRemoveImage?: () => void;
}) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const minPrice =
    product.options.length > 0
      ? Math.min(...product.options.map((o) => o.price))
      : product.price;

  return (
    <div className="group bg-white border border-[#e6ddd3] rounded-3xl overflow-hidden shadow-xs hover:shadow-md transition-all flex flex-col">
      <div
        onClick={onSelect}
        className="relative aspect-[4/5] bg-[#faf8f5] overflow-hidden cursor-pointer"
      >
        <img
          src={product.imageUrl}
          alt={product.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        {product.badge && (
          <span className="absolute top-3 right-3 px-2.5 py-1 rounded-full bg-[#762b43] text-white text-[10px] font-bold shadow">
            {product.badge}
          </span>
        )}
      </div>

      <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
        <div onClick={onSelect} className="cursor-pointer">
          <h3 className="text-sm font-extrabold text-[#1f1917] line-clamp-1 group-hover:text-[#762b43] transition-colors">
            {product.title}
          </h3>
          <p className="text-xs text-[#6e645e] line-clamp-2 mt-1 leading-relaxed">
            {product.description}
          </p>
        </div>

        <div className="pt-2 border-t border-[#f3eee8] flex items-center justify-between gap-2">
          <span className="text-sm font-extrabold text-[#762b43]">
            {minPrice.toLocaleString('en-US')} دج
          </span>
          <button
            type="button"
            onClick={onSelect}
            className="inline-flex items-center gap-1 px-3.5 py-1.5 rounded-full bg-[#faf8f5] hover:bg-[#762b43] text-[#1f1917] hover:text-white border border-[#e6ddd3] text-xs font-bold transition-colors cursor-pointer"
          >
            <span>تخصيص</span>
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>
        </div>

        {isAdminMode && (
          <div className="pt-2 border-t border-[#e6ddd3] flex items-center justify-between gap-1.5">
            <input
              ref={inputRef}
              type="file"
              accept="image/*"
              onChange={(e) => {
                const f = e.target.files?.item(0);
                if (f) onReplaceImage(f);
                e.target.value = '';
              }}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              title="تغيير الصورة"
              className="p-1.5 rounded-lg bg-[#faf8f5] border border-[#e6ddd3] text-[#1f1917] hover:border-[#762b43] cursor-pointer"
            >
              <ImagePlus className="w-3.5 h-3.5 text-[#762b43]" />
            </button>
            {onRemoveImage && (
              <button
                type="button"
                onClick={onRemoveImage}
                title="إزالة الصورة"
                className="p-1.5 rounded-lg bg-[#faf8f5] border border-[#e6ddd3] text-[#6e645e] hover:text-rose-600 cursor-pointer"
              >
                <ImageOff className="w-3.5 h-3.5" />
              </button>
            )}
            <button
              type="button"
              onClick={onEdit}
              title="تعديل"
              className="p-1.5 rounded-lg bg-[#faf8f5] border border-[#e6ddd3] text-[#1f1917] hover:border-[#762b43] cursor-pointer"
            >
              <Pencil className="w-3.5 h-3.5 text-[#762b43]" />
            </button>
            <button
              type="button"
              onClick={onDelete}
              title="حذف المنتج"
              className="p-1.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 hover:bg-rose-100 cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export function ProductCatalog({
  products,
  isAdminMode,
  onAddToCart,
  onOpenAddProduct,
  onEditProduct,
  onDeleteProduct,
  onReplaceProductImage,
  onSetProductColorImage,
  onToggleProductField,
  onRemoveProductImage,
}: ProductCatalogProps) {
  const [activeCategory, setActiveCategory] = useState<CategoryId | null>(null);
  const [activeBranch, setActiveBranch] = useState<string>('الكل');
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);

  const selectedProduct = selectedProductId
    ? products.find((p) => p.id === selectedProductId) ?? null
    : null;

  if (selectedProduct) {
    return (
      <section id="catalog" className="py-10 px-4">
        <ProductDetailView
          product={selectedProduct}
          isAdminMode={isAdminMode}
          onBack={() => setSelectedProductId(null)}
          onAddToCart={onAddToCart}
          onEditProduct={onEditProduct}
          onDeleteProduct={onDeleteProduct}
          onReplaceProductImage={onReplaceProductImage}
          onSetColorImage={
            onSetProductColorImage
              ? (colorName, file) => onSetProductColorImage(selectedProduct.id, colorName, file)
              : undefined
          }
          onToggleField={(field) => onToggleProductField?.(selectedProduct.id, field)}
        />
      </section>
    );
  }

  if (activeCategory) {
    const branches = CATEGORY_BRANCHES[activeCategory] ?? [];
    const categoryProducts = products.filter((p) => p.category === activeCategory);
    const filteredProducts =
      activeBranch === 'الكل'
        ? categoryProducts
        : categoryProducts.filter((p) => p.branch === activeBranch);

    return (
      <section id="catalog" className="py-10 px-4 max-w-6xl mx-auto space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => {
              setActiveCategory(null);
              setActiveBranch('الكل');
            }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-[#e6ddd3] text-xs font-bold text-[#1f1917] hover:border-[#762b43] cursor-pointer"
          >
            <ArrowRight className="w-4 h-4 text-[#762b43]" />
            <span>العودة إلى الأقسام الرئيسية</span>
          </button>

          {isAdminMode && (
            <button
              type="button"
              onClick={() => onOpenAddProduct(activeCategory)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#762b43] text-white text-xs font-bold shadow-sm hover:bg-[#5e2135] cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>إضافة قطعة جديدة</span>
            </button>
          )}
        </div>

        <div className="space-y-2">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-[#1f1917]">
            {CATEGORY_LABELS[activeCategory]}
          </h2>
          <div className="flex flex-wrap gap-2 pt-2">
            {['الكل', ...branches].map((br) => (
              <button
                key={br}
                type="button"
                onClick={() => setActiveBranch(br)}
                className={`px-4 py-1.5 rounded-full text-xs font-bold border transition-colors cursor-pointer ${
                  activeBranch === br
                    ? 'bg-[#762b43] text-white border-[#762b43]'
                    : 'bg-white text-[#1f1917] border-[#e6ddd3] hover:border-[#762b43]'
                }`}
              >
                {br}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
          {filteredProducts.map((product) => (
            <ProductGridCard
              key={product.id}
              product={product}
              isAdminMode={isAdminMode}
              onSelect={() => setSelectedProductId(product.id)}
              onEdit={() => onEditProduct(product)}
              onDelete={() => onDeleteProduct(product.id)}
              onReplaceImage={(file) => onReplaceProductImage(product.id, file)}
              onRemoveImage={
                onRemoveProductImage ? () => onRemoveProductImage(product.id) : undefined
              }
            />
          ))}
        </div>
      </section>
    );
  }

  

  return (
    <section id="catalog" className="py-12 px-4 max-w-6xl mx-auto space-y-8">
      <div className="text-center max-w-2xl mx-auto space-y-2">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#faf8f5] border border-[#e6ddd3] text-xs font-bold text-[#762b43]">
          <Sparkles className="w-3.5 h-3.5" />
          <span>تشكيلة التخرج الفاخرة</span>
        </span>
        <h2 className="text-2xl sm:text-4xl font-extrabold text-[#1f1917]">
          اختر إطلالة تخرجك
        </h2>
        <p className="text-sm text-[#6e645e]">
          تصفّح أقسام الأوشحة، الأرواب، وباقات التخرج وصمّم كل تفصيلة على ذوقك.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {MAIN_SECTIONS.map((sec) => {
          const firstItem = products.find((p) => p.category === sec.id);
          const coverImg = firstItem?.imageUrl || sec.fallbackImg;

          return (
            <div
              key={sec.id}
              onClick={() => {
                setActiveCategory(sec.id);
                setActiveBranch('الكل');
              }}
              className="group bg-white border border-[#e6ddd3] rounded-3xl overflow-hidden shadow-xs hover:shadow-lg transition-all cursor-pointer flex flex-col"
            >
              <div className="relative aspect-[4/5] bg-[#faf8f5] overflow-hidden">
                <img
                  src={coverImg}
                  alt={sec.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <span className="absolute bottom-3 right-3 px-3 py-1 rounded-full bg-white/95 border border-[#e6ddd3] text-xs font-extrabold text-[#762b43] shadow-xs">
                  {sec.priceLabel}
                </span>
              </div>
              <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
                <div>
                  <h3 className="text-xl font-extrabold text-[#1f1917] group-hover:text-[#762b43] transition-colors">
                    {sec.title}
                  </h3>
                  <p className="text-xs text-[#6e645e] leading-relaxed mt-1.5">
                    {sec.subtitle}
                  </p>
                </div>
                <span className="inline-flex items-center justify-between w-full px-4 py-2.5 rounded-full bg-[#faf8f5] group-hover:bg-[#762b43] text-[#1f1917] group-hover:text-white border border-[#e6ddd3] text-xs font-bold transition-colors">
                  <span>{sec.buttonText}</span>
                  <ChevronLeft className="w-4 h-4" />
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

                        
                      
    
                
