import { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import api from '../api/client.js';

const labels = {
  ENG: {
    title: 'Feedback',
    hint: 'Tell us about the taste, service or anything else.',
    placeholder: 'Write your comment...',
    send: 'Send',
    thanks: 'Thank you for your feedback!',
    error: 'Could not send feedback. Please try again.',
  },
  RUS: {
    title: 'Отзыв',
    hint: 'Расскажите о вкусе, сервисе или о чём-то другом.',
    placeholder: 'Напишите ваш комментарий...',
    send: 'Отправить',
    thanks: 'Спасибо за отзыв!',
    error: 'Не удалось отправить отзыв. Попробуйте ещё раз.',
  },
  UZB: {
    title: 'Fikr-mulohaza',
    hint: "Ta'm, xizmat yoki boshqa narsa haqida yozing.",
    placeholder: 'Izohingizni yozing...',
    send: 'Yuborish',
    thanks: 'Fikringiz uchun rahmat!',
    error: "Yuborib bo'lmadi. Qayta urinib ko'ring.",
  },
};

export default function FeedbackPage() {
  const { language } = useOutletContext();
  const l = labels[language] || labels.RUS;
  const [comment, setComment] = useState('');
  const [rating, setRating] = useState(0);
  const [status, setStatus] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (event) => {
    event.preventDefault();
    if (!comment.trim() || busy) return;

    setBusy(true);
    setStatus('');

    try {
      await api.post('/feedback', { comment, rating });
      setComment('');
      setRating(0);
      setStatus(l.thanks);
    } catch (error) {
      setStatus(error?.response?.data?.message || l.error);
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} style={styles.card}>
      <h2 style={styles.title}>{l.title}</h2>
      <p style={styles.hint}>{l.hint}</p>

      <div style={styles.stars}>
        {[1, 2, 3, 4, 5].map((value) => (
          <button
            key={value}
            type="button"
            onClick={() => setRating(value === rating ? 0 : value)}
            style={{ ...styles.star, opacity: value <= rating ? 1 : 0.3 }}
            aria-label={`${value}`}
          >
            ★
          </button>
        ))}
      </div>

      <textarea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        maxLength={1000}
        rows={6}
        placeholder={l.placeholder}
        style={styles.textarea}
      />

      <button type="submit" disabled={busy || !comment.trim()} style={styles.button}>
        {l.send}
      </button>

      {status ? <div style={styles.status}>{status}</div> : null}
    </form>
  );
}

const styles = {
  card: {
    background: 'rgba(255,255,255,0.85)',
    borderRadius: '24px',
    padding: '18px',
    color: '#145962',
  },
  title: { margin: 0, fontSize: '22px', fontWeight: 800 },
  hint: { margin: '6px 0 12px', fontSize: '14px' },
  stars: { display: 'flex', gap: '4px', marginBottom: '10px' },
  star: {
    border: 'none',
    background: 'transparent',
    fontSize: '30px',
    color: '#f5a623',
    cursor: 'pointer',
    padding: 0,
  },
  textarea: {
    width: '100%',
    boxSizing: 'border-box',
    borderRadius: '14px',
    border: '1px solid #b9e3e8',
    padding: '12px',
    fontSize: '15px',
    fontFamily: 'inherit',
    resize: 'vertical',
  },
  button: {
    marginTop: '10px',
    width: '100%',
    padding: '12px',
    borderRadius: '12px',
    border: 'none',
    background: '#1a93f1',
    color: '#fff',
    fontWeight: 800,
    cursor: 'pointer',
  },
  status: { marginTop: '10px', fontWeight: 700 },
};
