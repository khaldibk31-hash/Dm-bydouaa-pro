import { FormEvent, useEffect, useState } from 'react';
import {
  CheckCircle2,
  Download,
  Loader2,
  Package,
  RefreshCw,
  Send,
  Settings,
  ShoppingBag,
  TrendingUp,
  X,
} from 'lucide-react';
import { CATEGORY_LABELS } from '../data/defaultStore';
import { CategoryId, Product, ProductOption, StoreCopy } from '../types/store';
import { supabase } from '../lib/supabase';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLogin: (email: string, password: string) => Promise<void>;
}

export function AdminLoginModal({ isOpen, onClose, onLogin }: LoginModalProps) {
  const [email, setEmail] = useState('khaldibk31@gmail.com');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      setError('أدخلي البريد الإلكتروني وكلمة المرور.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      await onLogin(email.trim(), password);
      setPassword('');
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'تعذر تسجيل الدخول.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
      aria-label="دخول الإدارة"
    >
      <div className="bg-white border border-[#e6ddd3] rounded-2xl w-full max-w-sm p-6 shadow-2xl">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-bold text-[#1f1917]">دخول الإدارة</h3>
          <button
            type="button"
            onClick={onClose}
            className="p-1 text-[#6e645e] hover:text-[#1f1917] cursor-pointer"
            aria-label="إغلاق"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <p className="text-xs text-[#6e645e] mb-4">
          دخول خاص بالإدارة لمتابعة الطلبات والأرباح وتعديل المنتجات.
        </p>

        <form onSubmit={handleSubmit} className="space-y-3">
          <input
            type="email"
            autoComplete="username"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="البريد الإلكتروني للإدارة"
            className="w-full px-3.5 py-2.5 rounded-lg border border-[#e6ddd3] bg-[#faf8f5] text-sm text-[#1f1917]"
          />
          <input
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="كلمة المرور"
            className="w-full px-3.5 py-2.5 rounded-lg border border-[#e6ddd3] bg-[#faf8f5] text-sm text-[#1f1917]"
          />

          {error && <p className="text-xs font-semibold text-red-700">{error}</p>}

          <div className="flex gap-2 pt-2">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-2.5 px-4 rounded-lg bg-[#762b43] hover:bg-[#581e31] text-white text-sm font-bold disabled:opacity-60 cursor-pointer"
            >
              {loading ? 'جاري التحقق...' : 'دخول'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="py-2.5 px-4 rounded-lg bg-[#f3eee8] hover:bg-[#e6ddd3] text-[#1f1917] text-sm font-semibold cursor-pointer"
            >
              إلغاء
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

interface ProductModalProps {
  isOpen: boolean;
  initialCategory: CategoryId;
  editingProduct: Product | null;
  onClose: () => void;
  onSave: (payload: {
    id?: string;
    category: CategoryId;
    branch: string;
    name: string;
    description: string;
    basePrice: number;
    options: ProductOption[];
    imageFile?: File;
    existingImageUrl?: string;
  }) => Promise<void>;
}

export function ProductEditorModal({
  isOpen,
  initialCategory,
  editingProduct,
  onClose,
  onSave,
}: ProductModalProps) {
  const [category, setCategory] = useState<CategoryId>(initialCategory);
  const [branch, setBranch] = useState('');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [basePrice, setBasePrice] = useState('');
  const [optionsText, setOptionsText] = useState('');
  const [imageFile, setImageFile] = useState<File | undefined>(undefined);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isOpen) return;
    setError('');
    setImageFile(undefined);
    if (editingProduct) {
      setCategory(editingProduct.category);
      setBranch(editingProduct.branch);
      setName(editingProduct.name);
      setDescription(editingProduct.description);
      setBasePrice(String(editingProduct.basePrice));
      setOptionsText(
        editingProduct.options.map((o) => `${o.label}|${o.price}`).join('\n')
      );
    } else {
      setCategory(initialCategory);
      setBranch('');
      setName('');
      setDescription('');
      setBasePrice('3800');
      setOptionsText('كريب|3800\nدان|4300');
    }
  }, [isOpen, editingProduct, initialCategory]);

  if (!isOpen) return null;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('يرجى إدخال اسم المنتج.');
      return;
    }

    const parsedOptions: ProductOption[] = optionsText
      .split('\n')
      .map((line) => line.split('|'))
      .filter(
        (parts) =>
          parts.length >= 2 &&
          parts[0].trim() &&
          Number.isFinite(Number(parts[1].trim()))
      )
      .map((parts) => ({
        label: parts[0].trim(),
        price: Math.max(0, Number(parts[1].trim())),
      }));

    const numericBase = Math.max(
      0,
      Number(basePrice) || (parsedOptions[0]?.price ?? 0)
    );

    setSaving(true);
    setError('');
    try {
      await onSave({
        id: editingProduct?.id,
        category,
        branch: branch.trim() || 'عام',
        name: name.trim(),
        description: description.trim() || 'تفصيل وتطريز متقن حسب الطلب.',
        basePrice: parsedOptions.length > 0 ? parsedOptions[0].price : numericBase,
        options: parsedOptions,
        imageFile,
        existingImageUrl: editingProduct?.imageUrl,
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'تعذر حفظ المنتج.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
      aria-label={editingProduct ? 'تعديل المنتج' : 'إضافة موديل جديد'}
    >
      <div className="bg-white border border-[#e6ddd3] rounded-2xl w-full max-w-md p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-bold text-[#1f1917]">
            {editingProduct ? 'تعديل الموديل' : 'إضافة موديل جديد'}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="p-1 text-[#6e645e] hover:text-[#1f1917] cursor-pointer"
            aria-label="إغلاق"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-xs font-semibold text-[#6e645e] mb-1">
              القسم
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as CategoryId)}
              className="w-full px-3 py-2.5 rounded-lg border border-[#e6ddd3] bg-[#faf8f5] text-sm text-[#1f1917]"
            >
              {(['shawl', 'robe', 'cap', 'accessories'] as CategoryId[]).map(
                (cat) => (
                  <option key={cat} value={cat}>
                    {CATEGORY_LABELS[cat]}
                  </option>
                )
              )}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#6e645e] mb-1">
              صورة المنتج (اختياري)
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setImageFile(e.target.files?.[0])}
              className="w-full text-xs text-[#6e645e] file:mr-0 file:ml-3 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:bg-[#f3eee8] file:text-[#1f1917] file:font-bold"
            />
          </div>

          <input
            type="text"
            value={branch}
            onChange={(e) => setBranch(e.target.value)}
            placeholder="اسم الفرع (مثال: شال ميس)"
            className="w-full px-3.5 py-2.5 rounded-lg border border-[#e6ddd3] bg-[#faf8f5] text-sm text-[#1f1917]"
          />

          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="اسم المنتج"
            className="w-full px-3.5 py-2.5 rounded-lg border border-[#e6ddd3] bg-[#faf8f5] text-sm text-[#1f1917]"
          />

          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="وصف قصير"
            className="w-full px-3.5 py-2.5 rounded-lg border border-[#e6ddd3] bg-[#faf8f5] text-sm text-[#1f1917]"
          />

          <input
            type="number"
            value={basePrice}
            onChange={(e) => setBasePrice(e.target.value)}
            placeholder="السعر الأساسي بالدينار الجزائري"
/>
                    <div>
            <label className="block text-xs font-semibold text-[#6e645e] mb-1">
              خيارات إضافية (كل خيار في سطر: الاسم|السعر)
            </label>
            <textarea
              rows={3}
              value={optionsText}
              onChange={(e) => setOptionsText(e.target.value)}
              placeholder={'كريب|3800\nدان|4300'}
              className="w-full px-3.5 py-2 rounded-lg border border-[#e6ddd3] bg-[#faf8f5] text-xs text-[#1f1917]"
            />
          </div>

          {error && <p className="text-xs font-semibold text-red-700">{error}</p>}

          <div className="flex gap-2 pt-2">
            <button
              type="submit"
              disabled={saving}
              className="flex-1 py-2.5 px-4 rounded-lg bg-[#762b43] hover:bg-[#581e31] text-white text-sm font-bold disabled:opacity-60 cursor-pointer"
            >
              {saving ? 'جاري الحفظ...' : editingProduct ? 'تحديث' : 'إضافة'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="py-2.5 px-4 rounded-lg bg-[#f3eee8] hover:bg-[#e6ddd3] text-[#1f1917] text-sm font-semibold cursor-pointer"
            >
              إلغاء
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

interface CopyModalProps {
  isOpen: boolean;
  copy: StoreCopy;
  onClose: () => void;
  onSaveCopy: (next: StoreCopy) => void;
}

export function CopyEditorModal({
  isOpen,
  copy,
  onClose,
  onSaveCopy,
}: CopyModalProps) {
  const [draft, setDraft] = useState<StoreCopy>(copy);

  useEffect(() => {
    if (isOpen) setDraft(copy);
  }, [isOpen, copy]);

  if (!isOpen) return null;

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    onSaveCopy(draft);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
      aria-label="تعديل نصوص المتجر"
    >
      <div className="bg-white border border-[#e6ddd3] rounded-2xl w-full max-w-lg p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-bold text-[#1f1917]">تعديل نصوص الواجهة</h3>
          <button
            type="button"
            onClick={onClose}
            className="p-1 text-[#6e645e] hover:text-[#1f1917] cursor-pointer"
            aria-label="إغلاق"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-xs font-semibold text-[#6e645e] mb-1">
              اسم العلامة
            </label>
            <input
              type="text"
              value={draft.brandName}
              onChange={(e) => setDraft({ ...draft, brandName: e.target.value })}
              className="w-full px-3.5 py-2 rounded-lg border border-[#e6ddd3] bg-[#faf8f5] text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#6e645e] mb-1">
              العنوان الرئيسي (Hero)
            </label>
            <input
              type="text"
              value={draft.heroTitle}
              onChange={(e) => setDraft({ ...draft, heroTitle: e.target.value })}
              className="w-full px-3.5 py-2 rounded-lg border border-[#e6ddd3] bg-[#faf8f5] text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#6e645e] mb-1">
              الوصف التعريفي
            </label>
            <textarea
              rows={3}
              value={draft.heroSubtitle}
              onChange={(e) => setDraft({ ...draft, heroSubtitle: e.target.value })}
              className="w-full px-3.5 py-2 rounded-lg border border-[#e6ddd3] bg-[#faf8f5] text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#6e645e] mb-1">
              عنوان الاستوديو
            </label>
            <input
              type="text"
              value={draft.studioTitle}
              onChange={(e) => setDraft({ ...draft, studioTitle: e.target.value })}
              className="w-full px-3.5 py-2 rounded-lg border border-[#e6ddd3] bg-[#faf8f5] text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#6e645e] mb-1">
              عنوان جدول الأسعار
            </label>
            <input
              type="text"
              value={draft.pricesTitle}
              onChange={(e) => setDraft({ ...draft, pricesTitle: e.target.value })}
              className="w-full px-3.5 py-2 rounded-lg border border-[#e6ddd3] bg-[#faf8f5] text-sm"
            />
          </div>

          <div className="flex gap-2 pt-2">
            <button
              type="submit"
              className="flex-1 py-2.5 px-4 rounded-lg bg-[#762b43] hover:bg-[#581e31] text-white text-sm font-bold cursor-pointer"
            >
              تطبيق التعديلات
            </button>
            <button
              type="button"
              onClick={onClose}
              className="py-2.5 px-4 rounded-lg bg-[#f3eee8] hover:bg-[#e6ddd3] text-[#1f1917] text-sm font-semibold cursor-pointer"
            >
              إلغاء
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

interface OrderRecord {
  id: string;
  order_number: number;
  customer_name: string;
  customer_phone: string;
  wilaya: string;
  commune: string;
  delivery_type: string;
  product_details: {
    items?: Array<{
      title: string;
      details?: string;
      quantity: number;
      unitPrice: number;
    }>;
    deliveryDate?: string;
    notes?: string;
  };
  total_sell_price: number;
  total_cost_price: number;
  delivery_price: number;
  net_profit: number;
  status: string;
  created_at: string;
}

interface InventoryItem {
  id: string;
  name: string;
  cost_price: number;
  sell_price: number;
  stock_quantity: number;
}

interface DashboardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNotify: (type: 'success' | 'error' | 'info', text: string) => void;
}

export function AdminDashboardModal({
  isOpen,
  onClose,
  onNotify,
}: DashboardModalProps) {
  const [activeTab, setActiveTab] = useState<'orders' | 'inventory' | 'delivery'>('orders');
  const [orders, setOrders] = useState<OrderRecord[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(false);

  const [prodName, setProdName] = useState('');
  const [prodCost, setProdCost] = useState('');
  const [prodSell, setProdSell] = useState('');
  const [prodQty, setProdQty] = useState('');

  const [deliveryCompany, setDeliveryCompany] = useState('Yalidine');
  const [apiId, setApiId] = useState('');
  const [apiToken, setApiToken] = useState('');

  const fetchData = async () => {
    if (!supabase) return;
    setLoading(true);
    try {
      const [ordersRes, invRes, settingsRes] = await Promise.all([
        supabase.from('orders').select('*').order('order_number', { ascending: false }),
        supabase.from('products').select('*').order('created_at', { ascending: false }),
        supabase.from('store_settings').select('*').eq('id', 1).maybeSingle(),
      ]);

      if (ordersRes.data) setOrders(ordersRes.data as OrderRecord[]);
      if (invRes.data) setInventory(invRes.data as InventoryItem[]);
      if (settingsRes.data) {
        setDeliveryCompany(settingsRes.data.delivery_company || 'Yalidine');
        setApiId(settingsRes.data.delivery_api_id || '');
        setApiToken(settingsRes.data.delivery_api_token || '');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) fetchData();
  }, [isOpen]);

  if (!isOpen) return null;

  const handleUpdateOrderStatus = async (orderId: string, newStatus: string) => {
    if (!supabase) return;
    const { error } = await supabase
      .from('orders')
      .update({ status: newStatus })
      .eq('id', orderId);

    if (error) {
      onNotify('error', 'تعذر تحديث حالة الطلب.');
    } else {
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o))
      );
      onNotify('success', `تم تغيير الحالة إلى: ${newStatus}`);
    }
  };

  const handleUpdateOrderCost = async (orderId: string, costValue: number) => {
    if (!supabase) return;
    const { error } = await supabase
      .from('orders')
      .update({ total_cost_price: costValue })
      .eq('id', orderId);

    if (!error) {
      fetchData();
      onNotify('success', 'تم تحديث التكلفة وحساب الفائدة الصافية.');
    }
  };

  const handleAddInventory = async (e: FormEvent) => {
    e.preventDefault();
    if (!supabase || !prodName.trim()) return;
    const { error } = await supabase.from('products').insert([
      {
        name: prodName.trim(),
        cost_price: Number(prodCost) || 0,
        sell_price: Number(prodSell) || 0,
        stock_quantity: Number(prodQty) || 0,
      },
    ]);
    if (error) {
      onNotify('error', 'تعذر إضافة السلعة.');
    } else {
      setProdName('');
      setProdCost('');
      setProdSell('');
      setProdQty('');
      fetchData();
      onNotify('success', 'تمت إضافة السلعة إلى المخزون.');
    }
  };

  const handleSaveDeliverySettings = async (e: FormEvent) => {
    e.preventDefault();
    if (!supabase) return;
    const { error } = await supabase.from('store_settings').upsert({
      id: 1,
      delivery_company: deliveryCompany,
      delivery_api_id: apiId.trim(),
      delivery_api_token: apiToken.trim(),
      updated_at: new Date().toISOString(),
    });
    if (error) {
      onNotify('error', 'تعذر حفظ إعدادات التوصيل.');
    } else {
      onNotify('success', 'تم حفظ إعدادات شركة التوصيل بنجاح.');
    }
  };

  const handleExportCSV = () => {
    const headers = ['رقم الطلب', 'الاسم', 'الهاتف', 'الولاية', 'البلدية', 'التوصيل', 'المبلغ', 'التكلفة', 'الفائدة', 'الحالة'];
    const rows = orders.map((o) => [
      o.order_number,
      `"${o.customer_name}"`,
      `"${o.customer_phone}"`,
      `"${o.wilaya}"`,
      `"${o.commune}"`,
      `"${o.delivery_type}"`,
      o.total_sell_price,
      o.total_cost_price,
      o.net_profit,
      `"${o.status}"`,
    ]);
    const csv = '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `orders-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
  };

  const activeOrders = orders.filter((o) => o.status !== 'ملغى');
  const totalSales = activeOrders.reduce((s, o) => s + Number(o.total_sell_price || 0), 0);
  const totalProfit = activeOrders.reduce((s, o) => s + Number(o.net_profit || 0), 0);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/70 backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
    >
      <div className="bg-[#faf8f5] border border-[#e6ddd3] rounded-2xl w-full max-w-4xl h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        <div className="px-4 py-3.5 bg-white border-b border-[#e6ddd3] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-[#762b43]" />
            <h2 className="text-base font-bold text-[#1f1917]">
              لوحة إدارة الطلبات والأرباح
            </h2>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={fetchData}
              className="p-1.5 rounded-lg bg-[#f3eee8] text-[#1f1917] hover:bg-[#e6ddd3] cursor-pointer"
              title="تحديث"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-[#6e645e] hover:bg-[#f3eee8] cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="px-4 py-2 bg-white border-b border-[#e6ddd3] flex gap-2 overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveTab('orders')}
            className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-bold cursor-pointer ${
              activeTab === 'orders'
                ? 'bg-[#762b43] text-white'
                : 'bg-[#f3eee8] text-[#1f1917]'
            }`}
          >
            <ShoppingBag className="w-3.5 h-3.5" />
            <span>الطلبات ({orders.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('inventory')}
            className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-bold cursor-pointer ${
              activeTab === 'inventory'
                ? 'bg-[#762b43] text-white'
                : 'bg-[#f3eee8] text-[#1f1917]'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5" />
            <span>السلعة والفائدة</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('delivery')}
            className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-bold cursor-pointer ${
              activeTab === 'delivery'
                ? 'bg-[#762b43] text-white'
                : 'bg-[#f3eee8] text-[#1f1917]'
            }`}
          >
            <Settings className="w-3.5 h-3.5" />
            <span>مكتب التوصيل</span>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {loading ? (
            <div className="py-12 flex justify-center">
              <Loader2 className="w-6 h-6 animate-spin text-[#762b43]" />
            </div>
          ) : activeTab === 'orders' ? (
            <>
              <div className="flex flex-wrap items-center justify-between gap-2 bg-white p-3 rounded-xl border border-[#e6ddd3]">
                <div className="text-xs font-bold text-[#1f1917]">
                  إجمالي المبيعات النشطة:{' '}
                  <span className="text-[#762b43]">{totalSales.toLocaleString('en-US')} دج</span>
                  {' | '}
                  صافي الفائدة:{' '}
                  <span className="text-emerald-700">{totalProfit.toLocaleString('en-US')} دج</span>
                </div>
                <button
                  type="button"
                  onClick={handleExportCSV}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#18734b] text-white text-xs font-bold cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>تصدير Excel</span>
                </button>
              </div>

              {orders.length === 0 ? (
                <p className="text-center text-sm text-[#6e645e] py-10">
                  لا توجد طلبات مسجلة في القاعدة بعد.
                </p>
              ) : (

                                <div className="space-y-3">
                  {orders.map((order) => (
                    <div
                      key={order.id}
                      className="bg-white border border-[#e6ddd3] rounded-xl p-4 space-y-2.5"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#e6ddd3] pb-2">
                        <div>
                          <span className="text-xs font-extrabold bg-[#762b43] text-white px-2 py-0.5 rounded ml-2">
                            #{order.order_number}
                          </span>
                          <span className="text-sm font-bold text-[#1f1917]">
                            {order.customer_name}
                          </span>
                          <span className="text-xs text-[#6e645e] mr-2" dir="ltr">
                            ({order.customer_phone})
                          </span>
                        </div>
                        <select
                          value={order.status}
                          onChange={(e) => handleUpdateOrderStatus(order.id, e.target.value)}
                          className="px-2.5 py-1 rounded-lg border border-[#e6ddd3] bg-[#faf8f5] text-xs font-bold text-[#1f1917]"
                        >
                          {['جديد', 'مؤكد', 'قيد التوصيل', 'مستلم', 'ملغى'].map((st) => (
                            <option key={st} value={st}>
                              {st}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="text-xs text-[#6e645e] space-y-1">
                        <p>
                          📍 <strong>العنوان:</strong> {order.wilaya} - {order.commune} ({order.delivery_type})
                        </p>
                        {order.product_details?.items?.map((item, idx) => (
                          <p key={idx} className="text-[#1f1917]">
                            • {item.title} {item.details ? `(${item.details})` : ''} × {item.quantity}
                          </p>
                        ))}
                        {order.product_details?.notes && (
                          <p className="text-amber-800">📝 ملاحظة: {order.product_details.notes}</p>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-[#e6ddd3] text-xs">
                        <div className="flex items-center gap-3">
                          <span>
                            البيع: <strong>{Number(order.total_sell_price).toLocaleString('en-US')} دج</strong>
                          </span>
                          <label className="inline-flex items-center gap-1">
                            <span>التكلفة:</span>
                            <input
                              type="number"
                              defaultValue={order.total_cost_price}
                              onBlur={(e) =>
                                handleUpdateOrderCost(order.id, Number(e.target.value) || 0)
                              }
                              className="w-20 px-2 py-0.5 border border-[#e6ddd3] rounded bg-[#faf8f5] font-bold"
                            />
                          </label>
                          <span className="text-emerald-700 font-bold">
                            الفائدة: {Number(order.net_profit).toLocaleString('en-US')} دج
                          </span>
                        </div>

                        {order.status === 'مؤكد' && (
                          <button
                            type="button"
                            onClick={() =>
                              onNotify(
                                'info',
                                `جاهز للإرسال عبر ${deliveryCompany} (تأكد من إدخال مفاتيح API في تبويب مكتب التوصيل).`
                              )
                            }
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#1f1917] text-white font-bold cursor-pointer"
                          >
                            <Send className="w-3 h-3" />
                            <span>إرسال للتوصيل</span>
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          ) : activeTab === 'inventory' ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-white p-4 rounded-xl border border-[#e6ddd3]">
                  <p className="text-xs text-[#6e645e]">إجمالي المبيعات</p>
                  <p className="text-lg font-extrabold text-[#1f1917] mt-1">
                    {totalSales.toLocaleString('en-US')} دج
                  </p>
                </div>
                <div className="bg-white p-4 rounded-xl border border-[#e6ddd3]">
                  <p className="text-xs text-[#6e645e]">صافي الفائدة المحققة</p>
                  <p className="text-lg font-extrabold text-emerald-700 mt-1">
                    {totalProfit.toLocaleString('en-US')} دج
                  </p>
                </div>
              </div>

              <form
                onSubmit={handleAddInventory}
                className="bg-white p-4 rounded-xl border border-[#e6ddd3] space-y-3"
              >
                <h3 className="text-sm font-bold text-[#1f1917] flex items-center gap-1.5">
                  <Package className="w-4 h-4 text-[#762b43]" />
                  <span>إضافة سلعة ورأس مال للمخزون</span>
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
                  <input
                    type="text"
                    value={prodName}
                    onChange={(e) => setProdName(e.target.value)}
                    placeholder="اسم السلعة (مثلاً: قماش كريب)"
                    className="px-3 py-2 rounded-lg border border-[#e6ddd3] text-xs"
                  />
                  <input
                    type="number"
                    value={prodCost}
                    onChange={(e) => setProdCost(e.target.value)}
                    placeholder="سعر التكلفة (دج)"
                    className="px-3 py-2 rounded-lg border border-[#e6ddd3] text-xs"
                  />
                  <input
                    type="number"
                    value={prodSell}
                    onChange={(e) => setProdSell(e.target.value)}
                    placeholder="سعر البيع (دج)"
                    className="px-3 py-2 rounded-lg border border-[#e6ddd3] text-xs"
                  />
                  <input
                    type="number"
                    value={prodQty}
                    onChange={(e) => setProdQty(e.target.value)}
                    placeholder="الكمية المتوفرة"
                    className="px-3 py-2 rounded-lg border border-[#e6ddd3] text-xs"
                  />
                </div>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-[#762b43] text-white text-xs font-bold cursor-pointer"
                >
                  حفظ في المخزون
                </button>
              </form>

              <div className="bg-white rounded-xl border border-[#e6ddd3] divide-y divide-[#e6ddd3]">
                {inventory.map((item) => (
                  <div key={item.id} className="p-3 flex items-center justify-between text-xs">
                    <div>
                      <p className="font-bold text-[#1f1917]">{item.name}</p>
                      <p className="text-[#6e645e]">
                        التكلفة: {item.cost_price} دج | البيع: {item.sell_price} دج | الفائدة للقطعة:{' '}
                        <span className="text-emerald-700 font-bold">
                          {item.sell_price - item.cost_price} دج
                        </span>
                      </p>
                    </div>
                    <span className="px-2.5 py-1 rounded bg-[#f3eee8] font-bold">
                      الكمية: {item.stock_quantity}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <form
              onSubmit={handleSaveDeliverySettings}
              className="bg-white p-4 rounded-xl border border-[#e6ddd3] space-y-3"
            >
              <h3 className="text-sm font-bold text-[#1f1917]">
                ربط حساب مكتب التوصيل (API)
              </h3>
              <div>
                <label className="block text-xs font-semibold text-[#6e645e] mb-1">
                  شركة التوصيل
                </label>
                <select
                  value={deliveryCompany}
                  onChange={(e) => setDeliveryCompany(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-[#e6ddd3] text-sm"
                >
                  <option value="Yalidine">Yalidine Express</option>
                  <option value="ZR Express">ZR Express</option>
                  <option value="Noest">Noest Express</option>
                  <option value="Maystro">Maystro Delivery</option>
                  <option value="Anderson">Anderson Logistics</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#6e645e] mb-1">
                  API ID (المعرّف من حسابك في شركة التوصيل)
                </label>
                <input
                  type="text"
                  value={apiId}
                  onChange={(e) => setApiId(e.target.value)}
                  placeholder="أدخل API ID"
                  className="w-full px-3 py-2 rounded-lg border border-[#e6ddd3] text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#6e645e] mb-1">
                  API Token (الرمز السري من حسابك)
                </label>
                <input
                  type="password"
                  value={apiToken}
                  onChange={(e) => setApiToken(e.target.value)}
                  placeholder="أدخل API Token"
                  className="w-full px-3 py-2 rounded-lg border border-[#e6ddd3] text-sm"
                />
              </div>
              <button
                type="submit"
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-lg bg-[#18734b] text-white text-xs font-bold cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>حفظ بيانات الربط</span>
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

                
