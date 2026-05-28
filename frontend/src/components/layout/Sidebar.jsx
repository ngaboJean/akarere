// ============================================================
// Sidebar - Navigation Component (Abayobozi)
// ============================================================
import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import useAuthStore from '../../store/authStore';
import toast from 'react-hot-toast';
import {
  LayoutDashboard, FileText, CheckSquare, Bell,
  Users, BarChart3, FolderOpen, MessageSquare,
  LogOut, Menu, X, Shield, ChevronDown
} from 'lucide-react';

const ROLE_LABELS = {
  umukuru_umudugudu: "Umukuru w'Umudugudu",
  es_akagari:        "ES w'Akagari",
  es_umurenge:       "ES w'Umurenge",
  admin_akarere:     "Umuyobozi w'Akarere",
  umuturage:         "Umuturage",
};

const ROLE_COLORS = {
  umukuru_umudugudu: 'bg-green-600',
  es_akagari:        'bg-blue-600',
  es_umurenge:       'bg-purple-600',
  admin_akarere:     'bg-red-600',
  umuturage:         'bg-gray-600',
};

export default function Sidebar({ basePath }) {
  const [isOpen, setIsOpen] = useState(false);
  const { umukoresha, sohoka } = useAuthStore();
  const navigate = useNavigate();

  const handleSohoka = async () => {
    await sohoka();
    toast.success('Wasohowe neza.');
    navigate('/injira');
  };

  const navItems = basePath === '/akarere' ? [
    { to: `${basePath}/raporo`,     icon: BarChart3,      label: 'Raporo & Analytics' },
    { to: `${basePath}/abakoresha`, icon: Users,          label: 'Abakoresha' },
    { to: `${basePath}/ibikorwa`,   icon: FolderOpen,     label: 'Ibikorwa rya Leta' },
  ] : basePath === '/umuturage' ? [
    { to: `${basePath}/ibibazo`,          icon: FileText,    label: 'Ibibazo Byanjye' },
    { to: `${basePath}/gutanga-ikibazo`,  icon: CheckSquare, label: 'Gutanga Ikibazo' },
    { to: `${basePath}/impushya`,         icon: Shield,      label: 'Gusaba Impushya' },
  ] : [
    { to: `${basePath}/ibibazo`,   icon: FileText,      label: 'Ibibazo' },
    { to: `${basePath}/impushya`,  icon: Shield,        label: 'Impushya' },
    { to: `${basePath}/inyandiko`, icon: MessageSquare, label: 'Inyandiko z\'Ibanga' },
  ];

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="p-6 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
            <Shield className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-white font-bold text-sm leading-tight">System y'Ibanze</h1>
            <p className="text-white/60 text-xs">🇷🇼 Rwanda</p>
          </div>
        </div>
      </div>

      {/* User Info */}
      <div className="p-4 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm
            ${ROLE_COLORS[umukoresha?.role_slug] || 'bg-gray-600'}`}>
            {umukoresha?.amazina?.charAt(0) || 'U'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white font-medium text-sm truncate">{umukoresha?.amazina}</p>
            <p className="text-white/60 text-xs">{ROLE_LABELS[umukoresha?.role_slug]}</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        <p className="text-white/40 text-xs font-semibold uppercase tracking-wider mb-3 px-2">Ibikoresho</p>
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            onClick={() => setIsOpen(false)}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150
               ${isActive
                 ? 'bg-white text-rwanda-dark shadow-md'
                 : 'text-white/70 hover:bg-white/10 hover:text-white'}`
            }
          >
            <Icon size={18} />
            {label}
          </NavLink>
        ))}
      </nav>

      {/* Logout */}
      <div className="p-4 border-t border-white/10">
        <button
          onClick={handleSohoka}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-white/70
                     hover:bg-red-500/20 hover:text-red-300 transition-all text-sm font-medium"
        >
          <LogOut size={18} />
          Sohoka
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile Toggle */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 w-10 h-10 bg-rwanda-dark text-white rounded-xl
                   flex items-center justify-center shadow-lg"
      >
        {isOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      {/* Mobile Overlay */}
      {isOpen && (
        <div className="lg:hidden fixed inset-0 bg-black/50 z-40" onClick={() => setIsOpen(false)} />
      )}

      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex flex-col w-64 bg-rwanda-dark min-h-screen fixed left-0 top-0 z-30">
        <SidebarContent />
      </aside>

      {/* Mobile Sidebar */}
      <aside className={`lg:hidden fixed left-0 top-0 h-full w-72 bg-rwanda-dark z-50 transform transition-transform duration-300
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <SidebarContent />
      </aside>
    </>
  );
}
