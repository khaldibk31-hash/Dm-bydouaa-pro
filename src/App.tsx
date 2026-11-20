import { useCallback, useEffect, useState } from 'react';
import { Lock, MessageCircle } from 'lucide-react';
import {
  AdminLoginModal,
  CopyEditorModal,
  ProductEditorModal,
} from './components/AdminModals';
import { CartDrawer } from './components/CartDrawer';
import { Header } from './components/Header';
import { HeroSection } from './components/HeroSection';
import { PricingAndFaq } from './components/PricingAndFaq';
import { ProductCatalog } from './components/ProductCatalog';
import { StoleStudio } from './components/StoleStudio';
import { ToastContainer } from './components/Toast';
import {
  DEFAULT_STORE_STATE,
  SHAWL_IMAGE_PATH,
  WHATSAPP_NUMBER,
} from './data/defaultStore';
import {
  loadStoreState,
  saveStoreState,
  signInAdmin,
  signOutAdmin,
  supabase,
  uploadStoreImage,
} from './lib/supabase';
import {
  CapStyleOverride,
  CartItem,
  CategoryId,
  Product,
  ProductOption,
  SectionOverride,
  StoreCopy,
  StoreState,
  ToastMessage,
} from './types/store';
import { useInlineEditor } from './hooks/useInlineEditor';
import { Reveal } from './components/Reveal';
import { ArrowDown, ArrowUp, CloudUpload, LogOut } from 'lucide-react';

const CART_STORAGE_KEY = 'dg_by_douaa_cart_v1';
const EMPTY_RECORD: Record<string, string> = {};

