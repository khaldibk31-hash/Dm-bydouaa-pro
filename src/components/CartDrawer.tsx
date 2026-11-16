import { FormEvent, useMemo, useState } from 'react';
import {
  Check,
  Copy,
  ExternalLink,
  Minus,
  Plus,
  ShoppingBag,
  Trash2,
  X,
} from 'lucide-react';
import { ALGERIA_WILAYAS, WHATSAPP_NUMBER } from '../data/defaultStore';
import { CartItem } from '../types/store';

interface CartDrawerProps {
  isOpen: boolean;
  items: CartItem[];
  onClose: () => void;
  onUpdateQuantity: (id: string, delta: number) => void;
  onRemoveItem: (id: string) => void;
  onClearCart: () => void;
  onNotify: (type: 'success' | 'error' | 'info', text: string) => void;
}

export function CartDrawer({
  isOpen,
  items,
  onClose,
  onUpdateQuantity,
  onRemoveItem,
  onClearCart,
  onNotify,
}: CartDrawerProps) {
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [wilaya, setWilaya] = useState('16 - الجزائر');
  const [commune, setCommune] = useState('');
  const [deliveryMethod, setDeliveryMethod] = useState<'home' | 'desk'>('home');
  const [deliveryDate, setDeliveryDate] = useState('');
  const [notes, setNotes] = useState('');
  const [nameError, setNameError] = useState('');
  const [generatedOrderText, setGeneratedOrderText] = useState('');
  const [copied, setCopied] = useState(false);

  const minDateString = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    return d.toISOString().split('T')[0];
  }, []);

  if (!isOpen) return null;

  const subtotal = items.reduce(
    (sum, item) => sum + item.unitPrice * item.quantity,
    0
  );
  const deposit30 = Math.round(subtotal * 0.3);

  const buildOrderMessage = () => {
    const lines = items
      .map(
        (it, idx) =>
          `${idx + 1}. ${it.title}${it.details ? ` [${it.details}]` : ''} × ${
            it.quantity
          } — ${(it.unitPrice * it.quantity).toLocaleString('en-US')} دج`
      )
      .join('\n');

    const methodText =
      deliveryMethod === 'home' ? 'توصيل إلى المنزل' : 'استلام من مكتب التوصيل';

    return [
      '*طلب جديد عبر متجر DG by Douaa 🎓*',
      `👤 *الاسم:* ${fullName.trim()}`,
      phone.trim() ? `📱 *الهاتف:* ${phone.trim()}` : null,
      `📍 *الولاية:* ${wilaya}${commune.trim() ? ` - ${commune.trim()}` : ''}`,
      `🚚 *طريقة الاستلام:* ${methodText}`,
      `📅 *موعد التسليم المطلوب:* ${deliveryDate || 'أقرب موعد متاح'}`,
      `🛒 *الطلبات:*\n${lines}`,
      `💰 *المجموع التقديري:* ${subtotal.toLocaleString('en-US')} دج`,
      `💳 *العربون التقريبي (30% عند التأكيد):* ${deposit30.toLocaleString('en-US')} دج`,
      notes.trim() ? `📝 *ملاحظات:* ${notes.trim()}` : null,
    ]
      .filter(Boolean)
      .join('\n');
  };

  const whatsappUrl = generatedOrderText
    ? `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(generatedOrderText)}`
    : '';

  const handlePrepareOrder = (e: FormEvent) => {
    e.preventDefault();
    if (items.length === 0) {
      onNotify('error', 'الحقيبة فارغة حالياً.');
      return;
    }
    if (!fullName.trim()) {
      setNameError('يرجى إدخال الاسم الكامل لتأكيد الطلب.');
      return;
    }
    setNameError('');
    const message = buildOrderMessage();
    setGeneratedOrderText(message);
    onNotify('success', 'تم تجهيز طلبك. اضغطي على زر المتابعة عبر WhatsApp.');
  };

  const handleCopyOrder = async () => {
    if (!generatedOrderText) return;
    try {
      await navigator.clipboard.writeText(generatedOrderText);
      setCopied(true);
      onNotify('success', 'تم نسخ تفاصيل الطلب بنجاح.');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      onNotify('error', 'تعذر النسخ التلقائي. يمكنك تحديد النص ونسخه يدوياً.');
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end bg-black/50 backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
      aria-label="حقيبة التسوق وإرسال الطلب"
    >
      <div
        className="fixed inset-0"
        onClick={onClose}
        aria-hidden="true"
      />

      <aside className="relative z-10 w-full max-w-md bg-[#faf8f5] h-full flex flex-col border-r border-[#e6ddd3] shadow-2xl">
        {/* Drawer Header */}
        <div className="px-5 py-4 bg-white border-b border-[#e6ddd3] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <ShoppingBag className="w-5 h-5 text-[#762b43]" />
            <h2 className="text-base font-bold text-[#1f1917]">
              حقيبة الطلب ({items.reduce((acc, i) => acc + i.quantity, 0)})
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#6e645e] hover:text-[#1f1917] hover:bg-[#f3eee8] transition-colors cursor-pointer"
            aria-label="إغلاق الحقيبة"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {items.length === 0 ? (
            <div className="bg-white border border-[#e6ddd3] rounded-2xl p-8 text-center">
              <ShoppingBag className="w-8 h-8 text-[#b99a65] mx-auto mb-3 opacity-80" />
              <p className="text-sm font-bold text-[#1f1917] mb-1">
                حقيبة الطلب فارغة
              </p>
              <p className="text-xs text-[#6e645e]">
                صمّمي وشاحك أو اختاري قطعك من المجموعة لإضافتها هنا.
              </p>
            </div>
          ) : (
            <>
              {/* Itemized List */}
              <div className="bg-white border border-[#e6ddd3] rounded-2xl divide-y divide-[#e6ddd3]">
                {items.map((item) => (
                  <div key={item.id} className="p-4 space-y-2.5">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h3 className="text-sm font-bold text-[#1f1917] leading-snug">
                          {item.title}
                        </h3>
                        {item.details && (
                          <p className="text-xs text-[#6e645e] mt-1 leading-relaxed">
                            {item.details}
                          </p>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setGeneratedOrderText('');
                          onRemoveItem(item.id);
                        }}
                        className="p-1 text-[#6e645e] hover:text-red-700 transition-colors shrink-0 cursor-pointer"
                        aria-label="حذف القطعة"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="flex items-center justify-between pt-1">
                      <div className="inline-flex items-center border border-[#e6ddd3] rounded-lg bg-[#faf8f5]">
                        <button
                          type="button"
                          onClick={() => {
                            setGeneratedOrderText('');
                            onUpdateQuantity(item.id, -1);
                          }}
                          className="p-1.5 text-[#1f1917] hover:bg-[#f3eee8] rounded-r-lg cursor-pointer"
                          aria-label="إنقاص الكمية"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="px-3 text-xs font-bold tabular-nums text-[#1f1917]">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            setGeneratedOrderText('');
                            onUpdateQuantity(item.id, 1);
                          }}
                          className="p-1.5 text-[#1f1917] hover:bg-[#f3eee8] rounded-l-lg cursor-pointer"
                          aria-label="زيادة الكمية"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <span className="text-sm font-extrabold text-[#762b43] tabular-nums">
                        {(item.unitPrice * item.quantity).toLocaleString('en-US')} دج
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Totals Summary */}
              <div className="bg-white border border-[#e6ddd3] rounded-2xl p-4 space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-[#6e645e]">المجموع التقديري</span>
                  <span className="text-lg font-extrabold text-[#1f1917] tabular-nums">
                    {subtotal.toLocaleString('en-US')} دج
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs pt-2 border-t border-[#e6ddd3]">
                  <span className="text-[#6e645e]">
                    عربون التأكيد (30% بعد المراجعة)
                  </span>
                  <span className="font-bold text-[#762b43] tabular-nums">
                    {deposit30.toLocaleString('en-US')} دج
                  </span>
                </div>
              </div>

              {/* Customer Checkout Form */}
              <form onSubmit={handlePrepareOrder} className="space-y-3">
                <h3 className="text-sm font-bold text-[#1f1917]">
                  بيانات التوصيل والتأكيد
                </h3>

                <div>
                  <label className="block text-xs font-semibold text-[#6e645e] mb-1">
                    الاسم الكامل *
                  </label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => {
                      setFullName(e.target.value);
                      if (nameError) setNameError('');
                      setGeneratedOrderText('');
                    }}
                    placeholder="الاسم واللقب"
                    className="w-full px-3.5 py-2.5 rounded-lg border border-[#e6ddd3] bg-white text-sm text-[#1f1917]"
                  />
                  {nameError && (
                    <p className="text-xs text-red-700 font-semibold mt-1">
                      {nameError}
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-[#6e645e] mb-1">
                      رقم الهاتف (اختياري)
                    </label>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => {
                        setPhone(e.target.value);
                        setGeneratedOrderText('');
                      }}
                      placeholder="05 / 06 / 07..."
                      className="w-full px-3.5 py-2.5 rounded-lg border border-[#e6ddd3] bg-white text-sm text-[#1f1917]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#6e645e] mb-1">
                      موعد التسليم المطلوب
                    </label>
                    <input
                      type="date"
                      min={minDateString}
                      value={deliveryDate}
                      onChange={(e) => {
                        setDeliveryDate(e.target.value);
                        setGeneratedOrderText('');
                      }}
                      className="w-full px-3 py-2.5 rounded-lg border border-[#e6ddd3] bg-white text-xs text-[#1f1917]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-[#6e645e] mb-1">
                      الولاية
                    </label>
                    <select
                      value={wilaya}
                      onChange={(e) => {
                        setWilaya(e.target.value);
                        setGeneratedOrderText('');
                      }}
                      className="w-full px-3 py-2.5 rounded-lg border border-[#e6ddd3] bg-white text-xs font-semibold text-[#1f1917]"
                    >
                      {ALGERIA_WILAYAS.map((w) => (
                        <option key={w} value={w}>
                          {w}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#6e645e] mb-1">
                      البلدية
                    </label>
                    <input
                      type="text"
                      value={commune}
                      onChange={(e) => {
                        setCommune(e.target.value);
                        setGeneratedOrderText('');
                      }}
                      placeholder="اسم البلدية"
                      className="w-full px-3.5 py-2.5 rounded-lg border border-[#e6ddd3] bg-white text-sm text-[#1f1917]"
                    />
                  </div>
                </div>

                {/* Delivery Method Segmented Selector */}
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setDeliveryMethod('home');
                      setGeneratedOrderText('');
                    }}
                    className={`py-2 px-3 rounded-lg text-xs font-bold border transition-colors cursor-pointer ${
                      deliveryMethod === 'home'
                        ? 'bg-[#1f1917] text-white border-[#1f1917]'
                        : 'bg-white text-[#6e645e] border-[#e6ddd3]'
                    }`}
                  >
                    توصيل للمنزل
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setDeliveryMethod('desk');
                      setGeneratedOrderText('');
                    }}
                    className={`py-2 px-3 rounded-lg text-xs font-bold border transition-colors cursor-pointer ${
                      deliveryMethod === 'desk'
                        ? 'bg-[#1f1917] text-white border-[#1f1917]'
                        : 'bg-white text-[#6e645e] border-[#e6ddd3]'
                    }`}
                  >
                    استلام من المكتب
                  </button>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#6e645e] mb-1">
                    ملاحظات المقاس أو التطريز
                  </label>
                  <textarea
                    rows={2}
                    value={notes}
                    onChange={(e) => {
                      setNotes(e.target.value);
                      setGeneratedOrderText('');
                    }}
                    placeholder="تفاصيل المقاس (XS-XXL)، اللون، أو طلبات إضافية..."
                    className="w-full px-3.5 py-2.5 rounded-lg border border-[#e6ddd3] bg-white text-sm text-[#1f1917]"
                  />
                </div>

                {!generatedOrderText ? (
                  <button
                    type="submit"
                    className="w-full py-3 px-4 rounded-lg bg-[#18734b] hover:bg-[#135c3c] text-white text-sm font-bold transition-colors cursor-pointer"
                  >
                    تجهيز وإرسال الطلب عبر WhatsApp
                  </button>
                ) : (
                  <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 space-y-3">
                    <p className="text-xs font-bold text-emerald-900">
                      ملخص طلبك جاهز للإرسال عبر WhatsApp:
                    </p>
                    <pre className="text-[11px] text-emerald-950 bg-white/80 p-2.5 rounded-lg border border-emerald-200 whitespace-pre-wrap font-sans leading-relaxed max-h-36 overflow-y-auto">
                      {generatedOrderText}
                    </pre>
                    <div className="flex flex-col sm:flex-row gap-2">
                      <a
                        href={whatsappUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 inline-flex items-center justify-center gap-1.5 py-2.5 px-4 rounded-lg bg-[#18734b] hover:bg-[#135c3c] text-white text-xs font-bold transition-colors"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span>فتح WhatsApp الآن</span>
                      </a>
                      <button
                        type="button"
                        onClick={handleCopyOrder}
                        className="inline-flex items-center justify-center gap-1.5 py-2.5 px-3.5 rounded-lg bg-white border border-emerald-300 text-emerald-900 text-xs font-bold hover:bg-emerald-100 transition-colors cursor-pointer"
                      >
                        {copied ? (
                          <Check className="w-3.5 h-3.5" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                        <span>{copied ? 'تم النسخ' : 'نسخ النص'}</span>
                      </button>
                    </div>
                  </div>
                )}
              </form>

              <div className="pt-2 flex justify-end">
                <button
                  type="button"
                  onClick={() => {
                    setGeneratedOrderText('');
                    onClearCart();
                  }}
                  className="text-xs font-semibold text-[#6e645e] hover:text-red-700 transition-colors cursor-pointer"
                >
                  تفريغ الحقيبة
                </button>
              </div>
            </>
          )}
        </div>
      </aside>
    </div>
  );
}
