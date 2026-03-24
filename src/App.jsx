import React, { useState, useEffect } from 'react';
import { 
  getCurrentUser,
  clearCurrentUser,
  findEmployeeById, 
  getRecordByDate, 
  getRecordsByEmployee,
  upsertRecord 
} from './utils/storage';
import { 
  todayDateString, 
  nowTimeString, 
  currentYearMonth,
  calcMonthlyMinutes,
  getNextPunchType,
  getDisplayPunchType,
  getPunchLabel,
  getPunchMessage
} from './utils/timeLogic';

import NameRegistration from './components/NameRegistration';
import Dashboard from './components/Dashboard';
import AttendanceHistory from './components/AttendanceHistory';
import AdminLogin from './components/AdminLogin';
import AdminDashboard from './components/AdminDashboard';
import QRCodeDisplay from './components/QRCodeDisplay';
import MonthlyReport from './components/MonthlyReport';
import Scanner from './components/Scanner';

const QR_CODE_VALUE = '2026PUNCH';

// URLのハッシュで従業員・管理者を切り替えるフック
function useMode() {
  const [mode, setMode] = useState(
    window.location.hash === '#admin' ? 'admin' : 'employee'
  );

  useEffect(() => {
    const handleHashChange = () => {
      setMode(window.location.hash === '#admin' ? 'admin' : 'employee');
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  return mode;
}

// ===== 従業員側アプリ =====
function EmployeeApp() {
  const [user, setUser] = useState(null);
  const [view, setView] = useState('dashboard');
  const [loading, setLoading] = useState(true);
  const [punchResult, setPunchResult] = useState(null);
  const [pendingPunchType, setPendingPunchType] = useState(null);
  const [showScanner, setShowScanner] = useState(false);
  
  const [todayRecord, setTodayRecord] = useState(null);
  const [monthlyMinutes, setMonthlyMinutes] = useState(0);

  const loadData = async (userId) => {
    if (!userId) return;
    
    // Check if employee still exists in database (Admin deletion sync)
    try {
      if (navigator.onLine) {
        const employee = await findEmployeeById(userId);
        if (!employee) {
          clearCurrentUser();
          setUser(null);
          return;
        }
      }
    } catch (e) {
      console.error("Account verification failed:", e);
    }
    
    const records = await getRecordsByEmployee(userId);
    const today = todayDateString();
    const todayRec = await getRecordByDate(userId, today);
    setTodayRecord(todayRec);
    setMonthlyMinutes(calcMonthlyMinutes(records, currentYearMonth()));
  };

  useEffect(() => {
    const user = getCurrentUser();
    setUser(user);
    if (user) loadData(user.id);
    setLoading(false);
  }, []);

  if (loading) return null;

  if (!user) {
    return <NameRegistration onComplete={(u) => {
      setUser(u);
      loadData(u.id);
    }} />;
  }

  // 打刻種別を選択してスキャナーを表示
  const handlePunch = (type) => {
    setPendingPunchType(type);
    setShowScanner(true);
  };

  // QRコードスキャン成功時
  const handleScan = async (decodedText) => {
    setShowScanner(false);
    
    if (!pendingPunchType) return;

    const today = todayDateString();
    const record = (await getRecordByDate(user.id, today)) || { 
      employeeId: user.id, 
      date: today, 
      approved: false 
    };

    if (record.approved) {
      alert('この日の勤務は既に承認されているため、打刻できません。');
      return;
    }

    const isUniversalQR = (decodedText === QR_CODE_VALUE);

    if (!isUniversalQR) {
      alert('無効なQRコードです。');
      return;
    }

    const type = pendingPunchType;
    const label = getPunchLabel(type);
    const message = getPunchMessage(type);

    const newRecord = { ...record, [type]: nowTimeString() };
    await upsertRecord(newRecord);

    setPunchResult({ type, label, message, time: nowTimeString() });
    
    setPendingPunchType(null);
    // データを再読み込み
    await loadData(user.id);
  };

  return (
    <>
      {view === 'dashboard' && (
        <Dashboard 
          user={user} 
          todayRecord={todayRecord}
          monthlyMinutes={monthlyMinutes}
          onPunch={handlePunch}
          onViewHistory={() => setView('history')}
        />
      )}
      {view === 'refresh' && null}
      {view === 'history' && (
        <AttendanceHistory user={user} onBack={() => setView('dashboard')} />
      )}
      {showScanner && (
        <Scanner onScan={handleScan} onClose={() => setShowScanner(false)} />
      )}
      {punchResult && (
        <PunchModal result={punchResult} onClose={() => setPunchResult(null)} />
      )}
    </>
  );
}

// ===== 打刻完了モーダル =====
function PunchModal({ result, onClose }) {
  const { label, message, time } = result;
  
  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1000, 
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '1.5rem', background: 'rgba(0,0,0,0.6)'
    }}>
      <div className="card" style={{ 
        maxWidth: '400px', width: '100%', textAlign: 'center', padding: '2rem',
        animation: 'fadeIn 0.3s ease-out' 
      }}>
        <div style={{ 
          fontSize: '3rem', marginBottom: '1rem', 
          animation: 'pulse 1s infinite alternate' 
        }}>🎉</div>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--primary)', marginBottom: '0.5rem' }}>
          {label}完了
        </h2>
        <div style={{ 
          fontSize: '2rem', fontWeight: 900, marginBottom: '1rem', letterSpacing: '0.1em' 
        }}>
          {time}
        </div>
        <p style={{ fontSize: '1rem', color: 'var(--text-muted)', marginBottom: '2rem', lineHeight: 1.6 }}>
          {message}
        </p>
        <button className="btn btn-primary" onClick={onClose} style={{ padding: '1rem' }}>
          閉じる
        </button>
      </div>
    </div>
  );
}

// ===== 管理者側アプリ =====
function AdminApp() {
  const [view, setView] = useState('login');

  return (
    <>
      {view === 'login' && (
        <AdminLogin 
          onLogin={() => setView('dashboard')} 
          onBack={() => { window.location.hash = ''; }}
        />
      )}
      {view === 'dashboard' && (
        <AdminDashboard 
          onBack={() => setView('login')}
          onViewQRCode={() => setView('qrcode')}
          onViewReport={() => setView('report')}
        />
      )}
      {view === 'qrcode' && (
        <QRCodeDisplay onBack={() => setView('dashboard')} />
      )}
      {view === 'report' && (
        <MonthlyReport onBack={() => setView('dashboard')} />
      )}
    </>
  );
}

// ===== ルートコンポーネント =====
export default function App() {
  const mode = useMode();
  return mode === 'admin' ? <AdminApp /> : <EmployeeApp />;
}
