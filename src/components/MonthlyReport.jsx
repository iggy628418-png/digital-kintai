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
    <div className="report-container">
      {/* ヘッダー（印刷時非表示） */}
      <header className="header no-print" style={{ background: '#1e293b', color: 'white', border: 'none' }}>
        <button onClick={onBack} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
          <ArrowLeft size={24} color="white" />
        </button>
        <span className="header-title" style={{ background: 'white', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          勤務集計レポート
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

      <main className="no-print" style={{ padding: '1rem' }}>
        {/* 月選択（印刷時非表示） */}
        <div className="card" style={{ marginBottom: '1.5rem' }}>
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
              <Download size={16} />CSV保存
            </button>
            <button onClick={handlePrint} className="btn btn-primary" style={{ flex: 1, fontSize: '0.875rem', background: '#334155' }}>
              <Printer size={16} />印刷用表示
            </button>
          </div>
        </div>

        <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', textAlign: 'center' }}>
          ※「印刷用表示」ボタンを押すと、写真のようなフォーマットで1人1ページずつ出力されます。
        </div>
      </main>

      {/* 印刷用プレビュー / 実際の印刷内容 */}
      <div className="print-content">
        {summaries.map(({ emp, dailyData }) => (
          <div key={emp.id} className="print-page">
            <div className="print-header">
              <div className="print-ym">
                <span className="ym-year">{y}</span>年
                <span className="ym-month">{Number(m)}</span>月
              </div>
              <h1 className="print-title">勤務表</h1>
              <div className="print-name-box">
                氏名 <span className="print-name">{emp.name}</span>
              </div>
            </div>

            <table className="print-table">
              <thead>
                <tr>
                  <th rowSpan={2} style={{ width: '15%' }}>月/日 (曜日)</th>
                  <th colSpan={3}>午前</th>
                  <th colSpan={3}>午後</th>
                  <th rowSpan={2} style={{ width: '10%' }}>確認印</th>
                </tr>
                <tr>
                  <th>開始</th>
                  <th>休憩</th>
                  <th>終了</th>
                  <th>開始</th>
                  <th>休憩</th>
                  <th>終了</th>
                </tr>
              </thead>
              <tbody>
                {dailyData.map(d => {
                  const dateObj = new Date(d.date);
                  const days = ['日', '月', '火', '水', '木', '金', '土'];
                  const dow = days[dateObj.getDay()];
                  const isWeekend = dateObj.getDay() === 0 || dateObj.getDay() === 6;

                  return (
                    <tr key={d.date} className={isWeekend ? 'weekend-row' : ''}>
                      <td className="center">
                        {dateObj.getDate()}日 ({dow})
                      </td>
                      <td className="center">{d.morningIn || ''}</td>
                      <td className="center"></td>
                      <td className="center">{d.morningOut || ''}</td>
                      <td className="center">{d.afternoonIn || ''}</td>
                      <td className="center"></td>
                      <td className="center">{d.afternoonOut || ''}</td>
                      <td className="center">
                        {d.approved && <div className="stamp-placeholder">印</div>}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            <div className="print-footer">
              <div className="footer-item">勤務</div>
              <div className="footer-item">公休</div>
              <div className="footer-item">休業</div>
              <div className="footer-item">有給</div>
            </div>
          </div>
        ))}
      </div>

      <style>{`
        .print-content {
          padding: 2rem;
          background: #f1f5f9;
        }
        .print-page {
          background: white;
          width: 210mm;
          min-height: 297mm;
          padding: 20mm 15mm;
          margin: 0 auto 2rem auto;
          box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);
          color: black;
          font-family: "Sawarabi Mincho", "Hiragino Mincho ProN", serif;
        }
        .print-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
          margin-bottom: 2rem;
        }
        .print-ym {
          font-size: 1.2rem;
          border-bottom: 1px solid black;
          padding-bottom: 4px;
        }
        .ym-year, .ym-month {
          font-size: 1.5rem;
          margin-right: 4px;
        }
        .print-title {
          font-size: 2rem;
          font-weight: normal;
          letter-spacing: 0.5em;
          margin: 0;
        }
        .print-name-box {
          font-size: 1.2rem;
          border-bottom: 1px solid black;
          min-width: 200px;
          text-align: left;
        }
        .print-name {
          font-size: 1.4rem;
          margin-left: 1rem;
        }
        .print-table {
          width: 100%;
          border-collapse: collapse;
          border: 2px solid black;
        }
        .print-table th, .print-table td {
          border: 1px solid black;
          height: 2rem;
          padding: 4px;
        }
        .print-table th {
          background: #f8f8f8;
          font-weight: normal;
          font-size: 0.9rem;
        }
        .center { text-align: center; }
        .weekend-row { background: #fcfcfc; }
        
        .stamp-placeholder {
          width: 24px;
          height: 24px;
          border: 1px solid #ef4444;
          border-radius: 50%;
          color: #ef4444;
          font-size: 0.6rem;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto;
        }

        .print-footer {
          margin-top: 2rem;
          display: flex;
          gap: 2rem;
          font-size: 0.9rem;
        }

        @media print {
          title { display: none; }
          .no-print { display: none !important; }
          .print-content { padding: 0; background: none; }
          .print-page {
            box-shadow: none;
            margin: 0;
            width: 100%;
            height: auto;
            break-after: page;
          }
          body { background: white; }
          @page {
            size: A4;
            margin: 0;
          }
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
