import React, { useState, useEffect } from 'react';
import { ArrowLeft, Download, Printer, BarChart2 } from 'lucide-react';
import { getEmployees, getRecords } from '../utils/storage';
import {
  calcDailyMinutes,
  calcBreakMinutes,
  minutesToDisplay,
  formatDateJP,
} from '../utils/timeLogic';

function getMonthDays(yearMonth) {
  const [y, m] = yearMonth.split('-').map(Number);
  const days = [];
  const daysInMonth = new Date(y, m, 0).getDate();
  for (let d = 1; d <= daysInMonth; d++) {
    days.push(`${yearMonth}-${String(d).padStart(2, '0')}`);
  }
  return days;
}

export default function MonthlyReport({ onBack, initialMonth }) {
  const [employees, setEmployees] = useState([]);
  const [records, setRecords]     = useState([]);
  const [month, setMonth]         = useState(initialMonth || (() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  }));

  useEffect(() => {
    const loadData = async () => {
      const emps = await getEmployees();
      const recs = await getRecords();
      setEmployees(emps);
      setRecords(recs);
    };
    loadData();
  }, []);

  const days = getMonthDays(month);
  const monthRecords = records.filter(r => r.date.startsWith(month));

  // 従業員ごとの日次データを集計
  const summaries = employees.map(emp => {
    const empRecords = monthRecords.filter(r => r.employeeId === emp.id);
    const dailyData = days.map(date => {
      const rec = empRecords.find(r => r.date === date);
      return {
        date,
        morningIn:    rec?.morningIn    || '',
        morningOut:   rec?.morningOut   || '',
        afternoonIn:  rec?.afternoonIn  || '',
        afternoonOut: rec?.afternoonOut || '',
        minutes: rec ? calcDailyMinutes(rec) : 0,
        breakMinutes: rec ? calcBreakMinutes(rec) : 0,
        approved: rec?.approved || false,
        hasData: !!rec,
      };
    });
    const totalMinutes = dailyData.reduce((s, d) => s + d.minutes, 0);
    const totalBreakMinutes = dailyData.reduce((s, d) => s + d.breakMinutes, 0);
    const workDays = dailyData.filter(d => d.hasData).length;
    return { emp, dailyData, totalMinutes, totalBreakMinutes, workDays };
  });

  // CSV ダウンロード
  const downloadCSV = () => {
    const header = ['従業員名', '日付', '出勤', '休憩入り', '休憩戻り', '退勤', '休憩時間', '実労働時間', '承認'];
    const rows = [];
    summaries.forEach(({ emp, dailyData }) => {
      dailyData.filter(d => d.hasData).forEach(d => {
        rows.push([
          emp.name,
          d.date,
          d.morningIn,
          d.morningOut,
          d.afternoonIn,
          d.afternoonOut,
          minutesToDisplay(d.breakMinutes),
          minutesToDisplay(d.minutes),
          d.approved ? '承認済み' : '未承認',
        ]);
      });
    });
    const csv = [header, ...rows].map(r => r.join(',')).join('\n');
    const bom = '\uFEFF'; // Excel用BOM
    const blob = new Blob([bom + csv], { type: 'text/csv;charset=utf-8;' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    document.body.appendChild(a);
    a.href     = url;
    a.download = `勤務集計_${month}.csv`;
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handlePrint = () => window.print();

  const [y, m] = month.split('-');
  const monthLabel = `${y}年${Number(m)}月`;

  return (
    <div className="app-container page-transition">
      {/* ヘッダー（印刷時非表示） */}
      <header className="header no-print" style={{ background: '#1e293b', color: 'white', border: 'none' }}>
        <button onClick={onBack} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
          <ArrowLeft size={24} color="white" />
        </button>
        <span className="header-title" style={{ background: 'white', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          月次集計レポート
        </span>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button onClick={downloadCSV} title="CSVダウンロード" style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
            <Download size={22} color="white" />
          </button>
          <button onClick={handlePrint} title="印刷" style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
            <Printer size={22} color="white" />
          </button>
        </div>
      </header>

      <main style={{ padding: '1rem' }}>
        {/* 月選択（印刷時非表示） */}
        <div className="card no-print" style={{ marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
            <BarChart2 size={18} color="var(--primary)" />
            <span style={{ fontWeight: 700 }}>対象月を選択</span>
          </div>
          <input
            type="month"
            value={month}
            onChange={e => setMonth(e.target.value)}
            style={{ width: '100%', padding: '0.75rem', borderRadius: '0.75rem', border: '1px solid var(--border)', boxSizing: 'border-box' }}
          />
          <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.75rem' }}>
            <button onClick={downloadCSV} className="btn btn-outline" style={{ flex: 1, fontSize: '0.875rem' }}>
              <Download size={16} />CSVダウンロード
            </button>
            <button onClick={handlePrint} className="btn btn-primary" style={{ flex: 1, fontSize: '0.875rem', background: '#334155' }}>
              <Printer size={16} />印刷
            </button>
          </div>
        </div>

        {/* 印刷タイトル（印刷時のみ表示） */}
        <div className="print-only" style={{ display: 'none', textAlign: 'center', marginBottom: '1rem' }}>
          <h1 style={{ fontSize: '1.25rem', fontWeight: 800 }}>{monthLabel} 勤務集計表</h1>
        </div>

        {summaries.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
            <p>従業員が登録されていません</p>
          </div>
        ) : (
          summaries.map(({ emp, dailyData, totalMinutes, totalBreakMinutes, workDays }) => (
            <div key={emp.id} className="card report-card" style={{ marginBottom: '1.5rem', padding: '1rem' }}>
              {/* 従業員名 + 月合計 */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                <div>
                  <span style={{ fontWeight: 800, fontSize: '1.1rem' }}>{emp.name}</span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginLeft: '0.5rem' }}>{monthLabel}</span>
                </div>
                <div style={{ display: 'flex', gap: '1rem', fontSize: '0.8rem' }}>
                  <span>出勤日数: <strong>{workDays}日</strong></span>
                  <span>合計: <strong style={{ color: 'var(--primary)' }}>{minutesToDisplay(totalMinutes)}</strong></span>
                </div>
              </div>

              {/* 日別テーブル */}
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.75rem' }}>
                  <thead>
                    <tr style={{ background: '#f1f5f9' }}>
                      <th style={th}>日付</th>
                      <th style={th}>出勤</th>
                      <th style={th}>休憩入り</th>
                      <th style={th}>休憩戻り</th>
                      <th style={th}>退勤</th>
                      <th style={th}>休憩</th>
                      <th style={th}>実働</th>
                      <th style={th}>状態</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dailyData.filter(d => d.hasData).map((d, index) => (
                      <tr key={d.date} style={{ borderBottom: '1px solid #e2e8f0', background: index % 2 === 0 ? 'white' : '#f8fafc' }}>
                        <td style={td}>{formatDateJP(d.date)}</td>
                        <td style={{ ...td, textAlign: 'center' }}>{d.morningIn    || '—'}</td>
                        <td style={{ ...td, textAlign: 'center' }}>{d.morningOut   || '—'}</td>
                        <td style={{ ...td, textAlign: 'center' }}>{d.afternoonIn  || '—'}</td>
                        <td style={{ ...td, textAlign: 'center' }}>{d.afternoonOut || '—'}</td>
                        <td style={{ ...td, textAlign: 'center', color: '#db2777' }}>{d.breakMinutes > 0 ? minutesToDisplay(d.breakMinutes) : '—'}</td>
                        <td style={{ ...td, textAlign: 'center', fontWeight: 700, color: 'var(--primary)' }}>{minutesToDisplay(d.minutes)}</td>
                        <td style={{ ...td, textAlign: 'center' }}>
                          <span style={{
                            fontSize: '0.65rem',
                            padding: '0.2rem 0.5rem',
                            borderRadius: '0.4rem',
                            background: d.approved ? '#d1fae5' : '#fef3c7',
                            color: d.approved ? '#065f46' : '#92400e',
                            fontWeight: 700,
                            border: `1px solid ${d.approved ? '#a7f3d0' : '#fde68a'}`,
                          }}>
                            {d.approved ? '確定' : '未承認'}
                          </span>
                        </td>
                      </tr>
                    ))}
                    {dailyData.filter(d => d.hasData).length === 0 && (
                      <tr>
                        <td colSpan={8} style={{ ...td, textAlign: 'center', color: 'var(--text-muted)', padding: '1rem' }}>
                          この月の記録はありません
                        </td>
                      </tr>
                    )}
                  </tbody>
                  <tfoot>
                    <tr style={{ background: '#eff6ff', fontWeight: 700 }}>
                      <td style={td}>合計</td>
                      <td colSpan={4} style={{ ...td, textAlign: 'center', color: 'var(--text-muted)' }}>{workDays}日</td>
                      <td style={{ ...td, textAlign: 'center', color: '#db2777' }}>{minutesToDisplay(totalBreakMinutes)}</td>
                      <td style={{ ...td, textAlign: 'center', color: 'var(--primary)' }}>{minutesToDisplay(totalMinutes)}</td>
                      <td style={td}></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          ))
        )}
      </main>

      {/* 印刷用スタイル */}
      <style>{`
        @media print {
          .no-print { display: none !important; }
          .print-only { display: block !important; }
          .app-container { max-width: 100% !important; box-shadow: none !important; }
          .report-card { break-inside: avoid; box-shadow: none !important; border: 1px solid #ccc !important; }
          body { font-size: 11px; }
        }
      `}</style>
    </div>
  );
}

const th = {
  padding: '0.4rem 0.5rem',
  textAlign: 'left',
  fontWeight: 700,
  color: 'var(--text-muted)',
  whiteSpace: 'nowrap',
};
const td = {
  padding: '0.4rem 0.5rem',
  whiteSpace: 'nowrap',
};
