import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const today = new Date().toISOString().split('T')[0];

  // Fetch today's records
  const { data: records } = await supabase
    .from('daily_records')
    .select('*')
    .eq('record_date', today);

  const eggsCollected = records?.reduce((sum, r) => sum + (r.eggs_collected || 0), 0) || 0;
  const deaths = records?.reduce((sum, r) => sum + (r.deaths || 0), 0) || 0;
  const feedUsed = records?.reduce((sum, r) => sum + (r.feed_used_kg || 0), 0) || 0;

  // Build report payload
  const reportSummary = {
    date: today,
    eggsCollected,
    deaths,
    feedUsedKg: feedUsed,
    status: 'Daily Summary Ready',
  };

  // Here you can integrate Resend (Email) or Twilio (WhatsApp) to send `reportSummary` directly to your phone.

  return NextResponse.json(reportSummary);
}