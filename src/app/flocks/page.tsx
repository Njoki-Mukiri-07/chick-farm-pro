'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import SidebarLayout from '@/components/SidebarLayout'
import { Plus, Search, Bird, Calendar, X, Tag, Home as HomeIcon } from 'lucide-react'

interface Flock {
  id: string
  name: string
  batch_code: string
  bird_type: string
  breed: string
  supplier: string
  housing: string
  arrival_date: string
  initial_count: number
  current_count: number
  age_on_arrival: number
  purchase_cost: number
  status: string
  notes: string
}

export default function FlocksPage() {
  const router = useRouter()
  const [flocks, setFlocks] = useState<Flock[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [activeTab, setActiveTab] = useState<'Active' | 'Archived' | 'All'>('Active')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  // Form states for New Batch
  const [name, setName] = useState('')
  const [batchCode, setBatchCode] = useState('')
  const [birdType, setBirdType] = useState('Broilers')
  const [breed, setBreed] = useState('')
  const [supplier, setSupplier] = useState('')
  const [housing, setHousing] = useState('')
  const [arrivalDate, setArrivalDate] = useState(new Date().toISOString().split('T')[0])
  const [birdsReceived, setBirdsReceived] = useState(100)
  const [ageOnArrival, setAgeOnArrival] = useState(0)
  const [purchaseCost, setPurchaseCost] = useState(0)
  const [status, setStatus] = useState('Active')
  const [notes, setNotes] = useState('')

  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        router.push('/login')
        return
      }
      fetchFlocks()
    }
    checkSession()
  }, [router])

  const fetchFlocks = async () => {
    const { data, error } = await supabase.from('flocks').select('*').order('created_at', { ascending: false })
    if (data) {
      setFlocks(data)
    }
  }

  const handleCreateBatch = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    const payload = {
      name,
      batch_code: batchCode,
      bird_type: birdType,
      breed,
      supplier,
      housing,
      arrival_date: arrivalDate,
      initial_count: Number(birdsReceived),
      current_count: Number(birdsReceived),
      age_on_arrival: Number(ageOnArrival),
      purchase_cost: Number(purchaseCost),
      status,
      notes
    }

    const { error } = await supabase.from('flocks').insert([payload])

    if (error) {
      alert('Error creating batch: ' + error.message)
    } else {
      setIsModalOpen(false)
      fetchFlocks()
      // Reset form
      setName('')
      setBatchCode('')
      setBreed('')
      setSupplier('')
      setHousing('')
      setBirdsReceived(100)
      setPurchaseCost(0)
      setNotes('')
    }
    setLoading(false)
  }

  // Filter flocks based on tab and search query
  const filteredFlocks = flocks.filter(f => {
    const matchesTab = 
      activeTab === 'All' ? true : 
      activeTab === 'Active' ? f.status === 'Active' : f.status === 'Archived'
    
    const matchesSearch = 
      f.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.breed.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (f.batch_code && f.batch_code.toLowerCase().includes(searchQuery.toLowerCase()))

    return matchesTab && matchesSearch
  })

  return (
    <SidebarLayout>
      <div className="w-full space-y-6">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">Flocks</h1>
            <p className="text-xs text-gray-500 font-medium mt-0.5">
              Every batch on your farm, with live bird counts and age.
            </p>
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="bg-[#facc15] hover:bg-yellow-400 text-[#163c29] font-extrabold text-xs px-4 py-2.5 rounded-xl flex items-center gap-2 shadow-sm transition cursor-pointer"
          >
            <Plus size={16} /> New batch
          </button>
        </div>

        {/* Search and Tabs Bar */}
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
          <div className="relative w-full sm:w-96">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
              <Search size={16} />
            </span>
            <input 
              type="text"
              placeholder="Search batches"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium text-gray-800 focus:outline-none focus:border-emerald-600"
            />
          </div>

          <div className="flex items-center gap-1 bg-gray-50 p-1 rounded-xl border border-gray-200/60 w-full sm:w-auto justify-center">
            {(['Active', 'Archived', 'All'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-1.5 rounded-lg text-xs font-bold transition ${
                  activeTab === tab 
                    ? 'bg-[#163c29] text-white shadow-sm' 
                    : 'text-gray-500 hover:text-gray-900'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        {/* Flocks Grid or Empty State */}
        {filteredFlocks.length === 0 ? (
          <div className="bg-white rounded-2xl border border-dashed border-gray-200 p-16 text-center space-y-4">
            <div className="w-12 h-12 mx-auto bg-emerald-50 text-emerald-700 rounded-2xl flex items-center justify-center">
              <Bird size={24} />
            </div>
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-gray-900">No batches yet</h3>
              <p className="text-xs text-gray-400 max-w-sm mx-auto">
                Create your first batch to start tracking birds, feed and production.
              </p>
            </div>
            <button
              onClick={() => setIsModalOpen(true)}
              className="inline-flex items-center gap-2 bg-[#163c29] hover:bg-emerald-900 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-sm transition"
            >
              <Plus size={14} /> New batch
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredFlocks.map(f => (
              <div key={f.id} className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm space-y-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-extrabold text-sm text-gray-900">{f.name}</h3>
                    <p className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold mt-0.5">
                      {f.breed} • {f.bird_type}
                    </p>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    f.status === 'Active' ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-100 text-gray-600'
                  }`}>
                    {f.status}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-3 border-t border-gray-100 text-xs">
                  <div>
                    <p className="text-gray-400 text-[10px] uppercase font-semibold">Live Birds</p>
                    <p className="font-extrabold text-gray-900 text-base">{f.current_count}</p>
                  </div>
                  <div>
                    <p className="text-gray-400 text-[10px] uppercase font-semibold">Initial Count</p>
                    <p className="font-bold text-gray-700 text-base">{f.initial_count}</p>
                  </div>
                </div>

                <div className="pt-2 text-[11px] text-gray-500 space-y-1">
                  {f.housing && <div className="flex items-center gap-1.5"><HomeIcon size={13} className="text-gray-400" /> {f.housing}</div>}
                  {f.batch_code && <div className="flex items-center gap-1.5"><Tag size={13} className="text-gray-400" /> Code: {f.batch_code}</div>}
                  <div className="flex items-center gap-1.5"><Calendar size={13} className="text-gray-400" /> Arrived: {f.arrival_date}</div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* New Batch Modal */}
        {isModalOpen && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 space-y-6 shadow-xl my-8">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="font-extrabold text-lg text-gray-900">New batch</h2>
                  <p className="text-xs text-gray-400">Batches group the birds you keep together in one house.</p>
                </div>
                <button 
                  onClick={() => setIsModalOpen(false)}
                  className="p-2 text-gray-400 hover:text-gray-600 rounded-xl"
                >
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleCreateBatch} className="space-y-4 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="font-semibold text-gray-700">Batch name</label>
                    <input 
                      type="text"
                      placeholder="e.g. Layers Batch 3"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl font-medium text-gray-800 focus:outline-none focus:border-emerald-600"
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-semibold text-gray-700">Batch code</label>
                    <input 
                      type="text"
                      placeholder="e.g. LY-003"
                      value={batchCode}
                      onChange={(e) => setBatchCode(e.target.value)}
                      className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl font-medium text-gray-800 focus:outline-none focus:border-emerald-600"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="font-semibold text-gray-700">Bird type</label>
                    <select 
                      value={birdType}
                      onChange={(e) => setBirdType(e.target.value)}
                      className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl font-medium text-gray-800 focus:outline-none focus:border-emerald-600"
                    >
                      <option value="Broilers">Broilers</option>
                      <option value="Layers">Layers</option>
                      <option value="Improved Kienyeji">Improved Kienyeji</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="font-semibold text-gray-700">Breed / strain</label>
                    <input 
                      type="text"
                      placeholder="e.g. Kenbro"
                      value={breed}
                      onChange={(e) => setBreed(e.target.value)}
                      className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl font-medium text-gray-800 focus:outline-none focus:border-emerald-600"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="font-semibold text-gray-700">Supplier</label>
                    <input 
                      type="text"
                      placeholder="Hatchery or supplier"
                      value={supplier}
                      onChange={(e) => setSupplier(e.target.value)}
                      className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl font-medium text-gray-800 focus:outline-none focus:border-emerald-600"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-semibold text-gray-700">Housing / house</label>
                    <input 
                      type="text"
                      placeholder="e.g. House B"
                      value={housing}
                      onChange={(e) => setHousing(e.target.value)}
                      className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl font-medium text-gray-800 focus:outline-none focus:border-emerald-600"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="font-semibold text-gray-700">Arrival date</label>
                    <input 
                      type="date"
                      value={arrivalDate}
                      onChange={(e) => setArrivalDate(e.target.value)}
                      className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl font-medium text-gray-800 focus:outline-none focus:border-emerald-600"
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-semibold text-gray-700">Birds received</label>
                    <input 
                      type="number"
                      min="1"
                      value={birdsReceived}
                      onChange={(e) => setBirdsReceived(Number(e.target.value))}
                      className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl font-medium text-gray-800 focus:outline-none focus:border-emerald-600"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="font-semibold text-gray-700">Age on arrival (days)</label>
                    <input 
                      type="number"
                      min="0"
                      value={ageOnArrival}
                      onChange={(e) => setAgeOnArrival(Number(e.target.value))}
                      className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl font-medium text-gray-800 focus:outline-none focus:border-emerald-600"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-semibold text-gray-700">Purchase cost (KSh)</label>
                    <input 
                      type="number"
                      min="0"
                      value={purchaseCost}
                      onChange={(e) => setPurchaseCost(Number(e.target.value))}
                      className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl font-medium text-gray-800 focus:outline-none focus:border-emerald-600"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-gray-700">Status</label>
                  <select 
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl font-medium text-gray-800 focus:outline-none focus:border-emerald-600"
                  >
                    <option value="Active">Active</option>
                    <option value="Archived">Archived</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-gray-700">Notes</label>
                  <textarea 
                    rows={2}
                    placeholder="Anything worth remembering about this batch"
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
                    {loading ? 'Creating...' : 'Create batch'}
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