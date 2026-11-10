'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import SidebarLayout from '@/components/SidebarLayout'
import { Plus, ShoppingBag, Users, Receipt, X, Calendar } from 'lucide-react'

interface SaleRecord {
  id: string
  customer_name: string
  product_category: string
  quantity: number
  unit_price: number
  total_amount: number
  amount_paid: number
  payment_status: 'Paid' | 'Partial' | 'Unpaid'
  sale_date: string
  notes: string
}

export default function SalesPage() {
  const router = useRouter()
  const [sales, setSales] = useState<SaleRecord[]>([])
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  // Form states for New Sale
  const [customerName, setCustomerName] = useState('')
  const [productCategory, setProductCategory] = useState('Eggs (Tray)')
  const [quantity, setQuantity] = useState(1)
  const [unitPrice, setUnitPrice] = useState(450)
  const [amountPaid, setAmountPaid] = useState(450)
  const [saleDate, setSaleDate] = useState(new Date().toISOString().split('T')[0])
  const [notes, setNotes] = useState('')

  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        router.push('/login')
        return
      }
      fetchSales()
    }
    checkSession()
  }, [router])

  const fetchSales = async () => {
    const { data, error } = await supabase.from('sales').select('*').order('sale_date', { ascending: false })
    if (data) {
      setSales(data)
    }
  }

  const handleCreateSale = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    const totalAmount = Number(quantity) * Number(unitPrice)
    const paid = Number(amountPaid)
    const paymentStatus = paid >= totalAmount ? 'Paid' : paid > 0 ? 'Partial' : 'Unpaid'

    const payload = {
      customer_name: customerName,
      product_category: productCategory,
      quantity: Number(quantity),
      unit_price: Number(unitPrice),
      total_amount: totalAmount,
      amount_paid: paid,
      payment_status: paymentStatus,
      sale_date: saleDate,
      notes
    }

    const { error } = await supabase.from('sales').insert([payload])

    if (error) {
      alert('Error recording sale: ' + error.message)
    } else {
      // Also log income into general transactions table if needed for financial reports
      await supabase.from('transactions').insert([{
        type: 'Income (+)',
        category: `Sale (${productCategory})`,
        amount: paid,
        transaction_date: saleDate,
        notes: `Customer: ${customerName || 'Walk-in'}`
      }])

      setIsModalOpen(false)
      fetchSales()
      // Reset form
      setCustomerName('')
      setQuantity(1)
      setUnitPrice(450)
      setAmountPaid(450)
      setNotes('')
    }
    setLoading(false)
  }

  // Calculations
  const totalSalesAmount = sales.reduce((sum, s) => sum + Number(s.total_amount || 0), 0)
  const totalCashReceived = sales.reduce((sum, s) => sum + Number(s.amount_paid || 0), 0)
  const totalOutstanding = totalSalesAmount - totalCashReceived

  // Extract unique customers
  const uniqueCustomers = Array.from(new Set(sales.map(s => s.customer_name).filter(Boolean)))

  return (
    <SidebarLayout>
      <div className="w-full space-y-6">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">Sales</h1>
            <p className="text-xs text-gray-500 font-medium mt-0.5">
              Birds, eggs, manure and other products — with what you were actually paid.
            </p>
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="bg-[#facc15] hover:bg-yellow-400 text-[#163c29] font-extrabold text-xs px-4 py-2.5 rounded-xl flex items-center gap-2 shadow-sm transition cursor-pointer"
          >
            <Plus size={16} /> New sale
          </button>
        </div>

        {/* 3 Summary Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-between">
            <div className="flex justify-between items-start">
              <span className="text-[10px] font-bold text-gray-400 tracking-wider uppercase">TOTAL SALES</span>
              <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
                <ShoppingBag size={16} />
              </div>
            </div>
            <div className="mt-4">
              <h3 className="text-2xl font-extrabold text-gray-900">KSh {totalSalesAmount.toLocaleString()}</h3>
              <p className="text-[11px] text-gray-400 font-medium mt-0.5">{sales.length} transactions</p>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-between">
            <div className="flex justify-between items-start">
              <span className="text-[10px] font-bold text-gray-400 tracking-wider uppercase">CASH RECEIVED</span>
              <div className="p-2 bg-emerald-50 text-emerald-700 rounded-xl">
                <Receipt size={16} />
              </div>
            </div>
            <div className="mt-4">
              <h3 className="text-2xl font-extrabold text-gray-900">KSh {totalCashReceived.toLocaleString()}</h3>
              <p className="text-[11px] text-gray-400 font-medium mt-0.5">Money actually collected</p>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-between">
            <div className="flex justify-between items-start">
              <span className="text-[10px] font-bold text-gray-400 tracking-wider uppercase">OUTSTANDING</span>
              <div className="p-2 bg-orange-50 text-orange-600 rounded-xl">
                <Users size={16} />
              </div>
            </div>
            <div className="mt-4">
              <h3 className="text-2xl font-extrabold text-gray-900">KSh {totalOutstanding.toLocaleString()}</h3>
              <p className="text-[11px] text-gray-400 font-medium mt-0.5">Unpaid customer balances</p>
            </div>
          </div>
        </div>

        {/* Sales History Section */}
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-4">
          <h2 className="font-bold text-sm text-gray-900">Sales history</h2>
          {sales.length === 0 ? (
            <div className="text-center py-16 space-y-3 bg-gray-50/50 rounded-2xl border border-dashed border-gray-200">
              <div className="w-10 h-10 mx-auto bg-emerald-50 text-emerald-700 rounded-xl flex items-center justify-center">
                <ShoppingBag size={20} />
              </div>
              <h3 className="text-xs font-bold text-gray-800">No sales recorded</h3>
              <p className="text-[11px] text-gray-400 max-w-xs mx-auto">
                Record your first sale to start tracking income and balances.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {sales.map(s => (
                <div key={s.id} className="flex justify-between items-center p-4 bg-gray-50 rounded-xl text-xs">
                  <div>
                    <p className="font-bold text-gray-800">{s.product_category} — <span className="text-emerald-700">{s.customer_name || 'Walk-in Customer'}</span></p>
                    <p className="text-[10px] text-gray-400">{s.sale_date} • Qty: {s.quantity} @ KSh {s.unit_price}</p>
                  </div>
                  <div className="text-right">
                    <span className="font-extrabold text-gray-900">KSh {Number(s.total_amount).toLocaleString()}</span>
                    <p className={`text-[10px] font-bold ${s.payment_status === 'Paid' ? 'text-emerald-600' : 'text-amber-600'}`}>
                      {s.payment_status} (Paid: KSh {s.amount_paid})
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Customers Section */}
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-4">
          <h2 className="font-bold text-sm text-gray-900">Customers</h2>
          {uniqueCustomers.length === 0 ? (
            <p className="text-xs text-gray-400">Customers appear here once you record a sale.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {uniqueCustomers.map((cust, idx) => (
                <div key={idx} className="p-3 bg-gray-50 rounded-xl border border-gray-100 text-xs font-bold text-gray-800 flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center text-xs">
                    {cust.charAt(0).toUpperCase()}
                  </div>
                  {cust}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* New Sale Modal */}
        {isModalOpen && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 space-y-6 shadow-xl my-8">
              <div className="flex justify-between items-center">
                <h2 className="font-extrabold text-lg text-gray-900">New sale</h2>
                <button onClick={() => setIsModalOpen(false)} className="p-2 text-gray-400 hover:text-gray-600 rounded-xl">
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleCreateSale} className="space-y-4 text-xs">
                <div className="space-y-1">
                  <label className="font-semibold text-gray-700">Customer name</label>
                  <input 
                    type="text"
                    placeholder="e.g. Mama Mboga / John"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl font-medium text-gray-800 focus:outline-none focus:border-emerald-600"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-gray-700">Product / category</label>
                  <select 
                    value={productCategory}
                    onChange={(e) => setProductCategory(e.target.value)}
                    className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl font-medium text-gray-800 focus:outline-none focus:border-emerald-600"
                  >
                    <option value="Eggs (Tray)">Eggs (Tray)</option>
                    <option value="Broiler Chicken">Broiler Chicken</option>
                    <option value="Spent Layers">Spent Layers</option>
                    <option value="Manure (Bags)">Manure (Bags)</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="font-semibold text-gray-700">Quantity</label>
                    <input 
                      type="number"
                      min="1"
                      value={quantity}
                      onChange={(e) => setQuantity(Number(e.target.value))}
                      className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl font-medium text-gray-800 focus:outline-none focus:border-emerald-600"
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-semibold text-gray-700">Unit price (KSh)</label>
                    <input 
                      type="number"
                      min="0"
                      value={unitPrice}
                      onChange={(e) => setUnitPrice(Number(e.target.value))}
                      className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl font-medium text-gray-800 focus:outline-none focus:border-emerald-600"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="font-semibold text-gray-700">Amount paid (KSh)</label>
                    <input 
                      type="number"
                      min="0"
                      value={amountPaid}
                      onChange={(e) => setAmountPaid(Number(e.target.value))}
                      className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl font-medium text-gray-800 focus:outline-none focus:border-emerald-600"
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-semibold text-gray-700">Sale date</label>
                    <input 
                      type="date"
                      value={saleDate}
                      onChange={(e) => setSaleDate(e.target.value)}
                      className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl font-medium text-gray-800 focus:outline-none focus:border-emerald-600"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-gray-700">Notes</label>
                  <textarea 
                    rows={2}
                    placeholder="Optional notes about delivery or balance"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl font-medium text-gray-800 focus:outline-none focus:border-emerald-600 resize-none"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-5 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-6 py-2.5 bg-[#163c29] hover:bg-emerald-900 text-white font-extrabold rounded-xl transition shadow-sm"
                  >
                    {loading ? 'Saving...' : 'Save sale'}
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