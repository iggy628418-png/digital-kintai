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
          {/* 午前用 */}
          <div className="card" style={{ textAlign: 'center', padding: '1.5rem', border: '2px solid var(--primary)' }}>
            <div style={{ background: '#eff6ff', color: 'var(--primary)', display: 'inline-block', padding: '0.25rem 1rem', borderRadius: '1rem', fontWeight: 800, fontSize: '1rem', marginBottom: '1rem' }}>
              午前用 (出勤・退勤 共通)
            </div>
            <div style={{ background: 'white', padding: '1rem', borderRadius: '0.5rem', display: 'inline-block', border: '1px solid #e2e8f0', marginBottom: '1rem' }}>
              <QRCodeSVG value={QR_IN} size={240} level="H" includeMargin={true} />
            </div>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-main)', fontWeight: 700 }}>1回目で出勤、2回目で退勤になります</p>
          </div>

          {/* 午後用 */}
          <div className="card" style={{ textAlign: 'center', padding: '1.5rem', border: '2px solid var(--secondary)' }}>
            <div style={{ background: '#f5f3ff', color: 'var(--secondary)', display: 'inline-block', padding: '0.25rem 1rem', borderRadius: '1rem', fontWeight: 800, fontSize: '1rem', marginBottom: '1rem' }}>
              午後用 (出勤・退勤 共通)
            </div>
            <div style={{ background: 'white', padding: '1rem', borderRadius: '0.5rem', display: 'inline-block', border: '1px solid #e2e8f0', marginBottom: '1rem' }}>
              <QRCodeSVG value={QR_OUT} size={240} level="H" includeMargin={true} />
            </div>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-main)', fontWeight: 700 }}>1回目で出勤、2回目で退勤になります</p>
          </div>
        </div>

        <div className="card no-print" style={{ marginTop: '2rem', background: '#f8fafc' }}>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '0.75rem', fontWeight: 700 }}>【新しい使いかた】</p>
          <ul style={{ fontSize: '0.875rem', color: 'var(--text-main)', paddingLeft: '1.2rem', lineHeight: 2 }}>
            <li>午前と午後の2つのQRコードだけで運用できます。</li>
            <li><strong>1回目のスキャンで「出勤」</strong>、<strong>2回目のスキャンで「退勤」</strong>が自動的に記録されます。</li>
            <li>QRコードを印刷して、スタッフが読み取りやすい場所に掲示してください。</li>
          </ul>
          <button className="btn btn-primary" onClick={handlePrint} style={{ marginTop: '1rem', width: '100%' }}>
            <Printer size={18} />
            このページを印刷する
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
