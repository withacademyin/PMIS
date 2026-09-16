'use client';

export function DashboardLayout({ role, sidebarItems, activeNav, onNavChange, footer, profileSection, children }) {
  return (
    <div className="flex min-h-[calc(100vh-57px)] overflow-hidden">

      {/* Sidebar */}
      <aside className="hidden lg:flex w-56 flex-col border-r border-slate-200 bg-white pt-6 pb-6 px-3 shrink-0 overflow-y-auto">
        <div className="mb-6 px-3">
          <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">{role}</p>
        </div>

        {profileSection && <div className="px-3 mb-5">{profileSection}</div>}

        <nav className="flex-1 flex flex-col gap-0.5">
          {sidebarItems.map(({ icon: Icon, label, id }) => {
            const navKey = id || label;
            return (
              <button
                key={navKey}
                onClick={() => onNavChange(navKey)}
                className={`group flex items-center gap-2.5 rounded-md px-3 py-[7px] text-[13px] font-medium transition-colors ${
                  activeNav === navKey
                    ? 'bg-slate-100 text-slate-900'
                    : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'
                }`}
              >
                <Icon className="w-[15px] h-[15px]" strokeWidth={1.75} />
                {label}
              </button>
            );
          })}
        </nav>

        {footer && (
          <div className="mt-auto px-3 pt-4 border-t border-slate-100">
            {footer}
          </div>
        )}
      </aside>

      {/* Main content area */}
      <main className="flex-1 min-w-0 overflow-y-auto bg-slate-50/60">
        <div className="px-8 py-6 space-y-5">
          {children}
        </div>
      </main>
    </div>
  );
}

export default DashboardLayout;
