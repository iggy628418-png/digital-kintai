import React, { useState, useEffect } from 'react';
import { ArrowLeft, Users, CheckCircle, XCircle, Clock, Calendar, Edit2, Save, X, BarChart2, QrCode, Trash2 } from 'lucide-react';
import { getEmployees, getRecords, approveRecord, unapproveRecord, upsertRecord, deleteRecord, deleteEmployee } from '../utils/storage';
import { formatDateJP, calcDailyMinutes, calcBreakMinutes, minutesToDisplay } from '../utils/timeLogic';

const TIME_FIELDS = [
  { key: 'morningIn',    label: '出勤' },
  { key: 'morningOut',   label: '休憩入り' },
  { key: 'afternoonIn',  label: '休憩戻り' },
  { key: 'afternoonOut', label: '退勤' },
];

export default function AdminDashboard({ onBack, onViewQRCode, onViewReport }) {
  const [employees, setEmployees]   = useState([]);
  const [records, setRecords]       = useState([]);
  const [filterMonth, setFilterMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });
  // 編集中のレコードキー: "employeeId-date" or null
  const [editingKey, setEditingKey] = useState(null);
  const [editValues, setEditValues] = useState({});

  const reload = async () => {
    const emps = await getEmployees();
    const recs = await getRecords();
    setEmployees(emps);
    setRecords(recs);
  };

  useEffect(() => { reload(); }, []);

  const handleApprove = async (employeeId, date) => {
    if (await approveRecord(employeeId, date)) reload();
  };
  
  const handleUnapprove = async (employeeId, date) => {
    if (await unapproveRecord(employeeId, date)) reload();
  };

  const handleReset = async (employeeId, date) => {
    if (window.confirm('この日の記録を完全にリセット（削除）しますか？')) {
      if (await deleteRecord(employeeId, date)) reload();
    }
  };

  const handleDeleteEmployee = async (employee) => {
    if (window.confirm(`従業員「${employee.name}」を完全に削除しますか？`)) {
      if (window.confirm('従業員を削除すると、その方に関連する全ての勤務記録も同時に消去されます。本当によろしいですか？')) {
        if (await deleteEmployee(employee.id)) {
          alert(`「${employee.name}」を削除しました。`);
          reload();
        }
      }
    }
  };

  const startEdit = (record) => {
    setEditingKey(`${record.employeeId}-${record.date}`);
    setEditValues({
      morningIn:    record.morningIn    || '',
      morningOut:   record.morningOut   || '',
      afternoonIn:  record.afternoonIn  || '',
      afternoonOut: record.afternoonOut || '',
    });
  };

  const cancelEdit = () => {
    setEditingKey(null);
    setEditValues({});
  };

  const saveEdit = async (record) => {
    const updated = {
      ...record,
      morningIn:    editValues.morningIn    || null,
      morningOut:   editValues.morningOut   || null,
      afternoonIn:  editValues.afternoonIn  || null,
      afternoonOut: editValues.afternoonOut || null,
    };
    await upsertRecord(updated);
    setEditingKey(null);
    setEditValues({});
    await reload();
  };

  // 'pending' or 'approved'
  const [activeTab, setActiveTab] = useState('pending');

  const filteredRecords = records
    .filter(r => r.date.startsWith(filterMonth))
    .filter(r => activeTab === 'pending' ? !r.approved : r.approved)
    .sort((a, b) => b.date.localeCompare(a.date));

  return (
    <div className="app-container page-transition">
      <header className="header" style={{ background: '#1e293b', color: 'white', border: 'none' }}>
        <button onClick={onBack} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
          <ArrowLeft size={24} color="white" />
        </button>
        <span className="header-title" style={{ background: 'white', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          管理者メニュー
        </span>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button onClick={onViewQRCode} title="QRコードを表示" style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
            <QrCode size={24} color="white" />
          </button>
          <button onClick={onViewReport} title="レポートを表示" style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
            <BarChart2 size={24} color="white" />
          </button>
        </div>
      </header>

      <main style={{ padding: '1rem' }}>
        {/* 月選択 */}
        <div className="card" style={{ marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
            <Calendar size={18} color="var(--primary)" />
            <span style={{ fontWeight: 700 }}>表示する月を選択</span>
          </div>
          <input
            type="month"
            value={filterMonth}
            onChange={(e) => setFilterMonth(e.target.value)}
            style={{ width: '100%', padding: '0.75rem', borderRadius: '0.75rem', border: '1px solid var(--border)', boxSizing: 'border-box' }}
          />
        </div>

        {/* QRコード表示エリア */}
        <div className="card" style={{ marginBottom: '1.5rem', background: '#f8fafc', border: '1px solid #e2e8f0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
            <QrCode size={18} color="var(--secondary)" />
            <span style={{ fontWeight: 700 }}>打刻用QRコード</span>
          </div>
          <button
            onClick={onViewQRCode}
            className="btn btn-primary"
            style={{ background: 'var(--secondary)', fontSize: '0.875rem' }}
          >
            <QrCode size={18} />
            QRコードを表示・印刷する
          </button>
        </div>

        {/* 登録従業員の管理 */}
        <details className="card" style={{ marginBottom: '1.5rem', padding: '1rem' }}>
          <summary style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 700, cursor: 'pointer', outline: 'none' }}>
            <Users size={18} color="var(--primary)" />
            <span>登録従業員の管理（解除など）</span>
          </summary>
          <div style={{ display: 'grid', gap: '0.5rem', marginTop: '1rem' }}>
            {employees.length === 0 ? (
              <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>登録済みはいません</p>
            ) : (
              employees.map(emp => (
                <div key={emp.id} style={{ 
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center', 
                  padding: '0.6rem 0.75rem', background: '#fff', borderRadius: '0.6rem', border: '1px solid #eee' 
                }}>
                  <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>{emp.name}</span>
                  <button onClick={() => handleDeleteEmployee(emp)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                    <Trash2 size={14} /> 解除
                  </button>
                </div>
              ))
            )}
          </div>
        </details>

        {/* タブ切り替え */}
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', background: '#f1f5f9', padding: '0.3rem', borderRadius: '0.75rem' }}>
          <button
            onClick={() => setActiveTab('pending')}
            style={{
              flex: 1, padding: '0.6rem', borderRadius: '0.6rem', border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: '0.875rem',
              background: activeTab === 'pending' ? 'white' : 'transparent',
              boxShadow: activeTab === 'pending' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
              color: activeTab === 'pending' ? 'var(--primary)' : 'var(--text-muted)'
            }}
          >
            未承認 ({records.filter(r => r.date.startsWith(filterMonth) && !r.approved).length})
          </button>
          <button
            onClick={() => setActiveTab('approved')}
            style={{
              flex: 1, padding: '0.6rem', borderRadius: '0.6rem', border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: '0.875rem',
              background: activeTab === 'approved' ? 'white' : 'transparent',
              boxShadow: activeTab === 'approved' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
              color: activeTab === 'approved' ? 'var(--primary)' : 'var(--text-muted)'
            }}
          >
            承認済み ({records.filter(r => r.date.startsWith(filterMonth) && r.approved).length})
          </button>
        </div>

        <h3 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1rem' }}>
          {activeTab === 'pending' ? <Clock size={18} /> : <CheckCircle size={18} color="#10b981" />}
          {activeTab === 'pending' ? '承認待ちの記録' : '承認済みの記録'}（{filteredRecords.length}件）
        </h3>

        {filteredRecords.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-muted)' }}>
            <p>{activeTab === 'pending' ? '未承認の記録はありません' : '承認済みの記録はありません'}</p>
          </div>
        ) : (
          filteredRecords.map(record => {
            const emp = employees.find(e => e.id === record.employeeId);
            const key = `${record.employeeId}-${record.date}`;
            const isEditing = editingKey === key;

            return (
              <div key={key} className="card" style={{ padding: '1rem', marginBottom: '1rem' }}>
                {/* ヘッダー行 */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                  <div>
                    <span style={{ fontWeight: 800, fontSize: '1.1rem' }}>{emp?.name || '不明'}</span>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{formatDateJP(record.date)}</p>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <div className={`badge ${record.approved ? 'badge-success' : 'badge-pending'}`}>
                      {record.approved ? '承認済み' : '未承認'}
                    </div>
                    {!isEditing && (
                      <button
                        onClick={() => startEdit(record)}
                        title="時刻を修正"
                        style={{ background: 'none', border: '1px solid var(--border)', borderRadius: '0.5rem', padding: '0.3rem 0.5rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}
                      >
                        <Edit2 size={13} />
                        修正
                      </button>
                    )}
                    {!isEditing && (
                      <button
                        onClick={() => handleReset(record.employeeId, record.date)}
                        title="記録をリセット"
                        style={{ background: 'none', border: '1px solid #fee2e2', borderRadius: '0.5rem', padding: '0.3rem 0.5rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.75rem', color: '#ef4444' }}
                      >
                        <Trash2 size={13} />
                        リセット
                      </button>
                    )}
                  </div>
                </div>

                {/* 打刻時間（表示 or 編集） */}
                {isEditing ? (
                  <div style={{ marginBottom: '1rem' }}>
                    <p style={{ fontSize: '0.75rem', color: 'var(--primary)', fontWeight: 700, marginBottom: '0.75rem' }}>🖊 時刻を修正してください</p>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                      {TIME_FIELDS.map(({ key: fKey, label }) => (
                        <div key={fKey}>
                          <label style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.2rem' }}>{label}</label>
                          <input
                            type="time"
                            value={editValues[fKey]}
                            onChange={e => setEditValues(v => ({ ...v, [fKey]: e.target.value }))}
                            style={{ width: '100%', padding: '0.4rem', borderRadius: '0.5rem', border: '1px solid var(--border)', fontSize: '0.875rem', boxSizing: 'border-box' }}
                          />
                        </div>
                      ))}
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem' }}>
                      <button
                        onClick={() => saveEdit(record)}
                        style={{ flex: 1, padding: '0.6rem', background: 'var(--secondary)', color: 'white', border: 'none', borderRadius: '0.75rem', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}
                      >
                        <Save size={15} />保存
                      </button>
                      <button
                        onClick={cancelEdit}
                        style={{ flex: 1, padding: '0.6rem', background: '#f1f5f9', border: 'none', borderRadius: '0.75rem', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem', color: 'var(--text-muted)' }}
                      >
                        <X size={15} />キャンセル
                      </button>
                    </div>
                  </div>
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', fontSize: '0.8rem', marginBottom: '1rem' }}>
                    <div style={{ padding: '0.6rem', background: '#f8fafc', borderRadius: '0.5rem', border: '1px solid #e2e8f0' }}>
                      <p style={{ color: 'var(--text-muted)', marginBottom: '0.25rem' }}>出勤・退勤：{record.morningIn || '--:--'} 〜 {record.afternoonOut || '--:--'}</p>
                      <p style={{ color: '#db2777' }}>休憩時間：{record.morningOut || '--:--'} 〜 {record.afternoonIn || '--:--'} ({minutesToDisplay(calcBreakMinutes(record))})</p>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', background: '#eff6ff', borderRadius: '0.5rem', border: '1px solid #dbeafe' }}>
                      <span style={{ fontSize: '0.65rem', color: 'var(--primary)' }}>実労働時間</span>
                      <span style={{ fontWeight: 800, color: 'var(--primary)', fontSize: '1.1rem' }}>{minutesToDisplay(calcDailyMinutes(record))}</span>
                    </div>
                  </div>
                )}

                {/* 承認ボタン */}
                {!record.approved ? (
                  <button
                    className="btn btn-primary"
                    style={{ background: 'var(--secondary)', fontSize: '0.875rem' }}
                    onClick={() => handleApprove(record.employeeId, record.date)}
                  >
                    <CheckCircle size={18} />
                    この日の記録を承認する
                  </button>
                ) : (
                  <button
                    className="btn btn-outline"
                    style={{ color: '#ef4444', fontSize: '0.875rem', borderColor: '#fee2e2' }}
                    onClick={() => handleUnapprove(record.employeeId, record.date)}
                  >
                    <XCircle size={18} />
                    承認を取り消す
                  </button>
                )}
              </div>
            );
          })
        )}
      </main>
    </div>
  );
}
