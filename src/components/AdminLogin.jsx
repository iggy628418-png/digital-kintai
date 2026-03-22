import React, { useState } from 'react';
import { Lock, ArrowLeft } from 'lucide-react';
import { verifyAdminPassword } from '../utils/storage';

export default function AdminLogin({ onLogin, onBack }) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (await verifyAdminPassword(password)) {
      onLogin();
    } else {
      setError(true);
      setPassword('');
    }
  };

  return (
    <div className="app-container page-transition" style={{ padding: '1rem', display: 'flex', flexDirection: 'column' }}>
      {/* 戻るボタンエリア：ヘッダーのクラスを使わず、シンプルに配置 */}
      <div style={{ padding: '1rem 0', marginBottom: '1rem' }}>
        <button 
          onClick={onBack} 
          style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)' }}
        >
          <ArrowLeft size={24} />
          <span>戻る</span>
        </button>
      </div>

      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%' }}>
        <div className="card" style={{ width: '100%', maxWidth: '360px', position: 'relative', zIndex: 1 }}>
          <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <div style={{ 
              width: 64, height: 64, borderRadius: '1.25rem', background: '#334155', 
              display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem',
              color: 'white'
            }}>
              <Lock size={32} />
            </div>
            <h2 className="card-title">管理者ログイン</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
              会社用パスワードを入力してください
            </p>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="input-group">
              <label className="input-label">パスワード</label>
              <input 
                type="password" 
                value={password} 
                onChange={(e) => { setPassword(e.target.value); setError(false); }}
                placeholder="パスワードを入力"
                required
                autoFocus
                style={{ 
                  borderColor: error ? '#ef4444' : 'var(--border)',
                  background: 'white',
                  cursor: 'text'
                }}
              />
              {error && <p style={{ color: '#ef4444', fontSize: '0.75rem', marginTop: '0.5rem' }}>パスワードが正しくありません</p>}
            </div>
            <button type="submit" className="btn btn-primary" style={{ background: '#334155' }}>
              ログイン
            </button>
          </form>
          
          <p style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.7rem', color: 'var(--text-muted)' }}>
            ※初期パスワード：admin1234
          </p>
        </div>
      </div>
    </div>
  );
}
