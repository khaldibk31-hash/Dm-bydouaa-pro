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
  onEdit,
  onDelete,
  onReplaceImage,
}: {
  product: Product;
  sectionTitle: string;
  isAdminMode: boolean;
  onBackToHome: () => void;
  onBackToSection: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  onReplaceImage?: (file: File) => void;
}) {
  const [selectedColor, setSelectedColor] = useState(CAP_SWATCHES.at(0)!);
  const activeImageUrl = product.colorImages?.[selectedColor.name] || product.imageUrl;

  // التحقق واش الزبون اختار "شال بالظهر" باش نطلعولو الألوان
  const hasBackOption = product.options.some(opt => opt.label.includes('بالظهر'));

  return (
    // 🟢 حيدنا الإطار الجانبي (border, rounded, bg-white) باش يولي نقي
    <div className="w-full max-w-2xl mx-auto py-6">
      
      {/* شريط التنقل النقي */}
      <div className="pb-4 mb-6 flex flex-wrap items-center justify-between gap-2 text-xs font-bold text-[#6e645e]">
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
              <button onClick={onEdit} className="inline-flex items-center gap-1 text-blue-700 hover:underline font-bold">
                <Pencil className="w-3.5 h-3.5" /><span>تعديل المنتج</span>
              </button>
              <button onClick={() => { if (window.confirm('هل أنت متأكد من الحذف؟')) onDelete(); }} className="inline-flex items-center gap-1 text-red-600 hover:underline font-bold">
                <Trash2 className="w-3.5 h-3.5" /><span>حذف</span>
              </button>
            </div>
          )}
          <button onClick={onBackToSection} className="inline-flex items-center gap-1 text-[#762b43] hover:underline cursor-pointer">
            <ArrowRight className="w-3.5 h-3.5" /><span>رجوع</span>
          </button>
        </div>
      </div>

      <div className="space-y-8">
        
        {/* الصورة الكبيرة - تم إصلاحها بـ object-contain */}
        <div className="relative aspect-[4/3] w-full rounded-2xl bg-[#faf8f5] overflow-hidden flex items-center justify-center border border-[#e6ddd3]">
          {isAdminMode && onReplaceImage && (
            <div className="absolute top-3 right-3 z-10">
              <label className="cursor-pointer bg-white/95 backdrop-blur-md text-[#1f1917] px-3 py-1.5 rounded-lg border border-[#e6ddd3] text-xs font-bold shadow-sm hover:bg-[#f3eee8] flex items-center gap-1.5">
                <ImagePlus className="w-4 h-4 text-[#762b43]" />
                تغيير الصورة
                <input type="file" accept="image/*" className="hidden" onChange={(e) => {
                    const file = e.target.files?.item(0);
                    if (file) onReplaceImage(file);
                    e.target.value = '';
                }} />
              </label>
            </div>
          )}
          {activeImageUrl ? (
            // 🟢 هنا صلحنا الإطار باش تبان الصورة كاملة
            <img src={activeImageUrl} alt={product.name} className="w-full h-full object-contain p-4" />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center">
              <ShoppingBag className="w-10 h-10 text-[#762b43] mb-2 opacity-75" />
              <span className="font-editorial text-lg font-bold text-[#1f1917]">{product.name}</span>
            </div>
          )}
        </div>

        {/* دوائر الألوان - كتبان غير إلا كان خيار "بالظهر" كاين */}
        {hasBackOption && (
          <div className="p-5 bg-[#faf8f5] border border-[#e6ddd3] rounded-2xl">
            <label className="block text-sm font-bold text-[#1f1917] mb-4 text-center">اختر لون الشال:</label>
            <div className="flex flex-wrap items-center justify-center gap-3">
              {CAP_SWATCHES.map((swatch) => (
                <button
                  key={swatch.name}
                  type="button"
                  onClick={() => setSelectedColor(swatch)}
                  className={`relative w-10 h-10 rounded-full border-2 flex items-center justify-center transition-transform cursor-pointer ${
                    swatch.name === selectedColor.name ? 'ring-2 ring-[#762b43] ring-offset-2 scale-110 border-[#762b43]' : 'border-[#d6cdc2] hover:scale-105'
                  }`}
                  style={{ backgroundColor: swatch.hex }}
                >
                  {swatch.name === selectedColor.name && (
                    <Check className={`w-5 h-5 ${swatch.hex === '#f5f5f4' || swatch.hex === '#e7d8c9' ? 'text-black' : 'text-white'}`} />
                  )}
                </button>
              ))}
            </div>
          </div>
        )}

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
    if (window.confirm(`هل أنت متأكد من حذف هذا الموديل نهائياً؟\n\n"${product.name}"`)) {
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
            style={isMorphing ? MORPH_STYLE : undefined}
            // 🟢 هنا صلحنا إطار الصورة فالكارت باش تبان كاملة
            className="w-full h-full object-contain p-2 transition-transform duration-300 group-hover:scale-[1.03]"
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
  const [morphProductId, setMorphProductId] = useState<string | null>(null);

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

    withViewTransition(
      () => {
        window.history.pushState(
          { catalogLevel: 'product', section: selectedSection, productId },
          ''
        );
        setSelectedProductId(productId);
      },
      () => setMorphProductId(null)
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
    if (pid) {
      flushSync(() => setMorphProductId(pid));
    }
    withViewTransition(
      () => setSelectedProductId(null),
      () => setMorphProductId(null)
    );
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
    <div key={selectedProductId || selectedSection || 'home'} className="catalog-enter">
      <section id="catalog-sec" className="py-12 sm:py-16 border-b border-[#e6ddd3]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          {selectedProduct && activeSectionMeta ? (
            <ProductDetailView
              product={selectedProduct}
              sectionTitle={activeSectionMeta.title}
              onBackToHome={handleBackToHome}
              onBackToSection={handleBackToSection}
              isAdminMode={isAdminMode}
              onEdit={() => onEditProduct(selectedProduct)}
              onDelete={() => {
                onDeleteProduct(selectedProduct.id);
                handleBackToHome();
              }}
              onReplaceImage={(file) => onReplaceProductImage(selectedProduct.id, file)}
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
    </div>
  );
}
