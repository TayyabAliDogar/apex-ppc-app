import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import {
  LayoutDashboard,
  FileText,
  Lightbulb,
  Upload,
  Settings,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

/**
 * Polished Sidebar Component
 * Financial Terminal aesthetic - sharp, precise, professional
 */
export function Sidebar({ collapsed, onToggle, activePath = '/' }) {
  const [hoveredItem, setHoveredItem] = useState(null);

  const navItems = [
    { path: '/', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/listing-editor', label: 'Listing Editor', icon: FileText },
    { path: '/insights', label: 'Insights', icon: Lightbulb },
    { path: '/upload', label: 'Upload Data', icon: Upload },
    { path: '/settings', label: 'Settings', icon: Settings },
  ];

  return (
    <motion.aside
      initial={false}
      animate={{ width: collapsed ? 80 : 256 }}
      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
      className="relative h-screen bg-obsidian-950 border-r border-obsidian-800 flex flex-col"
    >
      {/* Top accent line */}
      <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-emerald-500/50 via-emerald-500/20 to-transparent" />

      {/* Logo Section */}
      <div className="flex items-center justify-between px-6 py-6 border-b border-obsidian-800">
        <AnimatePresence mode="wait">
          {!collapsed && (
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
              className="flex items-center gap-3"
            >
              <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded flex items-center justify-center">
                <span className="text-white font-[700] text-sm">A</span>
              </div>
              <span className="text-lg font-[700] text-obsidian-800 tracking-tight">
                Apex PPC
              </span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Toggle Button */}
        <motion.button
          onClick={onToggle}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="p-2 rounded hover:bg-[#0D1826] transition-colors group"
        >
          {collapsed ? (
            <ChevronRight className="w-4 h-4 text-[#94A3B8] group-hover:text-emerald-400 transition-colors" />
          ) : (
            <ChevronLeft className="w-4 h-4 text-[#94A3B8] group-hover:text-emerald-400 transition-colors" />
          )}
        </motion.button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-6 space-y-1 overflow-y-auto custom-scrollbar">
        {navItems.map((item, index) => {
          const Icon = item.icon;
          const isActive = activePath === item.path;
          const isHovered = hoveredItem === item.path;

          return (
            <motion.a
              key={item.path}
              href={item.path}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05, duration: 0.3 }}
              onMouseEnter={() => setHoveredItem(item.path)}
              onMouseLeave={() => setHoveredItem(null)}
              style={{
                transition: 'background 0.15s ease, color 0.15s ease'
              }}
              className={`
                relative flex items-center gap-3 px-3 py-3 rounded
                ${isActive
                  ? 'bg-[#10B981]/10 text-emerald-400'
                  : 'text-[#94A3B8] hover:text-gray-200 hover:bg-[#0D1826]'
                }
              `}
            >
              {/* Active indicator */}
              {isActive && (
                <motion.div
                  layoutId="activeIndicator"
                  className="absolute left-0 top-0 bottom-0 w-1 bg-[#10B981] rounded-r"
                  transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                />
              )}

              {/* Icon */}
              <div className="relative">
                <Icon className={`w-5 h-5 transition-transform duration-200 ${isHovered ? 'scale-110' : ''}`} />

                {/* Icon glow on hover */}
                {isHovered && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    className="absolute inset-0 bg-[#10B981]/20 blur-lg -z-10"
                  />
                )}
              </div>

              {/* Label */}
              <AnimatePresence mode="wait">
                {!collapsed && (
                  <motion.span
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    transition={{ duration: 0.2 }}
                    className="text-sm font-medium tracking-wide"
                  >
                    {item.label}
                  </motion.span>
                )}
              </AnimatePresence>

              {/* Hover effect */}
              {isHovered && !isActive && (
                <motion.div
                  layoutId="hoverIndicator"
                  className="absolute inset-0 bg-gradient-to-r from-emerald-500/5 to-transparent rounded"
                  transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                />
              )}
            </motion.a>
          );
        })}
      </nav>

      {/* Bottom Section - User/Status */}
      <div className="px-3 py-4 border-t border-obsidian-800">
        <motion.div
          whileHover={{ scale: 1.02 }}
          className="flex items-center gap-3 px-3 py-3 rounded hover:bg-[#0D1826] transition-colors cursor-pointer"
        >
          <div className="w-8 h-8 bg-gradient-to-br from-gray-700 to-gray-800 rounded-[4px] flex items-center justify-center">
            <span className="text-xs font-medium text-[#F1F5F9]">U</span>
          </div>

          <AnimatePresence mode="wait">
            {!collapsed && (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.2 }}
                className="flex-1 min-w-0"
              >
                <div className="text-sm font-medium text-gray-200 truncate">
                  User Account
                </div>
                <div className="text-xs text-obsidian-8000 font-mono">
                  Free Plan
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>

      {/* Right edge accent */}
      <div className="absolute top-0 bottom-0 right-0 w-[1px] bg-gradient-to-b from-transparent via-emerald-500/20 to-transparent" />
    </motion.aside>
  );
}

/**
 * Sidebar Layout Wrapper
 * Use this to wrap your main content
 */
export function SidebarLayout({ children }) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="flex h-screen bg-obsidian-950">
      <Sidebar collapsed={collapsed} onToggle={() => setCollapsed(!collapsed)} />

      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  );
}
