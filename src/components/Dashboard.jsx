import React, { useState, useEffect } from 'react';
import { ClipboardCheck, LogOut, Clock, Calendar, ChevronRight, CheckCircle2, ShieldCheck } from 'lucide-react';
import { 
  clearCurrentUser 
} from '../utils/storage';
import { 
  todayDateString, 
  minutesToDisplay,
  calcDailyMinutes,
  getPunchTheme
} from '../utils/timeLogic';

export default function Dashboard({ user, todayRecord, monthlyMinutes, onPunch, onViewHistory }) {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="app-container page-transition">
      <header className="header">
        <span className="header-title">デジタル勤怠表</span>
        <button onClick={() => { clearCurrentUser(); window.location.reload(); }} style={{ background: 'none', border: 'none', padding: '0.5rem', borderRadius: '0.5rem', cursor: 'pointer' }}>
          <LogOut size={20} color="var(--text-muted)" />
        </button>
      </header>

      <main style={{ padding: '1rem' }}>
        {/* ステータスカード */}
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

        {/* 打刻カード */}
        <div className="card">
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

          {!todayRecord?.approved ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {/* 出勤・退勤セクション */}
              <div style={{ 
                padding: '1.25rem', 
                background: '#f8fafc', 
                borderRadius: '1rem', 
                border: '1px solid #e2e8f0' 
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', color: 'var(--primary)', fontWeight: 700, fontSize: '0.9rem' }}>
                  <Clock size={16} /> 勤務の記録
                </div>
                {!todayRecord?.morningIn ? (
                  <button 
                    className="btn" 
                    onClick={() => onPunch('morningIn')}
                    style={{ 
                      width: '100%',
                      padding: '1.25rem', 
                      fontSize: '1.2rem', 
                      background: getPunchTheme('morningIn').bgColor,
                      color: 'white',
                      boxShadow: '0 4px 6px -1px rgba(37, 99, 235, 0.2)'
                    }}
                  >
                    出勤を打刻する
                  </button>
                ) : (
                  <button 
                    className="btn" 
                    onClick={() => onPunch('afternoonOut')}
                    disabled={!!todayRecord?.afternoonOut}
                    style={{ 
                      width: '100%',
                      padding: '1.25rem', 
                      fontSize: '1.2rem', 
                      background: todayRecord?.afternoonOut ? '#f1f5f9' : getPunchTheme('afternoonOut').bgColor,
                      color: todayRecord?.afternoonOut ? '#94a3b8' : 'white',
                      border: todayRecord?.afternoonOut ? '1px solid #e2e8f0' : 'none',
                      opacity: todayRecord?.afternoonOut ? 0.6 : 1
                    }}
                  >
                    <LogOut size={20} /> 退勤を打刻する
                  </button>
                )}
              </div>

              {/* 休憩バナーセクション */}
              <div style={{ 
                padding: '1.25rem', 
                background: '#fff1f2', 
                borderRadius: '1rem', 
                border: '1px solid #fecdd3' 
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', color: '#be185d', fontWeight: 700, fontSize: '0.9rem' }}>
                  <span style={{ fontSize: '1.2rem' }}>☕</span> 休憩の記録
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  <button 
                    className="btn" 
                    onClick={() => onPunch('morningOut')}
                    disabled={!todayRecord?.morningIn || !!todayRecord?.morningOut || !!todayRecord?.afternoonOut}
                    style={{ 
                      padding: '1rem', 
                      fontSize: '1rem', 
                      background: (!todayRecord?.morningIn || todayRecord?.morningOut || !!todayRecord?.afternoonOut) ? '#f8fafc' : getPunchTheme('morningOut').bgColor,
                      color: (!todayRecord?.morningIn || todayRecord?.morningOut || !!todayRecord?.afternoonOut) ? '#cbd5e1' : 'white',
                      border: (!todayRecord?.morningIn || todayRecord?.morningOut || !!todayRecord?.afternoonOut) ? '1px solid #e2e8f0' : 'none',
                      opacity: (!todayRecord?.morningIn || todayRecord?.morningOut || !!todayRecord?.afternoonOut) ? 0.5 : 1
                    }}
                  >
                    休憩入り
                  </button>
                  <button 
                    className="btn" 
                    onClick={() => onPunch('afternoonIn')}
                    disabled={!todayRecord?.morningOut || !!todayRecord?.afternoonIn || !!todayRecord?.afternoonOut}
                    style={{ 
                      padding: '1rem', 
                      fontSize: '1rem', 
                      background: (!todayRecord?.morningOut || todayRecord?.afternoonIn || !!todayRecord?.afternoonOut) ? '#f8fafc' : getPunchTheme('afternoonIn').bgColor,
                      color: (!todayRecord?.morningOut || todayRecord?.afternoonIn || !!todayRecord?.afternoonOut) ? '#cbd5e1' : 'white',
                      border: (!todayRecord?.morningOut || todayRecord?.afternoonIn || !!todayRecord?.afternoonOut) ? '1px solid #e2e8f0' : 'none',
                      opacity: (!todayRecord?.morningOut || todayRecord?.afternoonIn || !!todayRecord?.afternoonOut) ? 0.5 : 1
                    }}
                  >
                    休憩戻り
                  </button>
                </div>
                {!todayRecord?.morningIn && (
                  <p style={{ fontSize: '0.7rem', color: '#fb7185', marginTop: '0.75rem', textAlign: 'center' }}>
                    ※出勤打刻をすると休憩ボタンが有効になります
                  </p>
                )}
              </div>
            </div>
          ) : (
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
