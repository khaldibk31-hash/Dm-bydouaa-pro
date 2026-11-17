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
  CartItem,
  CategoryId,
  Product,
  ProductOption,
  StoreCopy,
  StoreState,
  ToastMessage,
} from './types/store';

const CART_STORAGE_KEY = 'dg_by_douaa_cart_v1';

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
  useEffect(() => {
    const savedTexts = (
      storeState as StoreState & { customTexts?: Record<string, string> }
    ).customTexts;
    const textElements = document.querySelectorAll(
      'main h1, main h2, main h3, main p, main span, main th, main td, footer p'
    );

    textElements.forEach((el, idx) => {
      const htmlEl = el as HTMLElement;
      if (htmlEl.children.length > 0) return;

      const key = `txt_${idx}`;
      if (savedTexts && savedTexts[key]) {
        htmlEl.innerText = savedTexts[key];
      }

      if (isAdminMode) {
        htmlEl.contentEditable = 'true';
        htmlEl.style.outline = '1px dashed rgba(118, 43, 67, 0.35)';
        htmlEl.style.borderRadius = '4px';
        htmlEl.style.cursor = 'text';
        htmlEl.onblur = () => {
          const newText = htmlEl.innerText.trim();
          setStoreState((prev) => ({
            ...prev,
            customTexts: {
              ...((
                prev as StoreState & { customTexts?: Record<string, string> }
              ).customTexts || {}),
              [key]: newText,
            },
          }));
        };
      } else {
        htmlEl.contentEditable = 'false';
        htmlEl.style.outline = 'none';
        htmlEl.style.cursor = '';
        htmlEl.onblur = null;
      }
    });
  }, [isAdminMode, storeState.products]);

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
            <div key={secId} className="relative">
              {isAdminMode && (
                <div className="max-w-6xl mx-auto px-4 pt-3 flex items-center justify-between gap-2">
                  <span className="text-xs font-bold text-[#762b43] bg-[#faf8f5] px-3 py-1.5 rounded-full border border-[#e6ddd3]">
                    قسم: {sectionTitle}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      disabled={index === 0}
                      onClick={() => moveSection(secId, -1)}
                      className="px-3 py-1.5 rounded-full bg-white border border-[#e6ddd3] text-xs font-bold text-[#1f1917] disabled:opacity-40 cursor-pointer"
                    >
                      ↑ نقل للأعلى
                    </button>
                    <button
                      type="button"
                      disabled={index === sectionOrder.length - 1}
                      onClick={() => moveSection(secId, 1)}
                      className="px-3 py-1.5 rounded-full bg-white border border-[#e6ddd3] text-xs font-bold text-[#1f1917] disabled:opacity-40 cursor-pointer"
                    >
                      ↓ نقل للأسفل
                    </button>
                  </div>
                </div>
              )}

              {secId === 'catalog' && (
                <ProductCatalog
                  products={storeState.products}
                              onToggleProductField={(id, field) => {
              setStoreState((prev) => ({
                ...prev,
                products: prev.products.map((p) =>
                  p.id === id ? { ...p, [field]: !p[field] } : p
                ),
              }));
              notify('info', 'تم تحديث ظهور القسم. اضغطي "حفظ ونشر" لتثبيت التغيير.');
            }}

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
                  onSetProductColorImage={async (id, colorName, file) => {
                    try {
                      const dataUrl = file
                        ? await new Promise<string>((res, rej) => {
                            const r = new FileReader();
                            r.onload = () => res(String(r.result || ''));
                            r.onerror = rej;
                            r.readAsDataURL(file);
                          })
                        : '';
                      setStoreState((prev) => ({
                        ...prev,
                        products: prev.products.map((p) => {
                          if (p.id !== id) return p;
                          const updatedColors = { ...(p.colorImages || {}) };
                          if (dataUrl) {
                            updatedColors[colorName] = dataUrl;
                          } else {
                            delete updatedColors[colorName];
                          }
                          return { ...p, colorImages: updatedColors };
                        }),
                      }));
                      notify(
                        'info',
                        file
                          ? `تم رفع صورة لون "${colorName}". اضغطي "حفظ ونشر" لتثبيتها.`
                          : `تم حذف صورة لون "${colorName}".`
                      );
                    } catch {
                      notify('error', 'تعذر معالجة الصورة. جربي صورة أخرى.');
                    }
                  }}
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
                  priceTitle={storeState.copy.pricesTitle}
                  pricesSubtitle={storeState.copy.pricesSubtitle}
                />
              )}
            </div>
          );
        })}

  
      </main>

      {/* Quiet Atelier Footer */}
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

      {/* Direct WhatsApp Floating Action */}
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

      {/* Slide-Over Cart Drawer */}
      <CartDrawer
        isOpen={isCartOpen}
        items={cart}
        onClose={() => setIsCartOpen(false)}
        onUpdateQuantity={handleUpdateQuantity}
        onRemoveItem={handleRemoveCartItem}
        onClearCart={handleClearCart}
        onNotify={notify}
      />

      {/* Admin Modals */}
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

      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}
