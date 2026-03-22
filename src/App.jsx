import React, { useState, useEffect } from 'react';
import { 
  getCurrentUser, 
  getRecordByDate, 
  upsertRecord 
} from './utils/storage';
import { 
  todayDateString, 
  nowTimeString, 
  getNextPunchType,
  getDisplayPunchType
} from './utils/timeLogic';

import NameRegistration from './components/NameRegistration';
import Dashboard from './components/Dashboard';
import AttendanceHistory from './components/AttendanceHistory';
import AdminLogin from './components/AdminLogin';
import AdminDashboard from './components/AdminDashboard';
import QRCodeDisplay from './components/QRCodeDisplay';
import MonthlyReport from './components/MonthlyReport';
import Scanner from './components/Scanner';

const QR_IN  = 'WAKAMATSAYA-KINTAI-IN-2026';
const QR_OUT = 'WAKAMATSAYA-KINTAI-OUT-2026';

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
  const [pendingPunchType, setPendingPunchType] = useState(null);

  useEffect(() => {
    setUser(getCurrentUser());
    setLoading(false);
  }, []);

  if (loading) return null;

  if (!user) {
    return <NameRegistration onComplete={(u) => setUser(u)} />;
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

    const isUniversalQR = (decodedText === QR_IN || decodedText === QR_OUT);

    if (!isUniversalQR) {
      alert('無効なQRコードです。');
      return;
    }

    const type = pendingPunchType;
    const label = getPunchLabel(type);

    const newRecord = { ...record, [type]: nowTimeString() };
    await upsertRecord(newRecord);
    alert(`【${label}】\n${nowTimeString()} に打刻しました！`);
    
    setPendingPunchType(null);
    // ダッシュボードを再読み込み
    setView('refresh');
    setTimeout(() => setView('dashboard'), 0);
  };

  return (
    <>
      {view === 'dashboard' && (
        <Dashboard 
          user={user} 
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
    </>
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
