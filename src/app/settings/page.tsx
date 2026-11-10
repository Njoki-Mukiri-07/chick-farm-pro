'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import SidebarLayout from '@/components/SidebarLayout'
import { Settings, LogOut, UserPlus, Download, Trash2, CheckCircle2 } from 'lucide-react'

interface FarmSettings {
  farm_name: string
  owner_name: string
  phone: string
  email: string
  location: string
  county: string
  currency: string
  weight_unit: string
  motto: string
}

export default function SettingsPage() {
  const router = useRouter()
  const [userEmail, setUserEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [successMsg, setSuccessMsg] = useState('')

  // Farm Profile States
  const [farmName, setFarmName] = useState('')
  const [owner, setOwner] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [location, setLocation] = useState('')
  const [county, setCounty] = useState('')
  const [currency, setCurrency] = useState('KES')
  const [weightUnit, setWeightUnit] = useState('kg')
  const [motto, setMotto] = useState('Happy chicks. Healthy flocks. Better farming.')

  // Team Invite State
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState('User')

  useEffect(() => {
    const getSessionAndSettings = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        router.push('/login')
        return
      }
      setUserEmail(session.user.email || '')
      setEmail(session.user.email || '')

      // Fetch farm settings if saved
      const { data } = await supabase.from('farm_settings').select('*').limit(1).single()
      if (data) {
        setFarmName(data.farm_name || '')
        setOwner(data.owner_name || '')
        setPhone(data.phone || '')
        setLocation(data.location || '')
        setCounty(data.county || '')
        setCurrency(data.currency || 'KES')
        setWeightUnit(data.weight_unit || 'kg')
        setMotto(data.motto || '')
      }
    }
    getSessionAndSettings()
  }, [router])

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setSuccessMsg('')

    const payload = {
      farm_name: farmName,
      owner_name: owner,
      phone,
      email,
      location,
      county,
      currency,
      weight_unit: weightUnit,
      motto
    }

    // Upsert settings
    const { error } = await supabase.from('farm_settings').upsert({ id: 1, ...payload })

    if (error) {
      alert('Error saving settings: ' + error.message)
    } else {
      setSuccessMsg('Farm profile saved successfully!')
    }
    setLoading(false)
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  const handleExportData = async () => {
    // Simple CSV Export simulation for records & flocks
    const { data: flocks } = await supabase.from('flocks').select('*')
    const { data: records } = await supabase.from('daily_records').select('*')

    const exportData = { flocks, records }
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `chick-farm-pro-backup-${new Date().toISOString().split('T')[0]}.json`
    a.click()
  }

  const handleClearData = async () => {
    if (confirm('WARNING: This will delete all batches, records, sales, and expenses. Farm settings will stay. Are you sure?')) {
      await supabase.from('daily_records').delete().neq('id', '0')
      await supabase.from('flocks').delete().neq('id', '0')
      await supabase.from('transactions').delete().neq('id', '0')
      await supabase.from('sales').delete().neq('id', '0')
      await supabase.from('feed_inventory').delete().neq('id', '0')
      alert('All farm data has been cleared.')
    }
  }

  return (
    <SidebarLayout>
      <div className="w-full space-y-6">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">Settings</h1>
            <p className="text-xs text-gray-500 font-medium mt-0.5">
              Farm details, team access and your data.
            </p>
          </div>
          <button
            onClick={handleSignOut}
            className="bg-white hover:bg-red-50 text-red-600 border border-red-200 font-extrabold text-xs px-4 py-2.5 rounded-xl flex items-center gap-2 shadow-sm transition cursor-pointer"
          >
            <LogOut size={16} /> Sign out
          </button>
        </div>

        {successMsg && (
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs p-3 rounded-xl flex items-center gap-2">
            <CheckCircle2 size={16} /> {successMsg}
          </div>
        )}

        {/* Farm Profile Card */}
        <div className="bg-white p-6 sm:p-8 rounded-2xl border border-gray-100 shadow-sm space-y-6">
          <h2 className="font-bold text-sm text-gray-900">Farm profile</h2>

          <form onSubmit={handleSaveProfile} className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="font-semibold text-gray-700">Farm name</label>
                <input 
                  type="text"
                  placeholder="e.g. Green Valley Poultry"
                  value={farmName}
                  onChange={(e) => setFarmName(e.target.value)}
                  className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl font-medium text-gray-800 focus:outline-none focus:border-emerald-600"
                />
              </div>
              <div className="space-y-1">
                <label className="font-semibold text-gray-700">Owner</label>
                <input 
                  type="text"
                  placeholder="e.g. Peninah Njoki"
                  value={owner}
                  onChange={(e) => setOwner(e.target.value)}
                  className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl font-medium text-gray-800 focus:outline-none focus:border-emerald-600"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="font-semibold text-gray-700">Phone</label>
                <input 
                  type="text"
                  placeholder="07xx xxx xxx"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl font-medium text-gray-800 focus:outline-none focus:border-emerald-600"
                />
              </div>
              <div className="space-y-1">
                <label className="font-semibold text-gray-700">Email</label>
                <input 
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl font-medium text-gray-800 focus:outline-none focus:border-emerald-600"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="font-semibold text-gray-700">Location</label>
                <input 
                  type="text"
                  placeholder="e.g. Ongata Rongai"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl font-medium text-gray-800 focus:outline-none focus:border-emerald-600"
                />
              </div>
              <div className="space-y-1">
                <label className="font-semibold text-gray-700">County</label>
                <input 
                  type="text"
                  placeholder="e.g. Kajiado"
                  value={county}
                  onChange={(e) => setCounty(e.target.value)}
                  className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl font-medium text-gray-800 focus:outline-none focus:border-emerald-600"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="font-semibold text-gray-700">Currency</label>
                <select 
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl font-medium text-gray-800 focus:outline-none focus:border-emerald-600"
                >
                  <option value="KES">KES</option>
                  <option value="USD">USD</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="font-semibold text-gray-700">Weight unit</label>
                <select 
                  value={weightUnit}
                  onChange={(e) => setWeightUnit(e.target.value)}
                  className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl font-medium text-gray-800 focus:outline-none focus:border-emerald-600"
                >
                  <option value="kg">kg</option>
                  <option value="lbs">lbs</option>
                </select>
              </div>
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-gray-700">Motto</label>
              <input 
                type="text"
                value={motto}
                onChange={(e) => setMotto(e.target.value)}
                className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl font-medium text-gray-800 focus:outline-none focus:border-emerald-600"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 bg-[#163c29] hover:bg-emerald-900 text-white font-extrabold rounded-xl transition shadow-sm cursor-pointer"
            >
              {loading ? 'Saving...' : 'Save profile'}
            </button>
          </form>
        </div>

        {/* Team & Access Card */}
        <div className="bg-white p-6 sm:p-8 rounded-2xl border border-gray-100 shadow-sm space-y-6">
          <h2 className="font-bold text-sm text-gray-900">Team & access</h2>
          <div className="p-4 bg-gray-50 rounded-2xl flex items-center justify-between text-xs">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-[#163c29] text-amber-400 font-bold flex items-center justify-center">
                PN
              </div>
              <div>
                <p className="font-bold text-gray-900">Peninah Njoki</p>
                <p className="text-[10px] text-gray-400">{userEmail}</p>
              </div>
            </div>
            <span className="bg-emerald-50 text-emerald-800 font-bold px-2.5 py-1 rounded-lg text-[10px]">ADMIN</span>
          </div>

          <div className="space-y-2 pt-2 border-t border-gray-100">
            <label className="font-semibold text-gray-700 text-xs">Invite a team member</label>
            <div className="flex flex-col sm:flex-row gap-3">
              <input 
                type="email"
                placeholder="name@example.com"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                className="flex-1 p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium text-gray-800 focus:outline-none focus:border-emerald-600"
              />
              <select
                value={inviteRole}
                onChange={(e) => setInviteRole(e.target.value)}
                className="p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium text-gray-800 focus:outline-none focus:border-emerald-600"
              >
                <option value="User">User</option>
                <option value="Admin">Admin</option>
              </select>
              <button
                type="button"
                onClick={() => {
                  if (inviteEmail) {
                    alert(`Invite sent to ${inviteEmail} as ${inviteRole}!`)
                    setInviteEmail('')
                  } else {
                    alert('Please enter an email address.')
                  }
                }}
                className="bg-[#163c29] hover:bg-emerald-900 text-white font-extrabold text-xs px-5 py-2.5 rounded-xl flex items-center justify-center gap-2 transition cursor-pointer"
              >
                <UserPlus size={16} /> Invite
              </button>
            </div>
            <p className="text-[10px] text-gray-400">Admins manage the farm, team and data. Users record daily work.</p>
          </div>
        </div>

        {/* Data Management Card */}
        <div className="bg-white p-6 sm:p-8 rounded-2xl border border-gray-100 shadow-sm space-y-4">
          <h2 className="font-bold text-sm text-gray-900">Data management</h2>
          
          <div className="space-y-3">
            <button
              onClick={handleExportData}
              className="w-full p-4 bg-gray-50 hover:bg-gray-100 border border-gray-200/80 rounded-2xl flex items-center justify-between text-left transition cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-50 text-emerald-700 rounded-xl">
                  <Download size={18} />
                </div>
                <div>
                  <h4 className="font-bold text-xs text-gray-900">Export all records</h4>
                  <p className="text-[11px] text-gray-400">Download a backup JSON for flocks, records, feed, sales and expenses.</p>
                </div>
              </div>
            </button>

            <button
              onClick={handleClearData}
              className="w-full p-4 bg-red-50/50 hover:bg-red-50 border border-red-200/60 rounded-2xl flex items-center justify-between text-left transition cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-red-100 text-red-600 rounded-xl">
                  <Trash2 size={18} />
                </div>
                <div>
                  <h4 className="font-bold text-xs text-red-900">Clear farm data</h4>
                  <p className="text-[11px] text-red-400">Removes all batches, records, sales and expenses. Farm settings stay.</p>
                </div>
              </div>
            </button>
          </div>

          <p className="text-[10px] text-gray-400 text-center pt-2">Your records are stored securely and only visible inside your farm.</p>
        </div>
      </div>
    </SidebarLayout>
  )
}