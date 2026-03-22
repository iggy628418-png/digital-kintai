import React, { useState, useEffect } from 'react';
import { ClipboardCheck, LogOut, Clock, Calendar, ChevronRight, CheckCircle2, ShieldCheck } from 'lucide-react';
import { 
  getRecordByDate, 
  getRecordsByEmployee, 
  clearCurrentUser 
} from '../utils/storage';
import { 
  todayDateString, 
  currentYearMonth, 
  calcDailyMinutes, 
  calcMonthlyMinutes, 
  minutesToDisplay,
  getCurrentStatusLabel,
  getNextPunchType,
  getDisplayPunchType,
  getPunchLabel
} from '../utils/timeLogic';

export default function Dashboard({ user, onPunch, onViewHistory }) {
  const [todayRecord, setTodayRecord] = useState(null);
  const [monthlyMinutes, setMonthlyMinutes] = useState(0);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    
    // データの読み込み
    const loadData = async () => {
      const records = await getRecordsByEmployee(user.id);
      const today = todayDateString();
      const todayRec = await getRecordByDate(user.id, today);
      setTodayRecord(todayRec);
      setMonthlyMinutes(calcMonthlyMinutes(records, currentYearMonth()));
    };

    loadData();

    return () => clearInterval(timer);
  }, [user.id]);

  const nextPunch = getNextPunchType(todayRecord);
  const displayPunch = getDisplayPunchType(todayRecord);
  const isDone = nextPunch === 'done';

  return (
    <div className="app-container page-transition">
      <header className="header">
        <span className="header-title">デジタル勤怠表</span>
        <button onClick={() => { clearCurrentUser(); window.location.reload(); }} style={{ background: 'none', border: 'none', padding: '0.5rem', borderRadius: '0.5rem', cursor: 'pointer' }}>
          <LogOut size={20} color="var(--text-muted)" />
        </button>
      </header>

      <main style={{ padding: '1rem' }}>
        <div className="card" style={{ background: 'linear-gradient(135deg, #1e293b, #334155)', color: 'white' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
            <div>
              <p style={{ opacity: 0.8, fontSize: '0.875rem' }}>お疲れ様です</p>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 800 }}>{user.name} さん</h2>
            </div>
            <div 
              className={`badge ${todayRecord?.approved ? 'badge-success' : 'badge-pending'}`} 
              style={{ 
                padding: '0.4rem 0.8rem',
                borderRadius: '2rem',
                fontSize: '0.75rem',
                fontWeight: 700,
                background: todayRecord?.approved ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.1)',
                color: todayRecord?.approved ? '#34d399' : '#f87171',
                border: `1px solid ${todayRecord?.approved ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.2)'}`,
                display: 'flex',
                alignItems: 'center',
                gap: '0.25rem'
              }}
            >
              <div 
                style={{ 
                  width: '6px', 
                  height: '6px', 
                  borderRadius: '50%', 
                  background: todayRecord?.approved ? '#10b981' : '#ef4444',
                  boxShadow: `0 0 8px ${todayRecord?.approved ? '#10b981' : '#ef4444'}`
                }} 
              />
              {todayRecord?.approved ? '確定済み' : '未確定'}
            </div>
          </div>

          <div style={{ textAlign: 'center', margin: '2rem 0' }}>
            <div style={{ fontSize: '3.5rem', fontWeight: 800, letterSpacing: '-0.05em' }}>
              {currentTime.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })}
            </div>
            <div style={{ opacity: 0.7, fontSize: '1rem' }}>
              {currentTime.toLocaleDateString('ja-JP', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'short' })}
            </div>
          </div>

          <div className="stats-grid">
            <div className="stat-item" style={{ background: 'rgba(255,255,255,0.1)' }}>
              <span className="stat-label" style={{ color: 'rgba(255,255,255,0.6)' }}>今日の勤務</span>
              <span className="stat-value" style={{ color: 'white' }}>{minutesToDisplay(calcDailyMinutes(todayRecord))}</span>
            </div>
            <div className="stat-item" style={{ background: 'rgba(255,255,255,0.1)' }}>
              <span className="stat-label" style={{ color: 'rgba(255,255,255,0.6)' }}>今月の合計</span>
              <span className="stat-value" style={{ color: 'white' }}>{minutesToDisplay(monthlyMinutes)}</span>
            </div>
          </div>
        </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <h3 style={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
              <Clock size={18} color="var(--primary)" />
              本日の記録状況
            </h3>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.4rem', marginBottom: '1rem' }}>
              {[
                { label: '出勤', key: 'morningIn' },
                { label: '休憩入', key: 'morningOut' },
                { label: '休憩終', key: 'afternoonIn' },
                { label: '退勤', key: 'afternoonOut' }
              ].map((item) => (
                <div key={item.key} style={{ 
                  textAlign: 'center', 
                  padding: '0.5rem 0.2rem', 
                  borderRadius: '0.5rem',
                  background: todayRecord?.[item.key] ? '#f1f5f9' : '#ffffff',
                  border: todayRecord?.[item.key] ? '1px solid #e2e8f0' : '1px dashed #cbd5e1',
                  opacity: todayRecord?.[item.key] ? 1 : 0.5
                }}>
                  <p style={{ fontSize: '0.6rem', color: 'var(--text-muted)', marginBottom: '0.2rem' }}>{item.label}</p>
                  <p style={{ fontSize: '0.75rem', fontWeight: 800, color: todayRecord?.[item.key] ? 'var(--text-main)' : '#94a3b8' }}>
                    {todayRecord?.[item.key] || '--:--'}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {!todayRecord?.approved && !isDone && (
            <div style={{ position: 'relative' }}>
              <button 
                className="btn btn-primary" 
                onClick={onPunch}
                style={{ 
                  padding: '1.75rem', 
                  fontSize: '1.4rem', 
                  gap: '0.75rem',
                  background: getPunchTheme(displayPunch).bgColor,
                  border: `1px solid ${getPunchTheme(displayPunch).borderColor}`,
                  boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                  transition: 'transform 0.2s'
                }}
                onMouseDown={e => e.currentTarget.style.transform = 'scale(0.98)'}
                onMouseUp={e => e.currentTarget.style.transform = 'scale(1)'}
              >
                <Clock size={28} />
                {getPunchLabel(displayPunch)}を打刻
              </button>
              {displayPunch.includes('Out') && (
                <div style={{ 
                  textAlign: 'center', 
                  marginTop: '0.75rem', 
                  fontSize: '0.8rem', 
                  color: 'var(--text-muted)',
                  animation: 'pulse 2s infinite'
                }}>
                  休憩や退勤の時はこちらを押してください
                </div>
              )}
            </div>
          )}

          {todayRecord?.approved && (
            <div style={{
              background: 'linear-gradient(135deg, #d1fae5, #a7f3d0)',
              border: '2px solid #10b981',
              borderRadius: '1rem',
              padding: '1.25rem',
              textAlign: 'center',
            }}>
              <ShieldCheck size={40} color="#059669" style={{ marginBottom: '0.5rem' }} />
              <p style={{ fontWeight: 800, fontSize: '1.1rem', color: '#065f46' }}>勤怠確定済み</p>
            </div>
          )}

          {isDone && !todayRecord?.approved && (
            <div style={{ textAlign: 'center', padding: '1rem' }}>
              <CheckCircle2 size={36} color="var(--secondary)" style={{ marginBottom: '0.5rem' }} />
              <p style={{ color: 'var(--secondary)', fontWeight: 700 }}>本日の全ての打刻が完了しました</p>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>お疲れ様でした！</p>
            </div>
          )}

        <button className="btn btn-outline" onClick={onViewHistory}>
          <Calendar size={18} />
          勤務履歴を見る
          <ChevronRight size={16} style={{ marginLeft: 'auto' }} />
        </button>
      </main>
    </div>
  );
}