export default function App() {
  const [storeState, setStoreState] = useState<StoreState>(DEFAULT_STORE_STATE);
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);
  const [isAdminMode, setIsAdminMode] = useState(false);
  const [isSavingCloud, setIsSavingCloud] = useState(false);
  const sectionOrder = storeState.sectionOrder && storeState.sectionOrder.length === 3
    ? storeState.sectionOrder
    : ['catalog', 'studio', 'pricing'];

  const moveSection = (id: string, dir: -1 | 1) => {
    const idx = sectionOrder.indexOf(id);
    const target = idx + dir;
    if (idx < 0 || target < 0 || target >= sectionOrder.length) return;
    const next = [...sectionOrder];
    [next[idx], next[target]] = [next[target], next[idx]];
    setStoreState((prev) => ({ ...prev, sectionOrder: next }));
  };

  const [cart, setCart] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem(CART_STORAGE_KEY);
      return saved ? (JSON.parse(saved) as CartItem[]) : [];
    } catch {
      return [];
    }
  });

  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isCopyModalOpen, setIsCopyModalOpen] = useState(false);
  const [productModalState, setProductModalState] = useState<{
    isOpen: boolean;
    category: CategoryId;
    editing: Product | null;
  }>({
    isOpen: false,
    category: 'shawl',
    editing: null,
  });

  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const notify = useCallback(
    (type: ToastMessage['type'], text: string) => {
      const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      setToasts((prev) => [...prev, { id, type, text }]);
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 3600);
    },
    []
  );

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
    } catch {
      // Ignore storage quota errors
    }
  }, [cart]);

  useEffect(() => {
    let active = true;

    loadStoreState().then(({ state, session, error }) => {
      if (!active) return;
      setStoreState(state);
      const authed = Boolean(session);
      setIsAdminAuthenticated(authed);
      setIsAdminMode(authed);
      if (error) {
        console.warn('Store load note:', error);
      }
    });

    const { data: authListener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        const authed = Boolean(session);
        setIsAdminAuthenticated(authed);
        setIsAdminMode(authed);
      }
    );

    return () => {
      active = false;
      authListener.subscription.unsubscribe();
    };
  }, []);

  const handleAddToCart = (item: Omit<CartItem, 'id' | 'quantity'>) => {
    setCart((prev) => {
      const existingIdx = prev.findIndex(
        (p) =>
          p.title === item.title &&
          (p.details || '') === (item.details || '') &&
          p.unitPrice === item.unitPrice
      );
      if (existingIdx >= 0) {
        return prev.map((entry, idx) =>
          idx === existingIdx
            ? { ...entry, quantity: entry.quantity + 1 }
            : entry
        );
      }
      const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      return [...prev, { ...item, id, quantity: 1 }];
    });
    notify('success', 'تمت إضافة القطعة إلى الحقيبة.');
  };

  const handleUpdateQuantity = (id: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) =>
          item.id === id
            ? { ...item, quantity: Math.max(0, item.quantity + delta) }
            : item
        )
        .filter((item) => item.quantity > 0)
    );
  };

  const handleRemoveCartItem = (id: string) => {
    setCart((prev) => prev.filter((item) => item.id !== id));
  };

  const handleClearCart = () => {
    setCart([]);
    notify('info', 'تم تفريغ الحقيبة.');
  };

  const handleUpdateProductAddon = (
    productId: string,
    addon: Pick<Product, 'americanShawlTitle' | 'americanShawlSubtitle' | 'americanShawlPrice'>
  ) => {
    setStoreState((prev) => ({
      ...prev,
      products: prev.products.map((p) => (p.id === productId ? { ...p, ...addon } : p)),
    }));
    notify('success', 'تم تحديث الإضافة. اضغطي "حفظ ونشر" لاعتمادها.');
  };

  const handleUnlockAdmin = () => {
    if (isAdminAuthenticated) {
      setIsAdminMode((prev) => !prev);
      return;
    }
    setIsLoginOpen(true);
  };

  const handleAdminLogin = async (email: string, password: string) => {
    if (password !== '20262026') throw new Error('كلمة المرور غير صحيحة');
    setIsAdminAuthenticated(true);
    setIsAdminMode(true);
    notify('success', 'تم تسجيل الدخول إلى لوحة الإدارة.');
  };

  const handleAdminLogout = async () => {
    try {
      await signOutAdmin();
      setIsAdminAuthenticated(false);
      setIsAdminMode(false);
      notify('info', 'تم تسجيل الخروج من الإدارة.');
    } catch (err) {
      notify(
        'error',
        err instanceof Error ? err.message : 'تعذر تسجيل الخروج.'
      );
    }
  };

  const handlePublishToCloud = async () => {
    setIsSavingCloud(true);
    try {
      await saveStoreState(storeState);
      notify('success', 'تم حفظ التعديلات ونشرها للزبائن بنجاح.');
    } catch (err) {
      notify(
        'error',
        err instanceof Error ? err.message : 'تعذر الحفظ في قاعدة البيانات.'
      );
    } finally {
      setIsSavingCloud(false);
    }
  };

  const handleUploadLogo = async (file: File) => {
    try {
      const url = await uploadStoreImage(file, 500);
      setStoreState((prev) => ({ ...prev, logoUrl: url }));
      notify('success', 'تم رفع الشعار. اضغطي "حفظ ونشر" لتثبيته.');
    } catch (err) {
      notify(
        'error',
        err instanceof Error ? err.message : 'تعذر رفع الشعار.'
      );
    }
  };

  const handleUploadStudioBg = async (file: File) => {
    try {
      const url = await uploadStoreImage(file, 1200);
      setStoreState((prev) => ({ ...prev, studioBgUrl: url }));
      notify('success', 'تم تحديث خلفية الاستوديو. اضغطي "حفظ ونشر" لتثبيتها.');
    } catch (err) {
      notify(
        'error',
        err instanceof Error ? err.message : 'تعذر رفع صورة المعاينة.'
      );
    }
  };

  const handleReplaceProductImage = async (productId: string, file: File) => {
    try {
      const url = await uploadStoreImage(file, 900);
      setStoreState((prev) => ({
        ...prev,
        products: prev.products.map((p) =>
          p.id === productId ? { ...p, imageUrl: url } : p
        ),
      }));
      notify('success', 'تم تحديث صورة المنتج.');
    } catch (err) {
      notify(
        'error',
        err instanceof Error ? err.message : 'تعذر رفع صورة المنتج.'
      );
    }
  };

  const handleSaveProduct = async (payload: {
    id?: string;
    category: CategoryId;
    branch: string;
    name: string;
    description: string;
    basePrice: number;
    options: ProductOption[];
    imageFile?: File;
    existingImageUrl?: string;
  }) => {
    let imageUrl = payload.existingImageUrl || SHAWL_IMAGE_PATH;
    if (payload.imageFile) {
      imageUrl = await uploadStoreImage(payload.imageFile, 900);
    }

    if (payload.id) {
      setStoreState((prev) => ({
        ...prev,
        products: prev.products.map((p) =>
          p.id === payload.id
            ? {
                ...p,
                category: payload.category,
                branch: payload.branch,
                name: payload.name,
                description: payload.description,
                basePrice: payload.basePrice,
                options: payload.options,
                imageUrl,
              }
            : p
        ),
      }));
      notify('success', 'تم تعديل الموديل. اضغطي "حفظ ونشر" لاعتماده.');
    } else {
      const newProduct: Product = {
        id: `prod-${Date.now()}`,
        category: payload.category,
        branch: payload.branch,
        name: payload.name,
        description: payload.description,
        basePrice: payload.basePrice,
        imageUrl,
        options: payload.options,
      };
      setStoreState((prev) => ({
        ...prev,
        products: [...prev.products, newProduct],
      }));
      notify('success', 'تمت إضافة الموديل الجديد.');
    }
  };

  const handleDeleteProduct = (productId: string) => {
    setStoreState((prev) => ({
      ...prev,
      products: prev.products.filter((p) => p.id !== productId),
    }));
    notify('info', 'تم حذف الموديل. اضغطي "حفظ ونشر" لتأكيد التغيير.');
  };

  const handleSaveCopy = (nextCopy: StoreCopy) => {
    setStoreState((prev) => ({ ...prev, copy: nextCopy }));
    notify('success', 'تم تحديث النصوص. اضغطي "حفظ ونشر" لحفظها سحابياً.');
  };

  const totalCartItems = cart.reduce((sum, item) => sum + item.quantity, 0);

  const handleUpdateCapStyle = (capId: string, patch: CapStyleOverride) => {
    setStoreState((prev) => ({
      ...prev,
      capStyles: {
        ...(prev.capStyles || {}),
        [capId]: { ...(prev.capStyles?.[capId] || {}), ...patch },
      },
    }));
    notify('success', 'تم تحديث القبعة. اضغطي "حفظ ونشر" لاعتماد التعديل.');
  };

  const handleUploadCapStyleImage = async (capId: string, file: File) => {
    try {
      const url = await uploadStoreImage(file, 900);
      setStoreState((prev) => ({
        ...prev,
        capStyles: {
          ...(prev.capStyles || {}),
          [capId]: { ...(prev.capStyles?.[capId] || {}), imageUrl: url },
        },
      }));
      notify('success', 'تم تغيير صورة القبعة. اضغطي "حفظ ونشر" لتثبيتها.');
    } catch (err) {
      notify('error', err instanceof Error ? err.message : 'تعذر رفع صورة القبعة.');
    }
  };

  const handleUpdateSection = (sectionId: string, patch: SectionOverride) => {
    setStoreState((prev) => ({
      ...prev,
      sectionMeta: {
        ...(prev.sectionMeta || {}),
        [sectionId]: { ...(prev.sectionMeta?.[sectionId] || {}), ...patch },
      },
    }));
    notify('success', 'تم تحديث القسم. اضغطي "حفظ ونشر" لاعتماد التعديل.');
  };

  const handleUploadSectionImage = async (sectionId: string, file: File) => {
    try {
      const url = await uploadStoreImage(file, 1200);
      setStoreState((prev) => ({
        ...prev,
        sectionMeta: {
          ...(prev.sectionMeta || {}),
          [sectionId]: { ...(prev.sectionMeta?.[sectionId] || {}), imageUrl: url },
        },
      }));
      notify('success', 'تم تغيير صورة القسم. اضغطي "حفظ ونشر" لتثبيتها.');
    } catch (err) {
      notify('error', err instanceof Error ? err.message : 'تعذر رفع صورة القسم.');
    }
  };

  const handleSetProductColorImage = async (id: string, colorName: string, file: File | null) => {
    try {
      const url = file ? await uploadStoreImage(file, 900) : '';
      setStoreState((prev) => ({
        ...prev,
        products: prev.products.map((p) => {
          if (p.id !== id) return p;
          const updatedColors = { ...(p.colorImages || {}) };
          if (url) updatedColors[colorName] = url;
          else delete updatedColors[colorName];
          return { ...p, colorImages: updatedColors };
        }),
      }));
      notify(
        'info',
        file
          ? `تم رفع صورة لون "${colorName}". اضغطي "حفظ ونشر" لتثبيتها.`
          : `تم حذف صورة لون "${colorName}".`
      );
    } catch (err) {
      notify('error', err instanceof Error ? err.message : 'تعذر رفع الصورة. جربي صورة أخرى.');
    }
  };

  useInlineEditor({
    enabled: isAdminMode,
    texts: storeState.customTexts || EMPTY_RECORD,
    images: storeState.customImages || EMPTY_RECORD,
    onSetText: (key, value) =>
      setStoreState((prev) => {
        const next = { ...(prev.customTexts || {}) };
        if (value === null) delete next[key];
        else next[key] = value;
        return { ...prev, customTexts: next };
      }),
    onSetHidden: (key, hidden) =>
      setStoreState((prev) => {
        const next = { ...(prev.customTexts || {}) };
        if (hidden) next[`${key}_hidden`] = '1';
        else delete next[`${key}_hidden`];
        return { ...prev, customTexts: next };
      }),
    onSetImage: async (key, file) => {
      try {
        const url = file ? await uploadStoreImage(file, 900) : '';
        setStoreState((prev) => {
          const next = { ...(prev.customImages || {}) };
          if (url) next[key] = url;
          else delete next[key];
          return { ...prev, customImages: next };
        });
        if (file) notify('success', 'تمت إضافة الصورة. اضغطي "حفظ ونشر" لتثبيتها.');
      } catch (err) {
        notify('error', err instanceof Error ? err.message : 'تعذر رفع الصورة.');
      }
    },
  });

  return (
    <div className="min-h-screen flex flex-col bg-[#faf8f5] text-[#1f1917]">
      <Header
        brandName={storeState.copy.brandName}
        logoUrl={storeState.logoUrl}
        cartCount={totalCartItems}
        isAdminMode={isAdminMode}
        isSaving={isSavingCloud}
        onOpenCart={() => setIsCartOpen(true)}
        onPublish={handlePublishToCloud}
        onLogout={handleAdminLogout}
        onOpenCopyEditor={() => setIsCopyModalOpen(true)}
        onOpenAddProduct={() =>
          setProductModalState({
            isOpen: true,
            category: 'shawl',
            editing: null,
          })
        }
        onUploadLogo={handleUploadLogo}
      />

      <main className="flex-1">
        <HeroSection copy={storeState.copy} />

        {sectionOrder.map((secId, index) => {
          const sectionTitle =
            secId === 'catalog'
              ? 'أقسام دار الأزياء (الوشاح والروب والقبعة)'
              : secId === 'studio'
              ? 'استوديو تصميم الوشاح'
              : 'جدول الأسعار والأسئلة الشائعة';

          return (
            <Reveal key={secId} className="relative">
              {isAdminMode && (
                <div
                  data-no-inline-edit
                  className="max-w-5xl mx-auto px-4 sm:px-6 pt-4 flex flex-wrap items-center justify-between gap-2"
                >
                  <span className="text-xs font-bold text-[#762b43] bg-[#fbf3f5] px-3 py-2 rounded-full border border-dashed border-[#762b43]/30">
                    قسم: {sectionTitle}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      disabled={index === 0}
                      onClick={() => moveSection(secId, -1)}
                      aria-label="نقل القسم للأعلى"
                      className="inline-flex items-center gap-1 min-h-9 px-3 rounded-xl bg-white border border-[#e6ddd3] text-xs font-bold text-[#1f1917] disabled:opacity-40 cursor-pointer"
                    >
                      <ArrowUp className="w-3.5 h-3.5" />
                      <span>للأعلى</span>
                    </button>
                    <button
                      type="button"
                      disabled={index === sectionOrder.length - 1}
                      onClick={() => moveSection(secId, 1)}
                      aria-label="نقل القسم للأسفل"
                      className="inline-flex items-center gap-1 min-h-9 px-3 rounded-xl bg-white border border-[#e6ddd3] text-xs font-bold text-[#1f1917] disabled:opacity-40 cursor-pointer"
                    >
                      <ArrowDown className="w-3.5 h-3.5" />
                      <span>للأسفل</span>
                    </button>
                  </div>
                </div>
              )}

              {secId === 'catalog' && (
                <ProductCatalog
                  products={storeState.products}
                  capStyleOverrides={storeState.capStyles}
                  sectionOverrides={storeState.sectionMeta}
                  onUpdateCapStyle={handleUpdateCapStyle}
                  onUploadCapStyleImage={handleUploadCapStyleImage}
                  onUpdateSection={handleUpdateSection}
                  onUploadSectionImage={handleUploadSectionImage}
                  onToggleProductField={(id, field) => {
                    setStoreState((prev) => ({
                      ...prev,
                      products: prev.products.map((p) =>
                        p.id === id ? { ...p, [field]: !p[field] } : p
                      ),
                    }));
                    notify('info', 'تم تحديث ظهور القسم. اضغطي "حفظ ونشر" لتثبيت التغيير.');
                  }}
                  onUpdateProductAddon={handleUpdateProductAddon}
                  isAdminMode={isAdminMode}
                  onAddToCart={handleAddToCart}
                  onOpenAddProduct={(defaultCat) =>
                    setProductModalState({
                      isOpen: true,
                      category: defaultCat || 'shawl',
                      editing: null,
                    })
                  }
                  onEditProduct={(product) =>
                    setProductModalState({
                      isOpen: true,
                      category: product.category,
                      editing: product,
                    })
                  }
                  onDeleteProduct={handleDeleteProduct}
                  onReplaceProductImage={handleReplaceProductImage}
                  onRemoveProductImage={(id) => {
                    setStoreState((prev) => ({
                      ...prev,
                      products: prev.products.map((p) =>
                        p.id === id ? { ...p, imageUrl: '' } : p
                      ),
                    }));
                    notify('info', 'تمت إزالة الصورة. اضغطي "حفظ ونشر" لتثبيت التغيير.');
                  }}
                  onSetProductColorImage={handleSetProductColorImage}
                />
              )}

              {secId === 'studio' && (
                <StoleStudio
                  title={storeState.copy.studioTitle}
                  subtitle={storeState.copy.studioSubtitle}
                  studioBgUrl={storeState.studioBgUrl}
                  isAdminMode={isAdminMode}
                  onUploadStudioBg={handleUploadStudioBg}
                  onAddToCart={handleAddToCart}
                />
              )}

              {secId === 'pricing' && (
                <PricingAndFaq
                  pricesTitle={storeState.copy.pricesTitle}
                  pricesSubtitle={storeState.copy.pricesSubtitle}
                />
              )}
            </Reveal>
          );
        })}
      </main>

      <footer className="bg-white border-t border-[#e6ddd3] py-10 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div>
            <p className="font-editorial text-xl font-bold text-[#1f1917]">
              {storeState.copy.brandName}
            </p>
            <p className="text-xs sm:text-sm text-[#6e645e] mt-1 max-w-md">
              دار أزياء التخرج في الجزائر: شالات مطرزة باسمك وشعارك، روبات بمقاسك، وقبعات مخصصة مع التوصيل لجميع الولايات.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-4 text-xs text-[#6e645e]">
            <a
              href={`https://wa.me/${WHATSAPP_NUMBER}`}
              target="_blank"
              rel="noopener noreferrer"
              className="font-bold text-[#18734b] hover:underline"
            >
              تواصل عبر WhatsApp
            </a>
            <span aria-hidden="true">·</span>
            <span>© 2026 DG by Douaa الجزائر</span>
            <span aria-hidden="true">·</span>
            <button
              type="button"
              onClick={handleUnlockAdmin}
              className="inline-flex items-center gap-1 text-[#6e645e] hover:text-[#762b43] transition-colors cursor-pointer"
              title="دخول الإدارة"
            >
              <Lock className="w-3.5 h-3.5" />
              <span>{isAdminAuthenticated ? 'وضع الإدارة' : 'الإدارة'}</span>
            </button>
          </div>
        </div>
      </footer>

      <a
        href={`https://wa.me/${WHATSAPP_NUMBER}`}
        target="_blank"
        rel="noopener noreferrer"
        title="تواصل عبر WhatsApp"
        aria-label="تواصل مباشر عبر WhatsApp"
        className="fixed bottom-5 left-5 z-30 w-12 h-12 rounded-full bg-[#18734b] hover:bg-[#135c3c] text-white shadow-lg flex items-center justify-center transition-transform hover:scale-105"
      >
        <MessageCircle className="w-5 h-5" />
      </a>

      <CartDrawer
        isOpen={isCartOpen}
        items={cart}
        onClose={() => setIsCartOpen(false)}
        onUpdateQuantity={handleUpdateQuantity}
        onRemoveItem={handleRemoveCartItem}
        onClearCart={handleClearCart}
        onNotify={notify}
      />

      <AdminLoginModal
        isOpen={isLoginOpen}
        onClose={() => setIsLoginOpen(false)}
        onLogin={handleAdminLogin}
      />

      <ProductEditorModal
        isOpen={productModalState.isOpen}
        initialCategory={productModalState.category}
        editingProduct={productModalState.editing}
        onClose={() =>
          setProductModalState((prev) => ({ ...prev, isOpen: false }))
        }
        onSave={handleSaveProduct}
      />

      <CopyEditorModal
        isOpen={isCopyModalOpen}
        copy={storeState.copy}
        onClose={() => setIsCopyModalOpen(false)}
        onSaveCopy={handleSaveCopy}
      />

      {/* لوحة الإدارة العائمة */}
      {isAdminMode && (
        <div
          data-no-inline-edit
          className="fixed bottom-4 right-4 z-40 flex items-center gap-1.5 bg-[#1f1917]/95 backdrop-blur-md rounded-full shadow-2xl p-1.5 pr-3"
        >
          <span className="flex items-center gap-1.5 text-[11px] font-bold text-white/80 ml-1">
            <span className="w-2 h-2 rounded-full bg-emerald-400" aria-hidden="true" />
            <span className="hidden sm:inline">وضع الإدارة · اضغطي على أي نص لتعديله</span>
            <span className="sm:hidden">الإدارة</span>
          </span>
          <button
            type="button"
            onClick={handlePublishToCloud}
            disabled={isSavingCloud}
            className="inline-flex items-center gap-1.5 h-10 px-4 rounded-full bg-[#762b43] hover:bg-[#8d3552] text-white text-xs font-bold transition-colors disabled:opacity-60 cursor-pointer"
          >
            <CloudUpload className="w-4 h-4" />
            <span>{isSavingCloud ? 'جاري النشر...' : 'حفظ ونشر'}</span>
          </button>
          <button
            type="button"
            onClick={handleAdminLogout}
            aria-label="خروج من الإدارة"
            className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      )}

      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}
