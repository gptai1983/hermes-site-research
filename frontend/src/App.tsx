import { trpc } from './lib/trpc';
import { useState } from 'react';

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

  return (
    <div
      style={{
        border: '1px solid #ccc',
        borderRadius: '8px',
        padding: '15px',
        background: session.status === 'running' ? '#fff3cd' : '#f8f9fa',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span>ID: {session.id}</span>
        <span
          style={{
            padding: '4px 8px',
            borderRadius: '4px',
            background:
              session.status === 'completed'
                ? '#28a745'
                : session.status === 'failed'
                ? '#dc3545'
                : '#ffc107',
            color: 'white',
          }}
        >
          {session.status}
        </span>
      </div>
      <p><strong>Задача:</strong> {session.prompt}</p>
      
      {session.status === 'completed' && getReport.data?.[0] && (
        <div style={{ marginTop: '10px', padding: '10px', background: '#e9ecef', borderRadius: '4px' }}>
          <strong>Результат:</strong>
          <pre style={{ whiteSpace: 'pre-wrap', fontSize: '12px', maxHeight: '300px', overflow: 'auto' }}>
            {getReport.data[0].content}
          </pre>
        </div>
      )}
      
      {session.error && (
        <div style={{ color: 'red', marginTop: '10px' }}>Ошибка: {session.error}</div>
      )}
    </div>
  );
}
