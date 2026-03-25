import React, { useState, useEffect } from 'react';
import { ArrowLeft, Download, Printer, BarChart2, FileText } from 'lucide-react';
import html2pdf from 'html2pdf.js';
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
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [selectedEmpId, setSelectedEmpId] = useState(null);
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
      if (emps.length > 0 && !selectedEmpId) {
        setSelectedEmpId(emps[0].id);
      }
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
    const header = ['従業員名', '日付', '午前・開始', '午前・終了', '午後・開始', '午後・終了', '休憩時間計', '労働時間計', '承認印'];
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

  const handleDownloadPDF = async () => {
    if (isGeneratingPDF) return;
    setIsGeneratingPDF(true);
    
    const element = document.querySelector('.print-content');
    element.classList.add('is-generating');
    
    const originalGap = element.style.gap;
    const originalPadding = element.style.padding;
    element.style.gap = '0';
    element.style.padding = '0';

    const opt = {
      margin:       0,
      filename:     `勤務表_全て_${month}.pdf`,
      image:        { type: 'jpeg', quality: 0.98 },
      html2canvas:  { scale: 2, useCORS: true, letterRendering: true },
      jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' },
      pagebreak:    { mode: ['avoid-all', 'css', 'legacy'] }
    };

    try {
      await html2pdf().from(element).set(opt).save();
    } catch (error) {
      console.error('PDF Generation error:', error);
      alert('PDFの作成中にエラーが発生しました。');
    } finally {
      element.classList.remove('is-generating');
      element.style.gap = originalGap;
      element.style.padding = originalPadding;
      setIsGeneratingPDF(false);
    }
  };

  const handleDownloadSinglePDF = async (emp, empMonthData) => {
    const element = document.getElementById(`print-page-${emp.id}`);
    if (!element) return;
    
    const opt = {
      margin:       0,
      filename:     `勤務表_${emp.name}_${month}.pdf`,
      image:        { type: 'jpeg', quality: 0.98 },
      html2canvas:  { scale: 2, useCORS: true },
      jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };

    try {
      await html2pdf().from(element).set(opt).save();
    } catch (error) {
      console.error('Single PDF error:', error);
      alert('PDF出力に失敗しました。');
    }
  };

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
          勤怠集計
        </span>
        <div style={{ display: 'flex', gap: '0.4rem' }}>
          <button onClick={downloadCSV} title="CSVダウンロード" style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
            <Download size={20} color="white" />
          </button>
          <button onClick={handleDownloadPDF} title="全てPDF" disabled={isGeneratingPDF} style={{ background: 'none', border: 'none', cursor: 'pointer', opacity: isGeneratingPDF ? 0.5 : 1 }}>
            <FileText size={20} color="white" />
          </button>
          <button onClick={handlePrint} title="印刷" style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
            <Printer size={20} color="white" />
          </button>
        </div>
      </header>

      <main className="no-print" style={{ padding: '1rem' }}>
        {/* 月選択 */}
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
        </div>

        {/* 従業員一覧と個別出力 */}
        <div className="card" style={{ marginBottom: '1.5rem', padding: '1rem' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 800, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Download size={18} /> 個別・一括出力
          </h3>
          <div style={{ display: 'grid', gap: '0.75rem' }}>
            {summaries.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>データがありません</p>
            ) : (
              summaries.map(s => (
                <div key={s.emp.id} 
                  onClick={() => setSelectedEmpId(s.emp.id)}
                  style={{ 
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center', 
                    padding: '0.75rem', 
                    background: selectedEmpId === s.emp.id ? '#eff6ff' : '#f8fafc', 
                    borderRadius: '0.75rem', 
                    border: selectedEmpId === s.emp.id ? '2px solid #3b82f6' : '1px solid #e2e8f0',
                    cursor: 'pointer'
                  }}>
                  <div style={{ textAlign: 'left' }}>
                    <div style={{ fontWeight: 700, fontSize: '0.9rem', color: selectedEmpId === s.emp.id ? '#1d4ed8' : 'inherit' }}>
                      {s.emp.name} {selectedEmpId === s.emp.id && ' (閲覧中)'}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>実働: {minutesToDisplay(s.totalMinutes)} / 出勤: {s.workDays}日</div>
                  </div>
                  <button onClick={(e) => { e.stopPropagation(); handleDownloadSinglePDF(s.emp, s); }} className="btn btn-outline" style={{ padding: '0.4rem 0.8rem', fontSize: '0.75rem', background: 'white' }}>
                    <FileText size={14} /> PDF
                  </button>
                </div>
              ))
            )}
            {/* 全て表示へのリセットボタン（デバッグ・確認用） */}
            {selectedEmpId && (
              <button 
                onClick={() => setSelectedEmpId(null)} 
                style={{ background: 'none', border: 'none', color: '#6366f1', fontSize: '0.8rem', cursor: 'pointer', marginTop: '0.5rem', fontWeight: 700 }}
              >
                ← 全従業員を一覧表示する
              </button>
            )}
          </div>

          <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1.5rem' }}>
            <button onClick={handleDownloadPDF} className="btn btn-primary" disabled={isGeneratingPDF} style={{ flex: 1, fontSize: '0.8rem', background: '#4f46e5' }}>
              <FileText size={16} /> {isGeneratingPDF ? '作成中...' : '全て保存'}
            </button>
            <button onClick={handlePrint} className="btn btn-primary" style={{ flex: 1, fontSize: '0.8rem', background: '#334155' }}>
              <Printer size={16} /> 印刷/保存
            </button>
          </div>
        </div>

        <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', textAlign: 'center' }}>
          ※「印刷/保存」ボタンでA4縦の印刷イメージを確認・出力できます。
        </div>
      </main>

      {/* 印刷用プレビュー / 実際の印刷内容 */}
      <div className="print-content">
        {summaries.map(({ emp, dailyData }) => (
          <div key={emp.id} 
            className={`print-page ${(!selectedEmpId || selectedEmpId === emp.id) ? 'is-active' : ''}`} 
            id={`print-page-${emp.id}`}
          >
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
                  <th rowSpan={2} style={{ width: '13%' }}>月/日 (曜日)</th>
                  <th colSpan={2}>午前</th>
                  <th colSpan={2}>午後</th>
                  <th rowSpan={2} style={{ width: '12%' }}>休憩時間計</th>
                  <th rowSpan={2} style={{ width: '12%' }}>労働時間計</th>
                  <th rowSpan={2} style={{ width: '10%' }}>承認印</th>
                </tr>
                <tr>
                  <th>開始</th>
                  <th>終了</th>
                  <th>開始</th>
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
                      <td className="center">{d.morningOut || ''}</td>
                      <td className="center">{d.afternoonIn || ''}</td>
                      <td className="center">{d.afternoonOut || ''}</td>
                      <td className="center">{d.hasData ? minutesToDisplay(d.breakMinutes) : ''}</td>
                      <td className="center">{d.hasData ? minutesToDisplay(d.minutes) : ''}</td>
                      <td className="center">
                        {d.approved && <div className="stamp-placeholder">承</div>}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            <div className="print-footer-group">
              <div className="print-footer">
                <div className="footer-item">実働合計: <strong>{minutesToDisplay(summaries.find(s => s.emp.id === emp.id).totalMinutes)}</strong></div>
                <div className="footer-item">休憩合計: <strong>{minutesToDisplay(summaries.find(s => s.emp.id === emp.id).totalBreakMinutes)}</strong></div>
                <div className="footer-item">出勤日数: <strong>{summaries.find(s => s.emp.id === emp.id).workDays}日</strong></div>
              </div>
              <div className="print-footer second-footer">
                <div className="footer-item">勤務 □</div>
                <div className="footer-item">公休 □</div>
                <div className="footer-item">休業 □</div>
                <div className="footer-item">有給 □</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <style>{`
        .report-container {
          min-height: 100vh;
          background: #f8fafc;
        }
        .print-content {
          padding: 2rem 0;
          background: #e2e8f0;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 2rem;
        }
        .print-page {
          display: none; /* Hide all on screen by default */
          background: white;
          width: 210mm;
          height: 296mm; /* Adjusted to prevent spill into blank page */
          padding: 8mm 15mm;
          margin: 0 auto;
          box-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.1);
          color: black;
          font-family: "Sawarabi Mincho", "Hiragino Mincho ProN", serif;
          box-sizing: border-box;
          position: relative;
          flex-direction: column;
          overflow: hidden;
          page-break-after: always;
        }
        .print-page.is-active {
          display: flex; /* Show selected person or all when filtered is null */
        }
        .print-content.is-generating .print-page {
          display: flex !important; /* Force show for PDF generation */
        }
        .print-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
          margin-bottom: 2mm;
          border-bottom: 2px solid black;
          padding-bottom: 1mm;
        }
        .print-ym {
          font-size: 1.1rem;
          padding-bottom: 2px;
        }
        .ym-year, .ym-month {
          font-size: 1.3rem;
          margin-right: 2px;
          font-weight: bold;
        }
        .print-title {
          font-size: 1.8rem;
          font-weight: normal;
          letter-spacing: 0.5em;
          margin: 0;
          flex-grow: 1;
          text-align: center;
        }
        .print-name-box {
          font-size: 1rem;
          min-width: 200px;
          text-align: right;
        }
        .print-name {
          font-size: 1.3rem;
          margin-left: 0.5rem;
          border-bottom: 1px solid black;
          padding: 0 1rem;
          font-weight: bold;
        }
        .print-table {
          width: 100%;
          border-collapse: collapse;
          border: 1.5px solid black;
          margin-bottom: 5mm;
        }
        .print-table th, .print-table td {
          border: 1px solid black;
          height: 6.8mm; /* Reduced to fit 31 days nicely */
          padding: 1px 4px;
          font-size: 0.85rem;
        }
        .print-table th {
          background: #f1f5f9;
          font-weight: bold;
        }
        .center { text-align: center; }
        .weekend-row { background: #f8fafc; }
        
        .stamp-placeholder {
          width: 22px;
          height: 22px;
          border: 1px solid #ef4444;
          border-radius: 50%;
          color: #ef4444;
          font-size: 0.7rem;
          font-weight: bold;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto;
        }

        .print-footer-group {
          margin-top: auto;
          border-top: 1px dashed #ccc;
          padding-top: 2mm;
        }
        .print-footer {
          display: flex;
          gap: 2rem;
          font-size: 0.9rem;
        }
        .second-footer {
          margin-top: 1mm;
          padding-top: 0;
          border-top: none;
          display: flex;
          gap: 1.5rem;
          font-size: 0.8rem;
          color: #444;
        }

        @media print {
          title { display: none; }
          .no-print { display: none !important; }
          .print-content { 
            padding: 0 !important; 
            margin: 0 !important; 
            background: none !important; 
            display: block !important;
          }
          .print-page {
            box-shadow: none !important;
            margin: 0 !important;
            width: 100% !important;
            height: 100% !important;
            break-after: page;
          }
          @page {
            size: A4 portrait;
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
