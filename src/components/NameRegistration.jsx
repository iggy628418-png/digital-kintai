import React, { useState } from 'react';
import { UserPlus } from 'lucide-react';
import { addEmployee, setCurrentUser } from '../utils/storage';

export default function NameRegistration({ onComplete }) {
  const [name, setName] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    const user = await addEmployee(name.trim());
    setCurrentUser(user);
    onComplete(user);
  };

  return (
    <div className="app-container page-transition" style={{ justifyContent: 'center', padding: '2rem' }}>
      <div className="card">
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
            />
          </div>
          <button type="submit" className="btn btn-primary">
            登録してはじめる
          </button>
        </form>
      </div>
    </div>
  );
}
