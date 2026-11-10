'use client'

import { ReactNode, useEffect, useState, Suspense } from 'react'
import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { 
  Home, 
  Bird, 
  ClipboardList, 
  Package, 
  ShoppingCart, 
  Receipt, 
  BarChart3, 
  Settings, 
  LogOut,
  ChevronLeft,
  ChevronRight
} from 'lucide-react'
import { supabase } from '@/lib/supabase'

interface SidebarLayoutProps {
  children: ReactNode
}

const navItems = [
  { name: 'Home', href: '/', icon: Home, tabKey: null },
  { name: 'Flocks', href: '/flocks', icon: Bird, tabKey: null },
  { name: 'Records', href: '/records', icon: ClipboardList, tabKey: null },
  { name: 'Feed', href: '/finance?tab=feed', icon: Package, tabKey: 'feed' },
  { name: 'Sales', href: '/sales', icon: ShoppingCart, tabKey: null },
  { name: 'Expenses', href: '/expenses', icon: Receipt, tabKey: null },
  { name: 'Reports', href: '/reports', icon: BarChart3, tabKey: null },
  { name: 'Settings', href: '/settings', icon: Settings, tabKey: null },
]

function SidebarContent({ children }: SidebarLayoutProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const currentTab = searchParams.get('tab')
  
  const [userEmail, setUserEmail] = useState<string>('')
  const [collapsed, setCollapsed] = useState(false)

  useEffect(() => {
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (session?.user?.email) {
        setUserEmail(session.user.email)
      }
    }
    getSession()
  }, [])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  const isLinkActive = (item: typeof navItems[0]) => {
    if (item.href.startsWith('/finance')) {
      if (pathname !== '/finance') return false
      if (!currentTab) return item.tabKey === 'feed'
      return currentTab === item.tabKey
    }
    return pathname === item.href
  }

  // Mobile bottom navigation items for quick thumb access
  const mobileBottomItems = [
    { name: 'Home', href: '/', icon: Home },
    { name: 'Flocks', href: '/flocks', icon: Bird },
    { name: 'Records', href: '/records', icon: ClipboardList },
    { name: 'Reports', href: '/reports', icon: BarChart3 },
    { name: 'Settings', href: '/settings', icon: Settings },
  ]

  return (
    <div className="min-h-screen w-full bg-[#fbf9f4] flex font-sans items-stretch pb-20 md:pb-0">
      {/* Desktop Collapsible Sidebar */}
      <aside 
        className={`bg-[#163c29] text-white hidden md:flex flex-col shrink-0 justify-between p-4 sticky top-0 self-stretch min-h-screen transition-all duration-300 z-30 ${
          collapsed ? 'w-20' : 'w-60'
        }`}
      >
        <div>
          {/* Brand Header & Toggle Button */}
          <div className="flex items-center justify-between px-1 py-3 mb-4">
            <div className="flex items-center gap-3 overflow-hidden">
              <div className="w-9 h-9 rounded-full bg-amber-400 flex items-center justify-center font-extrabold text-[#163c29] text-base shadow shrink-0">
                O
              </div>
              {!collapsed && (
                <div className="truncate transition-opacity duration-200">
                  <h1 className="font-extrabold text-sm tracking-tight text-white leading-none">Chick Farm Pro</h1>
                  <p className="text-[9px] text-emerald-300 font-semibold tracking-wider uppercase mt-1">
                    MANAGE • GROW • PROFIT
                  </p>
                </div>
              )}
            </div>

            {/* Collapse Toggle Button */}
            <button
              onClick={() => setCollapsed(!collapsed)}
              className="p-1.5 rounded-lg bg-emerald-950/60 hover:bg-emerald-900 text-emerald-300 transition shrink-0 cursor-pointer"
              title={collapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
            >
              {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1.5">
            {navItems.map((item) => {
              const Icon = item.icon
              const isActive = isLinkActive(item)
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  title={collapsed ? item.name : undefined}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium transition-all duration-150 cursor-pointer ${
                    isActive
                      ? 'bg-[#facc15] text-[#163c29] font-bold shadow-sm'
                      : 'text-emerald-100/80 hover:bg-white/10 hover:text-white'
                  } ${collapsed ? 'justify-center' : ''}`}
                >
                  <Icon size={18} className="shrink-0" />
                  {!collapsed && <span className="truncate">{item.name}</span>}
                </Link>
              )
            })}
          </nav>
        </div>

        {/* Bottom User Profile */}
        <div className={`bg-[#123222] p-2.5 rounded-2xl flex items-center border border-white/5 ${
          collapsed ? 'justify-center' : 'justify-between'
        }`}>
          <div className="flex items-center gap-2.5 overflow-hidden">
            <div className="w-8 h-8 rounded-full bg-[#facc15] text-[#163c29] font-bold text-xs flex items-center justify-center shrink-0">
              PN
            </div>
            {!collapsed && (
              <div className="truncate">
                <p className="text-xs font-bold text-white truncate">Peninah Njoki</p>
                <p className="text-[10px] text-emerald-400 font-medium">Admin</p>
              </div>
            )}
          </div>
          {!collapsed && (
            <button
              onClick={handleLogout}
              title="Sign Out"
              className="text-emerald-200/60 hover:text-white p-1 rounded-lg transition shrink-0 cursor-pointer"
            >
              <LogOut size={15} />
            </button>
          )}
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 w-full relative">
        {/* Top Header */}
        <header className="bg-[#fbf9f4] border-b border-gray-200/50 h-16 px-6 lg:px-8 flex items-center justify-between sticky top-0 z-40 w-full">
          <div>
            <h2 className="text-xl font-bold text-gray-900 tracking-tight">Dashboard</h2>
            <p className="text-xs text-gray-400 font-medium">
              {new Date().toLocaleDateString('en-GB', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Link 
              href="/reports"
              className="bg-[#163c29] hover:bg-emerald-900 text-emerald-300 text-[11px] font-semibold px-3.5 py-1.5 rounded-full flex items-center gap-1.5 shadow-sm transition cursor-pointer no-print relative z-40"
            >
              <span className="w-2 h-2 rounded-full bg-amber-400"></span> Daily summary
            </Link>
          </div>
        </header>

        {/* Page Content Container */}
        <main className="flex-1 p-6 lg:p-8 w-full space-y-6 relative z-10">
          {children}
        </main>
      </div>

      {/* Mobile Fixed Bottom Navigation Bar */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 bg-[#163c29] border-t border-emerald-900/40 px-3 py-2 flex items-center justify-around z-50 shadow-2xl">
        {mobileBottomItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex flex-col items-center justify-center py-1 px-2 rounded-xl transition cursor-pointer ${
                isActive ? 'text-[#facc15] font-bold' : 'text-emerald-100/70 hover:text-white'
              }`}
            >
              <Icon size={20} />
              <span className="text-[10px] mt-0.5 tracking-tight">{item.name}</span>
            </Link>
          )
        })}
      </nav>
    </div>
  )
}

export default function SidebarLayout({ children }: SidebarLayoutProps) {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#fbf9f4]" />}>
      <SidebarContent>{children}</SidebarContent>
    </Suspense>
  )
}