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

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2rem' }}>
          {/* ユニバーサルQR */}
          <div className="card" style={{ textAlign: 'center', padding: '2rem', border: '3px solid var(--secondary)', maxWidth: '500px', width: '100%' }}>
            <div style={{ background: '#f5f3ff', color: 'var(--secondary)', display: 'inline-block', padding: '0.4rem 1.5rem', borderRadius: '1.5rem', fontWeight: 800, fontSize: '1.2rem', marginBottom: '1.5rem' }}>
              打刻用 共通QRコード
            </div>
            <div style={{ background: 'white', padding: '1.5rem', borderRadius: '1rem', display: 'inline-block', border: '1px solid #e2e8f0', marginBottom: '1.5rem' }}>
              <QRCodeSVG value={QR_IN} size={320} level="H" includeMargin={true} />
            </div>
            <p style={{ fontSize: '1rem', color: 'var(--text-main)', fontWeight: 700, lineHeight: 1.6 }}>
              これ1つで「出勤」も「退勤」も完結します。<br/>
              スキャンのたびに、自動で次の状態へ進みます。
            </p>
          </div>
        </div>

        <div className="card no-print" style={{ marginTop: '2rem', background: '#f8fafc' }}>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '0.75rem', fontWeight: 700 }}>【究極にシンプルな使いかた】</p>
          <ul style={{ fontSize: '0.875rem', color: 'var(--text-main)', paddingLeft: '1.2rem', lineHeight: 2 }}>
            <li><strong>QRコードはこれ1枚だけ</strong>でOKです。</li>
            <li>スタッフは何も考えず、このQRコードをスキャンするだけ。</li>
            <li>「今、出勤なのか退勤なのか」はシステムが自動で判別します。</li>
            <li>（例：朝スキャンすれば出勤、昼前にスキャンすれば退勤…と自動で進みます）</li>
          </ul>
          <button className="btn btn-primary" onClick={handlePrint} style={{ marginTop: '1rem', width: '100%' }}>
            <Printer size={18} />
            このQRコードを印刷する
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
