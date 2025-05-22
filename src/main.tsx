import React from 'react';
import { createRoot } from 'react-dom/client';
import { ApolloProvider } from '@apollo/client';
import App from './App.tsx';
import './index.css';
import client from './lib/graphql';

const root = document.getElementById('root');
if (root) {
  createRoot(root).render(
    <ApolloProvider client={client}>
      <App />
    </ApolloProvider>
  );
} else {
  console.error('Root element not found');
}
