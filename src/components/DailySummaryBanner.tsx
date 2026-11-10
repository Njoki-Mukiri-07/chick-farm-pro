'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { X, Sparkles, TrendingUp, Egg, Package, AlertCircle } from 'lucide-react';

export default function DailySummaryBanner() {
  const [showBanner, setShowBanner] = useState(false);
  const [summary, setSummary] = useState({
    eggs: 0,
    feed: 0,
    deaths: 0,
    profit: 0,
  });

  useEffect(() => {
    const checkDailyReport = async () => {
      const today = new Date().toISOString().split('T')[0];
      const dismissedDate = localStorage.getItem('dismissed_summary_date');

      // Don't show if the user already dismissed today's summary
      if (dismissedDate === today) return;

      // Fetch today's records
      const { data: records } = await supabase
        .from('daily_records')
        .select('*')
        .eq('record_date', today);

      // Fetch today's transactions
      const { data: transactions } = await supabase
        .from('transactions')
        .select('*')
        .gte('created_at', `${today}T00:00:00.000Z`);

      if (records && records.length > 0) {
        const totalEggs = records.reduce((sum, r) => sum + (r.eggs_collected || 0), 0);
        const totalFeed = records.reduce((sum, r) => sum + (r.feed_used_kg || 0), 0);
        const totalDeaths = records.reduce((sum, r) => sum + (r.deaths || 0), 0);

        let sales = 0;
        let expenses = 0;
        if (transactions) {
          sales = transactions
            .filter((t) => t.type === 'Income (+)')
            .reduce((sum, t) => sum + Number(t.amount), 0);
          expenses = transactions
            .filter((t) => t.type === 'Expense (-)')
            .reduce((sum, t) => sum + Number(t.amount), 0);
        }

        setSummary({
          eggs: totalEggs,
          feed: totalFeed,
          deaths: totalDeaths,
          profit: sales - expenses,
        });

        setShowBanner(true);
      }
    };

    checkDailyReport();
  }, []);

  const dismissBanner = () => {
    const today = new Date().toISOString().split('T')[0];
    localStorage.setItem('dismissed_summary_date', today);
    setShowBanner(false);
  };

  if (!showBanner) return null;

  return (
    <div className="bg-[#45543c] text-white px-4 py-3 rounded-2xl mb-6 shadow-md border border-[#384430] flex flex-col md:flex-row items-start md:items-center justify-between gap-3 relative animate-fadeIn">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-xl bg-amber-400 text-[#45543c] shrink-0">
          <Sparkles size={20} />
        </div>
        <div>
          <h4 className="font-bold text-sm tracking-tight flex items-center gap-2">
            Today's Farm Summary
            <span className="text-[10px] font-normal bg-emerald-900/60 text-emerald-200 px-2 py-0.5 rounded-full uppercase tracking-wider">
              Live Update
            </span>
          </h4>
          <p className="text-xs text-emerald-100/90 mt-0.5">
            Here is your end-of-day performance log compiled from your entries today.
          </p>
        </div>
      </div>

      {/* Metric Badges */}
      <div className="flex flex-wrap items-center gap-3 text-xs">
        <div className="bg-[#384430] px-3 py-1.5 rounded-xl flex items-center gap-1.5 font-medium">
          <Egg size={14} className="text-amber-300" />
          <span>{summary.eggs} Eggs</span>
        </div>
        <div className="bg-[#384430] px-3 py-1.5 rounded-xl flex items-center gap-1.5 font-medium">
          <Package size={14} className="text-emerald-300" />
          <span>{summary.feed} kg Feed</span>
        </div>
        {summary.deaths > 0 && (
          <div className="bg-rose-950/80 text-rose-200 border border-rose-800/40 px-3 py-1.5 rounded-xl flex items-center gap-1.5 font-medium">
            <AlertCircle size={14} />
            <span>{summary.deaths} Deaths</span>
          </div>
        )}
        <div className="bg-amber-400 text-[#45543c] px-3 py-1.5 rounded-xl flex items-center gap-1.5 font-bold">
          <TrendingUp size={14} />
          <span>Profit: KSh {summary.profit.toLocaleString()}</span>
        </div>

        {/* Close Button */}
        <button
          onClick={dismissBanner}
          className="p-1 hover:bg-[#384430] rounded-lg text-emerald-200 hover:text-white transition cursor-pointer ml-1"
          title="Dismiss notification"
        >
          <X size={18} />
        </button>
      </div>
    </div>
  );
}