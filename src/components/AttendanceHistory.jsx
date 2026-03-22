import React from 'react';
import { ArrowLeft, CheckCircle, Clock, Calendar } from 'lucide-react';
import { getRecordsByEmployee } from '../utils/storage';
import { formatDateJP, calcDailyMinutes, minutesToDisplay } from '../utils/timeLogic';

export default function AttendanceHistory({ user, onBack }) {
  const [records, setRecords] = React.useState([]);

  React.useEffect(() => {
    const loadRecords = async () => {
      const data = await getRecordsByEmployee(user.id);
      setRecords(data.sort((a, b) => b.date.localeCompare(a.date)));
    };
    loadRecords();
  }, [user.id]);

  return (
    <div className="app-container page-transition">
      <header className="header" style={{ padding: '1rem' }}>
        <button onClick={onBack} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
          <ArrowLeft size={24} />
        </button>
        <span className="header-title">勤務履歴</span>
        <div style={{ width: 24 }}></div>
      </header>

      <main style={{ padding: '1rem' }}>
        {records.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '4rem 1rem', color: 'var(--text-muted)' }}>
            <Calendar size={48} style={{ marginBottom: '1rem', opacity: 0.3 }} />
            <p>まだ勤務記録がありません</p>
          </div>
        ) : (
          records.map(record => (
            <div key={record.date} className="card" style={{ padding: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                <span className="history-date">{formatDateJP(record.date)}</span>
                <span className={`badge ${record.approved ? 'badge-success' : 'badge-pending'}`}>
                  {record.approved ? '承認済み' : '未承認'}
                </span>
              </div>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', fontSize: '0.875rem' }}>
                <div style={{ padding: '0.5rem', background: '#f8fafc', borderRadius: '0.5rem' }}>
                  <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>午前</p>
                  <p>{record.morningIn || '--:--'} 〜 {record.morningOut || '--:--'}</p>
                </div>
                <div style={{ padding: '0.5rem', background: '#f8fafc', borderRadius: '0.5rem' }}>
                  <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>午後</p>
                  <p>{record.afternoonIn || '--:--'} 〜 {record.afternoonOut || '--:--'}</p>
                </div>
              </div>

              <div style={{ marginTop: '0.75rem', display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '0.5rem' }}>
                <Clock size={14} color="var(--primary)" />
                <span style={{ fontWeight: 800, color: 'var(--primary)' }}>
                  合計：{minutesToDisplay(calcDailyMinutes(record))}
                </span>
              </div>
            </div>
          ))
        )}
      </main>
    </div>
  );
}
