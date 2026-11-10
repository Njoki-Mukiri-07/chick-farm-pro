'use client';

import { useState } from 'react';

interface InvestmentCycle {
  id: string;
  title: string;
  depositDate: string;
  chickDate: string;
  saleTargetDate: string;
  amountInvested: number;
  expectedReturn: number;
  status: 'Active' | 'Completed';
}

export default function InvestmentTracker() {
  const [cycles, setCycles] = useState<InvestmentCycle[]>([
    {
      id: '1',
      title: 'Batch A - November Cycle',
      depositDate: '5 Nov 2026',
      chickDate: '7 Nov 2026',
      saleTargetDate: '12 Dec 2026',
      amountInvested: 350,
      expectedReturn: 450,
      status: 'Active',
    },
    {
      id: '2',
      title: 'Batch B - Mid November Cycle',
      depositDate: '12 Nov 2026',
      chickDate: '14 Nov 2026',
      saleTargetDate: '19 Dec 2026',
      amountInvested: 350,
      expectedReturn: 450,
      status: 'Active',
    },
  ]);

  return (
    <div style={{ backgroundColor: '#ffffff', borderRadius: '1rem', border: '1px solid #e2e8f0', padding: '1.5rem', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.02)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
        <div>
          <h3 style={{ fontSize: '1.125rem', fontWeight: 700, color: '#0f172a', margin: 0 }}>
            🌾 Farm Investment & Cycle Targets
          </h3>
          <p style={{ fontSize: '0.8125rem', color: '#64748b', marginTop: '0.2rem' }}>
            Simple tracking for investor shares, deposit dates, and target sales returns.
          </p>
        </div>
        <span style={{ backgroundColor: '#f0fdf4', color: '#15803d', border: '1px solid #dcfce7', padding: '0.25rem 0.75rem', borderRadius: '9999px', fontSize: '0.75rem', fontWeight: 600 }}>
          Active Plan Active
        </span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
        {cycles.map((cycle) => (
          <div key={cycle.id} style={{ backgroundColor: '#fbf9f4', border: '1px solid #e2e8f0', borderRadius: '0.75rem', padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <span style={{ fontSize: '0.875rem', fontWeight: 700, color: '#1e293b' }}>{cycle.title}</span>
              <span style={{ fontSize: '0.75rem', backgroundColor: '#45543c', color: '#ffffff', padding: '0.15rem 0.5rem', borderRadius: '0.25rem', fontWeight: 500 }}>
                {cycle.status}
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', fontSize: '0.75rem', color: '#475569', borderTop: '1px solid #e2e8f0', borderBottom: '1px solid #e2e8f0', padding: '0.5rem 0' }}>
              <div>
                <p style={{ margin: 0, color: '#94a3b8' }}>Deposit Date</p>
                <p style={{ margin: '0.1rem 0 0 0', fontWeight: 600, color: '#0f172a' }}>{cycle.depositDate}</p>
              </div>
              <div>
                <p style={{ margin: 0, color: '#94a3b8' }}>Chicks Bought</p>
                <p style={{ margin: '0.1rem 0 0 0', fontWeight: 600, color: '#0f172a' }}>{cycle.chickDate}</p>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8125rem' }}>
              <div>
                <span style={{ color: '#64748b' }}>Target Sale: </span>
                <strong style={{ color: '#0f172a' }}>{cycle.saleTargetDate}</strong>
              </div>
              <div style={{ textAlign: 'right' }}>
                <span style={{ color: '#64748b' }}>Return: </span>
                <strong style={{ color: '#15803d' }}>KSh {cycle.expectedReturn}</strong>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}