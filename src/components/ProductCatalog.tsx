import { ChangeEvent, useRef, useState } from 'react';
import { Check, ImageOff, ImagePlus, Pencil, Plus, ShoppingBag, Trash2 } from 'lucide-react';
import {
  CAP_SWATCHES,
  CATEGORY_BRANCHES,
  CATEGORY_LABELS,
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

interface ProductCardProps {
  product: Product;
  isAdminMode: boolean;
  onAddToCart: (item: Omit<CartItem, 'id' | 'quantity'>) => void;
  onEdit: () => void;
  onDelete: () => void;
  onReplaceImage: (file: File) => void;
  onRemoveImage: () => void;
}

function ProductCard({
  product,
  isAdminMode,
  onAddToCart,
  onEdit,
  onDelete,
  onReplaceImage,
  onRemoveImage,
}: ProductCardProps) {
  const [selectedOptionIdx, setSelectedOptionIdx] = useState(0);
  const [selectedSecondary, setSelectedSecondary] = useState(
    product.secondaryOptions?.[0] || ''
  );
  const [selectedCapColor, setSelectedCapColor] = useState(CAP_SWATCHES[0].name);
  const [headSize, setHeadSize] = useState('');
  const [imgError, setImgError] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const activeOption = product.options[selectedOptionIdx];
  const basePrice = activeOption ? activeOption.price : product.basePrice;
  const tuxedoSurcharge = selectedSecondary.includes('+100') ? 100 : 0;
  const displayPrice = basePrice + tuxedoSurcharge;

  const handleImageChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImgError(false);
      onReplaceImage(file);
      e.target.value = '';
    }
  };

  const handleConfirmDeleteModel = () => {
    if (window.confirm(`هل أنتِ متأكدة من حذف هذا الموديل نهائياً؟\n\n"${product.name}"`)) {
      onDelete();
    }
  };

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

    onAddToCart({
      category: product.category,
      title: product.name,
      details: detailParts.join(' · '),
      unitPrice: displayPrice,
    });
  };

  const hasValidImage = Boolean(product.imageUrl) && !imgError;

  return (
    <article className="group bg-white border border-[#e6ddd3] rounded-2xl overflow-hidden flex flex-col transition-transform duration-200 hover:-translate-y-0.5 hover:shadow-md">
      <div className="relative aspect-[4/3] w-full bg-[#f3eee8] overflow-hidden">
        {hasValidImage ? (
          <img
            src={product.imageUrl}
            alt={product.name}
            referrerPolicy="no-referrer"
            onError={() => setImgError(true)}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center bg-gradient-to-br from-[#f3eee8] to-[#ebe2d8]">
            <ShoppingBag className="w-7 h-7 text-[#762b43] mb-2 opacity-80" />
            <span className="font-editorial text-base font-bold text-[#1f1917]">
              {product.name}
            </span>
            {isAdminMode && (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#762b43] text-white text-xs font-bold shadow-sm hover:bg-[#581e31] cursor-pointer"
              >
                <ImagePlus className="w-3.5 h-3.5" />
                <span>اضغطي لإضافة صورة</span>
              </button>
            )}
          </div>
        )}

        {isAdminMode && (
          <div className="absolute top-2.5 left-2.5 right-2.5 flex flex-wrap items-center justify-between gap-1.5 z-10">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleImageChange}
            />
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md bg-white/95 text-[#1f1917] border border-[#e6ddd3] text-xs font-bold shadow-sm hover:bg-[#f3eee8] cursor-pointer"
              >
                <ImagePlus className="w-3.5 h-3.5 text-[#762b43]" />
                <span>{hasValidImage ? 'تغيير الصورة' : 'إضافة صورة'}</span>
              </button>

              {hasValidImage && (
                <button
                  type="button"
                  onClick={onRemoveImage}
                  className="inline-flex items-center gap-1 px-2 py-1.5 rounded-md bg-white/95 text-amber-800 border border-amber-200 text-xs font-bold shadow-sm hover:bg-amber-50 cursor-pointer"
                >
                  <ImageOff className="w-3.5 h-3.5" />
                  <span>حذف الصورة</span>
                </button>
              )}
            </div>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={onEdit}
                title="تعديل تفاصيل الموديل"
                className="inline-flex items-center gap-1 px-2 py-1.5 rounded-md bg-white/95 text-[#1f1917] border border-[#e6ddd3] text-xs font-bold shadow-sm hover:bg-[#f3eee8] cursor-pointer"
              >
                <Pencil className="w-3.5 h-3.5" />
                <span>تعديل</span>
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteModel}
                title="حذف الموديل بالكامل"
                className="inline-flex items-center gap-1 px-2 py-1.5 rounded-md bg-red-600 text-white text-xs font-bold shadow-sm hover:bg-red-700 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>حذف الموديل</span>
              </button>
            </div>
          </div>
        )}
      </div>
      <div className="p-5 flex-1 flex flex-col justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-[#6e645e] mb-1.5">
            <span className="text-[#762b43]">{CATEGORY_LABELS[product.category]}</span>
            <span aria-hidden="true">·</span>
            <span>{product.branch}</span>
          </div>

          <h3 className="text-base font-bold text-[#1f1917] leading-snug mb-1.5">
            {product.name}
          </h3>

          <p className="text-xs sm:text-sm text-[#6e645e] leading-relaxed">
            {product.description}
          </p>
        </div>

        <div className="space-y-3">
          {(product.options.length > 0 ||
            (product.secondaryOptions && product.secondaryOptions.length > 0)) && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {product.options.length > 0 && (
                <select
                  aria-label="اختر النوع أو القماش"
                  value={selectedOptionIdx}
                  onChange={(e) => setSelectedOptionIdx(Number(e.target.value))}
                  className="w-full px-2.5 py-2 rounded-lg border border-[#e6ddd3] bg-[#faf8f5] text-xs font-semibold text-[#1f1917]"
                >
                  {product.options.map((opt, idx) => (
                    <option key={opt.label} value={idx}>
                      {opt.label} ({opt.price.toLocaleString('en-US')} دج)
                    </option>
                  ))}
                </select>
              )}

              {product.secondaryOptions && product.secondaryOptions.length > 0 && (
                <select
                  aria-label={product.secondaryLabel || 'خيارات إضافية'}
                  value={selectedSecondary}
                  onChange={(e) => setSelectedSecondary(e.target.value)}
                  className="w-full px-2.5 py-2 rounded-lg border border-[#e6ddd3] bg-[#faf8f5] text-xs font-semibold text-[#1f1917]"
                >
                  {product.secondaryOptions.map((sec) => (
                    <option key={sec} value={sec}>
                      {sec}
                    </option>
                  ))}
                </select>
              )}
            </div>
          )}

          {product.supportsColorSwatches && (
            <div className="pt-1 space-y-2.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-[#6e645e]">
                  لون القبعة: <strong className="text-[#1f1917]">{selectedCapColor}</strong>
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-1.5">
                {CAP_SWATCHES.map((swatch) => {
                  const isActive = swatch.name === selectedCapColor;
                  return (
                    <button
                      key={swatch.name}
                      type="button"
                      title={swatch.name}
                      aria-label={swatch.name}
                      onClick={() => setSelectedCapColor(swatch.name)}
                      className={`w-6 h-6 rounded-full border flex items-center justify-center transition-transform cursor-pointer ${
                        isActive
                          ? 'ring-2 ring-[#762b43] ring-offset-1 scale-105 border-[#762b43]'
                          : 'border-[#d6cdc2]'
                      }`}
                      style={{ backgroundColor: swatch.hex }}
                    >
                      {isActive && (
                        <Check
                          className={`w-3 h-3 ${
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
              <input
                type="number"
                min={48}
                max={66}
                value={headSize}
                onChange={(e) => setHeadSize(e.target.value)}
                placeholder="محيط الرأس بالسنتيمتر (اختياري، مثال: 57)"
                className="w-full px-3 py-2 rounded-lg border border-[#e6ddd3] bg-[#faf8f5] text-xs text-[#1f1917]"
              />
            </div>
          )}

          <div className="flex items-center justify-between gap-3 pt-3 border-t border-[#e6ddd3]">
            <div>
              <span className="block text-[11px] text-[#6e645e]">السعر</span>
              <span className="text-base font-extrabold text-[#762b43] tabular-nums">
                {displayPrice.toLocaleString('en-US')} دج
              </span>
            </div>

            <button
              type="button"
              onClick={handleAdd}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#762b43] hover:bg-[#581e31] text-white text-xs font-bold transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <ShoppingBag className="w-3.5 h-3.5" />
              <span>أضف للحقيبة</span>
            </button>
          </div>
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
  const [activeCategory, setActiveCategory] = useState<'all' | CategoryId>('all');
  const [activeBranch, setActiveBranch] = useState<string>('الكل');

  const handleSelectCategory = (cat: 'all' | CategoryId) => {
    setActiveCategory(cat);
    setActiveBranch('الكل');
  };

  const branches =
    activeCategory === 'all' ? [] : CATEGORY_BRANCHES[activeCategory] || [];

  const filteredProducts = products.filter((p) => {
    if (activeCategory !== 'all' && p.category !== activeCategory) return false;
    if (activeBranch !== 'الكل' && p.branch !== activeBranch) return false;
    return true;
  });

  const categories: Array<'all' | CategoryId> = [
    'all',
    'shawl',
    'robe',
    'cap',
    'accessories',
  ];

  return (
    <section id="catalog-sec" className="py-12 sm:py-16 border-b border-[#e6ddd3]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
          <div>
            <p className="text-xs font-bold text-[#762b43] mb-1.5">
              المجموعة الكاملة
            </p>
            <h2 className="font-editorial text-2xl sm:text-3xl font-bold text-[#1f1917]">
              اختر قطع تخرجك بدقة
            </h2>
            <p className="text-sm text-[#6e645e] mt-1">
              الوشاح يأتي مع قبعته، والروب يُفصّل بمقاسك، ويمكنك جمع كل القطع في طلب واحد.
            </p>
          </div>

          {isAdminMode && (
            <button
              type="button"
              onClick={() =>
                onOpenAddProduct(activeCategory === 'all' ? 'shawl' : activeCategory)
              }
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#1f1917] hover:bg-[#3a312d] text-white text-xs font-bold whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>إضافة موديل جديد</span>
            </button>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2 mb-4">
          {categories.map((cat) => {
            const active = activeCategory === cat;
            return (
              <button
                key={cat}
                type="button"
                onClick={() => handleSelectCategory(cat)}
                className={`px-4 py-2 rounded-lg text-xs sm:text-sm font-bold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  active
                    ? 'bg-[#762b43] text-white'
                    : 'bg-white border border-[#e6ddd3] text-[#6e645e] hover:text-[#1f1917] hover:bg-[#f3eee8]'
                }`}
              >
                {CATEGORY_LABELS[cat]}
              </button>
            );
          })}
        </div>

        {branches.length > 1 && (
          <div className="flex flex-wrap items-center gap-1.5 mb-7 pb-3 border-b border-[#e6ddd3]">
            {branches.map((branch) => {
              const active = activeBranch === branch;
              return (
                <button
                  key={branch}
                  type="button"
                  onClick={() => setActiveBranch(branch)}
                  className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    active
                      ? 'bg-[#1f1917] text-white'
                      : 'bg-[#f3eee8] text-[#6e645e] hover:text-[#1f1917]'
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
              لا توجد موديلات مطابقة في هذا القسم حالياً.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
            {filteredProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                isAdminMode={isAdminMode}
                onAddToCart={onAddToCart}
                onEdit={() => onEditProduct(product)}
                onDelete={() => onDeleteProduct(product.id)}
