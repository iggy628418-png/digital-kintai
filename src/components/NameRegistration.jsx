import React, { useState } from 'react';
import { UserPlus, CheckCircle } from 'lucide-react';
import { addEmployee, setCurrentUser, findEmployeeByName } from '../utils/storage';

export default function NameRegistration({ onComplete }) {
  const [name, setName] = useState('');
  const [existingUser, setExistingUser] = useState(null);
  const [isChecking, setIsChecking] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed || isChecking) return;

    setIsChecking(true);
    try {
      const found = await findEmployeeByName(trimmed);
      if (found) {
        setExistingUser(found);
      } else {
        const user = await addEmployee(trimmed);
        setCurrentUser(user);
        onComplete(user);
      }
    } catch (err) {
      console.error(err);
      alert('通信エラーが発生しました。');
    } finally {
      setIsChecking(false);
    }
  };

  const handleLinkExisting = () => {
    setCurrentUser(existingUser);
    onComplete(existingUser);
  };

  return (
    <div className="app-container page-transition" style={{ justifyContent: 'center', padding: '2rem' }}>
      <div className="card">
        {existingUser ? (
          /* アカウントが見つかった場合の表示 */
          <div style={{ textAlign: 'center', padding: '1rem' }}>
            <div style={{ 
              width: 64, height: 64, borderRadius: '50%', background: '#dcfce7', 
              display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem',
              color: '#16a34a'
            }}>
              <CheckCircle size={32} />
            </div>
            <h2 className="card-title">おかえりなさい！</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: '2rem' }}>
              すでに <strong>{existingUser.name}</strong> 様のアカウントが登録されています。<br />
              このアカウントで利用を再開しますか？
            </p>
            
            <div style={{ display: 'grid', gap: '0.75rem' }}>
              <button onClick={handleLinkExisting} className="btn btn-primary">
                この名前で再開する
              </button>
              <button onClick={() => setExistingUser(null)} className="btn btn-outline" style={{ fontSize: '0.875rem' }}>
                別の名前で登録する
              </button>
            </div>
          </div>
        ) : (
          /* 通常の登録フォーム */
          <>
            <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
              <div style={{ 
                width: 64, height: 64, borderRadius: '1.25rem', background: 'var(--primary)', 
                display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem',
                color: 'white'
              }}>
                <UserPlus size={32} />
              </div>
              <h2 className="card-title">利用者登録</h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                はじめにお名前を登録してください。<br />
                この端末（ブラウザ）に記録が保存されます。
              </p>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="input-group">
                <label className="input-label">お名前（姓名）</label>
                <input 
                  type="text" 
                  value={name} 
                  onChange={(e) => setName(e.target.value)}
                  placeholder="例：山田 太郎"
                  required
                  autoFocus
                  disabled={isChecking}
                />
              </div>
              <button type="submit" className="btn btn-primary" disabled={isChecking}>
                {isChecking ? '確認中...' : '登録してはじめる'}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
