import { ChangeEvent, useEffect, useMemo, useRef, useState } from 'react';
import { flushSync } from 'react-dom';
import {
  ArrowRight,
  Check,
  ChevronLeft,
  Eye,
  EyeOff,
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
import {
  CapStyleOverride,
  CartItem,
  CategoryId,
  Product,
  SectionOverride,
} from '../types/store';
import capRoundImg from '../assets/images/round.webp';
import capTriangleImg from '../assets/images/triangle.webp';
import capTuxedoImg from '../assets/images/tuxedo.webp';
import { AdminButton, AdminToolbar, AdminUploadButton } from './AdminControls';
import { QuickEditField, QuickEditSheet } from './QuickEditSheet';

type ToggleField = 'hideSizing' | 'hideCapDetails' | 'hideAmericanShawl';

interface AddonPatch {
  americanShawlTitle?: string;
  americanShawlSubtitle?: string;
  americanShawlPrice?: number;
}

interface ProductCatalogProps {
  products: Product[];
  isAdminMode: boolean;
  capStyleOverrides?: Record<string, CapStyleOverride>;
  sectionOverrides?: Record<string, SectionOverride>;
  onAddToCart: (item: Omit<CartItem, 'id' | 'quantity'>) => void;
  onOpenAddProduct: (defaultCategory?: CategoryId) => void;
  onEditProduct: (product: Product) => void;
  onDeleteProduct: (productId: string) => void;
  onReplaceProductImage: (productId: string, file: File) => void;
  onSetProductColorImage?: (productId: string, colorName: string, file: File | null) => void;
  onToggleProductField?: (productId: string, field: ToggleField) => void;
  onRemoveProductImage?: (productId: string) => void;
  onUpdateProductAddon?: (productId: string, addon: AddonPatch) => void;
  onUpdateCapStyle?: (capId: string, patch: CapStyleOverride) => void;
  onUploadCapStyleImage?: (capId: string, file: File) => Promise<void>;
  onUpdateSection?: (sectionId: string, patch: SectionOverride) => void;
  onUploadSectionImage?: (sectionId: string, file: File) => Promise<void>;
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

const BASE_CAP_STYLES = [
  { id: 'round', label: 'القبعة الدائرية', extraPrice: 0, image: capRoundImg },
  { id: 'triangle', label: 'القبعة المثلثة', extraPrice: 0, image: capTriangleImg },
  { id: 'tuxedo', label: 'قبعة توكسيدو', extraPrice: 100, image: capTuxedoImg },
];

const DEFAULT_ADDON = {
  title: 'إضافة الشال الأمريكي V',
  subtitle: 'يُلبس على الكتفين ويتدلى بأناقة',
  price: 900,
};

const LIGHT_SWATCHES = new Set(['#f5f5f4', '#e7d8c9', '#9ca3af', '#38bdf8', '#f472b6', '#c89b3c', '#10b981']);

function formatDzd(value: number) {
  return `${value.toLocaleString('en-US')} دج`;
}

function resolveCapStyles(overrides?: Record<string, CapStyleOverride>) {
  return BASE_CAP_STYLES.map((cap) => {
    const o = overrides?.[cap.id] ?? {};
    const extraPrice =
      typeof o.extraPrice === 'number' && Number.isFinite(o.extraPrice) ? o.extraPrice : cap.extraPrice;
    return {
      id: cap.id,
      label: o.label?.trim() || cap.label,
      extraPrice,
      image: o.imageUrl || cap.image,
      priceText: extraPrice > 0 ? `+${extraPrice.toLocaleString('en-US')} دج` : 'مشمولة',
    };
  });
}

type ResolvedCapStyle = ReturnType<typeof resolveCapStyles>[number];

function withViewTransition(update: () => void, cleanup?: () => void) {
  if (typeof document === 'undefined' || !('startViewTransition' in document)) {
    update();
    cleanup?.();
    return;
  }
  document
    .startViewTransition(() => {
      flushSync(update);
    })
    .finished.finally(() => cleanup?.());
}

const MORPH_STYLE = { viewTransitionName: 'product-hero' } as React.CSSProperties;

function SectionHeading({
  title,
  isAdminMode,
  hidden,
  onToggle,
}: {
  title: string;
  isAdminMode: boolean;
  hidden?: boolean;
  onToggle?: () => void;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <h4 className="text-sm font-extrabold text-[#1f1917]">{title}</h4>
      {isAdminMode && onToggle && (
        <AdminButton
          icon={hidden ? Eye : EyeOff}
          label={hidden ? 'إظهار للزبائن' : 'إخفاء القسم'}
          tone={hidden ? 'accent' : 'danger'}
          onClick={onToggle}
        />
      )}
    </div>
  );
}

function CapStylePicker({
  capStyles,
  selectedId,
  isAdminMode,
  onSelect,
  onEdit,
  onUpload,
}: {
  capStyles: ResolvedCapStyle[];
  selectedId: string;
  isAdminMode: boolean;
  onSelect: (id: string) => void;
  onEdit: (id: string) => void;
  onUpload: (id: string, file: File) => void;
}) {
  return (
    <div role="radiogroup" aria-label="شكل القبعة" className="grid grid-cols-3 gap-2.5 sm:gap-3">
      {capStyles.map((cap) => {
        const active = selectedId === cap.id;
        return (
          <div key={cap.id} className="min-w-0 flex flex-col gap-1.5">
            <button
              type="button"
              role="radio"
              aria-checked={active}
              onClick={() => onSelect(cap.id)}
              className={`group relative w-full rounded-2xl p-1.5 bg-white border-2 text-center cursor-pointer transition-all duration-200 ${
                active
                  ? 'border-[#762b43] shadow-[0_10px_24px_-12px_rgba(118,43,67,0.55)]'
                  : 'border-[#ece4da] hover:border-[#cdb9a6]'
              }`}
            >
              <div className="relative aspect-[3/4] w-full rounded-xl overflow-hidden bg-[#f7e6ec]">
                <img
                  src={cap.image}
                  alt={cap.label}
                  loading="lazy"
                  className={`absolute inset-0 w-full h-full object-cover transition-transform duration-500 ${
                    active ? 'scale-[1.04]' : 'group-hover:scale-[1.04]'
                  }`}
                />
                <span
                  className={`absolute top-1.5 right-1.5 w-6 h-6 rounded-full flex items-center justify-center transition-all ${
                    active
                      ? 'bg-[#762b43] text-white scale-100 opacity-100'
                      : 'bg-white/80 text-transparent scale-90 opacity-0 group-hover:opacity-100'
                  }`}
                  aria-hidden="true"
                >
                  <Check className="w-3.5 h-3.5" strokeWidth={3} />
                </span>
              </div>
              <span className="block mt-2 px-0.5 text-[11px] sm:text-xs font-extrabold text-[#1f1917] leading-tight text-balance">
                {cap.label}
              </span>
              <span
                className={`inline-block mt-1 mb-0.5 px-2 py-0.5 rounded-full text-[10px] sm:text-[11px] font-bold tabular-nums ${
                  cap.extraPrice > 0 ? 'bg-[#762b43]/10 text-[#762b43]' : 'bg-[#f3eee8] text-[#6e645e]'
                }`}
              >
                {cap.priceText}
              </span>
            </button>

            {isAdminMode && (
              <div className="flex flex-col gap-1" data-no-inline-edit>
                <AdminUploadButton
                  icon={ImagePlus}
                  label="تغيير الصورة"
                  tone="accent"
                  className="w-full !px-1.5 text-[11px]"
                  onFile={(file) => onUpload(cap.id, file)}
                />
                <AdminButton
                  icon={Pencil}
                  label="تعديل النص"
                  className="w-full !px-1.5 text-[11px]"
                  onClick={() => onEdit(cap.id)}
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function SwatchButton({
  swatch,
  active,
  hasPhoto,
  size = 'md',
  onClick,
}: {
  swatch: { name: string; hex: string };
  active: boolean;
  hasPhoto?: boolean;
  size?: 'sm' | 'md';
  onClick: () => void;
}) {
  const dims = size === 'sm' ? 'w-8 h-8' : 'w-9 h-9';
  return (
    <button
      type="button"
      title={swatch.name}
      aria-label={swatch.name}
      aria-pressed={active}
      onClick={onClick}
      className={`relative ${dims} rounded-full border flex items-center justify-center transition-transform cursor-pointer ${
        active ? 'ring-2 ring-[#762b43] ring-offset-2 border-transparent scale-105' : 'border-black/10 hover:scale-105'
      }`}
      style={{ backgroundColor: swatch.hex }}
    >
      {active && (
        <Check
          className={`w-4 h-4 ${LIGHT_SWATCHES.has(swatch.hex) ? 'text-[#1f1917]' : 'text-white'}`}
          strokeWidth={3}
        />
      )}
      {hasPhoto && !active && (
        <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 border border-white" />
      )}
    </button>
  );
}

function ProductDetailView({
  product,
  sectionTitle,
  isAdminMode,
  capStyles,
  onBackToHome,
  onBackToSection,
  onAddToCart,
  onSetColorImage,
  onToggleField,
  onEdit,
  onDelete,
  onReplaceImage,
  onEditCapStyle,
  onUploadCapStyle,
  onEditAddon,
  isMorphing,
}: {
  product: Product;
  sectionTitle: string;
  isAdminMode: boolean;
  capStyles: ResolvedCapStyle[];
  onBackToHome: () => void;
  onBackToSection: () => void;
  onAddToCart: (item: Omit<CartItem, 'id' | 'quantity'>) => void;
  onSetColorImage?: (colorName: string, file: File | null) => void;
  onToggleField?: (field: ToggleField) => void;
  onEdit?: () => void;
  onDelete?: () => void;
  onReplaceImage?: (file: File) => void;
  onEditCapStyle: (capId: string) => void;
  onUploadCapStyle: (capId: string, file: File) => void;
  onEditAddon: () => void;
  isMorphing?: boolean;
}) {
  const showCapSection =
    product.category !== 'accessories' && product.category !== 'cap' && !product.hideCapDetails;
  const secondaryDuplicatesCap = showCapSection && product.secondaryLabel === 'نوع القبعة';
  const secondaryDuplicatesSize = !product.hideSizing && product.secondaryLabel === 'الفئة والمقاس';
  const showSecondary =
    Boolean(product.secondaryOptions?.length) && !secondaryDuplicatesCap && !secondaryDuplicatesSize;

  const [selectedOptionIdx, setSelectedOptionIdx] = useState(0);
  const [selectedSecondary, setSelectedSecondary] = useState(product.secondaryOptions?.at(0) || '');
  const [selectedColor, setSelectedColor] = useState(CAP_SWATCHES[0]);
  const [selectedCapId, setSelectedCapId] = useState(BASE_CAP_STYLES[0].id);

  const [gender, setGender] = useState<'نسائي' | 'رجالي'>('نسائي');
  const [standardSize, setStandardSize] = useState('M');
  const [numericSize, setNumericSize] = useState('');
  const [fullLength, setFullLength] = useState('');
  const [shoulderAndSleeve, setShoulderAndSleeve] = useState('');

  const [capSameColor, setCapSameColor] = useState(true);
  const [capCustomColor, setCapCustomColor] = useState(CAP_SWATCHES[0]);
  const [headSize, setHeadSize] = useState('');
  const [capEmbroideryPos, setCapEmbroideryPos] = useState<'سطح القبعة' | 'جبهة القبعة'>('سطح القبعة');
  const [capNotes, setCapNotes] = useState('');

  const [addAmericanShawl, setAddAmericanShawl] = useState(false);
  const [customNotes, setCustomNotes] = useState('');
  const colorFileRef = useRef<HTMLInputElement>(null);

  const selectedCap = capStyles.find((c) => c.id === selectedCapId) ?? capStyles[0];
  const addon = {
    title: product.americanShawlTitle?.trim() || DEFAULT_ADDON.title,
    subtitle: product.americanShawlSubtitle?.trim() || DEFAULT_ADDON.subtitle,
    price:
      typeof product.americanShawlPrice === 'number' ? product.americanShawlPrice : DEFAULT_ADDON.price,
  };

  const activeOption = product.options[selectedOptionIdx];
  const basePrice = activeOption ? activeOption.price : product.basePrice;
  const capStyleSurcharge = showCapSection ? selectedCap.extraPrice : 0;
  const secondarySurcharge = showSecondary && selectedSecondary.includes('+100') ? 100 : 0;
  const americanShawlSurcharge = !product.hideAmericanShawl && addAmericanShawl ? addon.price : 0;
  const displayPrice = basePrice + capStyleSurcharge + secondarySurcharge + americanShawlSurcharge;

  const activeImageUrl = product.colorImages?.[selectedColor.name] || product.imageUrl;
  const hasDedicatedColorImg = Boolean(product.colorImages?.[selectedColor.name]);

  const handleColorFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.item(0);
    if (file && onSetColorImage) onSetColorImage(selectedColor.name, file);
    e.target.value = '';
  };

  const handleAdd = () => {
    const detailParts: string[] = [];
    if (activeOption) detailParts.push(activeOption.label);
    if (showSecondary && selectedSecondary) detailParts.push(selectedSecondary);
    detailParts.push(`اللون: ${selectedColor.name}`);

    if (!product.hideSizing) {
      detailParts.push(`الفئة: ${gender}`);
      detailParts.push(`المقاس: ${numericSize.trim() || standardSize}`);
      if (fullLength.trim()) detailParts.push(`الطول: ${fullLength.trim()} سم`);
      if (shoulderAndSleeve.trim()) detailParts.push(`الكتف/الكم: ${shoulderAndSleeve.trim()}`);
    }

    if (showCapSection) {
      detailParts.push(`شكل القبعة: ${selectedCap.label}`);
      detailParts.push(`لون القبعة: ${capSameColor ? selectedColor.name : capCustomColor.name}`);
      if (headSize.trim()) detailParts.push(`محيط الرأس: ${headSize.trim()} سم`);
      detailParts.push(`تطريز القبعة: ${capEmbroideryPos}`);
      if (capNotes.trim()) detailParts.push(`ملاحظة القبعة: ${capNotes.trim()}`);
    }

    if (!product.hideAmericanShawl && addAmericanShawl) detailParts.push(`+ ${addon.title}`);
    if (customNotes.trim()) detailParts.push(`ملاحظة: ${customNotes.trim()}`);

    onAddToCart({
      category: product.category,
      title: product.name,
      details: detailParts.join(' · '),
      unitPrice: displayPrice,
    });
  };

  return (
    <div className="bg-white border border-[#ece4da] rounded-3xl overflow-hidden shadow-[0_24px_60px_-40px_rgba(31,25,23,0.35)]">
      <div className="px-4 sm:px-6 py-3 bg-[#faf8f5] border-b border-[#ece4da] flex flex-wrap items-center justify-between gap-2">
        <nav aria-label="مسار التصفح" className="flex items-center gap-1 text-xs font-bold text-[#6e645e] min-w-0">
          <button type="button" onClick={onBackToHome} className="hover:text-[#762b43] cursor-pointer py-1.5">
            الرئيسية
          </button>
          <ChevronLeft className="w-3.5 h-3.5 shrink-0" />
          <button type="button" onClick={onBackToSection} className="hover:text-[#762b43] cursor-pointer py-1.5">
            {sectionTitle}
          </button>
          <ChevronLeft className="w-3.5 h-3.5 shrink-0 hidden sm:block" />
          <span className="text-[#1f1917] truncate hidden sm:inline">{product.name}</span>
        </nav>

        <button
          type="button"
          onClick={onBackToSection}
          className="inline-flex items-center gap-1.5 h-9 px-3 rounded-full bg-white border border-[#ece4da] text-xs font-bold text-[#762b43] hover:border-[#762b43] cursor-pointer"
        >
          <ArrowRight className="w-3.5 h-3.5" />
          <span>رجوع</span>
        </button>
      </div>

      {isAdminMode && onEdit && onDelete && (
        <AdminToolbar className="mx-4 sm:mx-6 mt-4">
          <span className="text-[11px] font-extrabold text-[#762b43] ml-1">إدارة المنتج:</span>
          <AdminButton icon={Pencil} label="تعديل الاسم والسعر" tone="dark" onClick={onEdit} />
          {onReplaceImage && (
            <AdminUploadButton icon={ImagePlus} label="تغيير الصورة" onFile={onReplaceImage} />
          )}
          <AdminButton
            icon={Trash2}
            label="حذف المنتج"
            tone="danger"
            onClick={() => {
              if (window.confirm('هل أنت متأكد من حذف هذا الموديل نهائياً؟')) onDelete();
            }}
          />
        </AdminToolbar>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-10 p-4 sm:p-6 md:p-8 items-start">
        <div className="md:sticky md:top-24 min-w-0">
          <div className="relative aspect-[4/5] rounded-2xl bg-[#f3eee8] overflow-hidden border border-[#ece4da]">
            {activeImageUrl ? (
              <img
                src={activeImageUrl}
                alt={product.name}
                style={isMorphing ? MORPH_STYLE : undefined}
                className="w-full h-full object-cover transition-opacity duration-300"
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center">
                <ShoppingBag className="w-10 h-10 text-[#762b43] mb-2 opacity-75" />
                <span className="font-editorial text-lg font-bold text-[#1f1917]">{product.name}</span>
              </div>
            )}
            <div className="absolute bottom-3 right-3 inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/95 backdrop-blur-sm shadow-sm text-xs font-bold text-[#1f1917]">
              <span className="w-3.5 h-3.5 rounded-full border border-black/15" style={{ backgroundColor: selectedColor.hex }} />
              <span>{selectedColor.name}</span>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-6 min-w-0">
          <div>
            <span className="inline-block px-2.5 py-1 rounded-full bg-[#762b43]/8 text-[11px] font-bold text-[#762b43] mb-2">
              {product.branch}
            </span>
            <h3 className="font-editorial text-2xl sm:text-3xl font-bold text-[#1f1917] leading-snug text-balance">
              {product.name}
            </h3>
            <p className="text-2xl font-extrabold text-[#762b43] mt-2 tabular-nums">{formatDzd(displayPrice)}</p>
            <p className="text-sm text-[#6e645e] leading-relaxed mt-3 text-pretty">{product.description}</p>
          </div>

          {product.options.length > 0 && (
            <fieldset className="space-y-2.5">
              <legend className="text-sm font-extrabold text-[#1f1917] mb-2.5">القماش أو الموديل</legend>
              <div className="grid grid-cols-2 gap-2.5">
                {product.options.map((opt, idx) => {
                  const active = idx === selectedOptionIdx;
                  return (
                    <button
                      key={`${opt.label}-${idx}`}
                      type="button"
                      aria-pressed={active}
                      onClick={() => setSelectedOptionIdx(idx)}
                      className={`relative p-3.5 rounded-2xl border-2 text-right transition-all cursor-pointer ${
                        active ? 'border-[#762b43] bg-[#fbf5f6]' : 'border-[#ece4da] bg-white hover:border-[#cdb9a6]'
                      }`}
                    >
                      <span className="block text-sm font-bold text-[#1f1917]">{opt.label}</span>
                      <span className="block text-xs font-extrabold text-[#762b43] mt-0.5 tabular-nums">
                        {formatDzd(opt.price)}
                      </span>
                      {active && (
                        <span className="absolute top-2.5 left-2.5 w-5 h-5 rounded-full bg-[#762b43] text-white flex items-center justify-center">
                          <Check className="w-3 h-3" strokeWidth={3} />
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </fieldset>
          )}

          {showSecondary && (
            <div>
              <h4 className="text-sm font-extrabold text-[#1f1917] mb-2.5">{product.secondaryLabel || 'خيار إضافي'}</h4>
              <div className="flex flex-wrap gap-2">
                {product.secondaryOptions!.map((sec) => {
                  const active = sec === selectedSecondary;
                  return (
                    <button
                      key={sec}
                      type="button"
                      aria-pressed={active}
                      onClick={() => setSelectedSecondary(sec)}
                      className={`min-h-10 px-4 rounded-full border text-xs font-bold transition-all cursor-pointer ${
                        active
                          ? 'bg-[#1f1917] text-white border-[#1f1917]'
                          : 'bg-white text-[#1f1917] border-[#ece4da] hover:border-[#1f1917]'
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
            <h4 className="text-sm font-extrabold text-[#1f1917] mb-3">
              اللون: <span className="text-[#762b43]">{selectedColor.name}</span>
            </h4>
            <div className="flex flex-wrap items-center gap-2.5">
              {CAP_SWATCHES.map((swatch) => (
                <SwatchButton
                  key={swatch.name}
                  swatch={swatch}
                  active={swatch.name === selectedColor.name}
                  hasPhoto={Boolean(product.colorImages?.[swatch.name])}
                  onClick={() => setSelectedColor(swatch)}
                />
              ))}
            </div>

            {isAdminMode && (
              <AdminToolbar className="mt-3">
                <input ref={colorFileRef} type="file" accept="image/*" className="hidden" onChange={handleColorFileChange} />
                <span className="text-[11px] font-extrabold text-[#762b43] ml-1">صورة لون «{selectedColor.name}»:</span>
                <AdminButton
                  icon={ImagePlus}
                  tone="accent"
                  label={hasDedicatedColorImg ? 'تغيير صورة اللون' : 'رفع صورة لهذا اللون'}
                  onClick={() => colorFileRef.current?.click()}
                />
                {hasDedicatedColorImg && (
                  <AdminButton
                    icon={Trash2}
                    tone="danger"
                    label="حذف"
                    onClick={() => onSetColorImage?.(selectedColor.name, null)}
                  />
                )}
              </AdminToolbar>
            )}
          </div>

          {(isAdminMode || !product.hideSizing) && (
            <div className={`pt-5 border-t border-[#ece4da] space-y-3.5 ${product.hideSizing ? 'opacity-60' : ''}`}>
              <SectionHeading
                title="المقاس"
                isAdminMode={isAdminMode}
                hidden={product.hideSizing}
                onToggle={onToggleField ? () => onToggleField('hideSizing') : undefined}
              />
              {!product.hideSizing && (
                <>
                  <div className="grid grid-cols-2 gap-1 p-1 rounded-full bg-[#f3eee8]">
                    {(['نسائي', 'رجالي'] as const).map((g) => (
                      <button
                        key={g}
                        type="button"
                        aria-pressed={gender === g}
                        onClick={() => setGender(g)}
                        className={`h-10 rounded-full text-sm font-bold transition-all cursor-pointer ${
                          gender === g ? 'bg-white text-[#762b43] shadow-sm' : 'text-[#6e645e]'
                        }`}
                      >
                        {g}
                      </button>
                    ))}
                  </div>

                  <div className="grid grid-cols-5 gap-1.5">
                    {['XS', 'S', 'M', 'L', 'XL'].map((sz) => {
                      const active = !numericSize && standardSize === sz;
                      return (
                        <button
                          key={sz}
                          type="button"
                          aria-pressed={active}
                          onClick={() => {
                            setStandardSize(sz);
                            setNumericSize('');
                          }}
                          className={`h-11 rounded-xl border text-sm font-bold cursor-pointer transition-colors ${
                            active
                              ? 'bg-[#762b43] text-white border-[#762b43]'
                              : 'bg-white text-[#1f1917] border-[#ece4da] hover:border-[#762b43]'
                          }`}
                        >
                          {sz}
                        </button>
                      );
                    })}
                  </div>

                  <div className="grid grid-cols-2 gap-2.5">
                    <div>
                      <label htmlFor={`num-size-${product.id}`} className="field-label">
                        أو رقم المقاس (34 - 70)
                      </label>
                      <input
                        id={`num-size-${product.id}`}
                        type="number"
                        inputMode="numeric"
                        min={34}
                        max={70}
                        value={numericSize}
                        onChange={(e) => setNumericSize(e.target.value)}
                        placeholder="44"
                        className="field-input"
                      />
                    </div>
                    <div>
                      <label htmlFor={`length-${product.id}`} className="field-label">
                        الطول الكامل (سم)
                      </label>
                      <input
                        id={`length-${product.id}`}
                        type="number"
                        inputMode="numeric"
                        min={80}
                        max={200}
                        value={fullLength}
                        onChange={(e) => setFullLength(e.target.value)}
                        placeholder="80 - 200"
                        className="field-input"
                      />
                    </div>
                  </div>

                  <input
                    type="text"
                    aria-label="عرض الكتفين وطول الكم"
                    value={shoulderAndSleeve}
                    onChange={(e) => setShoulderAndSleeve(e.target.value)}
                    placeholder="عرض الكتفين وطول الكم (اختياري)"
                    className="field-input"
                  />
                </>
              )}
            </div>
          )}

          {product.category !== 'accessories' &&
            product.category !== 'cap' &&
            (isAdminMode || !product.hideCapDetails) && (
              <div className={`pt-5 border-t border-[#ece4da] space-y-4 ${product.hideCapDetails ? 'opacity-60' : ''}`}>
                <SectionHeading
                  title="القبعة وتفاصيلها"
                  isAdminMode={isAdminMode}
                  hidden={product.hideCapDetails}
                  onToggle={onToggleField ? () => onToggleField('hideCapDetails') : undefined}
                />

                {!product.hideCapDetails && (
                  <>
                    <CapStylePicker
                      capStyles={capStyles}
                      selectedId={selectedCap.id}
                      isAdminMode={isAdminMode}
                      onSelect={setSelectedCapId}
                      onEdit={onEditCapStyle}
                      onUpload={onUploadCapStyle}
                    />

                    <div>
                      <span className="field-label">لون القبعة</span>
                      <div className="grid grid-cols-2 gap-1 p-1 rounded-full bg-[#f3eee8]">
                        {[
                          { v: true, l: 'نفس اللون المختار' },
                          { v: false, l: 'لون آخر' },
                        ].map((o) => (
                          <button
                            key={o.l}
                            type="button"
                            aria-pressed={capSameColor === o.v}
                            onClick={() => setCapSameColor(o.v)}
                            className={`h-10 rounded-full text-xs sm:text-sm font-bold cursor-pointer transition-all ${
                              capSameColor === o.v ? 'bg-white text-[#762b43] shadow-sm' : 'text-[#6e645e]'
                            }`}
                          >
                            {o.l}
                          </button>
                        ))}
                      </div>
                    </div>

                    {!capSameColor && (
                      <div className="p-3 rounded-2xl bg-[#faf8f5] border border-[#ece4da]">
                        <div className="flex flex-wrap items-center gap-2">
                          {CAP_SWATCHES.map((sw) => (
                            <SwatchButton
                              key={sw.name}
                              swatch={sw}
                              size="sm"
                              active={capCustomColor.name === sw.name}
                              onClick={() => setCapCustomColor(sw)}
                            />
                          ))}
                        </div>
                        <p className="text-xs font-bold text-[#762b43] mt-2">{capCustomColor.name}</p>
                      </div>
                    )}

                    <div>
                      <label htmlFor={`head-${product.id}`} className="field-label">
                        محيط الرأس (اختياري، 45 - 70 سم)
                      </label>
                      <input
                        id={`head-${product.id}`}
                        type="number"
                        inputMode="numeric"
                        min={45}
                        max={70}
                        value={headSize}
                        onChange={(e) => setHeadSize(e.target.value)}
                        placeholder="56"
                        className="field-input"
                      />
                    </div>

                    <div>
                      <span className="field-label">مكان تطريز القبعة</span>
                      <div className="grid grid-cols-2 gap-2">
                        {(['سطح القبعة', 'جبهة القبعة'] as const).map((pos) => (
                          <button
                            key={pos}
                            type="button"
                            aria-pressed={capEmbroideryPos === pos}
                            onClick={() => setCapEmbroideryPos(pos)}
                            className={`h-11 px-2.5 rounded-xl border text-xs sm:text-sm font-bold cursor-pointer transition-colors ${
                              capEmbroideryPos === pos
                                ? 'bg-[#762b43] text-white border-[#762b43]'
                                : 'bg-white text-[#1f1917] border-[#ece4da] hover:border-[#762b43]'
                            }`}
                          >
                            {pos}
                          </button>
                        ))}
                      </div>
                    </div>

                    <input
                      type="text"
                      aria-label="ملاحظات القبعة"
                      value={capNotes}
                      onChange={(e) => setCapNotes(e.target.value)}
                      placeholder="ملاحظات للقبعة (مثلاً: الاسم بخيط ذهبي)"
                      className="field-input"
                    />
                  </>
                )}
              </div>
            )}

          <div className="pt-5 border-t border-[#ece4da] space-y-3">
            {(isAdminMode || !product.hideAmericanShawl) && (
              <div className={`rounded-2xl border border-[#ece4da] bg-[#faf8f5] ${product.hideAmericanShawl ? 'opacity-60' : ''}`}>
                {!product.hideAmericanShawl && (
                  <label className="flex items-center justify-between gap-3 p-4 cursor-pointer">
                    <div className="min-w-0">
                      <span className="block text-sm font-bold text-[#1f1917]">
                        {addon.title}{' '}
                        <span className="text-[#762b43] tabular-nums">(+{formatDzd(addon.price)})</span>
                      </span>
                      <span className="block text-xs text-[#6e645e] mt-0.5">{addon.subtitle}</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={addAmericanShawl}
                      onChange={(e) => setAddAmericanShawl(e.target.checked)}
                      className="w-5 h-5 shrink-0 accent-[#762b43]"
                    />
                  </label>
                )}
                {isAdminMode && (
                  <div className="flex flex-wrap gap-1.5 px-3 pb-3 pt-1" data-no-inline-edit>
                    <AdminButton icon={Pencil} label="تعديل الإضافة" onClick={onEditAddon} />
                    {onToggleField && (
                      <AdminButton
                        icon={product.hideAmericanShawl ? Eye : EyeOff}
                        tone={product.hideAmericanShawl ? 'accent' : 'danger'}
                        label={product.hideAmericanShawl ? 'إظهار الشال الأمريكي' : 'إخفاء الشال الأمريكي'}
                        onClick={() => onToggleField('hideAmericanShawl')}
                      />
                    )}
                  </div>
                )}
              </div>
            )}

            <textarea
              rows={2}
              aria-label="ملاحظات إضافية"
              value={customNotes}
              onChange={(e) => setCustomNotes(e.target.value)}
              placeholder="ملاحظات إضافية للتطريز أو الطلب (اختياري)"
              className="field-input resize-none"
            />
          </div>

          <div className="pt-5 border-t border-[#ece4da] flex items-center justify-between gap-4">
            <div className="shrink-0">
              <span className="block text-xs text-[#6e645e]">الإجمالي</span>
              <span className="text-2xl font-extrabold text-[#1f1917] tabular-nums">{formatDzd(displayPrice)}</span>
            </div>
            <button
              type="button"
              onClick={handleAdd}
              className="btn-primary flex-1 max-w-xs h-13"
            >
              <ShoppingBag className="w-4 h-4" />
              <span>أضف إلى السلة</span>
            </button>
          </div>
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
  isMorphing,
}: {
  product: Product;
  isAdminMode: boolean;
  onSelect: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onReplaceImage: (file: File) => void;
  onRemoveImage: () => void;
  isMorphing?: boolean;
}) {
  const [imgError, setImgError] = useState(false);
  const hasValidImage = Boolean(product.imageUrl) && !imgError;

  return (
    <article className="group bg-white border border-[#ece4da] rounded-2xl overflow-hidden flex flex-col transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_18px_40px_-24px_rgba(31,25,23,0.4)]">
      <button
        type="button"
        onClick={onSelect}
        className="flex-1 flex flex-col text-right cursor-pointer"
        aria-label={`عرض ${product.name}`}
      >
        <div className="relative aspect-[4/5] w-full bg-[#f3eee8] overflow-hidden">
          {hasValidImage ? (
            <img
              src={product.imageUrl}
              alt=""
              referrerPolicy="no-referrer"
              onError={() => setImgError(true)}
              style={isMorphing ? MORPH_STYLE : undefined}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center p-5 text-center bg-gradient-to-br from-[#f3eee8] to-[#ebe2d8]">
              <ShoppingBag className="w-7 h-7 text-[#762b43] mb-2 opacity-80" />
              <span className="font-editorial text-sm font-bold text-[#1f1917]">{product.name}</span>
            </div>
          )}
          <span className="absolute top-2.5 right-2.5 px-2.5 py-1 rounded-full bg-white/90 backdrop-blur-sm text-[10px] sm:text-[11px] font-bold text-[#762b43]">
            {product.branch}
          </span>
        </div>

        <div className="p-3.5 sm:p-4 flex-1 flex flex-col justify-between gap-3">
          <div>
            <h3 className="font-editorial text-base sm:text-lg font-bold text-[#1f1917] leading-snug text-balance">
              {product.name}
            </h3>
            <p className="text-sm font-extrabold text-[#762b43] mt-1 tabular-nums">
              من {formatDzd(product.basePrice)}
            </p>
          </div>
          <span className="inline-flex items-center gap-1 text-xs font-bold text-[#1f1917] group-hover:text-[#762b43] transition-colors">
            <span>اختيار اللون والمقاس</span>
            <ChevronLeft className="w-3.5 h-3.5 transition-transform group-hover:-translate-x-0.5" />
          </span>
        </div>
      </button>

      {isAdminMode && (
        <div className="grid grid-cols-2 gap-1.5 p-2 border-t border-dashed border-[#762b43]/25 bg-[#fbf3f5]" data-no-inline-edit>
          <AdminUploadButton
            icon={ImagePlus}
            label={hasValidImage ? 'تغيير الصورة' : 'إضافة صورة'}
            tone="accent"
            className="!px-1.5 text-[11px]"
            onFile={(file) => {
              setImgError(false);
              onReplaceImage(file);
            }}
          />
          <AdminButton icon={Pencil} label="تعديل" className="!px-1.5 text-[11px]" onClick={onEdit} />
          {hasValidImage ? (
            <AdminButton icon={ImageOff} label="حذف الصورة" className="!px-1.5 text-[11px]" onClick={onRemoveImage} />
          ) : (
            <span />
          )}
          <AdminButton
            icon={Trash2}
            label="حذف"
            tone="danger"
            className="!px-1.5 text-[11px]"
            onClick={() => {
              if (window.confirm(`هل أنت متأكد من حذف هذا الموديل نهائياً؟\n\n"${product.name}"`)) onDelete();
            }}
          />
        </div>
      )}
    </article>
  );
}

type EditTarget =
  | { kind: 'cap'; id: string }
  | { kind: 'section'; id: string }
  | { kind: 'addon'; productId: string };

export function ProductCatalog({
  products,
  isAdminMode,
  capStyleOverrides,
  sectionOverrides,
  onAddToCart,
  onOpenAddProduct,
  onEditProduct,
  onDeleteProduct,
  onReplaceProductImage,
  onRemoveProductImage,
  onSetProductColorImage,
  onToggleProductField,
  onUpdateProductAddon,
  onUpdateCapStyle,
  onUploadCapStyleImage,
  onUpdateSection,
  onUploadSectionImage,
}: ProductCatalogProps) {
  const [selectedSection, setSelectedSection] = useState<CategoryId | null>(null);
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [activeBranch, setActiveBranch] = useState<string>('الكل');
  const [morphProductId, setMorphProductId] = useState<string | null>(null);
  const [editTarget, setEditTarget] = useState<EditTarget | null>(null);

  const capStyles = useMemo(() => resolveCapStyles(capStyleOverrides), [capStyleOverrides]);
  const sections = useMemo(
    () =>
      MAIN_SECTIONS.map((sec) => {
        const o = sectionOverrides?.[sec.id] ?? {};
        return {
          ...sec,
          title: o.title?.trim() || sec.title,
          subtitle: o.subtitle?.trim() || sec.subtitle,
          priceLabel: o.priceLabel?.trim() || sec.priceLabel,
          buttonText: o.buttonText?.trim() || sec.buttonText,
          customImg: o.imageUrl || '',
        };
      }),
    [sectionOverrides]
  );

  useEffect(() => {
    const handlePopState = (event: PopStateEvent) => {
      withViewTransition(() => {
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
      });
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const scrollToCatalog = () => {
    document.getElementById('catalog-sec')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const handleOpenSection = (cat: CategoryId) => {
    withViewTransition(() => {
      window.history.pushState({ catalogLevel: 'section', section: cat }, '');
      setSelectedSection(cat);
      setSelectedProductId(null);
      setActiveBranch('الكل');
    });
    scrollToCatalog();
  };

  const handleOpenProduct = (productId: string) => {
    flushSync(() => setMorphProductId(productId));
    withViewTransition(
      () => {
        window.history.pushState({ catalogLevel: 'product', section: selectedSection, productId }, '');
        setSelectedProductId(productId);
      },
      () => setMorphProductId(null)
    );
    scrollToCatalog();
  };

  const handleBackToHome = () => {
    withViewTransition(() => {
      window.history.pushState({ catalogLevel: 'home' }, '');
      setSelectedSection(null);
      setSelectedProductId(null);
      setActiveBranch('الكل');
    });
    scrollToCatalog();
  };

  const handleBackToSection = () => {
    const pid = selectedProductId;
    if (pid) flushSync(() => setMorphProductId(pid));
    withViewTransition(
      () => {
        window.history.pushState({ catalogLevel: 'section', section: selectedSection }, '');
        setSelectedProductId(null);
      },
      () => setMorphProductId(null)
    );
    scrollToCatalog();
  };

  const activeSectionMeta = sections.find((s) => s.id === selectedSection);
  const selectedProduct = products.find((p) => p.id === selectedProductId) || null;

  const sectionProducts = products.filter((p) => {
    if (!selectedSection) return false;
    if (selectedSection === 'accessories') return p.category === 'accessories' || p.category === 'cap';
    return p.category === selectedSection;
  });

  const branches = selectedSection && CATEGORY_BRANCHES[selectedSection] ? CATEGORY_BRANCHES[selectedSection] : [];
  const filteredProducts = sectionProducts.filter((p) => activeBranch === 'الكل' || p.branch === activeBranch);

  const handleUploadCap = async (capId: string, file: File) => {
    await onUploadCapStyleImage?.(capId, file);
  };

  const sheet = (() => {
    if (!editTarget) return null;
    if (editTarget.kind === 'cap') {
      const cap = capStyles.find((c) => c.id === editTarget.id);
      if (!cap) return null;
      const fields: QuickEditField[] = [
        { key: 'label', label: 'اسم القبعة', value: cap.label },
        { key: 'extraPrice', label: 'السعر الإضافي (دج) — 0 تعني مشمولة', value: String(cap.extraPrice), type: 'number' },
      ];
      return {
        title: `تعديل ${cap.label}`,
        fields,
        imageUrl: cap.image,
        onUploadImage: (file: File) => handleUploadCap(cap.id, file),
        onSave: (v: Record<string, string>) =>
          onUpdateCapStyle?.(cap.id, {
            label: v.label.trim(),
            extraPrice: Math.max(0, Math.round(Number(v.extraPrice) || 0)),
          }),
      };
    }
    if (editTarget.kind === 'section') {
      const sec = sections.find((s) => s.id === editTarget.id);
      if (!sec) return null;
      return {
        title: `تعديل قسم ${sec.title}`,
        fields: [
          { key: 'title', label: 'عنوان القسم', value: sec.title },
          { key: 'subtitle', label: 'الوصف', value: sec.subtitle, type: 'textarea' as const },
          { key: 'priceLabel', label: 'نص السعر', value: sec.priceLabel },
          { key: 'buttonText', label: 'نص الزر', value: sec.buttonText },
        ],
        imageUrl: sec.customImg || sec.fallbackImg,
        onUploadImage: (file: File) => onUploadSectionImage?.(sec.id, file),
        onSave: (v: Record<string, string>) =>
          onUpdateSection?.(sec.id, {
            title: v.title.trim(),
            subtitle: v.subtitle.trim(),
            priceLabel: v.priceLabel.trim(),
            buttonText: v.buttonText.trim(),
          }),
      };
    }
    const product = products.find((p) => p.id === editTarget.productId);
    if (!product) return null;
    return {
      title: 'تعديل إضافة الشال الأمريكي',
      fields: [
        { key: 'title', label: 'العنوان', value: product.americanShawlTitle || DEFAULT_ADDON.title },
        { key: 'subtitle', label: 'الوصف', value: product.americanShawlSubtitle || DEFAULT_ADDON.subtitle },
        {
          key: 'price',
          label: 'السعر (دج)',
          value: String(product.americanShawlPrice ?? DEFAULT_ADDON.price),
          type: 'number' as const,
        },
      ],
      imageUrl: undefined,
      onUploadImage: undefined,
      onSave: (v: Record<string, string>) =>
        onUpdateProductAddon?.(product.id, {
          americanShawlTitle: v.title.trim(),
          americanShawlSubtitle: v.subtitle.trim(),
          americanShawlPrice: Math.max(0, Math.round(Number(v.price) || 0)),
        }),
    };
  })();

  return (
    <div data-no-inline-edit>
      <section id="catalog-sec" className="scroll-mt-20 py-14 sm:py-20 border-b border-[#ece4da]">
        <div key={selectedProductId || selectedSection || 'home'} className="catalog-enter max-w-5xl mx-auto px-4 sm:px-6">
          {selectedProduct && activeSectionMeta ? (
            <ProductDetailView
              key={selectedProduct.id}
              product={selectedProduct}
              sectionTitle={activeSectionMeta.title}
              capStyles={capStyles}
              onBackToHome={handleBackToHome}
              onBackToSection={handleBackToSection}
              onAddToCart={onAddToCart}
              isAdminMode={isAdminMode}
              isMorphing={morphProductId === selectedProduct.id}
              onSetColorImage={(colorName, file) => onSetProductColorImage?.(selectedProduct.id, colorName, file)}
              onToggleField={(field) => onToggleProductField?.(selectedProduct.id, field)}
              onEdit={() => onEditProduct(selectedProduct)}
              onDelete={() => {
                onDeleteProduct(selectedProduct.id);
                handleBackToHome();
              }}
              onReplaceImage={(file) => onReplaceProductImage(selectedProduct.id, file)}
              onEditCapStyle={(id) => setEditTarget({ kind: 'cap', id })}
              onUploadCapStyle={handleUploadCap}
              onEditAddon={() => setEditTarget({ kind: 'addon', productId: selectedProduct.id })}
            />
          ) : selectedSection && activeSectionMeta ? (
            <div>
              <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
                <nav aria-label="مسار التصفح" className="flex items-center gap-1.5 text-xs font-bold text-[#6e645e]">
                  <button type="button" onClick={handleBackToHome} className="hover:text-[#762b43] cursor-pointer py-1.5">
                    الرئيسية
                  </button>
                  <ChevronLeft className="w-3.5 h-3.5" />
                  <span className="text-[#1f1917]">{activeSectionMeta.title}</span>
                </nav>
                <button
                  type="button"
                  onClick={handleBackToHome}
                  className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-full bg-white border border-[#ece4da] text-xs font-bold text-[#1f1917] hover:border-[#762b43] cursor-pointer"
                >
                  <ArrowRight className="w-3.5 h-3.5" />
                  <span>كل الأقسام</span>
                </button>
              </div>

              <div className="mb-6">
                <p className="eyebrow">مجموعة DG BY DOUAA</p>
                <h2 className="font-editorial text-3xl sm:text-4xl font-bold text-[#1f1917]">{activeSectionMeta.title}</h2>
                <p className="text-sm sm:text-base text-[#6e645e] mt-2 max-w-xl leading-relaxed">{activeSectionMeta.subtitle}</p>
              </div>

              {isAdminMode && (
                <AdminToolbar className="mb-6">
                  <AdminButton
                    icon={Plus}
                    label="إضافة قطعة للقسم"
                    tone="dark"
                    onClick={() => onOpenAddProduct(selectedSection)}
                  />
                  <AdminButton
                    icon={Pencil}
                    label="تعديل نصوص القسم"
                    onClick={() => setEditTarget({ kind: 'section', id: selectedSection })}
                  />
                </AdminToolbar>
              )}

              {branches.length > 1 && (
                <div className="-mx-4 px-4 sm:mx-0 sm:px-0 mb-6 overflow-x-auto no-scrollbar">
                  <div className="flex items-center gap-2 w-max">
                    {branches.map((branch) => {
                      const active = activeBranch === branch;
                      return (
                        <button
                          key={branch}
                          type="button"
                          aria-pressed={active}
                          onClick={() => setActiveBranch(branch)}
                          className={`h-10 px-4 rounded-full text-sm font-bold transition-colors cursor-pointer whitespace-nowrap ${
                            active
                              ? 'bg-[#1f1917] text-white'
                              : 'bg-white border border-[#ece4da] text-[#6e645e] hover:text-[#1f1917] hover:border-[#1f1917]'
                          }`}
                        >
                          {branch}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {filteredProducts.length === 0 ? (
                <div className="bg-white border border-dashed border-[#e6ddd3] rounded-2xl p-10 text-center">
                  <p className="text-sm font-semibold text-[#6e645e]">لا توجد قطع في هذا القسم حالياً.</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6">
                  {filteredProducts.map((product) => (
                    <SectionCard
                      key={product.id}
                      product={product}
                      isAdminMode={isAdminMode}
                      isMorphing={morphProductId === product.id}
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
              <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8 sm:mb-10">
                <div>
                  <p className="eyebrow">اختر القسم المناسب</p>
                  <h2 className="font-editorial text-3xl sm:text-4xl font-bold text-[#1f1917]">أقسام دار الأزياء</h2>
                </div>
                {isAdminMode && (
                  <AdminButton icon={Plus} label="إضافة موديل جديد" tone="dark" onClick={() => onOpenAddProduct('shawl')} />
                )}
              </div>

              <div className="space-y-5 sm:space-y-6">
                {sections.map((sec, idx) => {
                  const firstProdWithImg = products.find(
                    (p) =>
                      (sec.id === 'accessories'
                        ? p.category === 'accessories' || p.category === 'cap'
                        : p.category === sec.id) && p.imageUrl
                  );
                  const coverImg = sec.customImg || firstProdWithImg?.imageUrl || sec.fallbackImg;

                  return (
                    <article
                      key={sec.id}
                      onClick={() => handleOpenSection(sec.id)}
                      className="group relative bg-white border border-[#ece4da] rounded-3xl overflow-hidden grid grid-cols-1 sm:grid-cols-12 cursor-pointer transition-all duration-300 hover:shadow-[0_24px_50px_-30px_rgba(31,25,23,0.45)] hover:border-[#762b43]/35"
                    >
                      <div className="sm:col-span-5 sm:order-2 relative aspect-[16/11] sm:aspect-auto sm:min-h-72 bg-[#f3eee8] overflow-hidden">
                        <img
                          src={coverImg}
                          alt=""
                          loading="lazy"
                          className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                        />
                        <span className="absolute top-3 right-3 w-9 h-9 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center font-editorial text-sm font-bold text-[#762b43] tabular-nums">
                          0{idx + 1}
                        </span>
                      </div>

                      <div className="sm:col-span-7 sm:order-1 p-5 sm:p-8 flex flex-col justify-between gap-5">
                        <div>
                          <h3 className="font-editorial text-2xl sm:text-3xl font-bold text-[#1f1917]">{sec.title}</h3>
                          <p className="text-sm sm:text-base text-[#6e645e] leading-relaxed mt-2 text-pretty">{sec.subtitle}</p>
                          <p className="inline-block mt-4 px-3 py-1 rounded-full bg-[#762b43]/8 text-sm font-extrabold text-[#762b43]">
                            {sec.priceLabel}
                          </p>
                        </div>

                        <div className="flex flex-col gap-3">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenSection(sec.id);
                            }}
                            className="btn-primary w-full sm:w-auto sm:self-start"
                          >
                            <span>{sec.buttonText}</span>
                            <ChevronLeft className="w-4 h-4 transition-transform group-hover:-translate-x-0.5" />
                          </button>

                          {isAdminMode && (
                            <AdminToolbar>
                              <AdminButton
                                icon={Pencil}
                                label="تعديل النصوص"
                                onClick={() => setEditTarget({ kind: 'section', id: sec.id })}
                              />
                              <AdminUploadButton
                                icon={ImagePlus}
                                label="تغيير الصورة"
                                tone="accent"
                                onFile={(file) => onUploadSectionImage?.(sec.id, file)}
                              />
                            </AdminToolbar>
                          )}
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </section>

      {sheet && (
        <QuickEditSheet
          isOpen
          title={sheet.title}
          fields={sheet.fields}
          imageUrl={sheet.imageUrl}
          onUploadImage={sheet.onUploadImage}
          onSave={sheet.onSave}
          onClose={() => setEditTarget(null)}
        />
      )}
    </div>
  );
}
