'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import SidebarLayout from '@/components/SidebarLayout'
import InvestmentTracker from '@/components/InvestmentTracker'
import { 
  Plus, 
  Bird, 
  Egg, 
  Package, 
  TrendingUp, 
  ArrowUpRight, 
  ClipboardList, 
  ShoppingBag, 
  Receipt,
  BarChart3
} from 'lucide-react'

interface Flock {
  id: string
  name: string
  breed: string
  current_count: number
}

interface Transaction {
  id: string
  type: string
  category: string
  amount: number
}

export default function DashboardPage() {
  const router = useRouter()
  const [flocks, setFlocks] = useState<Flock[]>([])
  const [totalBirds, setTotalBirds] = useState(0)
  const [eggsToday, setEggsToday] = useState(0)
  const [feedLeft, setFeedLeft] = useState(0)
  const [totalSales, setTotalSales] = useState(0)
  const [totalExpenses, setTotalExpenses] = useState(0)
  const [recentSales, setRecentSales] = useState<Transaction[]>([])
  const [recentExpenses, setRecentExpenses] = useState<Transaction[]>([])
  const [greeting, setGreeting] = useState('Good evening')

  useEffect(() => {
    const hour = new Date().getHours()
    if (hour < 12) setGreeting('Good morning')
    else if (hour < 17) setGreeting('Good afternoon')
    else setGreeting('Good evening')

    const fetchDashboardData = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        router.push('/login')
        return
      }

      // 1. Fetch Flocks
      const { data: flocksData } = await supabase.from('flocks').select('*')
      if (flocksData) {
        setFlocks(flocksData)
        setTotalBirds(flocksData.reduce((sum, f) => sum + (f.current_count || 0), 0))
      }

      // 2. Fetch Today's Egg Production
      const today = new Date().toISOString().split('T')[0]
      const { data: recordsData } = await supabase
        .from('daily_records')
        .select('*')
        .eq('record_date', today)

      if (recordsData) {
        setEggsToday(recordsData.reduce((sum, r) => sum + (r.eggs_collected || 0), 0))
      }

      // 3. Fetch Feed Inventory Total
      const { data: feedData } = await supabase.from('feed_inventory').select('*')
      if (feedData) {
        setFeedLeft(feedData.reduce((sum, f) => sum + (f.quantity_kg || 0), 0))
      }

      // 4. Fetch Transactions for Sales and Expenses
      const { data: txData } = await supabase.from('transactions').select('*').order('created_at', { ascending: false })
      if (txData) {
        const sales = txData.filter(t => t.type === 'Income (+)').reduce((sum, t) => sum + Number(t.amount), 0)
        const exp = txData.filter(t => t.type === 'Expense (-)').reduce((sum, t) => sum + Number(t.amount), 0)
        setTotalSales(sales)
        setTotalExpenses(exp)
        setRecentSales(txData.filter(t => t.type === 'Income (+)').slice(0, 3))
        setRecentExpenses(txData.filter(t => t.type === 'Expense (-)').slice(0, 3))
      }
    }

    fetchDashboardData()
  }, [router])

  const netProfit = totalSales - totalExpenses

  // Big, readable action cards inspired by FugoSmart
  const quickActions = [
    { name: 'Record Activity', href: '/records', icon: ClipboardList, color: 'bg-emerald-50 text-[#45543c] border-emerald-200' },
    { name: 'Manage Flocks', href: '/flocks', icon: Bird, color: 'bg-amber-50 text-amber-700 border-amber-200' },
    { name: 'Feed Stock', href: '/finance?tab=feed', icon: Package, color: 'bg-blue-50 text-blue-700 border-blue-200' },
    { name: 'Record Sales', href: '/sales', icon: ShoppingBag, color: 'bg-purple-50 text-purple-700 border-purple-200' },
    { name: 'Add Expense', href: '/expenses', icon: Receipt, color: 'bg-rose-50 text-rose-700 border-rose-200' },
    { name: 'View Reports', href: '/reports', icon: BarChart3, color: 'bg-slate-50 text-slate-700 border-slate-200' },
  ]

  return (
    <SidebarLayout>
      <div className="w-full space-y-6">
        
        {/* Hero Header Banner */}
        <div className="relative bg-[#45543c] text-white rounded-3xl p-8 overflow-hidden min-h-[200px] flex flex-col justify-between shadow-sm">
          <div 
            className="absolute inset-0 opacity-15 bg-cover bg-center pointer-events-none"
            style={{ backgroundImage: `url('https://images.unsplash.com/photo-1548550023-2bdb3c5beed7?q=80&w=1200&auto=format&fit=crop')` }}
          />

          <div className="relative z-10 space-y-2">
            <p className="text-[10px] font-bold text-amber-300 uppercase tracking-widest">
              {new Date().toLocaleDateString('en-GB', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })}
            </p>
            <h1 className="text-3xl font-extrabold tracking-tight">{greeting}, Peninah!</h1>
            <p className="text-xs text-emerald-100 font-medium max-w-sm">
              {flocks.length === 0
                ? 'Add your first batch and your farm numbers will appear here automatically.'
                : 'Your farm performance metrics are updated with today’s records.'}
            </p>
          </div>

          <div className="relative z-10 mt-6">
            <Link
              href="/records"
              className="inline-flex items-center gap-2 bg-[#facc15] hover:bg-yellow-400 text-[#45543c] font-extrabold px-5 py-2.5 rounded-full text-xs transition shadow-sm cursor-pointer"
            >
              <Plus size={16} /> Record today's activity
            </Link>
          </div>
        </div>

        {/* Large FugoSmart-style Action Buttons */}
        <div>
          <h2 className="text-sm font-bold text-gray-900 mb-3 tracking-tight">Quick Actions</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            {quickActions.map((action) => {
              const Icon = action.icon
              return (
                <Link
                  key={action.name}
                  href={action.href}
                  className={`p-4 rounded-2xl border ${action.color} flex flex-col items-center justify-center text-center transition-all hover:scale-[1.02] shadow-sm cursor-pointer`}
                >
                  <div className="p-3 rounded-full bg-white shadow-sm mb-2.5">
                    <Icon size={24} />
                  </div>
                  <span className="font-bold text-xs tracking-tight">{action.name}</span>
                </Link>
              )
            })}
          </div>
        </div>

        {/* 4 Summary Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-between">
            <div className="flex justify-between items-start">
              <span className="text-[10px] font-bold text-gray-400 tracking-wider uppercase">LIVE BIRDS</span>
              <div className="p-2 bg-gray-50 text-gray-600 rounded-xl">
                <Bird size={16} />
              </div>
            </div>
            <div className="mt-4">
              <h3 className="text-2xl font-extrabold text-gray-900">{totalBirds}</h3>
              <p className="text-[11px] text-gray-400 font-medium mt-0.5">{flocks.length} active batches</p>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-between">
            <div className="flex justify-between items-start">
              <span className="text-[10px] font-bold text-gray-400 tracking-wider uppercase">EGGS TODAY</span>
              <div className="p-2 bg-amber-50 text-amber-600 rounded-xl">
                <Egg size={16} />
              </div>
            </div>
            <div className="mt-4">
              <h3 className="text-2xl font-extrabold text-gray-900">{eggsToday}</h3>
              <p className="text-[11px] text-gray-400 font-medium mt-0.5">
                {eggsToday > 0 ? 'Logged today' : 'No records yet today'}
              </p>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-between">
            <div className="flex justify-between items-start">
              <span className="text-[10px] font-bold text-gray-400 tracking-wider uppercase">FEED LEFT</span>
              <div className="p-2 bg-emerald-50 text-[#45543c] rounded-xl">
                <Package size={16} />
              </div>
            </div>
            <div className="mt-4">
              <h3 className="text-2xl font-extrabold text-gray-900">{feedLeft} kg</h3>
              <p className="text-[11px] text-gray-400 font-medium mt-0.5">Purchased minus issued</p>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-between">
            <div className="flex justify-between items-start">
              <span className="text-[10px] font-bold text-gray-400 tracking-wider uppercase">PROFIT THIS MONTH</span>
              <div className="p-2 bg-orange-50 text-orange-600 rounded-xl">
                <TrendingUp size={16} />
              </div>
            </div>
            <div className="mt-4">
              <h3 className="text-2xl font-extrabold text-gray-900">KSh {netProfit.toLocaleString()}</h3>
              <p className="text-[11px] text-gray-400 font-medium mt-0.5">Sales KSh {totalSales.toLocaleString()}</p>
            </div>
          </div>
        </div>

        {/* Investment Schedule Tracker */}
        <InvestmentTracker />

        {/* Flocks & Recent Activity Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            
            {/* Active Flocks Overview */}
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-gray-900 text-xs">Your flocks</h3>
                <Link href="/flocks" className="text-xs font-semibold text-gray-400 hover:text-gray-600 flex items-center gap-1 cursor-pointer">
                  View all <ArrowUpRight size={14} />
                </Link>
              </div>
              {flocks.length === 0 ? (
                <div className="text-center py-4">
                  <p className="text-xs text-gray-400 mb-2">No active batches yet.</p>
                  <Link
                    href="/flocks"
                    className="inline-flex items-center gap-1.5 bg-[#45543c] text-white font-bold px-3.5 py-1.5 rounded-xl text-xs cursor-pointer"
                  >
                    <Plus size={14} /> Create a batch
                  </Link>
                </div>
              ) : (
                <div className="space-y-2">
                  {flocks.map(f => (
                    <div key={f.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-xl text-xs">
                      <div>
                        <p className="font-bold text-gray-800">{f.name}</p>
                        <p className="text-[10px] text-gray-400 uppercase">{f.breed}</p>
                      </div>
                      <span className="font-extrabold text-gray-900">{f.current_count} birds</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Sales vs Expenses Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm space-y-3">
                <div className="flex justify-between items-center">
                  <h4 className="font-bold text-xs text-gray-900">Recent sales</h4>
                  <Link href="/sales" className="text-[11px] font-semibold text-gray-400 cursor-pointer">All</Link>
                </div>
                {recentSales.length === 0 ? (
                  <p className="text-xs text-gray-400">No sales recorded yet.</p>
                ) : (
                  <div className="space-y-2">
                    {recentSales.map(s => (
                      <div key={s.id} className="flex justify-between text-xs">
                        <span className="text-gray-700 font-medium">{s.category}</span>
                        <span className="font-bold text-emerald-600">+KSh {Number(s.amount).toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm space-y-3">
                <div className="flex justify-between items-center">
                  <h4 className="font-bold text-xs text-gray-900">Recent expenses</h4>
                  <Link href="/expenses" className="text-[11px] font-semibold text-gray-400 cursor-pointer">All</Link>
                </div>
                {recentExpenses.length === 0 ? (
                  <p className="text-xs text-gray-400">No expenses recorded yet.</p>
                ) : (
                  <div className="space-y-2">
                    {recentExpenses.map(e => (
                      <div key={e.id} className="flex justify-between text-xs">
                        <span className="text-gray-700 font-medium">{e.category}</span>
                        <span className="font-bold text-amber-600">-KSh {Number(e.amount).toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

          </div>

          {/* Right Summary Bar */}
          <div className="space-y-6">
            <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm space-y-4">
              <h4 className="font-bold text-xs text-gray-900">This month overview</h4>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between text-gray-500">
                  <span>Sales</span>
                  <span className="font-bold text-gray-800">KSh {totalSales.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-gray-500">
                  <span>Expenses</span>
                  <span className="font-bold text-gray-800">KSh {totalExpenses.toLocaleString()}</span>
                </div>
                <div className="pt-2 border-t border-gray-100 flex justify-between font-extrabold text-gray-900">
                  <span>Profit</span>
                  <span>KSh {netProfit.toLocaleString()}</span>
                </div>
              </div>
              <Link
                href="/records"
                className="w-full py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold rounded-xl text-xs transition flex items-center justify-center gap-2 cursor-pointer"
              >
                <ClipboardList size={14} /> Log today's record
              </Link>
            </div>
          </div>
        </div>

      </div>
    </SidebarLayout>
  )
}