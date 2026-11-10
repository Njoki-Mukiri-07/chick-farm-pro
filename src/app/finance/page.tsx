'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import SidebarLayout from '@/components/SidebarLayout'
import { Package, Plus, ArrowDownLeft, X, ShoppingBag, Receipt, Calendar } from 'lucide-react'

interface FeedInventory {
  id: string
  feed_type: string
  quantity_kg: number
  bags_count: number
  total_cost: number
  supplier: string
  purchase_date: string
}

interface FeedIssue {
  id: string
  flock_id: string
  feed_type: string
  quantity_kg: number
  issue_date: string
  flocks?: { name: string }
}

interface Flock {
  id: string
  name: string
}

export default function FeedInventoryPage() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<'Stock' | 'Purchases' | 'Issues'>('Stock')
  const [inventory, setInventory] = useState<FeedInventory[]>([])
  const [issues, setIssues] = useState<FeedIssue[]>([])
  const [flocks, setFlocks] = useState<Flock[]>([])

  // Modals
  const [isPurchaseModalOpen, setIsPurchaseModalOpen] = useState(false)
  const [isIssueModalOpen, setIsIssueModalOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  // Purchase Form States
  const [feedType, setFeedType] = useState('Starter Crumb')
  const [quantityKg, setQuantityKg] = useState(50)
  const [bagsCount, setBagsCount] = useState(1)
  const [totalCost, setTotalCost] = useState(3500)
  const [supplier, setSupplier] = useState('')
  const [purchaseDate, setPurchaseDate] = useState(new Date().toISOString().split('T')[0])

  // Issue Form States
  const [selectedFlockId, setSelectedFlockId] = useState('')
  const [issueFeedType, setIssueFeedType] = useState('Starter Crumb')
  const [issueQuantityKg, setIssueQuantityKg] = useState(25)
  const [issueDate, setIssueDate] = useState(new Date().toISOString().split('T')[0])

  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        router.push('/login')
        return
      }
      fetchData()
    }
    checkSession()
  }, [router])

  const fetchData = async () => {
    // 1. Fetch Feed Inventory (Purchases)
    const { data: invData } = await supabase.from('feed_inventory').select('*').order('purchase_date', { ascending: false })
    if (invData) setInventory(invData)

    // 2. Fetch Feed Issues
    const { data: issueData } = await supabase.from('feed_issues').select('*, flocks(name)').order('issue_date', { ascending: false })
    if (issueData) setIssues(issueData)

    // 3. Fetch Flocks for Issue dropdown
    const { data: flocksData } = await supabase.from('flocks').select('id, name')
    if (flocksData) {
      setFlocks(flocksData)
      if (flocksData.length > 0) setSelectedFlockId(flocksData[0].id)
    }
  }

  const handlePurchaseFeed = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    const payload = {
      feed_type: feedType,
      quantity_kg: Number(quantityKg),
      bags_count: Number(bagsCount),
      total_cost: Number(totalCost),
      supplier,
      purchase_date: purchaseDate
    }

    const { error } = await supabase.from('feed_inventory').insert([payload])

    if (error) {
      alert('Error recording purchase: ' + error.message)
    } else {
      // Also record as an expense transaction automatically
      await supabase.from('transactions').insert([{
        type: 'Expense (-)',
        category: `Feed Purchase (${feedType})`,
        amount: Number(totalCost),
        transaction_date: purchaseDate,
        notes: `Bought ${quantityKg}kg from ${supplier || 'Supplier'}`
      }])

      setIsPurchaseModalOpen(false)
      fetchData()
      setSupplier('')
      setTotalCost(3500)
    }
    setLoading(false)
  }

  const handleIssueFeed = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedFlockId) {
      alert('Please select a batch.')
      return
    }

    setLoading(true)
    const payload = {
      flock_id: selectedFlockId,
      feed_type: issueFeedType,
      quantity_kg: Number(issueQuantityKg),
      issue_date: issueDate
    }

    const { error } = await supabase.from('feed_issues').insert([payload])

    if (error) {
      alert('Error issuing feed: ' + error.message)
    } else {
      setIsIssueModalOpen(false)
      fetchData()
    }
    setLoading(false)
  }

  // Calculations
  const totalPurchasedKg = inventory.reduce((sum, i) => sum + Number(i.quantity_kg || 0), 0)
  const totalIssuedKg = issues.reduce((sum, i) => sum + Number(i.quantity_kg || 0), 0)
  const feedInStoreKg = totalPurchasedKg - totalIssuedKg
  const totalFeedSpend = inventory.reduce((sum, i) => sum + Number(i.total_cost || 0), 0)

  return (
    <SidebarLayout>
      <div className="w-full space-y-6">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">Feed</h1>
            <p className="text-xs text-gray-500 font-medium mt-0.5">
              Stock in the store, what you bought and what each batch received.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsPurchaseModalOpen(true)}
              className="bg-white hover:bg-gray-50 text-gray-800 border border-gray-200 font-extrabold text-xs px-4 py-2.5 rounded-xl flex items-center gap-2 shadow-sm transition cursor-pointer"
            >
              <Plus size={16} /> Purchase
            </button>
            <button
              onClick={() => setIsIssueModalOpen(true)}
              className="bg-[#facc15] hover:bg-yellow-400 text-[#163c29] font-extrabold text-xs px-4 py-2.5 rounded-xl flex items-center gap-2 shadow-sm transition cursor-pointer"
            >
              <Plus size={16} /> Issue feed
            </button>
          </div>
        </div>

        {/* 4 Summary Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-between">
            <div className="flex justify-between items-start">
              <span className="text-[10px] font-bold text-gray-400 tracking-wider uppercase">FEED IN STORE</span>
              <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
                <Package size={16} />
              </div>
            </div>
            <div className="mt-4">
              <h3 className="text-2xl font-extrabold text-gray-900">{feedInStoreKg} kg</h3>
              <p className="text-[11px] text-gray-400 font-medium mt-0.5">Purchased minus issued</p>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-between">
            <div className="flex justify-between items-start">
              <span className="text-[10px] font-bold text-gray-400 tracking-wider uppercase">PURCHASED</span>
              <div className="p-2 bg-gray-50 text-gray-600 rounded-xl">
                <Package size={16} />
              </div>
            </div>
            <div className="mt-4">
              <h3 className="text-2xl font-extrabold text-gray-900">{totalPurchasedKg} kg</h3>
              <p className="text-[11px] text-gray-400 font-medium mt-0.5">Total stock bought</p>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-between">
            <div className="flex justify-between items-start">
              <span className="text-[10px] font-bold text-gray-400 tracking-wider uppercase">ISSUED TO FLOCKS</span>
              <div className="p-2 bg-amber-50 text-amber-600 rounded-xl">
                <ArrowDownLeft size={16} />
              </div>
            </div>
            <div className="mt-4">
              <h3 className="text-2xl font-extrabold text-gray-900">{totalIssuedKg} kg</h3>
              <p className="text-[11px] text-gray-400 font-medium mt-0.5">Fed to batches</p>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-between">
            <div className="flex justify-between items-start">
              <span className="text-[10px] font-bold text-gray-400 tracking-wider uppercase">FEED SPEND</span>
              <div className="p-2 bg-orange-50 text-orange-600 rounded-xl">
                <Receipt size={16} />
              </div>
            </div>
            <div className="mt-4">
              <h3 className="text-2xl font-extrabold text-gray-900">KSh {totalFeedSpend.toLocaleString()}</h3>
              <p className="text-[11px] text-gray-400 font-medium mt-0.5">Recorded in expenses</p>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-1 bg-white p-1.5 rounded-2xl border border-gray-100 shadow-sm w-fit">
          {(['Stock', 'Purchases', 'Issues'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-5 py-2 rounded-xl text-xs font-bold transition ${
                activeTab === tab 
                  ? 'bg-[#163c29] text-white shadow-sm' 
                  : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-4">
          {activeTab === 'Stock' && (
            <div>
              <h3 className="font-bold text-xs text-gray-900 mb-4">Stock by feed type</h3>
              {inventory.length === 0 ? (
                <div className="text-center py-16 space-y-3 bg-gray-50/50 rounded-2xl border border-dashed border-gray-200">
                  <div className="w-10 h-10 mx-auto bg-emerald-50 text-emerald-700 rounded-xl flex items-center justify-center">
                    <Package size={20} />
                  </div>
                  <h4 className="text-xs font-bold text-gray-800">No feed in store</h4>
                  <p className="text-[11px] text-gray-400 max-w-xs mx-auto">
                    Record a purchase to see your stock levels here.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {inventory.map(item => (
                    <div key={item.id} className="flex justify-between items-center p-4 bg-gray-50 rounded-xl text-xs">
                      <div>
                        <p className="font-bold text-gray-800">{item.feed_type}</p>
                        <p className="text-[10px] text-gray-400">Supplier: {item.supplier || 'General'}</p>
                      </div>
                      <div className="text-right">
                        <span className="font-extrabold text-emerald-700">{item.quantity_kg} kg</span>
                        <p className="text-[10px] text-gray-400">{item.bags_count} bags</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'Purchases' && (
            <div>
              <h3 className="font-bold text-xs text-gray-900 mb-4">Feed purchase history</h3>
              {inventory.length === 0 ? (
                <p className="text-xs text-gray-400">No purchases recorded yet.</p>
              ) : (
                <div className="space-y-3">
                  {inventory.map(p => (
                    <div key={p.id} className="flex justify-between items-center p-4 bg-gray-50 rounded-xl text-xs">
                      <div>
                        <p className="font-bold text-gray-800">{p.feed_type}</p>
                        <p className="text-[10px] text-gray-400">{p.purchase_date} • {p.supplier || 'No supplier'}</p>
                      </div>
                      <div className="text-right">
                        <span className="font-extrabold text-gray-900">KSh {Number(p.total_cost).toLocaleString()}</span>
                        <p className="text-[10px] text-emerald-600 font-semibold">{p.quantity_kg} kg ({p.bags_count} bags)</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'Issues' && (
            <div>
              <h3 className="font-bold text-xs text-gray-900 mb-4">Feed issued to flocks</h3>
              {issues.length === 0 ? (
                <p className="text-xs text-gray-400">No feed issued to batches yet.</p>
              ) : (
                <div className="space-y-3">
                  {issues.map(iss => (
                    <div key={iss.id} className="flex justify-between items-center p-4 bg-gray-50 rounded-xl text-xs">
                      <div>
                        <p className="font-bold text-gray-800">{iss.flocks?.name || 'Batch'}</p>
                        <p className="text-[10px] text-gray-400">{iss.issue_date} • Feed: {iss.feed_type}</p>
                      </div>
                      <span className="font-extrabold text-amber-600">-{iss.quantity_kg} kg</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Purchase Modal */}
        {isPurchaseModalOpen && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 space-y-6 shadow-xl my-8">
              <div className="flex justify-between items-center">
                <h2 className="font-extrabold text-lg text-gray-900">Purchase feed</h2>
                <button onClick={() => setIsPurchaseModalOpen(false)} className="p-2 text-gray-400 hover:text-gray-600 rounded-xl">
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handlePurchaseFeed} className="space-y-4 text-xs">
                <div className="space-y-1">
                  <label className="font-semibold text-gray-700">Feed type</label>
                  <select 
                    value={feedType}
                    onChange={(e) => setFeedType(e.target.value)}
                    className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl font-medium text-gray-800 focus:outline-none focus:border-emerald-600"
                  >
                    <option value="Starter Crumb">Starter Crumb</option>
                    <option value="Grower Mash">Grower Mash</option>
                    <option value="Finisher Pellets">Finisher Pellets</option>
                    <option value="Layers Mash">Layers Mash</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="font-semibold text-gray-700">Quantity (kg)</label>
                    <input 
                      type="number"
                      min="1"
                      value={quantityKg}
                      onChange={(e) => setQuantityKg(Number(e.target.value))}
                      className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl font-medium text-gray-800 focus:outline-none focus:border-emerald-600"
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-semibold text-gray-700">Bags count</label>
                    <input 
                      type="number"
                      min="1"
                      value={bagsCount}
                      onChange={(e) => setBagsCount(Number(e.target.value))}
                      className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl font-medium text-gray-800 focus:outline-none focus:border-emerald-600"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="font-semibold text-gray-700">Total cost (KSh)</label>
                    <input 
                      type="number"
                      min="0"
                      value={totalCost}
                      onChange={(e) => setTotalCost(Number(e.target.value))}
                      className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl font-medium text-gray-800 focus:outline-none focus:border-emerald-600"
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-semibold text-gray-700">Purchase date</label>
                    <input 
                      type="date"
                      value={purchaseDate}
                      onChange={(e) => setPurchaseDate(e.target.value)}
                      className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl font-medium text-gray-800 focus:outline-none focus:border-emerald-600"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-gray-700">Supplier</label>
                  <input 
                    type="text"
                    placeholder="e.g. Unga Feeds"
                    value={supplier}
                    onChange={(e) => setSupplier(e.target.value)}
                    className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl font-medium text-gray-800 focus:outline-none focus:border-emerald-600"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                  <button
                    type="button"
                    onClick={() => setIsPurchaseModalOpen(false)}
                    className="px-5 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-6 py-2.5 bg-[#163c29] hover:bg-emerald-900 text-white font-extrabold rounded-xl transition shadow-sm"
                  >
                    {loading ? 'Saving...' : 'Save purchase'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Issue Feed Modal */}
        {isIssueModalOpen && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 space-y-6 shadow-xl my-8">
              <div className="flex justify-between items-center">
                <h2 className="font-extrabold text-lg text-gray-900">Issue feed to batch</h2>
                <button onClick={() => setIsIssueModalOpen(false)} className="p-2 text-gray-400 hover:text-gray-600 rounded-xl">
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleIssueFeed} className="space-y-4 text-xs">
                <div className="space-y-1">
                  <label className="font-semibold text-gray-700">Select Batch</label>
                  <select 
                    value={selectedFlockId}
                    onChange={(e) => setSelectedFlockId(e.target.value)}
                    className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl font-medium text-gray-800 focus:outline-none focus:border-emerald-600"
                    required
                  >
                    {flocks.length === 0 ? (
                      <option value="">No batches available</option>
                    ) : (
                      flocks.map(f => (
                        <option key={f.id} value={f.id}>{f.name}</option>
                      ))
                    )}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-gray-700">Feed type</label>
                  <select 
                    value={issueFeedType}
                    onChange={(e) => setIssueFeedType(e.target.value)}
                    className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl font-medium text-gray-800 focus:outline-none focus:border-emerald-600"
                  >
                    <option value="Starter Crumb">Starter Crumb</option>
                    <option value="Grower Mash">Grower Mash</option>
                    <option value="Finisher Pellets">Finisher Pellets</option>
                    <option value="Layers Mash">Layers Mash</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="font-semibold text-gray-700">Quantity (kg)</label>
                    <input 
                      type="number"
                      min="1"
                      value={issueQuantityKg}
                      onChange={(e) => setIssueQuantityKg(Number(e.target.value))}
                      className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl font-medium text-gray-800 focus:outline-none focus:border-emerald-600"
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-semibold text-gray-700">Issue date</label>
                    <input 
                      type="date"
                      value={issueDate}
                      onChange={(e) => setIssueDate(e.target.value)}
                      className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl font-medium text-gray-800 focus:outline-none focus:border-emerald-600"
                      required
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                  <button
                    type="button"
                    onClick={() => setIsIssueModalOpen(false)}
                    className="px-5 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-6 py-2.5 bg-[#163c29] hover:bg-emerald-900 text-white font-extrabold rounded-xl transition shadow-sm"
                  >
                    {loading ? 'Issuing...' : 'Issue feed'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </SidebarLayout>
  )
}