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
  Trash2,
} from 'lucide-react';
import {
  BOUQUET_IMAGE_PATH,
  CAP_SWATCHES,
  CATEGORY_BRANCHES,
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
    onUpdateProductAddon?: (
    productId: string,
    addon: { title: string; subtitle: string; price: number }
  ) => void;

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
        <path d="M35 135 C35 112, 85 112, 85 135 Z" fill="#ffffff" />
        <rect x="52" y="92" width="16" height="24" rx="6" fill="#ffffff" />
        <ellipse cx="60" cy="76" rx="18" ry="23" fill="#ffffff" />
        <path d="M41 56 Q60 66 79 56 L77 65 Q60 74 43 65 Z" fill="#1c1917" />
        {shape === 'round' && <ellipse cx="60" cy="49" rx="34" ry="12" fill="#292524" />}
        {shape === 'triangle' && <polygon points="60,34 98,50 60,64 22,50" fill="#292524" />}
        {shape === 'tuxedo' && (
          <>
            <polygon points="60,33 98,49 60,63 22,49" fill="#18181b" />
            <path d="M43 63 Q60 72 77 63" stroke="#d4af37" strokeWidth="2.5" fill="none" />
          </>
        )}
        <circle cx="60" cy="49" r="2.5" fill="#d4af37" />
        <path d="M60 49 L85 56 L85 84" stroke="#d4af37" strokeWidth="2.2" fill="none" />
        <rect x="82.5" y="81" width="5" height="12" rx="2" fill="#d4af37" />
      </svg>
    </div>
  );
}
function ProductDetailView({
  product,
  sectionTitle,
  isAdminMode,
  onBackToHome,
  onBackToSection,
  onAddToCart,
  onSetColorImage,
  onToggleField,
    onUpdateAddon,

}: {
  product: Product;
  sectionTitle: string;
  isAdminMode: boolean;
  onBackToHome: () => void;
  onBackToSection: () => void;
  onAddToCart: (item: Omit<CartItem, 'id' | 'quantity'>) => void;
  onSetColorImage?: (colorName: string, file: File | null) => void;
  onToggleField?: (field: 'hideSizing' | 'hideCapDetails' | 'hideAmericanShawl') => void;
    onUpdateAddon?: (addon: { title: string; subtitle: string; price: number }) => void;

}) {
  const [selectedOptionIdx, setSelectedOptionIdx] = useState(0);
  const [selectedSecondary, setSelectedSecondary] = useState(
    product.secondaryOptions?.at(0) || ''
  );
  const [selectedColor, setSelectedColor] = useState(CAP_SWATCHES.at(0)!);
  const [selectedCapStyle, setSelectedCapStyle] = useState(CAP_STYLES.at(0)!);

  const [gender, setGender] = useState<'نسائي' | 'رجالي'>('نسائي');
  const [standardSize, setStandardSize] = useState('M');
  const [numericSize, setNumericSize] = useState('');
  const [fullLength, setFullLength] = useState('');
  const [shoulderAndSleeve, setShoulderAndSleeve] = useState('');

  const [capSameColor, setCapSameColor] = useState(true);
  const [capCustomColor, setCapCustomColor] = useState(CAP_SWATCHES.at(0)!);
  const [headSize, setHeadSize] = useState('');
  const [capEmbroideryPos, setCapEmbroideryPos] = useState<'سطح القبعة' | 'جبهة القبعة'>('سطح القبعة');
  const [capNotes, setCapNotes] = useState('');

  const [addAmericanShawl, setAddAmericanShawl] = useState(false);
  const [customNotes, setCustomNotes] = useState('');
  const colorFileRef = useRef<HTMLInputElement>(null);

  const activeOption = product.options[selectedOptionIdx];
  const basePrice = activeOption ? activeOption.price : product.basePrice;
  const showCapSection =
    product.category !== 'accessories' &&
    product.category !== 'cap' &&
    !product.hideCapDetails;
  const capStyleSurcharge = showCapSection ? selectedCapStyle.extraPrice : 0;
  const tuxedoSurcharge = selectedSecondary.includes('+100') ? 100 : 0;
  const americanShawlSurcharge = !product.hideAmericanShawl && addAmericanShawl ? 900 : 0;
  const displayPrice = basePrice + capStyleSurcharge + tuxedoSurcharge + americanShawlSurcharge;

  const activeImageUrl = product.colorImages?.[selectedColor.name] || product.imageUrl;
  const hasDedicatedColorImg = Boolean(product.colorImages?.[selectedColor.name]);

  const handleColorFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.item(0);
    if (file && onSetColorImage) {
      onSetColorImage(selectedColor.name, file);
      e.target.value = '';
    }
  };

  const handleAdd = () => {
    const detailParts: string[] = [];
    if (activeOption) detailParts.push(activeOption.label);
    if (selectedSecondary) detailParts.push(selectedSecondary);
    if (selectedColor) detailParts.push(`اللون: ${selectedColor.name}`);

    if (!product.hideSizing) {
      detailParts.push(`الفئة: ${gender}`);
      if (numericSize.trim()) {
        detailParts.push(`المقاس: ${numericSize.trim()}`);
      } else {
        detailParts.push(`المقاس: ${standardSize}`);
      }
      if (fullLength.trim()) detailParts.push(`الطول: ${fullLength.trim()} سم`);
      if (shoulderAndSleeve.trim()) detailParts.push(`الكتف/الكم: ${shoulderAndSleeve.trim()}`);
    }

    if (showCapSection) {
      detailParts.push(`شكل القبعة: ${selectedCapStyle.label}`);
      const finalCapColor = capSameColor ? selectedColor.name : capCustomColor.name;
      detailParts.push(`لون القبعة: ${finalCapColor}`);
      if (headSize.trim()) detailParts.push(`محيط الرأس: ${headSize.trim()} سم`);
      detailParts.push(`تطريز القبعة: ${capEmbroideryPos}`);
      if (capNotes.trim()) detailParts.push(`ملاحظة القبعة: ${capNotes.trim()}`);
    }

    if (!product.hideAmericanShawl && addAmericanShawl) detailParts.push('+ شال أمريكي V');
    if (customNotes.trim()) detailParts.push(`ملاحظة: ${customNotes.trim()}`);

    onAddToCart({
      category: product.category,
      title: product.name,
      details: detailParts.join(' · '),
      unitPrice: displayPrice,
    });
  };
  return (
    <div className="bg-white border border-[#e6ddd3] rounded-3xl overflow-hidden shadow-sm">
      <div className="px-5 py-3.5 bg-[#faf8f5] border-b border-[#e6ddd3] flex flex-wrap items-center justify-between gap-2 text-xs font-bold text-[#6e645e]">
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={onBackToHome}
            className="hover:text-[#762b43] underline cursor-pointer"
          >
            الرئيسية
          </button>
          <ChevronLeft className="w-3.5 h-3.5" />
          <button
            type="button"
            onClick={onBackToSection}
            className="hover:text-[#762b43] underline cursor-pointer"
          >
            {sectionTitle}
          </button>
          <ChevronLeft className="w-3.5 h-3.5" />
          <span className="text-[#1f1917]">{product.name}</span>
        </div>

        <button
          type="button"
          onClick={onBackToSection}
          className="inline-flex items-center gap-1 text-[#762b43] hover:underline cursor-pointer"
        >
          <ArrowRight className="w-3.5 h-3.5" />
          <span>رجوع للقسم</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-5 sm:p-8">
        <div className="relative aspect-[3/4] rounded-2xl bg-[#faf8f5] overflow-hidden border border-[#e6ddd3]">
          {activeImageUrl ? (
            <>
              <img
                src={activeImageUrl}
                alt={product.name}
                className="w-full h-full object-cover transition-all duration-300"
              />
              <div className="absolute bottom-3 right-3 inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/95 backdrop-blur-sm border border-[#e6ddd3] shadow-sm text-xs font-bold text-[#1f1917]">
                <span
                  className="w-3.5 h-3.5 rounded-full border border-black/15"
                  style={{ backgroundColor: selectedColor.hex }}
                />
                <span>اللون: {selectedColor.name}</span>
              </div>
            </>
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center">
              <ShoppingBag className="w-10 h-10 text-[#762b43] mb-2 opacity-75" />
              <span className="font-editorial text-lg font-bold text-[#1f1917]">
                {product.name}
              </span>
            </div>
          )}
        </div>

        <div className="flex flex-col justify-between space-y-5">
          <div className="space-y-4">
            <div>
              <span className="inline-block text-xs font-bold text-[#762b43] mb-1">
                {product.branch}
              </span>
              <h3 className="font-editorial text-2xl sm:text-3xl font-bold text-[#1f1917]">
                {product.name}
              </h3>
              <p className="text-xl font-extrabold text-[#762b43] mt-1.5">
                {displayPrice.toLocaleString('en-US')} دج
              </p>
              <p className="text-sm text-[#6e645e] leading-relaxed mt-2">
                {product.description}
              </p>
            </div>

            {product.options.length > 0 && (
              <div>
                <label className="block text-xs font-bold text-[#1f1917] mb-2">
                  اختر القماش أو المقاس:
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {product.options.map((opt, idx) => {
                    const active = idx === selectedOptionIdx;
                    return (
                      <button
                        key={opt.label}
                        type="button"
                        onClick={() => setSelectedOptionIdx(idx)}
                        className={`p-3 rounded-2xl border text-right transition-all cursor-pointer ${
                          active ? 'border-[#762b43] bg-[#faf8f5]' : 'border-[#e6ddd3] bg-white'
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
            {product.secondaryOptions && product.secondaryOptions.length > 0 && (
              <div>
                <label className="block text-xs font-bold text-[#1f1917] mb-2">خيار إضافي:</label>
                <div className="flex flex-wrap gap-2">
                  {product.secondaryOptions.map((sec) => {
                    const active = sec === selectedSecondary;
                    return (
                      <button
                        key={sec}
                        type="button"
                        onClick={() => setSelectedSecondary(sec)}
                        className={`px-3 py-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                          active
                            ? 'bg-[#1f1917] text-white border-[#1f1917]'
                            : 'bg-[#faf8f5] text-[#1f1917] border-[#e6ddd3] hover:border-[#1f1917]'
                        }`}
                      >
                        {sec}
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
              <div className="flex flex-wrap items-center gap-2.5">
                {CAP_SWATCHES.map((swatch) => {
                  const isActive = swatch.name === selectedColor.name;
                  const hasPhoto = Boolean(product.colorImages?.[swatch.name]);
                  return (
                    <button
                      key={swatch.name}
                      type="button"
                      title={swatch.name}
                      onClick={() => setSelectedColor(swatch)}
                      className={`relative w-8 h-8 rounded-full border flex items-center justify-center transition-transform cursor-pointer ${
                        isActive
                          ? 'ring-2 ring-[#762b43] ring-offset-2 scale-110 border-[#762b43]'
                          : 'border-[#d6cdc2]'
                      }`}
                      style={{ backgroundColor: swatch.hex }}
                    >
                      {isActive && (
                        <Check
                          className={`w-4 h-4 ${
                            swatch.hex === '#f5f5f4' || swatch.hex === '#e7d8c9' || swatch.hex === '#9ca3af'
                              ? 'text-[#1f1917]'
                              : 'text-white'
                          }`}
                        />
                      )}
                      {hasPhoto && !isActive && (
                        <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 border border-white" />
                      )}
                    </button>
                  );
                })}
              </div>

              {isAdminMode && (
                <div className="mt-3 p-3 rounded-xl bg-[#faf8f5] border border-[#e6ddd3] flex flex-wrap items-center justify-between gap-2">
                  <input
                    ref={colorFileRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleColorFileChange}
                  />
                  <span className="text-xs font-bold text-[#1f1917]">
                    صورة لون "{selectedColor.name}":
                  </span>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => colorFileRef.current?.click()}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#762b43] text-white text-xs font-bold cursor-pointer"
                    >
                      <ImagePlus className="w-3.5 h-3.5" />
                      <span>{hasDedicatedColorImg ? 'تغيير صورة اللون' : 'رفع صورة لهذا اللون'}</span>
                    </button>
                    {hasDedicatedColorImg && (
                      <button
                        type="button"
                        onClick={() => onSetColorImage?.(selectedColor.name, null)}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-white text-red-600 border border-red-200 text-xs font-bold cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>حذف</span>
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
            {/* المقاسات التفصيلية */}
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
                          className={`py-2 rounded-full text-xs font-bold transition-all cursor-pointer ${
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
                      <div>
                        <label className="block text-[11px] font-bold text-[#6e645e] mb-1">
                          أو رقم مقاسك (34 - 70):
                        </label>
                        <input
                          type="number"
                          min={34}
                          max={70}
                          value={numericSize}
                          onChange={(e) => setNumericSize(e.target.value)}
                          placeholder="44 - 70"
                          className="w-full px-3 py-2 rounded-xl border border-[#e6ddd3] bg-[#faf8f5] text-xs"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-[#6e645e] mb-1">
                          الطول الكامل (80 - 200 سم):
                        </label>
                        <input
                          type="number"
                          min={80}
                          max={200}
                          value={fullLength}
                          onChange={(e) => setFullLength(e.target.value)}
                          placeholder="سم"
                          className="w-full px-3 py-2 rounded-xl border border-[#e6ddd3] bg-[#faf8f5] text-xs"
                        />
                      </div>
                    </div>

                    <input
                      type="text"
                      value={shoulderAndSleeve}
                      onChange={(e) => setShoulderAndSleeve(e.target.value)}
                      placeholder="عرض الكتفين وطول الكم (اختياري)..."
                      className="w-full px-3 py-2 rounded-xl border border-[#e6ddd3] bg-[#faf8f5] text-xs"
                    />
                  </>
                )}
              </div>
            )}
                        {/* تفاصيل القبعة والتطريز */}
            {product.category !== 'accessories' && product.category !== 'cap' && (isAdminMode || !product.hideCapDetails) && (
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
                              active
                                ? 'border-[#762b43] ring-2 ring-[#762b43]/20 bg-[#faf8f5]'
                                : 'border-[#e6ddd3] bg-white'
                            }`}
                          >
                            <CapCardGraphic shape={cap.shape} />
                            <span className="mt-2 block text-[11px] font-extrabold text-[#1f1917] leading-tight">
                              {cap.label}
                            </span>
                            <span className="text-[11px] font-bold text-[#762b43] mt-0.5">
                              {cap.priceText}
                            </span>
                          </button>
                        );
                      })}
                    </div>

                    <label className="block text-xs font-bold text-[#1f1917] pt-1">لون القبعة:</label>
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
                              capCustomColor.name === sw.name
                                ? 'ring-2 ring-[#762b43] ring-offset-1 scale-110'
                                : 'border-black/20'
                            }`}
                            style={{ backgroundColor: sw.hex }}
                          />
                        ))}
                        <span className="text-[11px] font-bold text-[#762b43] mr-1">
                          {capCustomColor.name}
                        </span>
                      </div>
                    )}

                    <div>
                      <label className="block text-xs font-bold text-[#1f1917] mb-1">
                        محيط الرأس (اختياري، 45 - 70 سم):
                      </label>
                      <input
                        type="number"
                        min={45}
                        max={70}
                        value={headSize}
                        onChange={(e) => setHeadSize(e.target.value)}
                        placeholder="45 - 70 سم"
                        className="w-full px-3 py-2 rounded-xl border border-[#e6ddd3] bg-[#faf8f5] text-xs"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      {(['سطح القبعة', 'جبهة القبعة'] as const).map((pos) => (
                        <button
                          key={pos}
                          type="button"
                          onClick={() => setCapEmbroideryPos(pos)}
                          className={`py-2 px-2.5 rounded-full border text-xs font-bold cursor-pointer ${
                            capEmbroideryPos === pos
                              ? 'bg-[#762b43] text-white border-[#762b43]'
                              : 'bg-white text-[#1f1917] border-[#e6ddd3]'
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
                      placeholder="ملاحظات للقبعة (مثلاً: الاسم على الجبهة بخيط ذهبي)..."
                      className="w-full px-3 py-2 rounded-xl border border-[#e6ddd3] bg-[#faf8f5] text-xs"
                    />
                  </>
                )}
              </div>
            )}

            {/* إضافات اختيارية وملاحظات عامة */}
            <div className="pt-3 border-t border-[#e6ddd3] space-y-2.5">
              {(isAdminMode || !product.hideAmericanShawl) && (
                <div className={`p-3 rounded-2xl border border-[#e6ddd3] bg-[#faf8f5] space-y-2 ${product.hideAmericanShawl ? 'opacity-50' : ''}`}>
                                    {isAdminMode && (
                    <div className="flex flex-wrap items-center justify-end gap-1.5">
                      {onUpdateAddon && !product.hideAmericanShawl && (
                        <button
                          type="button"
                          onClick={() => {
                            setAddonTitleDraft(
                              product.americanShawlTitle ?? 'إضافة الشال الأمريكي V'
                            );
                            setAddonSubtitleDraft(
                              product.americanShawlSubtitle ?? 'يُلبس على الكتفين ويتدلى بأناقة'
                            );
                            setAddonPriceDraft(String(product.americanShawlPrice ?? 900));
                            setIsEditingAddon((prev) => !prev);
                          }}
                          className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-900 cursor-pointer"
                        >
                          {isEditingAddon ? 'إلغاء' : '✎ تعديل النص والسعر'}
                        </button>
                      )}
                      {onToggleField && (
                        <button
                          type="button"
                          onClick={() => onToggleField('hideAmericanShawl')}
                          className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold cursor-pointer ${
                            product.hideAmericanShawl
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-rose-100 text-rose-700'
                          }`}
                        >
                          {product.hideAmericanShawl
                            ? '+ إظهار الإضافة'
                            : '✕ حذف وإخفاء'}
                        </button>
                      )}
                    </div>
                  )}

                  {isAdminMode && isEditingAddon && !product.hideAmericanShawl && (
                    <div className="p-2.5 rounded-xl bg-white border border-[#e6ddd3] space-y-2">
                      <input
                        type="text"
                        value={addonTitleDraft}
                        onChange={(e) => setAddonTitleDraft(e.target.value)}
                        placeholder="عنوان الإضافة..."
                        className="w-full px-2.5 py-1.5 rounded-lg border border-[#e6ddd3] text-xs font-bold"
                      />
                      <input
                        type="text"
                        value={addonSubtitleDraft}
                        onChange={(e) => setAddonSubtitleDraft(e.target.value)}
                        placeholder="الوصف الفرعي..."
                        className="w-full px-2.5 py-1.5 rounded-lg border border-[#e6ddd3] text-xs"
                      />
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          min={0}
                          value={addonPriceDraft}
                          onChange={(e) => setAddonPriceDraft(e.target.value)}
                          placeholder="السعر (دج)"
                          className="w-28 px-2.5 py-1.5 rounded-lg border border-[#e6ddd3] text-xs font-bold"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            onUpdateAddon?.({
                              title: addonTitleDraft.trim() || 'إضافة الشال الأمريكي V',
                              subtitle: addonSubtitleDraft.trim(),
                              price: Math.max(0, Number(addonPriceDraft) || 0),
                            });
                            setIsEditingAddon(false);
                          }}
                          className="px-3 py-1.5 rounded-lg bg-[#762b43] text-white text-xs font-bold cursor-pointer"
                        >
                          تطبيق
                        </button>
                      </div>
                    </div>
                  )}

                  {!product.hideAmericanShawl && (
                    <label className="flex items-center justify-between cursor-pointer">
                      <div>
                        <span className="block text-xs font-bold text-[#1f1917]">
                          {product.americanShawlTitle ?? 'إضافة الشال الأمريكي V'} (+
                          {effectiveAddonPrice.toLocaleString('en-US')} دج)
                        </span>
                        {(product.americanShawlSubtitle ?? 'يُلبس على الكتفين ويتدلى بأناقة') && (
                          <span className="text-[11px] text-[#6e645e]">
                            {product.americanShawlSubtitle ?? 'يُلبس على الكتفين ويتدلى بأناقة'}
                          </span>
                        )}
                      </div>
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
          </div>
      

          <div className="pt-4 border-t border-[#e6ddd3] flex items-center justify-between gap-4">
            <div>
              <span className="block text-xs text-[#6e645e]">الإجمالي</span>
              <span className="text-2xl font-extrabold text-[#1f1917]">
                {displayPrice.toLocaleString('en-US')} دج
              </span>
            </div>

            <button
              type="button"
              onClick={handleAdd}
              className="flex-1 max-w-xs inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-full bg-[#762b43] hover:bg-[#581e31] text-white text-sm font-bold shadow-md transition-colors cursor-pointer"
            >
              <ShoppingBag className="w-4 h-4" />
              <span>أضف إلى السلة</span>
            </button>
          </div>
        </div>
      </div>
    
  );
}
function SectionCard({
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
  onRemoveImage: () => void;
}) {
  const [imgError, setImgError] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.item(0);
    if (file) {
      setImgError(false);
      onReplaceImage(file);
      e.target.value = '';
    }
  };

  const handleConfirmDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm(`هل أنتِ متأكدة من حذف هذا الموديل نهائياً؟\n\n"${product.name}"`)) {
      onDelete();
    }
  };

  const hasValidImage = Boolean(product.imageUrl) && !imgError;

  return (
    <article
      onClick={onSelect}
      className="group bg-white border border-[#e6ddd3] rounded-2xl overflow-hidden flex flex-col cursor-pointer transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
    >
      <div className="relative aspect-[4/3] w-full bg-[#f3eee8] overflow-hidden">
        {hasValidImage ? (
          <img
            src={product.imageUrl}
            alt={product.name}
            referrerPolicy="no-referrer"
            onError={() => setImgError(true)}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center p-5 text-center bg-gradient-to-br from-[#f3eee8] to-[#ebe2d8]">
            <ShoppingBag className="w-7 h-7 text-[#762b43] mb-2 opacity-80" />
            <span className="font-editorial text-sm font-bold text-[#1f1917]">
              {product.name}
            </span>
            {isAdminMode && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  fileInputRef.current?.click();
                }}
                className="mt-2.5 inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#762b43] text-white text-xs font-bold shadow-sm cursor-pointer"
              >
                <ImagePlus className="w-3.5 h-3.5" />
                <span>إضافة صورة</span>
              </button>
            )}
          </div>
        )}
        {isAdminMode && (
          <div
            onClick={(e) => e.stopPropagation()}
            className="absolute top-2 left-2 right-2 flex flex-wrap items-center justify-between gap-1 z-10"
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleImageChange}
            />
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-white/95 text-[#1f1917] border border-[#e6ddd3] text-[11px] font-bold shadow-sm hover:bg-[#f3eee8] cursor-pointer"
              >
                <ImagePlus className="w-3 h-3 text-[#762b43]" />
                <span>{hasValidImage ? 'تغيير' : 'إضافة'}</span>
              </button>

              {hasValidImage && (
                <button
                  type="button"
                  onClick={onRemoveImage}
                  className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-white/95 text-amber-800 border border-amber-200 text-[11px] font-bold shadow-sm hover:bg-amber-50 cursor-pointer"
                >
                  <ImageOff className="w-3 h-3" />
                  <span>حذف الصورة</span>
                </button>
              )}
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={onEdit}
                className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-white/95 text-[#1f1917] border border-[#e6ddd3] text-[11px] font-bold shadow-sm hover:bg-[#f3eee8] cursor-pointer"
              >
                <Pencil className="w-3 h-3" />
                <span>تعديل</span>
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-red-600 text-white text-[11px] font-bold shadow-sm hover:bg-red-700 cursor-pointer"
              >
                <Trash2 className="w-3 h-3" />
                <span>حذف</span>
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="p-4 text-center flex-1 flex flex-col justify-between">
        <div>
          <h3 className="font-editorial text-lg font-bold text-[#1f1917] leading-snug">
            {product.name}
          </h3>
          <p className="text-xs sm:text-sm font-extrabold text-[#762b43] mt-1">
            من {product.basePrice.toLocaleString('en-US')} دج
          </p>
          <p className="text-[11px] text-[#6e645e] mt-0.5">{product.branch}</p>
        </div>

        <div className="mt-3 pt-2.5 border-t border-[#f3eee8]">
          <span className="inline-flex items-center gap-1 text-xs font-bold text-[#762b43] group-hover:underline">
            <span>اختيار اللون والمقاس</span>
            <ChevronLeft className="w-3.5 h-3.5" />
          </span>
        </div>
      </div>
    </article>
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
  onRemoveProductImage,
  onSetProductColorImage,
  onToggleProductField,
}: ProductCatalogProps) {
  const [selectedSection, setSelectedSection] = useState<CategoryId | null>(null);
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [activeBranch, setActiveBranch] = useState<string>('الكل');

  useEffect(() => {
    const handlePopState = (event: PopStateEvent) => {
      const state = event.state;
      if (state && state.catalogLevel === 'product') {
        setSelectedSection(state.section || null);
        setSelectedProductId(state.productId || null);
      } else if (state && state.catalogLevel === 'section') {
        setSelectedSection(state.section || null);
        setSelectedProductId(null);
      } else {
        setSelectedSection(null);
        setSelectedProductId(null);
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const handleOpenSection = (cat: CategoryId) => {
    window.history.pushState({ catalogLevel: 'section', section: cat }, '');
    setSelectedSection(cat);
    setSelectedProductId(null);
    setActiveBranch('الكل');
  };

  const handleOpenProduct = (productId: string) => {
    window.history.pushState(
      { catalogLevel: 'product', section: selectedSection, productId },
      ''
    );
    setSelectedProductId(productId);
  };

  const handleBackToHome = () => {
    setSelectedSection(null);
    setSelectedProductId(null);
    setActiveBranch('الكل');
  };

  const activeSectionMeta = MAIN_SECTIONS.find((s) => s.id === selectedSection);
  const selectedProduct = products.find((p) => p.id === selectedProductId) || null;

  const sectionProducts = products.filter((p) => {
    if (!selectedSection) return false;
    if (selectedSection === 'accessories') {
      return p.category === 'accessories' || p.category === 'cap';
    }
    return p.category === selectedSection;
  });

  const branches =
    selectedSection && CATEGORY_BRANCHES[selectedSection]
      ? CATEGORY_BRANCHES[selectedSection]
      : [];

  const filteredProducts = sectionProducts.filter((p) => {
    if (activeBranch !== 'الكل' && p.branch !== activeBranch) return false;
    return true;
  });
  return (
    <section id="catalog-sec" className="py-12 sm:py-16 border-b border-[#e6ddd3]">
      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        {selectedProduct && activeSectionMeta ? (
          <ProductDetailView
            product={selectedProduct}
            sectionTitle={activeSectionMeta.title}
            onBackToHome={handleBackToHome}
            onBackToSection={() => setSelectedProductId(null)}
            onAddToCart={onAddToCart}
            isAdminMode={isAdminMode}
            onSetColorImage={(colorName, file) =>
              onSetProductColorImage?.(selectedProduct.id, colorName, file)
            }
            onToggleField={(field) => onToggleProductField?.(selectedProduct.id, field)}
                      onUpdateAddon={(addon) =>
            onUpdateProductAddon?.(selectedProduct.id, addon)
          }

          />
        ) : selectedSection && activeSectionMeta ? (
      
          <div>
            <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
              <div className="flex items-center gap-1.5 text-xs font-bold text-[#6e645e]">
                <button
                  type="button"
                  onClick={handleBackToHome}
                  className="hover:text-[#762b43] underline cursor-pointer"
                >
                  الرئيسية
                </button>
                <ChevronLeft className="w-3.5 h-3.5" />
                <span className="text-[#1f1917]">{activeSectionMeta.title}</span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleBackToHome}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-white border border-[#e6ddd3] text-xs font-bold text-[#1f1917] hover:bg-[#f3eee8] cursor-pointer"
                >
                  <ArrowRight className="w-3.5 h-3.5" />
                  <span>كل الأقسام</span>
                </button>

                {isAdminMode && (
                  <button
                    type="button"
                    onClick={() => onOpenAddProduct(selectedSection)}
                    className="inline-flex items-center gap-1 px-3.5 py-1.5 rounded-lg bg-[#1f1917] text-white text-xs font-bold cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>إضافة قطعة للقسم</span>
                  </button>
                )}
              </div>
            </div>

            <div className="mb-6">
              <h2 className="font-editorial text-3xl sm:text-4xl font-bold text-[#1f1917]">
                {activeSectionMeta.title}
              </h2>
              <p className="text-sm text-[#6e645e] mt-1.5 max-w-xl">
                {activeSectionMeta.subtitle}
              </p>
            </div>

            {branches.length > 1 && (
              <div className="flex flex-wrap items-center gap-1.5 mb-6 pb-3 border-b border-[#e6ddd3]">
                {branches.map((branch) => {
                  const active = activeBranch === branch;
                  return (
                    <button
                      key={branch}
                      type="button"
                      onClick={() => setActiveBranch(branch)}
                      className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-colors cursor-pointer ${
                        active
                          ? 'bg-[#762b43] text-white'
                          : 'bg-white border border-[#e6ddd3] text-[#6e645e] hover:text-[#1f1917]'
                      }`}
                    >
                      {branch}
                    </button>
                  );
                })}
              </div>
            )}

            {filteredProducts.length === 0 ? (
              <div className="bg-white border border-[#e6ddd3] rounded-2xl p-10 text-center">
                <p className="text-sm font-semibold text-[#6e645e]">
                  لا توجد قطع في هذا القسم حالياً.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 sm:gap-6">
                {filteredProducts.map((product) => (
                  <SectionCard
                    key={product.id}
                    product={product}
                    isAdminMode={isAdminMode}
                    onSelect={() => handleOpenProduct(product.id)}
                    onEdit={() => onEditProduct(product)}
                    onDelete={() => onDeleteProduct(product.id)}
                    onReplaceImage={(file) => onReplaceProductImage(product.id, file)}
                    onRemoveImage={() => onRemoveProductImage?.(product.id)}
                  />
                ))}
              </div>
            )}
          </div>
        ) : (
          <div>
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
              <div>
                <p className="text-xs font-bold text-[#762b43] mb-1">
                  اختر القسم المناسب
                </p>
                <h2 className="font-editorial text-2xl sm:text-3xl font-bold text-[#1f1917]">
                  أقسام دار الأزياء
                </h2>
              </div>

              {isAdminMode && (
                <button
                  type="button"
                  onClick={() => onOpenAddProduct('shawl')}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#1f1917] hover:bg-[#3a312d] text-white text-xs font-bold cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>إضافة موديل جديد</span>
                </button>
              )}
            </div>

            <div className="space-y-5">
              {MAIN_SECTIONS.map((sec) => {
                const firstProdWithImg = products.find(
                  (p) =>
                    (sec.id === 'accessories'
                      ? p.category === 'accessories' || p.category === 'cap'
                      : p.category === sec.id) && p.imageUrl
                );
                const coverImg = firstProdWithImg?.imageUrl || sec.fallbackImg;

                return (
                  <div
                    key={sec.id}
                    onClick={() => handleOpenSection(sec.id)}
                    className="group bg-white border border-[#e6ddd3] rounded-3xl overflow-hidden grid grid-cols-1 sm:grid-cols-12 cursor-pointer transition-all duration-200 hover:shadow-md hover:border-[#762b43]/40"
                  >
                    <div className="sm:col-span-7 p-6 sm:p-8 flex flex-col justify-between">
                      <div>
                        <h3 className="font-editorial text-2xl sm:text-3xl font-bold text-[#1f1917]">
                          {sec.title}
                        </h3>
                        <p className="text-sm text-[#6e645e] leading-relaxed mt-2">
                          {sec.subtitle}
                        </p>
                        <p className="text-base font-extrabold text-[#762b43] mt-3">
                          {sec.priceLabel}
                        </p>
                      </div>

                      <div className="mt-5">
                        <span className="inline-flex items-center justify-center w-full sm:w-auto px-7 py-3 rounded-full bg-[#762b43] group-hover:bg-[#581e31] text-white text-sm font-bold transition-colors">
                          {sec.buttonText}
                        </span>
                      </div>
                    </div>

                    <div className="sm:col-span-5 aspect-[4/3] sm:aspect-auto bg-[#f3eee8] overflow-hidden">
                      <img
                        src={coverImg}
                        alt={sec.title}
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
