import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { FAQ_ITEMS, PRICING_TABLE_ROWS } from '../data/defaultStore';

interface PricingAndFaqProps {
  pricesTitle: string;
  pricesSubtitle: string;
}

export function PricingAndFaq({ pricesTitle, pricesSubtitle }: PricingAndFaqProps) {
  const [openFaqIdx, setOpenFaqIdx] = useState<number | null>(0);

  return (
    <section className="py-12 sm:py-16">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 grid grid-cols-1 lg:grid-cols-12 gap-10">
        {/* Official Pricing Matrix */}
        <div id="prices-sec" className="lg:col-span-7">
          <p className="text-xs font-bold text-[#762b43] mb-1.5">
            شفافية الأسعار
          </p>
          <h2 className="font-editorial text-2xl sm:text-3xl font-bold text-[#1f1917] mb-2">
            {pricesTitle}
          </h2>
          <p className="text-sm text-[#6e645e] mb-6">{pricesSubtitle}</p>

          <div className="bg-white border border-[#e6ddd3] rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-right border-collapse text-sm">
                <thead>
                  <tr className="bg-[#f3eee8] border-b border-[#e6ddd3] text-[#1f1917]">
                    <th className="py-3.5 px-4 font-bold">القطعة / الموديل</th>
                    <th className="py-3.5 px-4 font-bold">كريب / عادي</th>
                    <th className="py-3.5 px-4 font-bold">دان / خليجي</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#e6ddd3]">
                  {PRICING_TABLE_ROWS.map((row) => (
                    <tr key={row.name} className="hover:bg-[#faf8f5] transition-colors">
                      <td className="py-3.5 px-4 font-semibold text-[#1f1917]">
                        {row.name}
                      </td>
                      <td className="py-3.5 px-4 font-bold text-[#762b43] tabular-nums whitespace-nowrap">
                        {row.crepe.toLocaleString('en-US')} دج
                      </td>
                      <td className="py-3.5 px-4 font-bold text-[#762b43] tabular-nums whitespace-nowrap">
                        {row.dan.toLocaleString('en-US')} دج
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="px-4 py-3 bg-[#faf8f5] border-t border-[#e6ddd3] text-xs text-[#6e645e]">
              تطريز الاسم والدفعة مشمول مجاناً في جميع الشالات · قبعة التوكسيدو +100 دج.
            </div>
          </div>
        </div>

        {/* Frequently Asked Questions */}
        <div id="faq-sec" className="lg:col-span-5">
          <p className="text-xs font-bold text-[#762b43] mb-1.5">
            تفاصيل الطلب والتوصيل
          </p>
          <h2 className="font-editorial text-2xl sm:text-3xl font-bold text-[#1f1917] mb-2">
            الأسئلة الشائعة
          </h2>
          <p className="text-sm text-[#6e645e] mb-6">
            كل ما تحتاج معرفته عن التجهيز، العربون، والتوصيل في الجزائر.
          </p>

          <div className="bg-white border border-[#e6ddd3] rounded-2xl divide-y divide-[#e6ddd3]">
            {FAQ_ITEMS.map((item, idx) => {
              const isOpen = openFaqIdx === idx;
              return (
                <div key={item.q}>
                  <button
                    type="button"
                    aria-expanded={isOpen}
                    onClick={() => setOpenFaqIdx(isOpen ? null : idx)}
                    className="w-full flex items-center justify-between gap-4 px-5 py-4 text-right text-sm font-bold text-[#1f1917] hover:bg-[#faf8f5] transition-colors cursor-pointer"
                  >
                    <span>{item.q}</span>
                    <ChevronDown
                      className={`w-4 h-4 text-[#762b43] shrink-0 transition-transform duration-200 ${
                        isOpen ? 'rotate-180' : ''
                      }`}
                    />
                  </button>
                  {isOpen && (
                    <div className="px-5 pb-4 text-xs sm:text-sm text-[#6e645e] leading-relaxed">
                      {item.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
