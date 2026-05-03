const SUBJECT_COLORS = [
  '#e94560', '#0f3460', '#533483', '#16697a',
  '#e88d67', '#7b68ee', '#20b2aa', '#ff6b6b',
  '#4ecdc4', '#a86bd1', '#f39c12', '#2ecc71',
];

export function getSubjectColor(index) {
  return SUBJECT_COLORS[index % SUBJECT_COLORS.length];
}

export function gradeColor(grade) {
  if (grade >= 5.5) return '#2ecc71';
  if (grade >= 4.0) return '#f1c40f';
  return '#e74c3c';
}

export function average(grades) {
  if (!grades.length) return 0;
  return grades.reduce((a, b) => a + b, 0) / grades.length;
}

export function formatDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleDateString('de-CH', { day: '2-digit', month: '2-digit', year: 'numeric' });
}
