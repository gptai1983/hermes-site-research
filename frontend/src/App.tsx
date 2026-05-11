import { trpc } from './lib/trpc';
import { useState, useRef, useEffect } from 'react';

export function App() {
  const [url, setUrl] = useState('');
  const [prompt, setPrompt] = useState('');
  const sessions = trpc.sessions.list.useQuery({});
  const createSession = trpc.sessions.create.useMutation();
  const startSession = trpc.sessions.start.useMutation();
  const continueAfterLogin = trpc.sessions.continueAfterLogin.useMutation();

  const handleCreate = async () => {
    if (!prompt.trim()) return;
    const targetUrl = url.trim();
    const fullPrompt = targetUrl 
      ? `${prompt}\n\nЦелевой сайт: ${targetUrl}`
      : prompt;
    
    const result = await createSession.mutateAsync({
      profileId: 1,
      prompt: fullPrompt,
      url: targetUrl || 'https://example.com',
    });
    await startSession.mutateAsync({ id: result.id });
    setPrompt('');
    setUrl('');
    sessions.refetch();
  };

  const handleContinue = async (sessionId: number, task: string) => {
    await continueAfterLogin.mutateAsync({ id: sessionId, actualTask: task });
    sessions.refetch();
  };

  return (
    <div style={{ padding: '20px', maxWidth: '900px', margin: '0 auto' }}>
      <h1>Hermes Site Research Hub</h1>
      
      <div style={{ marginBottom: '20px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <input
          type="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://example.com (URL сайта)"
          style={{ width: '100%', padding: '10px' }}
        />
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Что сделать? (например: Проанализируй все виды программ на этом сайте)"
          rows={3}
          style={{ width: '100%', padding: '10px' }}
        />
        <button onClick={handleCreate} disabled={createSession.isPending || !prompt.trim()}>
          Запустить
        </button>
      </div>

      <h2>Сессии ({sessions.data?.length || 0})</h2>
      {sessions.data?.length === 0 && <p>Нет активных сессий</p>}
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {sessions.data?.map((session) => (
          <SessionCard key={session.id} session={session} onContinue={handleContinue} />
        ))}
      </div>
    </div>
  );
}

function SessionCard({ session, onContinue }: { session: any; onContinue: (id: number, task: string) => void }) {
  const getReport = trpc.reports.get.useQuery(
    { sessionId: session.id },
    { enabled: session.status === 'completed' }
  );
  const getLogs = trpc.sessions.logs.useQuery(
    { id: session.id },
    { enabled: ['running', 'waiting_for_login'].includes(session.status), refetchInterval: 1000 }
  );
  
  const logsEndRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [getLogs.data]);

  const statusConfig: Record<string, { color: string; label: string }> = {
    pending: { color: '#6c757d', label: '⏳ Ожидает' },
    waiting_for_login: { color: '#17a2b8', label: '🔐 Ручной вход' },
    running: { color: '#ffc107', label: '⏳ Выполняется...' },
    completed: { color: '#28a745', label: '✅ Готово' },
    failed: { color: '#dc3545', label: '❌ Ошибка' },
  };

  const config = statusConfig[session.status] || { color: '#6c757d', label: session.status };

  return (
    <div
      style={{
        border: `2px solid ${['running', 'waiting_for_login'].includes(session.status) ? config.color : '#ccc'}`,
        borderRadius: '8px',
        padding: '15px',
        background: ['running', 'waiting_for_login'].includes(session.status) ? '#fffef0' : '#f8f9fa',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: '12px', color: '#666' }}>ID: {session.id}</span>
        <span
          style={{
            padding: '4px 8px',
            borderRadius: '4px',
            background: config.color,
            color: 'white',
            fontWeight: 'bold',
          }}
        >
          {config.label}
        </span>
      </div>
      <p><strong>Задача:</strong> {session.prompt}</p>
      
      {session.status === 'waiting_for_login' && (
        <div style={{ 
          marginTop: '10px', 
          padding: '15px', 
          background: '#fff3cd', 
          borderRadius: '4px',
          border: '2px solid #ffc107'
        }}>
          <h3 style={{ margin: '0 0 10px 0', color: '#856404' }}>🔐 Требуется ручной вход</h3>
          <p style={{ margin: '0 0 10px 0' }}>1. Открой браузер и зайди на сайт</p>
          <p style={{ margin: '0 0 10px 0' }}>2. Введи логин/пароль и капчу вручную</p>
          <p style={{ margin: '0 0 15px 0' }}>3. Нажми кнопку когда будешь готов</p>
          <button 
            onClick={() => onContinue(session.id, session.prompt)}
            style={{
              padding: '10px 20px',
              background: '#28a745',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontWeight: 'bold'
            }}
          >
            ✅ Я ввёл данные
          </button>
        </div>
      )}
      
      {session.status === 'running' && getLogs.data && getLogs.data.length > 0 && (
        <div style={{ 
          marginTop: '10px', 
          padding: '10px', 
          background: '#e3f2fd', 
          borderRadius: '4px',
          fontSize: '11px',
          maxHeight: '200px',
          overflow: 'auto',
          fontFamily: 'monospace',
          whiteSpace: 'pre-wrap'
        }}>
          <strong>📋 Лог:</strong>
          {getLogs.data.map((log, i) => (
            <div key={i} style={{ margin: '2px 0' }}>{log}</div>
          ))}
          <div ref={logsEndRef} />
        </div>
      )}
      
      {session.status === 'completed' && getReport.data?.[0] && (
        <div style={{ marginTop: '10px', padding: '10px', background: '#d4edda', borderRadius: '4px' }}>
          <strong>Результат:</strong>
          <pre style={{ whiteSpace: 'pre-wrap', fontSize: '12px', maxHeight: '400px', overflow: 'auto' }}>
            {getReport.data[0].content}
          </pre>
        </div>
      )}
      
      {session.error && (
        <div style={{ color: 'red', marginTop: '10px', padding: '10px', background: '#f8d7da', borderRadius: '4px' }}>
          ❌ Ошибка: {session.error}
        </div>
      )}
    </div>
  );
}
