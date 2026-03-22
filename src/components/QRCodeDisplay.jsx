import React from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { ArrowLeft, Printer } from 'lucide-react';

// 打刻に使用するQRコードの内容
const QR_IN  = 'WAKAMATSAYA-KINTAI-IN-2026';
const QR_OUT = 'WAKAMATSAYA-KINTAI-OUT-2026';

export default function QRCodeDisplay({ onBack }) {
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="app-container page-transition">
      <header className="header no-print">
        <button onClick={onBack} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)' }}>
          <ArrowLeft size={24} />
        </button>
        <span className="header-title">打刻用QRコード</span>
        <button onClick={handlePrint} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
          <Printer size={24} />
        </button>
      </header>

      <main style={{ padding: '2rem 1rem' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }} className="no-print">
          <h2 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '0.5rem' }}>
            勤怠打刻用QRコード
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
            それぞれのQRコードを印刷して掲示してください
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
          {/* 出勤用 */}
          <div className="card" style={{ textAlign: 'center', padding: '1.5rem', border: '2px solid #10b981' }}>
            <div style={{ background: '#d1fae5', color: '#065f46', display: 'inline-block', padding: '0.25rem 1rem', borderRadius: '1rem', fontWeight: 800, fontSize: '0.9rem', marginBottom: '1rem' }}>
              出勤用 (IN)
            </div>
            <div style={{ background: 'white', padding: '1rem', borderRadius: '0.5rem', display: 'inline-block', border: '1px solid #e2e8f0', marginBottom: '1rem' }}>
              <QRCodeSVG value={QR_IN} size={200} level="H" includeMargin={true} />
            </div>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>コード: {QR_IN}</p>
          </div>

          {/* 退勤用 */}
          <div className="card" style={{ textAlign: 'center', padding: '1.5rem', border: '2px solid #ef4444' }}>
            <div style={{ background: '#fee2e2', color: '#991b1b', display: 'inline-block', padding: '0.25rem 1rem', borderRadius: '1rem', fontWeight: 800, fontSize: '0.9rem', marginBottom: '1rem' }}>
              退勤用 (OUT)
            </div>
            <div style={{ background: 'white', padding: '1rem', borderRadius: '0.5rem', display: 'inline-block', border: '1px solid #e2e8f0', marginBottom: '1rem' }}>
              <QRCodeSVG value={QR_OUT} size={200} level="H" includeMargin={true} />
            </div>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>コード: {QR_OUT}</p>
          </div>
        </div>

        <div className="card no-print" style={{ marginTop: '2rem', background: '#f8fafc' }}>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.5rem', fontWeight: 700 }}>【使い方】</p>
          <ol style={{ fontSize: '0.8rem', color: 'var(--text-main)', paddingLeft: '1.2rem', lineHeight: 1.8 }}>
            <li>「出勤用」と「退勤用」をそれぞれ印刷して掲示する</li>
            <li>スタッフはアプリの「打刻」ボタンを押す</li>
            <li>状況に合わせて正しい方のQRコードをスキャンする</li>
          </ol>
          <button className="btn btn-primary" onClick={handlePrint} style={{ marginTop: '1rem', width: '100%' }}>
            <Printer size={18} />
            QRコードを印刷する
          </button>
        </div>
      </main>

      <style>{`
        @media print {
          .no-print { display: none !important; }
          .app-container { max-width: 100% !important; padding: 0 !important; }
          .card { border: 2px solid #ccc !important; break-inside: avoid; margin-bottom: 2rem !important; }
        }
      `}</style>
    </div>
  );
}
