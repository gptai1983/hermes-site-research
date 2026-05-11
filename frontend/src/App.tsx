import { trpc } from './lib/trpc';
import { useState, useEffect, useRef } from 'react';

export function App() {
  const [url, setUrl] = useState('');
  const [prompt, setPrompt] = useState('');
  const sessions = trpc.sessions.list.useQuery({});
  const createSession = trpc.sessions.create.useMutation();
  const startSession = trpc.sessions.start.useMutation();

  const handleCreate = async () => {
    if (!prompt.trim()) return;
    const targetUrl = url.trim() || 'https://example.com';
    const fullPrompt = `Исследуй сайт ${targetUrl}. ${prompt}`;
    
    const result = await createSession.mutateAsync({
      profileId: 1,
      prompt: fullPrompt,
      url: targetUrl,
    });
    await startSession.mutateAsync({ id: result.id });
    setPrompt('');
    setUrl('');
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
          placeholder="https://example.com (опционально)"
          style={{ width: '100%', padding: '10px' }}
        />
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Что исследовать на сайте?"
          rows={3}
          style={{ width: '100%', padding: '10px' }}
        />
        <button onClick={handleCreate} disabled={createSession.isPending || !prompt.trim()}>
          Запустить исследование
        </button>
      </div>

      <h2>Сессии ({sessions.data?.length || 0})</h2>
      {sessions.data?.length === 0 && <p>Нет активных сессий</p>}
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {sessions.data?.map((session) => (
          <SessionCard key={session.id} session={session} />
        ))}
      </div>
    </div>
  );
}

function SessionCard({ session }: { session: any }) {
  const getReport = trpc.reports.get.useQuery(
    { sessionId: session.id },
    { enabled: session.status === 'completed' }
  );
  const getLogs = trpc.sessions.logs.useQuery(
    { id: session.id },
    { enabled: session.status === 'running', refetchInterval: 1000 }
  );
  
  const logsEndRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [getLogs.data]);

  const statusColor = {
    pending: '#6c757d',
    running: '#ffc107',
    completed: '#28a745',
    failed: '#dc3545',
  }[session.status] || '#6c757d';

  return (
    <div
      style={{
        border: `2px solid ${session.status === 'running' ? '#ffc107' : '#ccc'}`,
        borderRadius: '8px',
        padding: '15px',
        background: session.status === 'running' ? '#fffef0' : '#f8f9fa',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: '12px', color: '#666' }}>ID: {session.id}</span>
        <span
          style={{
            padding: '4px 8px',
            borderRadius: '4px',
            background: statusColor,
            color: 'white',
            fontWeight: 'bold',
          }}
        >
          {session.status === 'running' ? '⏳ Выполняется...' : session.status}
        </span>
      </div>
      <p><strong>Задача:</strong> {session.prompt}</p>
      
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
          <strong>📋 Лог выполнения:</strong>
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
