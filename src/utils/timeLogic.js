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
  if (!record) return 'morningIn';
  // afternoonIn 済みなら次は afternoonOut（morningIn の有無を問わない）
  if (record.afternoonIn && !record.afternoonOut) return 'afternoonOut';
  // afternoonOut まで全部揃っていれば完了
  if (record.afternoonOut) return 'done';
  // 通常の午前フロー
  if (!record.morningIn) return 'morningIn';
  if (!record.morningOut) return 'morningOut';
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

// 打刻タイプの日本語ラベル
export function getPunchLabel(type) {
  const labels = {
    morningIn: '午前 出勤',
    morningOut: '午前 退勤',
    afternoonIn: '午後 出勤',
    afternoonOut: '午後 退勤',
    done: '本日の打刻完了',
  };
  return labels[type] || type;
}

// 現在の状態のラベル
export function getCurrentStatusLabel(record) {
  const next = getNextPunchType(record);
  const statusLabels = {
    morningIn: '未出勤',
    morningOut: '午前 勤務中',
    afternoonIn: '午前 退勤済み',
    afternoonOut: '午後 勤務中',
    done: '本日の勤務完了',
  };
  return statusLabels[next] || '不明';
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

// 1日の勤務時間を分単位で計算
export function calcDailyMinutes(record) {
  if (!record) return 0;
  let total = 0;

  // 午前
  if (record.morningIn && record.morningOut) {
    const diff = timeToMinutes(record.morningOut) - timeToMinutes(record.morningIn);
    if (diff > 0) total += diff;
  }

  // 午後
  if (record.afternoonIn && record.afternoonOut) {
    const diff = timeToMinutes(record.afternoonOut) - timeToMinutes(record.afternoonIn);
    if (diff > 0) total += diff;
  }

  return total;
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
