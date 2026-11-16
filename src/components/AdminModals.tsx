import { FormEvent, useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { CATEGORY_LABELS } from '../data/defaultStore';
import { CategoryId, Product, ProductOption, StoreCopy } from '../types/store';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLogin: (email: string, password: string) => Promise<void>;
}

export function AdminLoginModal({ isOpen, onClose, onLogin }: LoginModalProps) {
  const [email, setEmail] = useState('smahiamin111@gmail.com');
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
          دخول خاص بصاحبة المتجر لتعديل المنتجات والأسعار والنصوص.
        </p>

        <form onSubmit={handleSubmit} className="space-y-3">
          <input
            type="hidden"
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
            className="w-full px-3.5 py-2.5 rounded-lg border border-[#e6ddd3] bg-[#faf8f5] text-sm text-[#1f1917]"
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
