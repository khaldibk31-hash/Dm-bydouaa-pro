import { ChangeEvent, useEffect, useRef, useState } from 'react';
import { flushSync } from 'react-dom';
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
import capRoundImg from '../assets/images/round.webp';
import capTriangleImg from '../assets/images/triangle.webp';
import capTuxedoImg from '../assets/images/tuxedo.webp';

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

// ✅ 1. حيدنا قسم "الوشاح" من هنا باش ما يبقاش يبان في القائمة الرئيسية
const MAIN_SECTIONS = [
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
  { id: 'round', label: 'القبعة الدائرية', extraPrice: 0, priceText: 'مشمولة', image: capRoundImg },
  { id: 'triangle', label: 'القبعة المثلثة', extraPrice: 0, priceText: 'مشمولة', image: capTriangleImg },
  { id: 'tuxedo', label: 'قبعة توكسيدو', extraPrice: 100, priceText: '+100 دج', image: capTuxedoImg },
];

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

function ProductDetailView({
  product,
  sectionTitle,
  isAdminMode,
  onBackToHome,
  onBackToSection,
  onAddToCart,
  onSetColorImage,
  onToggleField,
  onEdit,
  onDelete,
  onReplaceImage,
  isMorphing,
}: {
  product: Product;
  sectionTitle: string;
  isAdminMode: boolean;
  onBackToHome: () => void;
  onBackToSection: () => void;
  onAddToCart: (item: Omit<CartItem, 'id' | 'quantity'>) => void;
  onSetColorImage?: (colorName: string, file: File | null) => void;
  onToggleField?: (field: 'hideSizing' | 'hideCapDetails' | 'hideAmericanShawl') => void;
  onEdit?: () => void;
  onDelete?: () => void;
  onReplaceImage?: (file: File) => void;
  isMorphing?: boolean;
}) {
  const [selectedOptionIdx, setSelectedOptionIdx] = useState(0);
  const [selectedSecondary, setSelectedSecondary] = useState(
    product.secondaryOptions?.at(0) || ''
  );
  const [selectedColor, setSelectedColor] = useState(CAP_SWATCHES.at(0)!);
  const [selectedCapStyle, setSelectedCapStyle] = useState(CAP_STYLES.at(0)!);
  const [customCapImages, setCustomCapImages] = useState<Record<string, string>>({});

  // حالات مخصصة للنصوص اللي فالصورة
  const [rightText, setRightText] = useState('2026 دفعة');
  const [leftText, setLeftText] = useState('الاسم واللقب');
  
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

  const handleCapImageUpload = (capId: string, e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.item(0);
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          setCustomCapImages((prev) => ({ ...prev, [capId]: reader.result as string }));
        }
      };
      reader.readAsDataURL(file);
      e.target.value = '';
    }
  };

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

  // ✅ 2. التحقق واش الزبون اختار "شال بالظهر"
  const isBackShawlSelected = activeOption?.label.includes('بالظهر') || false;

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
    
    // نزيدو النصوص المخصصة للطلب
    detailParts.push(`الجهة اليمنى: ${rightText}`);
    detailParts.push(`الجهة اليسرى: ${leftText}`);

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
    <div className="bg-white border border-[#e6ddd3] rounded-3xl overflow-hidden shadow-sm max-w-2xl mx-auto">
      <div className="px-5 py-3.5 bg-[#faf8f5] border-b border-[#e6ddd3] flex flex-wrap items-center justify-between gap-2 text-xs font-bold text-[#6e645e]">
        <div className="flex items-center gap-1.5">
          <button onClick={onBackToHome} className="hover:text-[#762b43] underline cursor-pointer">
            الرئيسية
          </button>
          <ChevronLeft className="w-3.5 h-3.5" />
          <span className="text-[#1f1917]">{sectionTitle}</span>
        </div>

        <div className="flex items-center gap-3">
          {isAdminMode && onEdit && onDelete && (
            <div className="flex items-center gap-2 border-l border-[#e6ddd3] pl-3">
              <button onClick={onEdit} className="inline-flex items-center gap-1 text-blue-700 hover:underline cursor-pointer font-bold">
                <Pencil className="w-3.5 h-3.5" /><span>تعديل المنتج</span>
              </button>
              <button onClick={() => { if (window.confirm('هل أنت متأكد من الحذف؟')) onDelete(); }} className="inline-flex items-center gap-1 text-red-600 hover:underline cursor-pointer font-bold">
                <Trash2 className="w-3.5 h-3.5" /><span>حذف</span>
              </button>
            </div>
          )}
          <button onClick={onBackToSection} className="inline-flex items-center gap-1 text-[#762b43] hover:underline cursor-pointer">
            <ArrowRight className="w-3.5 h-3.5" /><span>رجوع</span>
          </button>
        </div>
      </div>

      <div className="p-5 sm:p-8 space-y-6">
        
        {/* 1. الصورة الكبيرة */}
        <div className="relative aspect-[4/3] w-full rounded-2xl bg-[#faf8f5] overflow-hidden border border-[#e6ddd3]">
          {isAdminMode && (
            <div className="absolute top-3 right-3 z-10">
              <label className="cursor-pointer bg-white/95 backdrop-blur-md text-[#1f1917] px-3 py-1.5 rounded-lg border border-[#e6ddd3] text-xs font-bold shadow-sm hover:bg-[#f3eee8] flex items-center gap-1.5">
                <ImagePlus className="w-4 h-4 text-[#762b43]" />
                تغيير الصورة
                <input type="file" accept="image/*" className="hidden" onChange={(e) => {
                    const file = e.target.files?.item(0);
                    if (file && onReplaceImage) onReplaceImage(file);
                    e.target.value = '';
                }} />
              </label>
            </div>
          )}
          {activeImageUrl ? (
            <img src={activeImageUrl} alt={product.name} className="w-full h-full object-contain" />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center">
              <ShoppingBag className="w-10 h-10 text-[#762b43] mb-2 opacity-75" />
              <span className="font-editorial text-lg font-bold text-[#1f1917]">{product.name}</span>
            </div>
          )}
        </div>

        {/* 2. القائمة المنسدلة لنوع الوشاح */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-sm font-bold text-[#1f1917]">نوع الوشاح والقماش (يشمل القبعة)</label>
            {isAdminMode && (
              <button onClick={onEdit} className="text-blue-600 text-xs flex items-center gap-1 hover:underline">
                <Pencil className="w-3 h-3" /> تعديل الخيارات
              </button>
            )}
          </div>
          <select
            value={selectedOptionIdx}
            onChange={(e) => setSelectedOptionIdx(Number(e.target.value))}
            className="w-full p-3.5 rounded-xl border-2 border-[#e6ddd3] bg-white text-sm font-bold text-[#1f1917] focus:outline-none focus:border-[#762b43] cursor-pointer"
          >
            {product.options.map((opt, idx) => (
              <option key={idx} value={idx}>
                {opt.label} ({opt.price.toLocaleString('en-US')} دج)
              </option>
            ))}
          </select>
        </div>

        {/* 3. الخيارات الإضافية إلا اختار "بالظهر" */}
        {isBackShawlSelected && (
          <div className="p-4 bg-[#faf8f5] border border-[#e6ddd3] rounded-xl space-y-4 animate-in fade-in slide-in-from-top-2">
            <p className="text-sm font-bold text-[#762b43]">لقد اخترت شال بالظهر! يرجى تحديد التفاصيل الإضافية:</p>
            <div>
              <label className="block text-xs font-bold text-[#1f1917] mb-2">اختر اللون:</label>
              <div className="flex flex-wrap items-center gap-2.5">
                {CAP_SWATCHES.map((swatch) => (
                  <button
                    key={swatch.name}
                    type="button"
                    onClick={() => setSelectedColor(swatch)}
                    className={`relative w-8 h-8 rounded-full border flex items-center justify-center transition-transform cursor-pointer ${
                      swatch.name === selectedColor.name ? 'ring-2 ring-[#762b43] ring-offset-2 scale-110' : 'border-[#d6cdc2]'
                    }`}
                    style={{ backgroundColor: swatch.hex }}
                  >
                    {swatch.name === selectedColor.name && <Check className="w-4 h-4 text-white" />}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* 4. حقول النصوص المخصصة */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-bold text-[#1f1917]">الجهة اليمنى (الدفعة أو التخصص)</label>
              {isAdminMode && <button onClick={() => alert('هنا تفتح نافذة تعديل النص')} className="text-blue-600 text-xs"><Pencil className="w-3 h-3" /></button>}
            </div>
            <input type="text" value={rightText} onChange={(e) => setRightText(e.target.value)} className="w-full p-3 rounded-xl border-2 border-[#e6ddd3] bg-white text-sm" />
          </div>
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-bold text-[#1f1917]">الجهة اليسرى (الاسم أو الجامعة)</label>
              {isAdminMode && <button onClick={() => alert('هنا تفتح نافذة تعديل النص')} className="text-blue-600 text-xs"><Pencil className="w-3 h-3" /></button>}
            </div>
            <input type="text" value={leftText} onChange={(e) => setLeftText(e.target.value)} className="w-full p-3 rounded-xl border-2 border-[#e6ddd3] bg-white text-sm" />
          </div>
        </div>

        {/* 5. تصميم القبعة المرفقة */}
        <div>
          <label className="block text-sm font-bold text-[#1f1917] mb-2">تصميم القبعة المرفقة</label>
          <select className="w-full p-3.5 rounded-xl border-2 border-[#e6ddd3] bg-white text-sm font-bold">
            <option>قبعة عادية (مشمولة مجاناً)</option>
            <option>قبعة توكسيدو (+100 دج)</option>
            <option>بدون قبعة</option>
          </select>
        </div>

        {/* الأزرار ديال الإضافة */}
        <div className="pt-6 border-t border-[#e6ddd3] flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-center sm:text-right w-full sm:w-auto">
            <span className="block text-xs text-[#6e645e]">الإجمالي</span>
            <span className="text-3xl font-extrabold text-[#762b43]">{displayPrice.toLocaleString('en-US')} دج</span>
          </div>
          <button
            type="button"
            onClick={handleAdd}
            className="w-full sm:w-auto px-8 py-4 rounded-xl bg-[#762b43] hover:bg-[#581e31] text-white text-base font-bold shadow-md transition-colors flex items-center justify-center gap-2"
          >
            <ShoppingBag className="w-5 h-5" />
            <span>أضف إلى السلة</span>
          </button>
        </div>

      </div>
    </div>
  );
}

function SectionCard({ product, isAdminMode, onSelect, onEdit, onDelete, onReplaceImage, onRemoveImage, isMorphing }: any) {
  const [imgError, setImgError] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const hasValidImage = Boolean(product.imageUrl) && !imgError;

  return (
    <article onClick={onSelect} className="group bg-white border border-[#e6ddd3] rounded-2xl overflow-hidden flex flex-col cursor-pointer transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
      <div className="relative aspect-[4/3] w-full bg-[#f3eee8] overflow-hidden">
        {hasValidImage ? (
          <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center p-5 text-center bg-[#f3eee8]">
            <ShoppingBag className="w-7 h-7 text-[#762b43] mb-2 opacity-80" />
          </div>
        )}
      </div>
      <div className="p-4 text-center flex-1 flex flex-col justify-between">
        <div>
          <h3 className="font-editorial text-lg font-bold text-[#1f1917] leading-snug">{product.name}</h3>
          <p className="text-xs sm:text-sm font-extrabold text-[#762b43] mt-1">من {product.basePrice.toLocaleString('en-US')} دج</p>
        </div>
        <div className="mt-3 pt-2.5 border-t border-[#f3eee8]">
          <span className="inline-flex items-center gap-1 text-xs font-bold text-[#762b43] group-hover:underline">
            <span>تخصيص الطلب</span><ChevronLeft className="w-3.5 h-3.5" />
          </span>
        </div>
      </div>
    </article>
  );
}

export function ProductCatalog({
  products, isAdminMode, onAddToCart, onOpenAddProduct, onEditProduct, onDeleteProduct, onReplaceProductImage, onRemoveProductImage, onSetProductColorImage, onToggleProductField,
}: ProductCatalogProps) {
  const [selectedSection, setSelectedSection] = useState<CategoryId | null>(null);
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [activeBranch, setActiveBranch] = useState<string>('الكل');
  const [morphProductId, setMorphProductId] = useState<string | null>(null);

  // ✅ نجبرو النظام يفتح قسم الوشاح أوتوماتيكياً حيت حيدناه من القائمة
  useEffect(() => {
    setSelectedSection('shawl');
  }, []);

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

  const handleOpenSection = (cat: CategoryId) => {
    withViewTransition(() => {
      window.history.pushState({ catalogLevel: 'section', section: cat }, '');
      setSelectedSection(cat);
      setSelectedProductId(null);
      setActiveBranch('الكل');
    });
  };

  const handleOpenProduct = (productId: string) => {
    flushSync(() => setMorphProductId(productId));
    withViewTransition(() => {
        window.history.pushState({ catalogLevel: 'product', section: selectedSection, productId }, '');
        setSelectedProductId(productId);
      }, () => setMorphProductId(null)
    );
  };

  const handleBackToHome = () => {
    withViewTransition(() => {
      setSelectedSection(null);
      setSelectedProductId(null);
      setActiveBranch('الكل');
    });
  };

  const handleBackToSection = () => {
    const pid = selectedProductId;
    if (pid) flushSync(() => setMorphProductId(pid));
    withViewTransition(() => setSelectedProductId(null), () => setMorphProductId(null));
  };

  // حيت حيدنا الوشاح من MAIN_SECTIONS، نقدرو نعطيوه قيمة ثابتة هنا باش ما يطيحش
  const activeSectionMeta = selectedSection === 'shawl' 
    ? { id: 'shawl', title: 'صمم وشاحك', subtitle: 'اختر التفاصيل', priceLabel: '', buttonText: '', fallbackImg: '' } 
    : MAIN_SECTIONS.find((s) => s.id === selectedSection);
    
  const selectedProduct = products.find((p) => p.id === selectedProductId) || null;

  const sectionProducts = products.filter((p) => {
    if (!selectedSection) return false;
    if (selectedSection === 'accessories') return p.category === 'accessories' || p.category === 'cap';
    return p.category === selectedSection;
  });

  const branches = selectedSection && CATEGORY_BRANCHES[selectedSection] ? CATEGORY_BRANCHES[selectedSection] : [];
  const filteredProducts = sectionProducts.filter((p) => activeBranch === 'الكل' || p.branch === activeBranch);

  return (
    <div key={selectedProductId || selectedSection || 'home'} className="catalog-enter">
      <section id="catalog-sec" className="py-12 sm:py-16 border-b border-[#e6ddd3]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          
          {selectedProduct && activeSectionMeta ? (
            <ProductDetailView
              product={selectedProduct}
              sectionTitle={activeSectionMeta.title}
              onBackToHome={handleBackToHome}
              onBackToSection={handleBackToSection}
              onAddToCart={onAddToCart}
              isAdminMode={isAdminMode}
              isMorphing={morphProductId === selectedProduct.id}
              onSetColorImage={(colorName, file) => onSetProductColorImage?.(selectedProduct.id, colorName, file)}
              onToggleField={(field) => onToggleProductField?.(selectedProduct.id, field)}
              onEdit={() => onEditProduct(selectedProduct)}
              onDelete={() => { onDeleteProduct(selectedProduct.id); handleBackToHome(); }}
              onReplaceImage={(file) => onReplaceProductImage(selectedProduct.id, file)}
            />
          ) : selectedSection && activeSectionMeta ? (
            <div>
              <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
                <div className="flex items-center gap-1.5 text-xs font-bold text-[#6e645e]">
                  <button onClick={handleBackToHome} className="hover:text-[#762b43] underline cursor-pointer">الرئيسية</button>
                  <ChevronLeft className="w-3.5 h-3.5" />
                  <span className="text-[#1f1917]">{activeSectionMeta.title}</span>
                </div>
                <button onClick={handleBackToHome} className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-white border border-[#e6ddd3] text-xs font-bold text-[#1f1917] hover:bg-[#f3eee8] cursor-pointer">
                  <ArrowRight className="w-3.5 h-3.5" /><span>كل الأقسام</span>
                </button>
              </div>

              <div className="mb-6">
                <h2 className="font-editorial text-3xl sm:text-4xl font-bold text-[#1f1917]">{activeSectionMeta.title}</h2>
                <p className="text-sm text-[#6e645e] mt-1.5 max-w-xl">{activeSectionMeta.subtitle}</p>
              </div>

              {filteredProducts.length === 0 ? (
                <div className="bg-white border border-[#e6ddd3] rounded-2xl p-10 text-center">
                  <p className="text-sm font-semibold text-[#6e645e]">لا توجد قطع في هذا القسم حالياً.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                  {filteredProducts.map((product) => (
                    <SectionCard key={product.id} product={product} onSelect={() => handleOpenProduct(product.id)} />
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div>
              <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
                <div>
                  <p className="text-xs font-bold text-[#762b43] mb-1">اختر القسم المناسب</p>
                  <h2 className="font-editorial text-2xl sm:text-3xl font-bold text-[#1f1917]">أقسام دار الأزياء</h2>
                </div>
                {isAdminMode && (
                  <button onClick={() => onOpenAddProduct('shawl')} className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#1f1917] hover:bg-[#3a312d] text-white text-xs font-bold cursor-pointer">
                    <Plus className="w-4 h-4" /><span>إضافة موديل جديد</span>
                  </button>
                )}
              </div>

              <div className="space-y-5">
                {MAIN_SECTIONS.map((sec) => {
                  const firstProdWithImg = products.find((p) => p.category === sec.id && p.imageUrl);
                  const coverImg = firstProdWithImg?.imageUrl || sec.fallbackImg;
                  return (
                    <div key={sec.id} onClick={() => handleOpenSection(sec.id)} className="group bg-white border border-[#e6ddd3] rounded-3xl overflow-hidden grid grid-cols-1 sm:grid-cols-12 cursor-pointer transition-all duration-200 hover:shadow-md hover:border-[#762b43]/40">
                      <div className="sm:col-span-7 p-6 sm:p-8 flex flex-col justify-between">
                        <div>
                          <h3 className="font-editorial text-2xl sm:text-3xl font-bold text-[#1f1917]">{sec.title}</h3>
                          <p className="text-sm text-[#6e645e] leading-relaxed mt-2">{sec.subtitle}</p>
                          <p className="text-base font-extrabold text-[#762b43] mt-3">{sec.priceLabel}</p>
                        </div>
                        <div className="mt-5">
                          <span className="inline-flex items-center justify-center w-full sm:w-auto px-7 py-3 rounded-full bg-[#762b43] group-hover:bg-[#581e31] text-white text-sm font-bold transition-colors">{sec.buttonText}</span>
                        </div>
                      </div>
                      <div className="sm:col-span-5 aspect-[4/3] sm:aspect-auto bg-[#f3eee8] overflow-hidden">
                        <img src={coverImg} alt={sec.title} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
