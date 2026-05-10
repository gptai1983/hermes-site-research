import React from 'react';
import ReactDOM from 'react-dom/client';
import { TrpcProvider } from './lib/trpc';
import { App } from './App';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <TrpcProvider>
      <App />
    </TrpcProvider>
  </React.StrictMode>
);
