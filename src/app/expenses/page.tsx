'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import SidebarLayout from '@/components/SidebarLayout'
import { Plus, Receipt, TrendingDown, Layers, X, Calendar } from 'lucide-react'

interface ExpenseRecord {
  id: string
  expense_date: string
  category: string
  description: string
  amount: number
  supplier_payee: string
  batch_id: string | null
  notes: string
  flocks?: { name: string }
}

interface Flock {
  id: string
  name: string
}

export default function ExpensesPage() {
  const router = useRouter()
  const [expenses, setExpenses] = useState<ExpenseRecord[]>([])
  const [flocks, setFlocks] = useState<Flock[]>([])
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  // Form states for New Expense
  const [expenseDate, setExpenseDate] = useState(new Date().toISOString().split('T')[0])
  const [category, setCategory] = useState('Vaccines & Medication')
  const [description, setDescription] = useState('')
  const [amount, setAmount] = useState(1000)
  const [supplierPayee, setSupplierPayee] = useState('')
  const [batchId, setBatchId] = useState<string>('farm-wide')
  const [notes, setNotes] = useState('')

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
    // Fetch expenses with linked flock name if any
    const { data: expData } = await supabase
      .from('transactions')
      .select('*, flocks(name)')
      .eq('type', 'Expense (-)')
      .order('transaction_date', { ascending: false })

    if (expData) {
      // Map transaction fields to match expense interface seamlessly
      const mapped = expData.map(t => ({
        id: t.id,
        expense_date: t.transaction_date,
        category: t.category,
        description: t.notes || t.category,
        amount: Number(t.amount),
        supplier_payee: t.supplier_payee || 'General Supplier',
        batch_id: t.batch_id,
        notes: t.notes,
        flocks: t.flocks
      }))
      setExpenses(mapped)
    }

    // Fetch flocks for allocation dropdown
    const { data: flocksData } = await supabase.from('flocks').select('id, name')
    if (flocksData) setFlocks(flocksData)
  }

  const handleCreateExpense = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    const payload = {
      type: 'Expense (-)',
      category,
      amount: Number(amount),
      transaction_date: expenseDate,
      supplier_payee: supplierPayee,
      batch_id: batchId === 'farm-wide' ? null : batchId,
      notes: description || notes
    }

    const { error } = await supabase.from('transactions').insert([payload])

    if (error) {
      alert('Error recording expense: ' + error.message)
    } else {
      setIsModalOpen(false)
      fetchData()
      // Reset form
      setDescription('')
      setAmount(1000)
      setSupplierPayee('')
      setBatchId('farm-wide')
      setNotes('')
    }
    setLoading(false)
  }

  // Calculations
  const totalSpent = expenses.reduce((sum, e) => sum + e.amount, 0)

  // Find largest category
  const categoryTotals: Record<string, number> = {}
  expenses.forEach(e => {
    categoryTotals[e.category] = (categoryTotals[e.category] || 0) + e.amount
  })
  const sortedCategories = Object.entries(categoryTotals).sort((a, b) => b[1] - a[1])
  const largestCategory = sortedCategories.length > 0 ? sortedCategories[0][0] : '—'
  const largestCategoryAmount = sortedCategories.length > 0 ? sortedCategories[0][1] : 0

  return (
    <SidebarLayout>
      <div className="w-full space-y-6">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">Expenses</h1>
            <p className="text-xs text-gray-500 font-medium mt-0.5">
              Every shilling spent on the farm, by category and batch.
            </p>
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="bg-[#facc15] hover:bg-yellow-400 text-[#163c29] font-extrabold text-xs px-4 py-2.5 rounded-xl flex items-center gap-2 shadow-sm transition cursor-pointer"
          >
            <Plus size={16} /> New expense
          </button>
        </div>

        {/* 3 Summary Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-between">
            <div className="flex justify-between items-start">
              <span className="text-[10px] font-bold text-gray-400 tracking-wider uppercase">TOTAL SPENT</span>
              <div className="p-2 bg-orange-50 text-orange-600 rounded-xl">
                <Receipt size={16} />
              </div>
            </div>
            <div className="mt-4">
              <h3 className="text-2xl font-extrabold text-gray-900">KSh {totalSpent.toLocaleString()}</h3>
              <p className="text-[11px] text-gray-400 font-medium mt-0.5">{expenses.length} entries</p>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-between">
            <div className="flex justify-between items-start">
              <span className="text-[10px] font-bold text-gray-400 tracking-wider uppercase">LARGEST CATEGORY</span>
              <div className="p-2 bg-emerald-50 text-emerald-700 rounded-xl">
                <TrendingDown size={16} />
              </div>
            </div>
            <div className="mt-4">
              <h3 className="text-lg font-extrabold text-gray-900 truncate">{largestCategory}</h3>
              <p className="text-[11px] text-gray-400 font-medium mt-0.5">
                {largestCategoryAmount > 0 ? `KSh ${largestCategoryAmount.toLocaleString()}` : 'No expenses yet'}
              </p>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-between">
            <div className="flex justify-between items-start">
              <span className="text-[10px] font-bold text-gray-400 tracking-wider uppercase">TOP CATEGORIES</span>
              <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
                <Layers size={16} />
              </div>
            </div>
            <div className="mt-4">
              <h3 className="text-xl font-extrabold text-gray-900">{sortedCategories.length} Categories</h3>
              <p className="text-[11px] text-gray-400 font-medium mt-0.5">Active expense streams</p>
            </div>
          </div>
        </div>

        {/* Expenses History Section */}
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-4">
          <h2 className="font-bold text-sm text-gray-900">All expenses</h2>
          {expenses.length === 0 ? (
            <div className="text-center py-16 space-y-3 bg-gray-50/50 rounded-2xl border border-dashed border-gray-200">
              <div className="w-10 h-10 mx-auto bg-orange-50 text-orange-600 rounded-xl flex items-center justify-center">
                <Receipt size={20} />
              </div>
              <h3 className="text-xs font-bold text-gray-800">No expenses yet</h3>
              <p className="text-[11px] text-gray-400 max-w-xs mx-auto">
                Record chicks, feed, labour and other farm costs to see your true profit.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {expenses.map(e => (
                <div key={e.id} className="flex justify-between items-center p-4 bg-gray-50 rounded-xl text-xs">
                  <div>
                    <p className="font-bold text-gray-800">{e.category} — <span className="text-gray-500 font-medium">{e.description}</span></p>
                    <p className="text-[10px] text-gray-400">{e.expense_date} • Paid to: {e.supplier_payee}</p>
                  </div>
                  <div className="text-right">
                    <span className="font-extrabold text-amber-600">-KSh {e.amount.toLocaleString()}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* New Expense Modal */}
        {isModalOpen && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 space-y-6 shadow-xl my-8">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="font-extrabold text-lg text-gray-900">New expense</h2>
                  <p className="text-xs text-gray-400">Money going out of the farm.</p>
                </div>
                <button onClick={() => setIsModalOpen(false)} className="p-2 text-gray-400 hover:text-gray-600 rounded-xl">
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleCreateExpense} className="space-y-4 text-xs">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="font-semibold text-gray-700">Date</label>
                    <input 
                      type="date"
                      value={expenseDate}
                      onChange={(e) => setExpenseDate(e.target.value)}
                      className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl font-medium text-gray-800 focus:outline-none focus:border-emerald-600"
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-semibold text-gray-700">Category</label>
                    <select 
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl font-medium text-gray-800 focus:outline-none focus:border-emerald-600"
                    >
                      <option value="Vaccines & Medication">Vaccines & Medication</option>
                      <option value="Feed Purchase">Feed Purchase</option>
                      <option value="Labor & Wages">Labor & Wages</option>
                      <option value="Utility / Power">Utility / Power</option>
                      <option value="Transport & Logistics">Transport & Logistics</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-gray-700">Description</label>
                  <input 
                    type="text"
                    placeholder="e.g. Vaccines for Layers batch"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl font-medium text-gray-800 focus:outline-none focus:border-emerald-600"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="font-semibold text-gray-700">Amount (KSh)</label>
                    <input 
                      type="number"
                      min="0"
                      value={amount}
                      onChange={(e) => setAmount(Number(e.target.value))}
                      className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl font-medium text-gray-800 focus:outline-none focus:border-emerald-600"
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-semibold text-gray-700">Supplier / payee</label>
                    <input 
                      type="text"
                      placeholder="Who was paid"
                      value={supplierPayee}
                      onChange={(e) => setSupplierPayee(e.target.value)}
                      className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl font-medium text-gray-800 focus:outline-none focus:border-emerald-600"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-gray-700">Allocate to batch (optional)</label>
                  <select 
                    value={batchId}
                    onChange={(e) => setBatchId(e.target.value)}
                    className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl font-medium text-gray-800 focus:outline-none focus:border-emerald-600"
                  >
                    <option value="farm-wide">Farm-wide</option>
                    {flocks.map(f => (
                      <option key={f.id} value={f.id}>{f.name}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-gray-700">Notes</label>
                  <textarea 
                    rows={2}
                    placeholder="Additional notes"
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
                    {loading ? 'Saving...' : 'Save expense'}
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