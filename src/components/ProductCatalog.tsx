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

// --- إعدادات الأقسام ---
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

const SIZE_CHART = [
  { size: 'XS', male: 44, female: 34 },
  { size: 'S', male: 46, female: 36 },
  { size: 'M', male: 48, female: 38 },
  { size: 'L', male: 50, female: 40 },
  { size: 'XL', male: 52, female: 42 },
  { size: 'XXL', male: 54, female: 44 },
];

interface ProductCatalogProps {
  products: Product[];
  isAdminMode: boolean;
  onAddToCart: (item: Omit<CartItem, 'id' | 'quantity'>) => void;
  onOpenAddProduct: (defaultCategory?: CategoryId) => void;
  onEditProduct: (product: Product) => void;
  onDeleteProduct: (productId: string) => void;
  onReplaceProductImage: (productId: string, file: File) => void;
  onSetProductColorImage?: (productId: string, colorName: string, file: File | null) => void;
  onRemoveProductImage?: (productId: string) => void;
}

// --- مكون عرض تفاصيل المنتج ---
function ProductDetailView({
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
}) {
  const [selectedOptionIdx, setSelectedOptionIdx] = useState(0);
  const [selectedSecondary, setSelectedSecondary] = useState(product.secondaryOptions?.at(0) || '');
  const [selectedColor, setSelectedColor] = useState(CAP_SWATCHES.at(0)!);

  const [gender, setGender] = useState<'نسائي' | 'رجالي'>('رجالي');
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
  const tuxedoSurcharge = selectedSecondary.includes('+100') ? 100 : 0;
  const americanShawlSurcharge = addAmericanShawl ? 900 : 0;
  const displayPrice = basePrice + tuxedoSurcharge + americanShawlSurcharge;

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

    detailParts.push(`الفئة: ${gender}`);
    if (numericSize.trim()) {
      detailParts.push(`المقاس: ${numericSize.trim()}`);
    } else {
      detailParts.push(`المقاس: ${standardSize}`);
    }
    if (fullLength.trim()) detailParts.push(`الطول: ${fullLength.trim()} سم`);
    if (shoulderAndSleeve.trim()) detailParts.push(`الكتف/الكم: ${shoulderAndSleeve.trim()}`);

    const finalCapColor = capSameColor ? selectedColor.name : capCustomColor.name;
    detailParts.push(`لون القبعة: ${finalCapColor}`);
    if (headSize.trim()) detailParts.push(`محيط الرأس: ${headSize.trim()} سم`);
    detailParts.push(`تطريز القبعة: ${capEmbroideryPos}`);
    if (capNotes.trim()) detailParts.push(`ملاحظة القبعة: ${capNotes.trim()}`);

    if (addAmericanShawl) detailParts.push('+ شال أمريكي V');
    if (customNotes.trim()) detailParts.push(`ملاحظة: ${customNotes.trim()}`);

    onAddToCart({
      category: product.category,
      title: product.name,
      details: detailParts.join(' · '),
      unitPrice: displayPrice,
    });
  };

  return (
    <div className="bg-white border border-[#e6ddd3] rounded-3xl overflow-hidden shadow-sm relative animate-fade-in-up pb-24">
      {/* شريط التنقل العلوي */}
      <div className="px-5 py-3.5 bg-[#faf8f5] border-b border-[#e6ddd3] flex flex-wrap items-center justify-between gap-2 text-xs font-bold text-[#6e645e] sticky top-0 z-20">
        <div className="flex items-center gap-1.5">
          <button type="button" onClick={onBackToHome} className="hover:text-[#762b43] underline cursor-pointer">الرئيسية</button>
          <ChevronLeft className="w-3.5 h-3.5" />
          <button type="button" onClick={onBackToSection} className="hover:text-[#762b43] underline cursor-pointer">{sectionTitle}</button>
          <ChevronLeft className="w-3.5 h-3.5" />
          <span className="text-[#1f1917]">{product.name}</span>
        </div>
        <button type="button" onClick={onBackToSection} className="inline-flex items-center gap-1 text-[#762b43] hover:underline cursor-pointer">
          <ArrowRight className="w-3.5 h-3.5" />
          <span>رجوع للقسم</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-5 sm:p-8">
        {/* صورة المنتج */}
        <div className="relative aspect-[3/4] rounded-2xl bg-pink-50 overflow-hidden border border-pink-100">
          {activeImageUrl ? (
            <>
              <img src={activeImageUrl} alt={product.name} className="w-full h-full object-contain transition-all duration-300" />
              <div className="absolute bottom-3 right-3 inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/95 backdrop-blur-sm border border-[#e6ddd3] shadow-sm text-xs font-bold text-[#1f1917]">
                <span className="w-3.5 h-3.5 rounded-full border border-black/15" style={{ backgroundColor: selectedColor.hex }} />
                <span>اللون: {selectedColor.name}</span>
              </div>
            </>
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center">
              <ShoppingBag className="w-10 h-10 text-[#762b43] mb-2 opacity-75" />
              <span className="text-lg font-bold text-[#1f1917]">{product.name}</span>
            </div>
          )}
        </div>

        {/* تفاصيل وخيارات المنتج */}
        <div className="flex flex-col space-y-6">
          <div>
            <h3 className="text-2xl sm:text-3xl font-bold text-[#762b43]">{product.name}</h3>
            <p className="text-xl font-extrabold text-[#762b43] mt-1.5">{displayPrice.toLocaleString('en-US')} دج</p>
            <p className="text-sm text-[#6e645e] leading-relaxed mt-2">{product.description}</p>
          </div>

          {/* اللون */}
          <div>
            <label className="block text-sm font-bold text-[#1f1917] mb-2">اللون: <span className="text-[#762b43]">{selectedColor.name}</span></label>
            <div className="flex flex-wrap items-center gap-3">
              {CAP_SWATCHES.map((swatch) => (
                <button
                  key={swatch.name}
                  type="button"
                  onClick={() => setSelectedColor(swatch)}
                  className={`w-9 h-9 rounded-full flex items-center justify-center transition-transform cursor-pointer ${
                    swatch.name === selectedColor.name ? 'ring-2 ring-[#762b43] ring-offset-2 scale-110' : 'border border-gray-200'
                  }`}
                  style={{ backgroundColor: swatch.hex }}
                >
                  {swatch.name === selectedColor.name && <Check className="w-4 h-4 text-white" />}
                </button>
              ))}
            </div>
            {isAdminMode && (
              <div className="mt-3 flex items-center gap-2">
                <input ref={colorFileRef} type="file" accept="image/*" className="hidden" onChange={handleColorFileChange} />
                <button type="button" onClick={() => colorFileRef.current?.click()} className="text-xs bg-[#762b43] text-white px-3 py-1.5 rounded-lg">تغيير صورة اللون</button>
              </div>
            )}
          </div>

          {/* المقاس */}
          <div className="space-y-4 pt-4 border-t border-[#e6ddd3]">
            <label className="block text-sm font-bold text-[#1f1917]">المقاس:</label>
            <div className="grid grid-cols-2 gap-1 p-1 rounded-full bg-[#f3eee8]">
              {(['رجالي', 'نسائي'] as const).map((g) => (
                <button
                  key={g}
                  type="button"
                  onClick={() => setGender(g)}
                  className={`py-2 rounded-full text-sm font-bold transition-all ${gender === g ? 'bg-white text-[#762b43] shadow-sm' : 'text-[#6e645e]'}`}
                >
                  {g}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-3 gap-2">
              {SIZE_CHART.map((item) => (
                <button
                  key={item.size}
                  type="button"
                  onClick={() => { setStandardSize(item.size); setNumericSize(''); }}
                  className={`py-2 flex flex-col items-center justify-center rounded-xl border ${
                    !numericSize && standardSize === item.size ? 'bg-white border-[#762b43] text-[#762b43]' : 'bg-white border-[#e6ddd3] text-gray-700'
                  }`}
                >
                  <span className="font-bold">{item.size}</span>
                  <span className="text-[10px] text-gray-400">{gender === 'رجالي' ? item.male : item.female}</span>
                </button>
              ))}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-[#6e645e] mb-1">أو اكتب رقم مقاسك (34 - 70)</label>
                <input type="number" value={numericSize} onChange={(e) => setNumericSize(e.target.value)} placeholder="44 - 70" className="w-full px-3 py-2.5 rounded-xl border border-[#e6ddd3] bg-white text-sm" />
              </div>
              <div>
                <label className="block text-xs font-bold text-[#6e645e] mb-1">الطول الكامل (80 - 200 سم)</label>
                <input type="number" value={fullLength} onChange={(e) => setFullLength(e.target.value)} placeholder="سم" className="w-full px-3 py-2.5 rounded-xl border border-[#e6ddd3] bg-white text-sm" />
              </div>
            </div>
          </div>

          {/* جدول المقاسات */}
          <div className="pt-4 border-t border-[#e6ddd3]">
             <h4 className="text-center font-bold text-[#762b43] mb-2">جدول مقاسات روب التخرج</h4>
             <div className="rounded-xl overflow-hidden border border-[#e6ddd3]">
                <table className="w-full text-center text-sm">
                  <thead className="bg-[#762b43] text-white">
                    <tr>
                      <th className="py-2">المقاس</th>
                      <th className="py-2">رجالي</th>
                      <th className="py-2">نسائي</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-[#e6ddd3]">
                    {SIZE_CHART.map((row) => (
                      <tr key={row.size}>
                        <td className="py-2 font-bold">{row.size}</td>
                        <td className="py-2 text-gray-600">{row.male}</td>
                        <td className="py-2 text-gray-600">{row.female}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
             </div>
          </div>

          {/* خيارات إضافية */}
          <div className="pt-4 border-t border-[#e6ddd3] space-y-3">
             <label className="flex items-center justify-between p-3 rounded-xl border border-[#e6ddd3] bg-[#faf8f5] cursor-pointer">
                <span className="text-sm font-bold text-[#1f1917]">إضافة الشال الأمريكي V (+900 دج)</span>
                <input type="checkbox" checked={addAmericanShawl} onChange={(e) => setAddAmericanShawl(e.target.checked)} className="w-4 h-4 accent-[#762b43]" />
             </label>
             <input type="text" value={customNotes} onChange={(e) => setCustomNotes(e.target.value)} placeholder="ملاحظات إضافية (اختياري)..." className="w-full px-3 py-2.5 rounded-xl border border-[#e6ddd3] bg-white text-sm" />
          </div>

        </div>
      </div>

      {/* الشريط السفلي الثابت (Sticky Bottom Bar) */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-[#e6ddd3] p-4 flex items-center justify-between z-50 md:absolute md:bottom-0 md:rounded-b-3xl shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
        <div className="flex flex-col">
          <span className="text-xs text-gray-500">الإجمالي</span>
          <span className="text-xl font-extrabold text-[#762b43]">{displayPrice.toLocaleString('en-US')} دج</span>
        </div>
        <button
          type="button"
          onClick={handleAdd}
          className="px-8 py-3 rounded-full bg-[#762b43] hover:bg-[#581e31] text-white text-sm font-bold shadow-md transition-colors flex items-center gap-2"
        >
          <ShoppingBag className="w-4 h-4" />
          <span>أضف إلى السلة</span>
        </button>
      </div>
    </div>
  );
}

// --- مكون كارت المنتج ---
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
  const hasValidImage = Boolean(product.imageUrl) && !imgError;

  const handleConfirmDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm(`هل أنت متأكد من حذف "${product.name}"؟`)) {
      onDelete();
    }
  };

  return (
    <article
      onClick={onSelect}
      className="group bg-white border border-[#e6ddd3] rounded-2xl overflow-hidden flex flex-col cursor-pointer transition-all duration-300 hover:-translate-y-1 hover:shadow-lg animate-fade-in"
    >
      <div className="relative aspect-[4/5] w-full bg-pink-50 overflow-hidden">
        {hasValidImage ? (
          <img src={product.imageUrl} alt={product.name} onError={() => setImgError(true)} className="w-full h-full object-cover mix-blend-multiply transition-transform duration-300 group-hover:scale-105" />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center p-5 text-center">
            <ShoppingBag className="w-8 h-8 text-[#762b43] mb-2 opacity-80" />
            <span className="text-sm font-bold text-[#1f1917]">{product.name}</span>
          </div>
        )}

        {/* أزرار الإدارة (تعديل وحذف) */}
        {isAdminMode && (
          <div onClick={(e) => e.stopPropagation()} className="absolute top-2 left-2 right-2 flex justify-between z-10">
             <div className="flex gap-1">
               <button onClick={() => fileInputRef.current?.click()} className="p-1.5 bg-white rounded-md shadow text-[#762b43]"><ImagePlus className="w-4 h-4" /></button>
               <input ref={fileInputRef} type="file" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if(f) onReplaceImage(f); }} />
             </div>
             <div className="flex gap-1">
               <button onClick={onEdit} className="p-1.5 bg-white rounded-md shadow text-gray-700"><Pencil className="w-4 h-4" /></button>
               <button onClick={handleConfirmDelete} className="p-1.5 bg-red-600 rounded-md shadow text-white"><Trash2 className="w-4 h-4" /></button>
             </div>
          </div>
        )}
      </div>

      <div className="p-3 text-center flex-1 flex flex-col justify-between">
        <div>
          <h3 className="text-sm sm:text-base font-bold text-[#1f1917] leading-snug">{product.name}</h3>
          <p className="text-sm font-extrabold text-[#762b43] mt-1">{product.basePrice.toLocaleString('en-US')} دج</p>
        </div>
        
        {/* دوائر الألوان (بحال الصورة) */}
        <div className="mt-3 flex items-center justify-center gap-1.5">
           {CAP_SWATCHES.slice(0, 5).map((sw) => (
             <span key={sw.name} className="w-3 h-3 rounded-full border border-gray-200" style={{ backgroundColor: sw.hex }} />
           ))}
           <span className="w-3 h-3 rounded-full border border-gray-200 bg-black" />
        </div>
      </div>
    </article>
  );
}

// --- المكون الرئيسي (الكتالوج) ---
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
}: ProductCatalogProps) {
  const [selectedSection, setSelectedSection] = useState<CategoryId | null>(null);
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [activeBranch, setActiveBranch] = useState<string>('الكل');

  // دالة للتعامل مع زر الرجوع في الهاتف لضمان انتقال سلس
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
    window.history.pushState({ catalogLevel: 'product', section: selectedSection, productId }, '');
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
    if (selectedSection === 'accessories') return p.category === 'accessories' || p.category === 'cap';
    return p.category === selectedSection;
  });

  const branches = selectedSection && CATEGORY_BRANCHES[selectedSection] ? CATEGORY_BRANCHES[selectedSection] : [];
  const filteredProducts = sectionProducts.filter((p) => activeBranch === 'الكل' || p.branch === activeBranch);

  return (
        <div key={selectedProductId || selectedSection || 'home'} className="catalog-enter">
    <section id="catalog-sec" className="py-8 sm:py-12 border-b border-[#e6ddd3] overflow-hidden">
      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        
        {/* عرض تفاصيل المنتج */}
        {selectedProduct && activeSectionMeta ? (
          <ProductDetailView
            product={selectedProduct}
            sectionTitle={activeSectionMeta.title}
            onBackToHome={handleBackToHome}
            onBackToSection={() => setSelectedProductId(null)}
            onAddToCart={onAddToCart}
            isAdminMode={isAdminMode}
            onSetColorImage={(colorName, file) => onSetProductColorImage?.(selectedProduct.id, colorName, file)}
          />
        ) : 
        
        /* عرض الأقسام والمنتجات */
        selectedSection && activeSectionMeta ? (
          <div className="animate-slide-in-right">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
              <div className="flex items-center gap-1.5 text-xs font-bold text-[#6e645e]">
                <button type="button" onClick={handleBackToHome} className="hover:text-[#762b43] underline">الرئيسية</button>
                <ChevronLeft className="w-3.5 h-3.5" />
                <span className="text-[#1f1917]">{activeSectionMeta.title}</span>
              </div>
              <button type="button" onClick={handleBackToHome} className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-white border border-[#e6ddd3] text-xs font-bold hover:bg-[#f3eee8]">
                <ArrowRight className="w-3.5 h-3.5" />
                <span>كل الأقسام</span>
              </button>
            </div>

            <div className="mb-6 text-center">
              <h2 className="text-3xl font-bold text-[#762b43]">{activeSectionMeta.title}</h2>
              <p className="text-sm text-[#6e645e] mt-1.5 max-w-xl mx-auto">{activeSectionMeta.subtitle}</p>
            </div>

            {branches.length > 1 && (
              <div className="flex flex-wrap items-center justify-center gap-1.5 mb-6 pb-3 border-b border-[#e6ddd3]">
                {branches.map((branch) => (
                  <button
                    key={branch}
                    type="button"
                    onClick={() => setActiveBranch(branch)}
                    className={`px-4 py-1.5 rounded-full text-xs font-bold transition-colors ${activeBranch === branch ? 'bg-[#762b43] text-white' : 'bg-white border border-[#e6ddd3] text-[#6e645e]'}`}
                  >
                    {branch}
                  </button>
                ))}
              </div>
            )}

            {/* شبكة المنتجات (عمودين بحال الصورة) */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-5">
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
          </div>
        ) : 
        
        /* الصفحة الرئيسية (الأقسام) */
        (
          <div className="animate-fade-in">
             <div className="text-center mb-8">
                <h2 className="text-3xl font-bold text-[#762b43]">أقسام دار الأزياء</h2>
             </div>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {MAIN_SECTIONS.map((sec) => {
                   const coverImg = products.find(p => (sec.id === 'accessories' ? p.category === 'accessories' || p.category === 'cap' : p.category === sec.id) && p.imageUrl)?.imageUrl || sec.fallbackImg;
                   return (
                     <div key={sec.id} onClick={() => handleOpenSection(sec.id)} className="bg-white border border-[#e6ddd3] rounded-3xl overflow-hidden cursor-pointer group hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1">
                        <div className="aspect-[4/3] bg-pink-50 overflow-hidden">
                           <img src={coverImg} className="w-full h-full object-cover mix-blend-multiply group-hover:scale-105 transition-transform duration-500" />
                        </div>
                        <div className="p-6 text-center">
                           <h3 className="text-xl font-bold text-[#762b43] mb-2">{sec.title}</h3>
                           <p className="text-sm text-[#6e645e] mb-4">{sec.subtitle}</p>
                           <span className="inline-block px-6 py-2 rounded-full bg-[#762b43] text-white text-sm font-bold group-hover:bg-[#581e31] transition-colors">{sec.buttonText}</span>
                        </div>
                     </div>
                   )
                })}
             </div>
          </div>
        )}
      </div>

      {/* أنيميشن الانتقالات */}
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes slideInRight {
          from { opacity: 0; transform: translateX(50px); }
          to { opacity: 1; transform: translateX(0); }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .animate-fade-in-up { animation: fadeInUp 0.4s ease-out forwards; }
        .animate-slide-in-right { animation: slideInRight 0.4s ease-out forwards; }
        .animate-fade-in { animation: fadeIn 0.4s ease-out forwards; }
      `}} />
    </section>
          </div>
  );
}
