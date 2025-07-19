import React from 'react';
import { useI18nFallback } from '../lib/useI18nFallback';
import { useTranslation } from 'next-i18next';

const TestI18nFallback = () => {
  const { t: fallbackT, isReady, currentLocale, refreshTranslations } = useI18nFallback();
  const { t: originalT, i18n } = useTranslation('common');

  const testKeys = [
    'Services',
    'CeGandeste', 
    'CarteaTa',
    'CeSimte',
    'readMore',
    'android',
    'ios',
    'exploreServices'
  ];

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h3 style={styles.title}>🧪 Test i18n Fallback</h3>
        <div style={styles.status}>
          <span style={{
            ...styles.statusBadge,
            backgroundColor: isReady ? '#4CAF50' : '#f44336'
          }}>
            {isReady ? '✅ Ready' : '⚠️ Using Fallback'}
          </span>
        </div>
      </div>

      <div style={styles.info}>
        <div style={styles.infoItem}>
          <strong>Current Locale:</strong> {currentLocale}
        </div>
        <div style={styles.infoItem}>
          <strong>i18n Language:</strong> {i18n?.language || 'undefined'}
        </div>
        <div style={styles.infoItem}>
          <strong>i18n Ready:</strong> {i18n?.isInitialized ? 'Yes' : 'No'}
        </div>
        <div style={styles.infoItem}>
          <strong>Has Resources:</strong> {i18n?.options?.resources ? 'Yes' : 'No'}
        </div>
      </div>

      <button 
        onClick={refreshTranslations}
        style={styles.refreshButton}
      >
        🔄 Refresh Translations
      </button>

      <div style={styles.translationsGrid}>
        <div style={styles.column}>
          <h4 style={styles.columnTitle}>Fallback Hook</h4>
          {testKeys.map(key => (
            <div key={key} style={styles.translationItem}>
              <span style={styles.key}>{key}:</span>
              <span style={styles.value}>{fallbackT(key)}</span>
            </div>
          ))}
        </div>

        <div style={styles.column}>
          <h4 style={styles.columnTitle}>Original Hook</h4>
          {testKeys.map(key => (
            <div key={key} style={styles.translationItem}>
              <span style={styles.key}>{key}:</span>
              <span style={styles.value}>{originalT(key)}</span>
            </div>
          ))}
        </div>
      </div>

      <div style={styles.instructions}>
        <h4>📋 Instrucțiuni pentru test:</h4>
        <ol style={styles.instructionsList}>
          <li>Schimbă limba din navbar</li>
          <li>Observă cum se actualizează traducerile în timp real</li>
          <li>Compară "Fallback Hook" cu "Original Hook"</li>
          <li>Dacă original hook returnează proprietăți (ex: "Services"), fallback hook va returna traducerea corectă</li>
          <li>Status badge va arăta dacă i18n este complet inițializat sau se folosesc fallback-uri</li>
        </ol>
      </div>
    </div>
  );
};

const styles = {
  container: {
    maxWidth: '1000px',
    margin: '20px auto',
    padding: '20px',
    backgroundColor: '#f8f9fa',
    borderRadius: '12px',
    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
    fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '20px',
    paddingBottom: '15px',
    borderBottom: '2px solid #e9ecef',
  },
  title: {
    margin: 0,
    color: '#2c3e50',
    fontSize: '24px',
    fontWeight: '600',
  },
  status: {
    display: 'flex',
    alignItems: 'center',
  },
  statusBadge: {
    padding: '6px 12px',
    borderRadius: '20px',
    color: 'white',
    fontSize: '14px',
    fontWeight: '500',
  },
  info: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '10px',
    marginBottom: '20px',
    padding: '15px',
    backgroundColor: 'white',
    borderRadius: '8px',
    border: '1px solid #dee2e6',
  },
  infoItem: {
    fontSize: '14px',
    color: '#495057',
  },
  refreshButton: {
    padding: '10px 20px',
    backgroundColor: '#667eea',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '500',
    marginBottom: '20px',
    transition: 'all 0.2s ease',
  },
  translationsGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '20px',
    marginBottom: '20px',
  },
  column: {
    backgroundColor: 'white',
    padding: '15px',
    borderRadius: '8px',
    border: '1px solid #dee2e6',
  },
  columnTitle: {
    margin: '0 0 15px 0',
    color: '#495057',
    fontSize: '16px',
    fontWeight: '600',
    textAlign: 'center',
  },
  translationItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '8px 0',
    borderBottom: '1px solid #f8f9fa',
  },
  key: {
    fontWeight: '500',
    color: '#6c757d',
    fontSize: '13px',
  },
  value: {
    color: '#212529',
    fontSize: '14px',
    fontWeight: '400',
    maxWidth: '150px',
    textAlign: 'right',
    wordBreak: 'break-word',
  },
  instructions: {
    backgroundColor: 'white',
    padding: '15px',
    borderRadius: '8px',
    border: '1px solid #dee2e6',
  },
  instructionsList: {
    margin: '10px 0 0 0',
    paddingLeft: '20px',
    color: '#495057',
    fontSize: '14px',
    lineHeight: '1.6',
  },
};

export default TestI18nFallback; 