// Layout Component - Professional Dark Theme

import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { useStore } from '../../store/useStore';

export function Layout({ children, currentView, onNavigate, title, subtitle, headerActions }) {
  const { sidebarCollapsed } = useStore();

  return (
    <div className="min-h-screen flex" style={{ backgroundColor: 'var(--bg-primary)', transition: 'var(--theme-transition)' }}>
      <div className="min-h-screen w-full flex">

        {/* Sidebar */}
        <Sidebar currentView={currentView} onNavigate={onNavigate} />

        {/* Main Content */}
        <div
          className={`flex-1 flex flex-col transition-all duration-300 relative z-10 ${
            sidebarCollapsed ? 'lg:ml-20' : 'lg:ml-64'
          }`}
        >
          {/* Header */}
          <Header title={title} subtitle={subtitle} actions={headerActions} />

          {/* Page Content */}
          <main
            className="flex-1 p-4 lg:p-8 pb-20 overflow-y-auto overflow-x-hidden"
            style={{
              WebkitOverflowScrolling: 'touch',
              animation: 'pageFadeIn 0.25s ease forwards'
            }}
          >
            {children}
          </main>
        </div>

      </div>
    </div>
  );
}