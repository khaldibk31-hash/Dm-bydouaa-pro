import { ChangeEvent, useRef, useState } from 'react';
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

function ProductDetailView({
  product,
  sectionTitle,
  onBackToHome,
  onBackToSection,
  onAddToCart,
}: {
  product: Product;
  sectionTitle: string;
  onBackToHome: () => void;
  onBackToSection: () => void;
  onAddToCart: (item: Omit<CartItem, 'id' | 'quantity'>) => void;
}) {
  const [selectedOptionIdx, setSelectedOptionIdx] = useState(0);
  const [selectedSecondary, setSelectedSecondary] = useState(
    product.secondaryOptions?.[0] || ''
  );
  const [selectedCapColor, setSelectedCapColor] = useState(CAP_SWATCHES[0].name);
  const [headSize, setHeadSize] = useState('');
  const [customNotes, setCustomNotes] = useState('');

  const activeOption = product.options[selectedOptionIdx];
  const basePrice = activeOption ? activeOption.price : product.basePrice;
  const tuxedoSurcharge = selectedSecondary.includes('+100') ? 100 : 0;
  const displayPrice = basePrice + tuxedoSurcharge;

  const handleAdd = () => {
    const detailParts: string[] = [];
    if (activeOption) detailParts.push(activeOption.label);
    if (selectedSecondary) detailParts.push(selectedSecondary);
    if (product.supportsColorSwatches && selectedCapColor) {
      detailParts.push(`لون: ${selectedCapColor}`);
    }
    if (product.supportsHeadCircumference && headSize.trim()) {
      detailParts.push(`محيط الرأس: ${headSize.trim()} سم`);
    }
    if (customNotes.trim()) {
      detailParts.push(`ملاحظة: ${customNotes.trim()}`);
    }

    onAddToCart({
      category: product.category,
      title: product.name,
      details: detailParts.join(' · '),
      unitPrice: displayPrice,
    });
  };

  return (
    <div className="bg-white border border-[#e6ddd3] rounded-3xl overflow-hidden shadow-sm">
      {/* Breadcrumb Navigation */}
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
        {/* Large Product Image */}
        <div className="aspect-[4/3] md:aspect-square rounded-2xl bg-[#f3eee8] overflow-hidden border border-[#e6ddd3]">
          {product.imageUrl ? (
            <img
              src={product.imageUrl}
              alt={product.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center">
              <ShoppingBag className="w-10 h-10 text-[#762b43] mb-2 opacity-75" />
              <span className="font-editorial text-lg font-bold text-[#1f1917]">
                {product.name}
              </span>
            </div>
          )}
        </div>

        {/* Customization Controls */}
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
                        className={`px-3 py-2.5 rounded-xl border text-xs font-bold text-right transition-all cursor-pointer ${
                          active
                            ? 'bg-[#762b43] text-white border-[#762b43]'
                            : 'bg-[#faf8f5] text-[#1f1917] border-[#e6ddd3] hover:border-[#762b43]'
                        }`}
                      >
                        <span className="block">{opt.label}</span>
                        <span className={`text-[11px] ${active ? 'text-white/90' : 'text-[#6e645e]'}`}>
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
                <label className="block text-xs font-bold text-[#1f1917] mb-2">
                  {product.secondaryLabel || 'خيارات إضافية'}:
                </label>
                <div className="grid grid-cols-2 gap-2">
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

            {product.supportsColorSwatches && (
              <div>
                <label className="block text-xs font-bold text-[#1f1917] mb-2">
                  اللون المختار: <span className="text-[#762b43]">{selectedCapColor}</span>
                </label>
                <div className="flex flex-wrap items-center gap-2">
                  {CAP_SWATCHES.map((swatch) => {
                    const isActive = swatch.name === selectedCapColor;
                    return (
                      <button
                        key={swatch.name}
                        type="button"
                        title={swatch.name}
                        onClick={() => setSelectedCapColor(swatch.name)}
                        className={`w-7 h-7 rounded-full border flex items-center justify-center transition-transform cursor-pointer ${
                          isActive
                            ? 'ring-2 ring-[#762b43] ring-offset-2 scale-110 border-[#762b43]'
                            : 'border-[#d6cdc2]'
                        }`}
                        style={{ backgroundColor: swatch.hex }}
                      >
                        {isActive && (
                          <Check
                            className={`w-3.5 h-3.5 ${
                                                          swatch.hex === '#f5f5f4' || swatch.hex === '#d6d3d1'
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
          )}

          {product.supportsHeadCircumference && (
            <div>
              <label className="block text-xs font-bold text-[#1f1917] mb-1.5">
                محيط الرأس بالسنتيمتر (اختياري):
              </label>
              <input
                type="number"
                min={48}
                max={66}
                value={headSize}
                onChange={(e) => setHeadSize(e.target.value)}
                placeholder="مثال: 57"
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#e6ddd3] bg-[#faf8f5] text-xs text-[#1f1917]"
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-[#1f1917] mb-1.5">
              ملاحظة أو لون خاص أو نص للتطريز (اختياري):
            </label>
            <input
              type="text"
              value={customNotes}
              onChange={(e) => setCustomNotes(e.target.value)}
              placeholder="اكتبي اللون أو المقاس أو الاسم المطلوب..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-[#e6ddd3] bg-[#faf8f5] text-xs text-[#1f1917]"
            />
          </div>
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
    const file = e.target.files?.[0];
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
}: ProductCatalogProps) {
  const [selectedSection, setSelectedSection] = useState<CategoryId | null>(null);
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [activeBranch, setActiveBranch] = useState<string>('الكل');

  const handleOpenSection = (cat: CategoryId) => {
    setSelectedSection(cat);
    setSelectedProductId(null);
    setActiveBranch('الكل');
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
                    onSelect={() => setSelectedProductId(product.id)}
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
