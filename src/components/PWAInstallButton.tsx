import React, { useState } from 'react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { Download, Share2, PlusSquare, X } from 'lucide-react';

export const PWAInstallButton: React.FC = () => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  // If already installed, hide
  if (isInstalled) {
    return null;
  }

  // Android / Chromium / Desktop flow
  if (isInstallable) {
    return (
      <button
        onClick={install}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-[#EDE5FA] text-[#8E72C9] hover:bg-[#8E72C9] hover:text-white transition-colors shadow-xs active:scale-95"
        title="نصب اپلیکیشن روی گوشی یا دسکتاپ"
      >
        <Download className="w-3.5 h-3.5" />
        <span>نصب برنامه</span>
      </button>
    );
  }

  // iOS Safari flow
  if (isIOS) {
    return (
      <>
        <button
          onClick={() => setShowIOSGuide(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-[#EDE5FA] text-[#8E72C9] hover:bg-[#8E72C9] hover:text-white transition-colors shadow-xs active:scale-95"
          title="نصب روی آیفون"
        >
          <Share2 className="w-3.5 h-3.5" />
          <span>نصب روی آیفون</span>
        </button>

        {showIOSGuide && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-in fade-in">
            <div className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-xl border border-[#E8DFF2] text-right">
              <div className="flex items-center justify-between mb-4">
                <button
                  onClick={() => setShowIOSGuide(false)}
                  className="p-1.5 rounded-full text-[#81758F] hover:bg-[#F5EFFC] transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
                <h3 className="text-base font-bold text-[#342B43]">
                  نصب «تکون بده» روی آیفون
                </h3>
              </div>

              <div className="space-y-3 text-sm text-[#81758F] leading-relaxed">
                <div className="flex items-start gap-2.5 p-3 rounded-2xl bg-[#FBF8FF] border border-[#E8DFF2]">
                  <Share2 className="w-5 h-5 text-[#8E72C9] shrink-0 mt-0.5" />
                  <p>
                    1. در نوار پایین مرورگر سافاری (Safari)، روی دکمه <strong>اشتراک‌گذاری (Share)</strong> بزنید.
                  </p>
                </div>

                <div className="flex items-start gap-2.5 p-3 rounded-2xl bg-[#FBF8FF] border border-[#E8DFF2]">
                  <PlusSquare className="w-5 h-5 text-[#8E72C9] shrink-0 mt-0.5" />
                  <p>
                    2. به پایین اسکرول کنید و گزینه <strong>Add to Home Screen (افزودن به صفحه اصلی)</strong> را انتخاب کنید.
                  </p>
                </div>

                <p className="text-xs text-[#8E72C9] bg-[#EDE5FA] p-3 rounded-2xl font-medium">
                  💡 پس از افزودن، آیکون «تکون بده» مانند یک برنامه واقعی روی صفحه آیفون قرار می‌گیرد و اعلان‌ها در پس‌زمینه در دسترس خواهند بود!
                </p>
              </div>

              <button
                onClick={() => setShowIOSGuide(false)}
                className="mt-5 w-full rounded-2xl bg-[#8E72C9] py-3 text-sm font-bold text-white hover:bg-[#7D61B8] transition-colors shadow-xs active:scale-98"
              >
                متوجه شدم!
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  return null;
};
