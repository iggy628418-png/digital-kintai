import React, { useEffect, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { X, Camera, RefreshCw, KeyRound } from 'lucide-react';

export default function Scanner({ onScan, onClose }) {
  const [cameras, setCameras] = useState([]);
  const [activeCamera, setActiveCamera] = useState(null);
  const [scanner, setScanner] = useState(null);
  const [error, setError] = useState('');
  const [manualMode, setManualMode] = useState(false);
  const [manualCode, setManualCode] = useState('');

  useEffect(() => {
    const html5QrCode = new Html5Qrcode("reader");
    setScanner(html5QrCode);

    Html5Qrcode.getCameras().then(devices => {
      if (devices && devices.length > 0) {
        setCameras(devices);
        // Default to rear-facing camera
        const initialCamera = { facingMode: "environment" };
        setActiveCamera(initialCamera);
        startScanner(html5QrCode, initialCamera);
      } else {
        setError('カメラが見つかりませんでした。');
      }
    }).catch(err => {
      console.error('Camera error:', err);
      setError('カメラのアクセス権限を確認してください。');
    });

    return () => {
      if (html5QrCode.isScanning) {
        html5QrCode.stop().catch(err => console.error("Failed to stop scanner", err));
      }
    };
  }, []);

  const startScanner = (scannerInstance, cameraConfig) => {
    scannerInstance.start(
      cameraConfig,
      {
        fps: 10,
        qrbox: { width: 250, height: 250 }
      },
      (decodedText) => {
        scannerInstance.stop().then(() => {
          onScan(decodedText);
        });
      },
      (errorMessage) => {
        // スキャン中のエラーは無視
      }
    ).catch(err => {
      setError('スキャンの開始に失敗しました。');
    });
  };

  const switchCamera = () => {
    if (!scanner || cameras.length < 2) return;
    
    // Find next camera in the devices list
    let nextIndex = 0;
    if (typeof activeCamera === 'string') {
      const currentIndex = cameras.findIndex(c => c.id === activeCamera);
      nextIndex = (currentIndex + 1) % cameras.length;
    } else {
      // If was object-based config, just pick the first one (or second)
      nextIndex = 1;
    }
    
    const nextCamera = cameras[nextIndex];

    if (scanner.isScanning) {
      scanner.stop().then(() => {
        setActiveCamera(nextCamera.id);
        startScanner(scanner, nextCamera.id);
      }).catch(err => {
        console.error("Stop failed during switch", err);
      });
    }
  };

  const handleManualSubmit = () => {
    const code = manualCode.trim();
    if (!code) return;
    onScan(code);
  };

  return (
    <div className="scanner-overlay">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        {!manualMode && (
          <button 
            onClick={switchCamera} 
            style={{ background: 'rgba(255,255,255,0.2)', border: 'none', color: 'white', cursor: 'pointer', padding: '0.75rem', borderRadius: '0.75rem', display: cameras.length > 1 ? 'flex' : 'none', alignItems: 'center', gap: '0.5rem' }}
          >
            <RefreshCw size={20} />
            カメラ切替
          </button>
        )}
        {manualMode && <div />}
        <button 
          onClick={onClose} 
          style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer' }}
        >
          <X size={32} />
        </button>
      </div>
      
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
        {manualMode ? (
          /* ===== 手動入力モード ===== */
          <div style={{ background: 'rgba(255,255,255,0.1)', padding: '2rem', borderRadius: '1rem', textAlign: 'center' }}>
            <KeyRound size={48} color="white" style={{ marginBottom: '1rem' }} />
            <p style={{ color: 'white', fontWeight: 700, fontSize: '1.1rem', marginBottom: '0.5rem' }}>
              打刻コードを入力
            </p>
            <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.85rem', marginBottom: '1.5rem' }}>
              QRコードの下に表示されている<br/><strong>打刻コード（例: 2026PUNCH）</strong>を入力してください
            </p>
            <input
              type="text"
              value={manualCode}
              onChange={e => setManualCode(e.target.value.toUpperCase())}
              onKeyDown={e => e.key === 'Enter' && handleManualSubmit()}
              placeholder="2026PUNCH"
              style={{
                width: '100%',
                padding: '0.75rem 1rem',
                borderRadius: '0.75rem',
                border: '2px solid rgba(255,255,255,0.3)',
                background: 'rgba(255,255,255,0.15)',
                color: 'white',
                fontSize: '1rem',
                outline: 'none',
                boxSizing: 'border-box',
                marginBottom: '1rem',
                textAlign: 'center',
              }}
              autoFocus
            />
            <button
              onClick={handleManualSubmit}
              style={{
                width: '100%',
                padding: '0.875rem',
                borderRadius: '0.75rem',
                border: 'none',
                background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                color: 'white',
                fontWeight: 700,
                fontSize: '1rem',
                cursor: 'pointer',
                marginBottom: '0.75rem',
              }}
            >
              打刻する
            </button>
            <button
              onClick={() => setManualMode(false)}
              style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.6)', cursor: 'pointer', fontSize: '0.875rem' }}
            >
              ← カメラに戻る
            </button>
          </div>
        ) : error ? (
          /* ===== カメラエラー ===== */
          <div style={{ background: 'rgba(239, 68, 68, 0.2)', padding: '1.5rem', borderRadius: '1rem', color: '#fca5a5', textAlign: 'center' }}>
            <Camera size={48} style={{ marginBottom: '1rem' }} />
            <p style={{ fontWeight: 700, marginBottom: '1rem' }}>{error}</p>
            <p style={{ fontSize: '0.8rem', opacity: 0.8, marginBottom: '1.5rem' }}>
              HTTPSの証明書エラーか、カメラ権限が拒否されている可能性があります。<br/>
              手動でコードを入力して打刻することもできます。
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <button
                onClick={() => setManualMode(true)}
                style={{ 
                  background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', 
                  border: 'none', 
                  color: 'white', 
                  padding: '0.875rem 1.5rem', 
                  borderRadius: '0.75rem', 
                  fontWeight: 700,
                  cursor: 'pointer',
                  fontSize: '1rem',
                }}
              >
                <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                  <KeyRound size={18} />
                  コードを手動入力して打刻する
                </span>
              </button>
              <button 
                onClick={() => window.location.reload()} 
                style={{ background: 'rgba(255,255,255,0.15)', color: '#fca5a5', border: '1px solid rgba(252,165,165,0.3)', padding: '0.5rem 1rem', borderRadius: '0.5rem', fontWeight: 700, cursor: 'pointer' }}
              >
                再読み込み
              </button>
            </div>
          </div>
        ) : (
          /* ===== QRスキャンモード ===== */
          <>
            <div id="reader"></div>
            <div style={{ color: 'white', textAlign: 'center', marginTop: '2rem' }}>
              <p style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.5rem' }}>
                QRコードをスキャン
              </p>
              <p style={{ opacity: 0.7, marginBottom: '1rem' }}>打刻用QRコードを枠内に収めてください</p>
              <button
                onClick={() => setManualMode(true)}
                style={{ background: 'none', border: '1px solid rgba(255,255,255,0.3)', color: 'rgba(255,255,255,0.7)', padding: '0.5rem 1rem', borderRadius: '0.5rem', cursor: 'pointer', fontSize: '0.875rem' }}
              >
                コードを手動入力する
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
