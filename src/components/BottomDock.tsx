import React from 'react';
import { Home, BarChart2, User } from 'lucide-react';

export type ActiveTab = 'home' | 'activity' | 'account';

interface BottomDockProps {
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
}

export const BottomDock: React.FC<BottomDockProps> = ({
  activeTab,
  onTabChange,
}) => {
  const tabs = [
    {
      id: 'home' as ActiveTab,
      label: 'خانه',
      icon: Home,
    },
    {
      id: 'activity' as ActiveTab,
      label: 'فعالیت',
      icon: BarChart2,
    },
    {
      id: 'account' as ActiveTab,
      label: 'حساب من',
      icon: User,
    },
  ];

  return (
    <div className="fixed bottom-4 sm:bottom-6 left-0 right-0 z-40 flex justify-center pointer-events-none px-4 mb-[env(safe-area-inset-bottom,0px)]">
      <nav
        role="navigation"
        aria-label="منوی اصلی ناوبری"
        className="pointer-events-auto flex items-center justify-between gap-1 p-1.5 px-2 rounded-full bg-white/92 backdrop-blur-xl border border-[#E8DFF2] shadow-xl shadow-purple-950/10 w-full max-w-xs transition-all duration-300"
      >
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-full transition-all duration-200 active:scale-95 text-xs select-none ${
                isActive
                  ? 'bg-[#EDE5FA] text-[#8E72C9] font-bold shadow-2xs'
                  : 'text-[#81758F] font-medium hover:text-[#342B43] hover:bg-[#F5EFFC]/60'
              }`}
              aria-label={tab.label}
              aria-current={isActive ? 'page' : undefined}
            >
              <Icon className={`w-4 h-4 shrink-0 transition-transform ${isActive ? 'scale-110' : ''}`} />
              <span className="leading-none tracking-tight">{tab.label}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
};
