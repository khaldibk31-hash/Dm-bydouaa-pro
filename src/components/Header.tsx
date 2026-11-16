import { ChangeEvent, useRef } from 'react';
import { ShoppingBag, CloudUpload, LogOut, Type, ImagePlus, Plus } from 'lucide-react';

interface HeaderProps {
  brandName: string;
  logoUrl: string;
  cartCount: number;
  isAdminMode: boolean;
  isSaving: boolean;
  onOpenCart: () => void;
  onPublish: () => void;
  onLogout: () => void;
  onOpenCopyEditor: () => void;
  onOpenAddProduct: () => void;
  onUploadLogo: (file: File) => void;
}

export function Header({
  brandName,
  logoUrl,
  cartCount,
  isAdminMode,
  isSaving,
  onOpenCart,
  onPublish,
  onLogout,
  onOpenCopyEditor,
  onOpenAddProduct,
  onUploadLogo,
}: HeaderProps) {
  const logoInputRef = useRef<HTMLInputElement>(null);

  const handleLogoChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onUploadLogo(file);
      e.target.value = '';
    }
  };

  return (
    <>
      <header className="sticky top-0 z-40 bg-[#faf8f5]/95 backdrop-blur-md border-b border-[#e6ddd3]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-8">
          {/* Zone 1: Single-line Brand Wordmark */}
          <a
            href="#top"
            className="flex items-center gap-2.5 shrink-0 whitespace-nowrap group"
          >
            {logoUrl ? (
              <img
                src={logoUrl}
                alt={brandName}
                referrerPolicy="no-referrer"
                className="h-9 w-9 rounded-md object-cover border border-[#e6ddd3]"
              />
            ) : null}
            <span className="font-editorial text-xl sm:text-2xl font-bold tracking-wide text-[#1f1917] whitespace-nowrap shrink-0">
              {brandName}
            </span>
          </a>

          {/* Zone 2: Clean single-line text navigation links */}
          <nav
            className="hidden md:flex items-center gap-7 text-sm font-semibold text-[#6e645e]"
            aria-label="التنقل الرئيسي"
          >
            <a
              href="#studio-sec"
              className="hover:text-[#762b43] transition-colors whitespace-nowrap shrink-0 py-1 border-b border-transparent hover:border-[#762b43]"
            >
              صمّم وشاحك
            </a>
            <a
              href="#catalog-sec"
              className="hover:text-[#762b43] transition-colors whitespace-nowrap shrink-0 py-1 border-b border-transparent hover:border-[#762b43]"
            >
              المجموعة
            </a>
            <a
              href="#prices-sec"
              className="hover:text-[#762b43] transition-colors whitespace-nowrap shrink-0 py-1 border-b border-transparent hover:border-[#762b43]"
            >
              الأسعار
            </a>
            <a
              href="#faq-sec"
              className="hover:text-[#762b43] transition-colors whitespace-nowrap shrink-0 py-1 border-b border-transparent hover:border-[#762b43]"
            >
              الأسئلة
            </a>
          </nav>

          {/* Zone 3: Single primary action */}
          <div className="flex items-center shrink-0">
            <button
              type="button"
              onClick={onOpenCart}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#762b43] hover:bg-[#581e31] text-white text-xs sm:text-sm font-bold transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <ShoppingBag className="w-4 h-4 shrink-0" />
              <span>الحقيبة</span>
              <span className="tabular-nums font-bold opacity-90">({cartCount})</span>
            </button>
          </div>
        </div>
      </header>

      {/* Admin Atelier Bar (only visible when authenticated via Supabase Auth) */}
      {isAdminMode && (
        <div
          className="bg-[#1f1917] text-[#faf8f5] border-b border-[#3a312d]"
          role="region"
          aria-label="لوحة إدارة المتجر"
        >
          <div className="max-w-6xl mx-auto px-4 sm:px-6 py-2.5 flex flex-wrap items-center justify-between gap-3">
            <div className="text-xs sm:text-sm">
              <span className="font-bold text-[#e6d5b8]">وضع الإدارة مفعّل</span>
              <span className="mx-2 text-[#6e645e]">·</span>
              <span className="text-[#cfc5bc]">
                احفظ التعديلات ليظهر التحديث لجميع الزوار
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <input
                ref={logoInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleLogoChange}
              />
              <button
                type="button"
                onClick={() => logoInputRef.current?.click()}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-white/10 hover:bg-white/20 text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                <ImagePlus className="w-3.5 h-3.5" />
                <span>تغيير الشعار</span>
              </button>
              <button
                type="button"
                onClick={onOpenCopyEditor}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-white/10 hover:bg-white/20 text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                <Type className="w-3.5 h-3.5" />
                <span>تعديل النصوص</span>
              </button>
              <button
                type="button"
                onClick={onOpenAddProduct}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-white/10 hover:bg-white/20 text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>إضافة موديل</span>
              </button>
              <button
                type="button"
                disabled={isSaving}
                onClick={onPublish}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-md bg-[#b99a65] hover:bg-[#a68652] text-[#1f1917] text-xs font-bold transition-colors whitespace-nowrap shrink-0 disabled:opacity-60 cursor-pointer"
              >
                <CloudUpload className="w-3.5 h-3.5" />
                <span>{isSaving ? 'جاري النشر...' : 'حفظ ونشر'}</span>
              </button>
              <button
                type="button"
                onClick={onLogout}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-white text-[#581e31] hover:bg-[#f3eee8] text-xs font-bold transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>خروج</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
