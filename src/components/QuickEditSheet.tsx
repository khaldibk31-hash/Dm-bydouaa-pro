import { FormEvent, useEffect, useRef, useState } from 'react';
import { ImagePlus, Loader2, Save, X } from 'lucide-react';

export interface QuickEditField {
  key: string;
  label: string;
  value: string;
  type?: 'text' | 'textarea' | 'number';
  placeholder?: string;
}

interface QuickEditSheetProps {
  isOpen: boolean;
  title: string;
  fields: QuickEditField[];
  imageUrl?: string;
  onUploadImage?: (file: File) => Promise<void> | void;
  onSave: (values: Record<string, string>) => void;
  onClose: () => void;
}

export function QuickEditSheet({
  isOpen,
  title,
  fields,
  imageUrl,
  onUploadImage,
  onSave,
  onClose,
}: QuickEditSheetProps) {
  const [values, setValues] = useState<Record<string, string>>({});
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    setValues(Object.fromEntries(fields.map((f) => [f.key, f.value])));
    // Only reset the draft when the sheet opens.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    onSave(values);
    onClose();
  };

  const handleFile = async (file?: File | null) => {
    if (!file || !onUploadImage) return;
    setUploading(true);
    try {
      await onUploadImage(file);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-black/55 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label={title}
      data-no-inline-edit
    >
      <button
        type="button"
        aria-label="إغلاق"
        className="absolute inset-0 cursor-default"
        onClick={onClose}
      />
      <form
        onSubmit={handleSubmit}
        className="sheet-enter relative w-full sm:max-w-md bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl max-h-[92dvh] flex flex-col"
      >
        <div className="flex items-center justify-between gap-3 px-5 pt-5 pb-3 border-b border-[#efe7de]">
          <h3 className="text-base font-extrabold text-[#1f1917]">{title}</h3>
          <button
            type="button"
            onClick={onClose}
            aria-label="إغلاق"
            className="w-10 h-10 -ml-2 rounded-full flex items-center justify-center text-[#6e645e] hover:bg-[#f3eee8] cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
          {onUploadImage && (
            <div className="flex items-center gap-4 p-3 rounded-2xl bg-[#faf8f5] border border-[#efe7de]">
              <div className="w-20 h-24 shrink-0 rounded-xl overflow-hidden bg-[#f3eee8] border border-[#e6ddd3]">
                {imageUrl ? (
                  <img src={imageUrl} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-[#b99a65]">
                    <ImagePlus className="w-6 h-6" />
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-[#1f1917] mb-2">الصورة</p>
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    handleFile(e.target.files?.item(0));
                    e.target.value = '';
                  }}
                />
                <button
                  type="button"
                  disabled={uploading}
                  onClick={() => fileRef.current?.click()}
                  className="inline-flex items-center gap-2 h-11 px-4 rounded-xl bg-[#762b43] hover:bg-[#581e31] text-white text-sm font-bold disabled:opacity-60 cursor-pointer"
                >
                  {uploading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <ImagePlus className="w-4 h-4" />
                  )}
                  <span>{uploading ? 'جاري الرفع...' : imageUrl ? 'تغيير الصورة' : 'رفع صورة'}</span>
                </button>
              </div>
            </div>
          )}

          {fields.map((field) => (
            <div key={field.key}>
              <label
                htmlFor={`qe-${field.key}`}
                className="block text-xs font-bold text-[#1f1917] mb-1.5"
              >
                {field.label}
              </label>
              {field.type === 'textarea' ? (
                <textarea
                  id={`qe-${field.key}`}
                  rows={3}
                  value={values[field.key] ?? ''}
                  placeholder={field.placeholder}
                  onChange={(e) => setValues((p) => ({ ...p, [field.key]: e.target.value }))}
                  className="field-input resize-y"
                />
              ) : (
                <input
                  id={`qe-${field.key}`}
                  type={field.type === 'number' ? 'number' : 'text'}
                  inputMode={field.type === 'number' ? 'numeric' : undefined}
                  value={values[field.key] ?? ''}
                  placeholder={field.placeholder}
                  onChange={(e) => setValues((p) => ({ ...p, [field.key]: e.target.value }))}
                  className="field-input"
                />
              )}
            </div>
          ))}
        </div>

        <div className="flex gap-2 px-5 py-4 border-t border-[#efe7de] pb-[max(1rem,env(safe-area-inset-bottom))]">
          <button
            type="submit"
            className="flex-1 inline-flex items-center justify-center gap-2 h-12 rounded-xl bg-[#1f1917] hover:bg-[#3a312d] text-white text-sm font-bold cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>حفظ التعديل</span>
          </button>
          <button
            type="button"
            onClick={onClose}
            className="h-12 px-5 rounded-xl bg-[#f3eee8] hover:bg-[#e6ddd3] text-[#1f1917] text-sm font-bold cursor-pointer"
          >
            إلغاء
          </button>
        </div>
      </form>
    </div>
  );
}
