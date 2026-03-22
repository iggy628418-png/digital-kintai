/**
 * 勤怠状態管理と時間計算ロジック
 *
 * 状態遷移:
 *   (nothing) → morningIn → morningOut → afternoonIn → afternoonOut
 */

// 現在時刻の時間（0〜23）を返す
export function currentHour() {
  return new Date().getHours();
}

// 現在の打刻状態を判定（午後のみ打刻にも対応）
export function getNextPunchType(record) {
  const hour = currentHour();
  
  if (!record) {
    return hour < 12 ? 'morningIn' : 'afternoonIn';
  }

  // 1. 午前出勤中なら、次は必ず午前退勤
  if (record.morningIn && !record.morningOut) return 'morningOut';

  // 2. 午後出勤中なら、次は必ず午後退勤
  if (record.afternoonIn && !record.afternoonOut) return 'afternoonOut';

  // 3. 全て完了
  if (record.afternoonOut) return 'done';

  // 4. まだ何もしていない場合（recordはあるが時間は空）
  if (!record.morningIn && !record.morningOut && !record.afternoonIn) {
    return hour < 12 ? 'morningIn' : 'afternoonIn';
  }

  // 5. 午前が終わっている or スキップされている場合
  if (!record.afternoonIn) return 'afternoonIn';

  return 'done';
}

// 時刻を考慮した「表示用」次の打刻タイプ
// 12時以降で未打刻の場合は午後から始める（スキップ不可、表示ラベルのみ変更）
export function getDisplayPunchType(record) {
  const next = getNextPunchType(record);
  const hour = currentHour();
  // 午後12時以降かつ午前打刻が全くない場合は「午後 出勤」表示にする
  if (next === 'morningIn' && hour >= 12) {
    return 'afternoonIn';
  }
  return next;
}

// 打刻後のメッセージ
export function getPunchMessage(type) {
  const messages = {
    morningIn: 'よろしくお願いします！今日もしっかり頑張りましょう。',
    morningOut: '休憩ですね。ゆっくり休んでリフレッシュしてください！',
    afternoonIn: 'お帰りなさい！午後の仕事も頑張りましょう。',
    afternoonOut: 'お疲れ様でした！気をつけてお帰りください。',
  };
  return messages[type] || '打刻が完了しました。';
}

// 打刻タイプの日本語ラベル
export function getPunchLabel(type) {
  const labels = {
    morningIn: '出勤',
    morningOut: '休憩入り',
    afternoonIn: '休憩戻り',
    afternoonOut: '退勤',
    done: '打刻完了',
  };
  return labels[type] || type;
}

// 打刻タイプのテーマカラー
export function getPunchTheme(type) {
  if (type === 'morningIn' || type === 'afternoonOut') {
    return { 
      color: '#ffffff', 
      bgColor: 'linear-gradient(135deg, #2563eb, #1d4ed8)', // Blue
      borderColor: '#1e40af'
    };
  }
  if (type === 'morningOut' || type === 'afternoonIn') {
    return { 
      color: '#ffffff', 
      bgColor: 'linear-gradient(135deg, #ec4899, #db2777)', // Pink
      borderColor: '#be185d'
    };
  }
  return { color: '#64748b', bgColor: '#f1f5f9', borderColor: '#e2e8f0' };
}

// 現在の状態のラベル
export function getCurrentStatusLabel(record) {
  if (!record || !record.morningIn) return '未出勤';
  if (record.afternoonOut) return '退勤済み';
  if (record.morningOut && !record.afternoonIn) return '休憩中';
  return '勤務中';
}

// HH:MM を分数に変換
export function timeToMinutes(timeStr) {
  if (!timeStr) return 0;
  const [h, m] = timeStr.split(':').map(Number);
  return h * 60 + m;
}

// 分数を "○時間○分" に変換
export function minutesToDisplay(totalMinutes) {
  if (totalMinutes <= 0) return '0分';
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  if (h === 0) return `${m}分`;
  if (m === 0) return `${h}時間`;
  return `${h}時間${m}分`;
}

// 1日の勤務時間を分単位で計算 (休憩を考慮)
export function calcDailyMinutes(record) {
  if (!record || !record.morningIn) return 0;
  
  const inT = timeToMinutes(record.morningIn);
  const outT = timeToMinutes(record.afternoonOut || record.morningOut || record.afternoonIn);
  
  if (!outT || outT <= inT) return 0;

  let total = outT - inT;
  
  // 休憩時間を引く (morningOut 〜 afternoonIn の間)
  if (record.morningOut && record.afternoonIn) {
    const bStart = timeToMinutes(record.morningOut);
    const bEnd = timeToMinutes(record.afternoonIn);
    const bDiff = bEnd - bStart;
    if (bDiff > 0) {
      total -= bDiff;
    }
  }
  
  return total > 0 ? total : 0;
}

// 休憩時間を分単位で計算 (morningOut 〜 afternoonIn)
export function calcBreakMinutes(record) {
  if (!record || !record.morningOut || !record.afternoonIn) return 0;
  const bStart = timeToMinutes(record.morningOut);
  const bEnd = timeToMinutes(record.afternoonIn);
  const diff = bEnd - bStart;
  return diff > 0 ? diff : 0;
}

// 月間の合計勤務時間を分単位で計算
export function calcMonthlyMinutes(records, yearMonth) {
  // yearMonth = 'YYYY-MM'
  return records
    .filter(r => r.date && r.date.startsWith(yearMonth))
    .reduce((sum, r) => sum + calcDailyMinutes(r), 0);
}

// 現在時刻を HH:MM で返す
export function nowTimeString() {
  const now = new Date();
  const h = String(now.getHours()).padStart(2, '0');
  const m = String(now.getMinutes()).padStart(2, '0');
  return `${h}:${m}`;
}

// 今日の日付を YYYY-MM-DD で返す
export function todayDateString() {
  const now = new Date();
  const y = now.getFullYear();
  const mo = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${mo}-${d}`;
}

// YYYY-MM を返す
export function currentYearMonth() {
  const now = new Date();
  const y = now.getFullYear();
  const mo = String(now.getMonth() + 1).padStart(2, '0');
  return `${y}-${mo}`;
}

// 日付を日本語にフォーマット
export function formatDateJP(dateStr) {
  if (!dateStr) return '';
  const [y, m, d] = dateStr.split('-');
  const dayOfWeek = ['日', '月', '火', '水', '木', '金', '土'];
  const dt = new Date(Number(y), Number(m) - 1, Number(d));
  return `${Number(m)}月${Number(d)}日 (${dayOfWeek[dt.getDay()]})`;
}
