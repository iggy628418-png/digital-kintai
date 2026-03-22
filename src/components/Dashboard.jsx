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

        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
            <Clock size={20} color="var(--primary)" />
            <h3 style={{ fontWeight: 700 }}>現在の状態：{getCurrentStatusLabel(todayRecord)}</h3>
          </div>

          {todayRecord?.approved ? (
            /* ===== 承認済みバナー ===== */
            <div style={{
              background: 'linear-gradient(135deg, #d1fae5, #a7f3d0)',
              border: '2px solid #10b981',
              borderRadius: '1rem',
              padding: '1.25rem',
              textAlign: 'center',
            }}>
              <ShieldCheck size={40} color="#059669" style={{ marginBottom: '0.5rem' }} />
              <p style={{ fontWeight: 800, fontSize: '1.1rem', color: '#065f46' }}>管理者に承認されました</p>
              <p style={{ fontSize: '0.75rem', color: '#047857', marginTop: '0.25rem' }}>この日の勤怠は確定しています</p>
            </div>
          ) : !isDone ? (
            /* ===== 打刻ボタン ===== */
            <button 
              className="btn btn-primary" 
              onClick={onPunch}
              style={{ padding: '1.5rem', fontSize: '1.25rem', gap: '0.75rem' }}
            >
              <Clock size={24} />
              QRスキャンして{getPunchLabel(displayPunch)}
            </button>
          ) : (
            /* ===== 全打刻完了 ===== */
            <div style={{ textAlign: 'center', padding: '1rem' }}>
              <CheckCircle2 size={36} color="var(--secondary)" style={{ marginBottom: '0.5rem' }} />
              <p style={{ color: 'var(--secondary)', fontWeight: 700 }}>本日の勤務記録はすべて完了しました</p>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>管理者の承認をお待ちください</p>
            </div>
          )}
        </div>

        <button className="btn btn-outline" onClick={onViewHistory}>
          <Calendar size={18} />
          勤務履歴を見る
          <ChevronRight size={16} style={{ marginLeft: 'auto' }} />
        </button>
      </main>
    </div>
  );
}
