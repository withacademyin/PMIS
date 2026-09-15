'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

const Tabs = React.forwardRef(({ className, defaultValue, value, onValueChange, children, ...props }, ref) => {
  const [activeTab, setActiveTab] = React.useState(value || defaultValue || '');

  React.useEffect(() => {
    if (value !== undefined) setActiveTab(value);
  }, [value]);

  const handleChange = (val) => {
    if (value === undefined) setActiveTab(val);
    onValueChange?.(val);
  };

  return (
    <div ref={ref} className={cn('', className)} data-active-tab={activeTab} {...props}>
      {React.Children.map(children, (child) => {
        if (!React.isValidElement(child)) return child;
        return React.cloneElement(child, { _activeTab: activeTab, _onTabChange: handleChange });
      })}
    </div>
  );
});
Tabs.displayName = 'Tabs';

const TabsList = React.forwardRef(({ className, children, _activeTab, _onTabChange, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      'inline-flex h-8 items-center gap-0.5 rounded-md bg-slate-100 p-0.5',
      className
    )}
    role="tablist"
    {...props}
  >
    {React.Children.map(children, (child) => {
      if (!React.isValidElement(child)) return child;
      return React.cloneElement(child, { _activeTab, _onTabChange });
    })}
  </div>
));
TabsList.displayName = 'TabsList';

const TabsTrigger = React.forwardRef(({ className, value, children, _activeTab, _onTabChange, ...props }, ref) => {
  const isActive = _activeTab === value;
  return (
    <button
      ref={ref}
      role="tab"
      type="button"
      aria-selected={isActive}
      data-state={isActive ? 'active' : 'inactive'}
      className={cn(
        'inline-flex items-center justify-center whitespace-nowrap rounded-[5px] px-2.5 py-1 text-[11px] font-medium transition-all',
        'text-slate-500 hover:text-slate-900',
        'data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-xs',
        className
      )}
      onClick={() => _onTabChange?.(value)}
      {...props}
    >
      {children}
    </button>
  );
});
TabsTrigger.displayName = 'TabsTrigger';

const TabsContent = React.forwardRef(({ className, value, children, _activeTab, _onTabChange, ...props }, ref) => {
  if (_activeTab !== value) return null;
  return (
    <div
      ref={ref}
      role="tabpanel"
      className={cn('mt-2', className)}
      {...props}
    >
      {children}
    </div>
  );
});
TabsContent.displayName = 'TabsContent';

export { Tabs, TabsList, TabsTrigger, TabsContent };
