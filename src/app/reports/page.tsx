'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import SidebarLayout from '@/components/SidebarLayout'
import { Printer, FileText } from 'lucide-react'

interface Transaction {
  id: string
  type: string
  category: string
  amount: number
  created_at: string
}

interface Flock {
  id: string
  name: string
  breed: string
  initial_count: number
  current_count: number
}

interface DailyRecord {
  flock_id: string
  eggs_collected: number
  mortality_count: number
  feed_consumed_kg: number
}

export default function ReportsPage() {
  const router = useRouter()
  const [totalSales, setTotalSales] = useState(0)
  const [cashReceived, setCashReceived] = useState(0)
  const [totalExpenses, setTotalExpenses] = useState(0)
  const [flocks, setFlocks] = useState<Flock[]>([])
  const [records, setRecords] = useState<DailyRecord[]>([])
  const [loading, setLoading] = useState(true)

  // Date filters default to current month
  const [fromDate, setFromDate] = useState('2026-11-01')
  const [toDate, setToDate] = useState('2026-11-09')

  useEffect(() => {
    const fetchReportData = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        router.push('/login')
        return
      }

      // 1. Fetch Transactions
      const { data: txData } = await supabase.from('transactions').select('*')
      if (txData) {
        const sales = txData.filter(t => t.type === 'Income (+)').reduce((sum, t) => sum + Number(t.amount), 0)
        const expenses = txData.filter(t => t.type === 'Expense (-)').reduce((sum, t) => sum + Number(t.amount), 0)
        setTotalSales(sales)
        setCashReceived(sales) // Assuming fully paid for now
        setTotalExpenses(expenses)
      }

      // 2. Fetch Flocks
      const { data: flocksData } = await supabase.from('flocks').select('*')
      if (flocksData) {
        setFlocks(flocksData)
      }

      // 3. Fetch Daily Records
      const { data: recData } = await supabase.from('daily_records').select('*')
      if (recData) {
        setRecords(recData)
      }

      setLoading(false)
    }

    fetchReportData()
  }, [router])

  const netProfit = totalSales - totalExpenses

  // Zoho-Style Professional PDF Report Generator
  const handleExportPDF = () => {
    const printWindow = window.open('', '_blank')
    if (!printWindow) return

    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Chick Farm Pro - Financial & Performance Report</title>
          <style>
            body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; color: #1f2937; margin: 0; padding: 40px; background: #fff; }
            .header { display: flex; justify-content: space-between; border-bottom: 2px solid #163c29; padding-bottom: 20px; margin-bottom: 30px; }
            .logo { font-size: 24px; font-weight: 900; color: #163c29; }
            .subtitle { font-size: 11px; color: #6b7280; text-transform: uppercase; letter-spacing: 1px; margin-top: 4px; }
            .meta { text-align: right; font-size: 12px; color: #4b5563; }
            .grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 15px; margin-bottom: 30px; }
            .card { background: #f9fafb; border: 1px solid #e5e7eb; padding: 15px; border-radius: 8px; }
            .card-title { font-size: 10px; font-weight: bold; color: #6b7280; text-transform: uppercase; }
            .card-value { font-size: 18px; font-weight: 800; color: #111827; margin-top: 5px; }
            table { width: 100%; border-collapse: collapse; margin-top: 15px; margin-bottom: 30px; font-size: 12px; }
            th { background: #163c29; color: white; text-align: left; padding: 10px; font-size: 11px; text-transform: uppercase; }
            td { padding: 10px; border-bottom: 1px solid #e5e7eb; color: #374151; }
            .section-title { font-size: 14px; font-weight: bold; color: #163c29; margin-top: 30px; margin-bottom: 10px; border-bottom: 1px solid #e5e7eb; padding-bottom: 5px; }
            .footer { text-align: center; font-size: 10px; color: #9ca3af; margin-top: 50px; border-top: 1px solid #e5e7eb; padding-top: 15px; }
          </style>
        </head>
        <body>
          <div class="header">
            <div>
              <div class="logo">🐔 Chick Farm Pro</div>
              <div class="subtitle">Manage • Grow • Profit | Official Financial Report</div>
            </div>
            <div class="meta">
              <strong>Generated on:</strong> ${new Date().toLocaleDateString('en-GB')}<br/>
              <strong>Period:</strong> ${fromDate} to ${toDate}
            </div>
          </div>

          <div class="grid">
            <div class="card">
              <div class="card-title">Total Sales</div>
              <div class="card-value">KSh ${totalSales.toLocaleString()}</div>
            </div>
            <div class="card">
              <div class="card-title">Cash Received</div>
              <div class="card-value">KSh ${cashReceived.toLocaleString()}</div>
            </div>
            <div class="card">
              <div class="card-title">Total Expenses</div>
              <div class="card-value">KSh ${totalExpenses.toLocaleString()}</div>
            </div>
            <div class="card">
              <div class="card-title">Net Profit</div>
              <div class="card-value" style="color: ${netProfit >= 0 ? '#059669' : '#dc2626'};">KSh ${netProfit.toLocaleString()}</div>
            </div>
          </div>

          <div class="section-title">Batch Profitability & Flock Performance</div>
          <table>
            <thead>
              <tr>
                <th>Batch Name</th>
                <th>Breed</th>
                <th>Birds</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              ${flocks.length === 0 ? '<tr><td colspan="4" style="text-align: center;">No active batches recorded.</td></tr>' : 
                flocks.map(f => `
                  <tr>
                    <td><b>${f.name}</b></td>
                    <td>${f.breed}</td>
                    <td>${f.current_count}</td>
                    <td style="color: #059669; font-weight: bold;">Active</td>
                  </tr>
                `).join('')}
            </tbody>
          </table>

          <div class="footer">
            Chick Farm Pro • Zero-Cost Enterprise Poultry Management System • Zoho-Grade Financial Summary
          </div>
        </body>
      </html>
    `

    printWindow.document.write(htmlContent)
    printWindow.document.close()
    printWindow.focus()
    setTimeout(() => {
      printWindow.print()
    }, 500)
  }

  const handlePrint = () => {
    window.print()
  }

  return (
    <SidebarLayout>
      <div className="space-y-6 max-w-7xl mx-auto w-full">
        {/* Header Title & Top Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Reports</h1>
            <p className="text-xs text-gray-500">Revenue, cash actually received, costs and flock performance.</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 rounded-xl text-xs font-bold shadow-sm transition"
            >
              <Printer size={14} /> Print
            </button>
            <button
              onClick={handleExportPDF}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-[#163c29] hover:bg-emerald-900 text-white rounded-xl text-xs font-bold shadow-sm transition"
            >
              <FileText size={14} /> Export PDF
            </button>
          </div>
        </div>

        {/* Date Filter Bar */}
        <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">From</label>
              <input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold text-gray-700 outline-none"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">To</label>
              <input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold text-gray-700 outline-none"
              />
            </div>
          </div>
          <div className="text-xs font-semibold text-gray-500 bg-gray-50 px-3 py-2 rounded-xl border border-gray-100">
            📅 Nov 2026 — Today
          </div>
        </div>

        {/* 4 Top Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">TOTAL SALES</span>
            <h3 className="text-2xl font-extrabold text-gray-900 mt-2">KSh {totalSales.toLocaleString()}</h3>
            <p className="text-[11px] text-gray-400 mt-0.5">Value of goods sold</p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">CASH RECEIVED</span>
            <h3 className="text-2xl font-extrabold text-gray-900 mt-2">KSh {cashReceived.toLocaleString()}</h3>
            <p className="text-[11px] text-gray-400 mt-0.5">Actually paid</p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">OUTSTANDING</span>
            <h3 className="text-2xl font-extrabold text-gray-900 mt-2">KSh 0</h3>
            <p className="text-[11px] text-gray-400 mt-0.5">Still owed by customers</p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">PROFIT</span>
            <h3 className="text-2xl font-extrabold text-gray-900 mt-2">KSh {netProfit.toLocaleString()}</h3>
            <p className="text-[11px] text-gray-400 mt-0.5">Expenses KSh {totalExpenses.toLocaleString()}</p>
          </div>
        </div>

        {/* Income vs Expenses Chart Placeholder Card */}
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-4">
          <h3 className="font-bold text-gray-900 text-sm">Income vs expenses</h3>
          <div className="h-48 flex items-end justify-between px-6 pt-6 border-b border-gray-100 pb-2">
            <div className="text-center w-full text-xs text-gray-400">
              <div className="h-32 flex items-center justify-center border border-dashed border-gray-200 rounded-xl bg-gray-50">
                Chart visual active once weekly transactions are logged
              </div>
            </div>
          </div>
          <div className="flex items-center gap-6 text-xs font-semibold text-gray-600 justify-center">
            <span className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-[#163c29]"></span> Income</span>
            <span className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-amber-500"></span> Expenses</span>
          </div>
        </div>

        {/* Batch Profitability Table */}
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="font-bold text-gray-900 text-sm">Batch profitability</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-gray-100 text-gray-400 font-bold uppercase text-[10px]">
                  <th className="pb-3">Batch</th>
                  <th className="pb-3">Birds</th>
                  <th className="pb-3">Sales</th>
                  <th className="pb-3">Costs</th>
                  <th className="pb-3 text-right">Net</th>
                </tr>
              </thead>
              <tbody>
                {flocks.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-6 text-center text-gray-400">No active batches recorded yet.</td>
                  </tr>
                ) : (
                  flocks.map(f => (
                    <tr key={f.id} className="border-b border-gray-50">
                      <td className="py-3 font-bold text-gray-800">{f.name} ({f.breed})</td>
                      <td className="py-3 text-gray-600">{f.current_count}</td>
                      <td className="py-3 text-emerald-600 font-bold">KSh 0</td>
                      <td className="py-3 text-amber-600 font-bold">KSh 0</td>
                      <td className="py-3 text-right font-extrabold text-gray-900">KSh 0</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Mortality & Egg Production Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Mortality */}
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-4">
            <h3 className="font-bold text-gray-900 text-sm">Mortality</h3>
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-gray-100 text-gray-400 font-bold uppercase text-[10px]">
                  <th className="pb-2">Batch</th>
                  <th className="pb-2">Start</th>
                  <th className="pb-2">Lost</th>
                  <th className="pb-2">Alive</th>
                  <th className="pb-2 text-right">Rate</th>
                </tr>
              </thead>
              <tbody>
                {flocks.length === 0 ? (
                  <tr><td colSpan={5} className="py-4 text-center text-gray-400">No batches registered.</td></tr>
                ) : (
                  flocks.map(f => {
                    const lost = f.initial_count - f.current_count
                    const rate = f.initial_count > 0 ? ((lost / f.initial_count) * 100).toFixed(1) : '0'
                    return (
                      <tr key={f.id} className="border-b border-gray-50">
                        <td className="py-2.5 font-bold text-gray-800">{f.name}</td>
                        <td className="py-2.5 text-gray-600">{f.initial_count}</td>
                        <td className="py-2.5 text-red-600 font-bold">{lost}</td>
                        <td className="py-2.5 text-gray-800 font-bold">{f.current_count}</td>
                        <td className="py-2.5 text-right font-bold text-gray-600">{rate}%</td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Egg Production */}
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-4">
            <h3 className="font-bold text-gray-900 text-sm">Egg production</h3>
            {records.length === 0 ? (
              <p className="text-xs text-gray-400 py-4">No layer batches or daily egg records yet.</p>
            ) : (
              <p className="text-xs text-emerald-700 font-semibold py-4">Egg records active and logging properly.</p>
            )}
          </div>
        </div>
      </div>
    </SidebarLayout>
  )
}