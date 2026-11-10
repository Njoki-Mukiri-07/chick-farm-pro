'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import SidebarLayout from '@/components/SidebarLayout'
import { ClipboardList, Calendar, CheckCircle2 } from 'lucide-react'

interface Flock {
  id: string
  name: string
  breed: string
  current_count: number
}

interface DailyRecord {
  id: string
  flock_id: string
  record_date: string
  opening_birds: number
  deaths: number
  culls: number
  sold_removed: number
  eggs_collected: number
  feed_used_kg: number
  water_litres: number
  health_observations: string
  vaccinations: string
  closing_birds: number
  flocks?: { name: string }
}

export default function RecordsPage() {
  const router = useRouter()
  const [flocks, setFlocks] = useState<Flock[]>([])
  const [records, setRecords] = useState<DailyRecord[]>([])
  
  // Form states
  const [selectedFlockId, setSelectedFlockId] = useState('')
  const [recordDate, setRecordDate] = useState(new Date().toISOString().split('T')[0])
  const [openingBirds, setOpeningBirds] = useState(0)
  const [deaths, setDeaths] = useState(0)
  const [culls, setCulls] = useState(0)
  const [soldRemoved, setSoldRemoved] = useState(0)
  const [eggsCollected, setEggsCollected] = useState(0)
  const [feedUsedKg, setFeedUsedKg] = useState(0)
  const [waterLitres, setWaterLitres] = useState(0)
  const [healthObservations, setHealthObservations] = useState('')
  const [vaccinations, setVaccinations] = useState('')
  const [loading, setLoading] = useState(false)
  const [successMsg, setSuccessMsg] = useState('')

  useEffect(() => {
    const fetchData = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        router.push('/login')
        return
      }

      // Fetch flocks
      const { data: flocksData } = await supabase.from('flocks').select('*')
      if (flocksData) {
        setFlocks(flocksData)
        if (flocksData.length > 0) {
          setSelectedFlockId(flocksData[0].id)
          setOpeningBirds(flocksData[0].current_count || 0)
        }
      }

      // Fetch existing records
      fetchRecords()
    }

    fetchData()
  }, [router])

  const fetchRecords = async () => {
    const { data } = await supabase
      .from('daily_records')
      .select('*, flocks(name)')
      .order('record_date', { ascending: false })
    if (data) {
      setRecords(data)
    }
  }

  // Handle flock change to update opening birds automatically
  const handleFlockChange = (id: string) => {
    setSelectedFlockId(id)
    const flock = flocks.find(f => f.id === id)
    if (flock) {
      setOpeningBirds(flock.current_count || 0)
    }
  }

  // Calculate closing birds dynamically
  const closingBirds = openingBirds - (Number(deaths) + Number(culls) + Number(soldRemoved))

  const handleSaveRecord = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedFlockId) {
      alert('Please select a batch first.')
      return
    }

    setLoading(true)
    setSuccessMsg('')

    const payload = {
      flock_id: selectedFlockId,
      record_date: recordDate,
      opening_birds: Number(openingBirds),
      deaths: Number(deaths),
      culls: Number(culls),
      sold_removed: Number(soldRemoved),
      eggs_collected: Number(eggsCollected),
      feed_used_kg: Number(feedUsedKg),
      water_litres: Number(waterLitres),
      health_observations: healthObservations,
      vaccinations: vaccinations,
      closing_birds: closingBirds
    }

    const { error } = await supabase.from('daily_records').insert([payload])

    if (error) {
      alert('Error saving record: ' + error.message)
    } else {
      // Also update flock current count
      await supabase
        .from('flocks')
        .update({ current_count: closingBirds })
        .eq('id', selectedFlockId)

      setSuccessMsg('Record saved successfully!')
      fetchRecords()
      
      // Reset numeric fields
      setDeaths(0)
      setCulls(0)
      setSoldRemoved(0)
      setEggsCollected(0)
      setFeedUsedKg(0)
      setWaterLitres(0)
      setHealthObservations('')
      setVaccinations('')
    }
    setLoading(false)
  }

  return (
    <SidebarLayout>
      <div className="w-full space-y-6">
        {/* Page Header */}
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">Records</h1>
          <p className="text-xs text-gray-500 font-medium mt-0.5">
            Daily bird counts, feed, water, eggs and health notes.
          </p>
        </div>

        {successMsg && (
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs p-3 rounded-xl flex items-center gap-2">
            <CheckCircle2 size={16} /> {successMsg}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
          {/* Left Form: Record Today */}
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-5">
            <div>
              <h2 className="font-bold text-sm text-gray-900">Record today</h2>
              <p className="text-xs text-gray-400">Log the numbers from your rounds.</p>
            </div>

            <form onSubmit={handleSaveRecord} className="space-y-4 text-xs">
              {/* Batch selection */}
              <div className="space-y-1">
                <label className="font-semibold text-gray-700">Batch</label>
                <select 
                  value={selectedFlockId}
                  onChange={(e) => handleFlockChange(e.target.value)}
                  className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl font-medium text-gray-800 focus:outline-none focus:border-emerald-600"
                  required
                >
                  {flocks.length === 0 ? (
                    <option value="">No batches available</option>
                  ) : (
                    flocks.map(f => (
                      <option key={f.id} value={f.id}>
                        {f.name} ({f.breed} - {f.current_count} birds)
                      </option>
                    ))
                  )}
                </select>
              </div>

              {/* Date */}
              <div className="space-y-1">
                <label className="font-semibold text-gray-700">Date</label>
                <div className="relative">
                  <input 
                    type="date"
                    value={recordDate}
                    onChange={(e) => setRecordDate(e.target.value)}
                    className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl font-medium text-gray-800 focus:outline-none focus:border-emerald-600"
                    required
                  />
                </div>
              </div>

              {/* Bird Counts Grid */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-gray-700">Opening birds</label>
                  <input 
                    type="number"
                    value={openingBirds}
                    onChange={(e) => setOpeningBirds(Number(e.target.value))}
                    className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl font-medium text-gray-800"
                    readOnly
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-gray-700">Deaths</label>
                  <input 
                    type="number"
                    min="0"
                    value={deaths}
                    onChange={(e) => setDeaths(Number(e.target.value))}
                    className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl font-medium text-gray-800 focus:outline-none focus:border-emerald-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-gray-700">Culls</label>
                  <input 
                    type="number"
                    min="0"
                    value={culls}
                    onChange={(e) => setCulls(Number(e.target.value))}
                    className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl font-medium text-gray-800 focus:outline-none focus:border-emerald-600"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-gray-700">Sold / removed</label>
                  <input 
                    type="number"
                    min="0"
                    value={soldRemoved}
                    onChange={(e) => setSoldRemoved(Number(e.target.value))}
                    className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl font-medium text-gray-800 focus:outline-none focus:border-emerald-600"
                  />
                </div>
              </div>

              {/* Eggs & Feed / Water */}
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-gray-700">Eggs collected</label>
                  <input 
                    type="number"
                    min="0"
                    value={eggsCollected}
                    onChange={(e) => setEggsCollected(Number(e.target.value))}
                    className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl font-medium text-gray-800 focus:outline-none focus:border-emerald-600"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-gray-700">Feed used (kg)</label>
                  <input 
                    type="number"
                    step="0.1"
                    min="0"
                    value={feedUsedKg}
                    onChange={(e) => setFeedUsedKg(Number(e.target.value))}
                    className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl font-medium text-gray-800 focus:outline-none focus:border-emerald-600"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-gray-700">Water (litres)</label>
                  <input 
                    type="number"
                    step="0.1"
                    min="0"
                    value={waterLitres}
                    onChange={(e) => setWaterLitres(Number(e.target.value))}
                    className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl font-medium text-gray-800 focus:outline-none focus:border-emerald-600"
                  />
                </div>
              </div>

              {/* Notes */}
              <div className="space-y-1">
                <label className="font-semibold text-gray-700">Health observations</label>
                <textarea 
                  rows={2}
                  placeholder="e.g. Healthy flock, good appetite"
                  value={healthObservations}
                  onChange={(e) => setHealthObservations(e.target.value)}
                  className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl font-medium text-gray-800 focus:outline-none focus:border-emerald-600 resize-none"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-gray-700">Vaccinations / medication</label>
                <textarea 
                  rows={2}
                  placeholder="e.g. Gumboro booster given"
                  value={vaccinations}
                  onChange={(e) => setVaccinations(e.target.value)}
                  className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl font-medium text-gray-800 focus:outline-none focus:border-emerald-600 resize-none"
                />
              </div>

              {/* Closing Birds Banner */}
              <div className="bg-[#163c29] text-white p-3.5 rounded-xl flex items-center justify-between">
                <span className="font-bold text-[11px] tracking-wider uppercase text-emerald-200">CLOSING BIRDS</span>
                <span className="font-extrabold text-amber-400 text-base">{closingBirds}</span>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-[#163c29] hover:bg-emerald-900 text-white font-extrabold rounded-xl transition shadow-sm cursor-pointer"
              >
                {loading ? 'Saving...' : 'Save record'}
              </button>
            </form>
          </div>

          {/* Right Column: Recent Records */}
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="font-bold text-sm text-gray-900">Recent records</h2>
              <span className="text-xs text-gray-400 font-semibold">{records.length} TOTAL</span>
            </div>

            {records.length === 0 ? (
              <div className="text-center py-16 space-y-3 bg-gray-50/50 rounded-2xl border border-dashed border-gray-200">
                <div className="w-10 h-10 mx-auto bg-gray-100 text-gray-500 rounded-xl flex items-center justify-center">
                  <ClipboardList size={20} />
                </div>
                <h3 className="text-xs font-bold text-gray-800">No records yet</h3>
                <p className="text-[11px] text-gray-400 max-w-xs mx-auto">
                  Save today's numbers on the left and they will appear here, newest first.
                </p>
              </div>
            ) : (
              <div className="space-y-3 max-h-[700px] overflow-y-auto pr-1">
                {records.map(r => (
                  <div key={r.id} className="p-4 bg-gray-50 rounded-xl border border-gray-100 space-y-2 text-xs">
                    <div className="flex justify-between items-center font-bold text-gray-900">
                      <span>{r.flocks?.name || 'Batch'}</span>
                      <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md text-[10px]">
                        {r.record_date}
                      </span>
                    </div>
                    <div className="grid grid-cols-4 gap-2 text-[11px] text-gray-600 pt-1 border-t border-gray-200/60">
                      <div>Closing: <strong className="text-gray-900">{r.closing_birds}</strong></div>
                      <div>Eggs: <strong className="text-amber-600">{r.eggs_collected}</strong></div>
                      <div>Feed: <strong className="text-gray-900">{r.feed_used_kg}kg</strong></div>
                      <div>Deaths: <strong className="text-red-600">{r.deaths}</strong></div>
                    </div>
                    {(r.health_observations || r.vaccinations) && (
                      <p className="text-[11px] text-gray-500 italic pt-1 border-t border-gray-200/40">
                        {r.health_observations && `Note: ${r.health_observations}`}
                        {r.vaccinations && ` | Med: ${r.vaccinations}`}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </SidebarLayout>
  )
}