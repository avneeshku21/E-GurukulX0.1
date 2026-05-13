import { useEffect, useMemo, useRef, useState } from 'react';
import { cn } from '../../lib/utils.js';

const FOCUSABLE = 'button:not([disabled])';

export default function Dropdown({ trigger, items = [], align = 'right' }) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const rootRef = useRef(null);
  const itemRefs = useRef([]);

  const flatItems = useMemo(
    () => items.filter((item) => !item?.divider),
    [items],
  );

  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (event) => {
      if (!rootRef.current?.contains(event.target)) setIsOpen(false);
    };
    const handleEscape = (event) => {
      if (event.key === 'Escape') setIsOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    itemRefs.current[activeIndex]?.focus();
  }, [activeIndex, isOpen]);

  const menuClass = align === 'left' ? 'left-0' : 'right-0';

  const handleTriggerKeyDown = (event) => {
    if (event.key === 'ArrowDown' || event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      setIsOpen(true);
      setActiveIndex(0);
    }
  };

  const handleItemKeyDown = (event, index, item) => {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setActiveIndex((index + 1) % flatItems.length);
      return;
    }
    if (event.key === 'ArrowUp') {
      event.preventDefault();
      setActiveIndex((index - 1 + flatItems.length) % flatItems.length);
      return;
    }
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      item.onClick?.();
      setIsOpen(false);
    }
  };

  let actionIndex = -1;

  return (
    <div ref={rootRef} className="relative inline-block text-left">
      <button type="button" onClick={() => setIsOpen((prev) => !prev)} onKeyDown={handleTriggerKeyDown} className="inline-flex items-center" aria-expanded={isOpen} aria-haspopup="menu">
        {trigger}
      </button>

      {isOpen && (
        <div className={cn('absolute z-40 mt-2 min-w-[220px] overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-xl', menuClass)} role="menu">
          <div className="py-1.5">
            {items.map((item, index) => {
              if (item?.divider) {
                return <div key={`divider-${index}`} className="my-1 border-t border-slate-200 dark:border-slate-800" />;
              }
              actionIndex += 1;
              const currentIndex = actionIndex;
              return (
                <button
                  key={`${item.label}-${index}`}
                  ref={(node) => { itemRefs.current[currentIndex] = node; }}
                  type="button"
                  role="menuitem"
                  onMouseEnter={() => setActiveIndex(currentIndex)}
                  onKeyDown={(event) => handleItemKeyDown(event, currentIndex, item)}
                  onClick={() => { item.onClick?.(); setIsOpen(false); }}
                  className={cn(
                    'w-full px-4 py-2.5 text-left text-sm flex items-center gap-3 transition-colors',
                    currentIndex === activeIndex ? 'bg-slate-100 dark:bg-slate-800' : 'bg-transparent',
                    item.isDanger ? 'text-red-600 dark:text-red-400' : 'text-slate-700 dark:text-slate-200',
                  )}
                >
                  {item.icon && <span className="shrink-0">{item.icon}</span>}
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}