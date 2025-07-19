import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Home1Header from '../../client/components/home/home-1/header';
import Footer from '../../client/components/Footer';
import { motion } from 'framer-motion';
import moment from 'moment';
import 'moment/locale/ro';

moment.locale('ro');

const InregistrariAcces = () => {
  const router = useRouter();
  const { email: urlEmail } = router.query; // Email din URL dacă vine din link email
  
  const [email, setEmail] = useState('');
  const [recordings, setRecordings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searched, setSearched] = useState(false);

  // Auto-populate email din URL dacă există
  useEffect(() => {
    if (urlEmail) {
      setEmail(decodeURIComponent(urlEmail));
      // Auto-search dacă avem email din URL
      searchRecordings(decodeURIComponent(urlEmail));
    }
  }, [urlEmail]);

  const searchRecordings = async (searchEmail = email) => {
    if (!searchEmail.trim()) {
      setError('Vă rugăm să introduceți o adresă de email validă');
      return;
    }

    // Validare email simplă
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(searchEmail.trim())) {
      setError('Adresa de email nu este validă');
      return;
    }

    try {
      setLoading(true);
      setError('');
      setSearched(false);

      console.log('🔍 Searching recordings for email:', searchEmail);

      const response = await fetch('/api/recordings/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: searchEmail.trim() })
      });

      const data = await response.json();

      if (data.success) {
        setRecordings(data.recordings || []);
        setSearched(true);
        console.log('✅ Found recordings:', data.recordings?.length || 0);
      } else {
        setError(data.message || 'Eroare la căutarea înregistrărilor');
      }

    } catch (error) {
      console.error('❌ Error searching recordings:', error);
      setError('Eroare la căutarea înregistrărilor. Încercați din nou.');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (recording) => {
    if (!recording.downloadURL) {
      alert('Link-ul de descărcare nu este disponibil încă. Înregistrarea se procesează...');
      return;
    }

    try {
      // Create download link
      const link = document.createElement('a');
      link.href = recording.downloadURL;
      link.download = `${recording.title || recording.meetingCode}_${recording.createdAtFormatted}.${recording.format || 'webm'}`;
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Download error:', error);
      alert('Eroare la descărcare. Vă rugăm încercați din nou.');
    }
  };

  const getStatusInfo = (recording) => {
    if (recording.status === 'completed' && recording.downloadURL) {
      return {
        status: 'Gata pentru descărcare',
        color: 'bg-green-100 text-green-800',
        icon: '✅'
      };
    } else if (recording.status === 'processing' || !recording.downloadURL) {
      return {
        status: 'Se procesează...',
        color: 'bg-yellow-100 text-yellow-800',
        icon: '⏳'
      };
    } else {
      return {
        status: 'În lucru',
        color: 'bg-gray-100 text-gray-800',
        icon: '🔄'
      };
    }
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return 'N/A';
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  const formatDuration = (seconds) => {
    if (!seconds) return 'N/A';
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50">
      <Home1Header />
      
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-4">
            Accesează Înregistrările
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Introduceți adresa de email cu care ați participat la consultație sau conferință pentru a accesa înregistrările dvs.
          </p>
        </div>

        {/* Email Search Form */}
        <div className="max-w-md mx-auto mb-8">
          <div className="bg-white rounded-xl shadow-lg p-6">
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
              Adresa de Email
            </label>
            <div className="flex gap-3">
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="numele@email.com"
                className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                onKeyPress={(e) => e.key === 'Enter' && searchRecordings()}
              />
              <button
                onClick={() => searchRecordings()}
                disabled={loading}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Caută
                  </div>
                ) : (
                  'Caută'
                )}
              </button>
            </div>
            
            {error && (
              <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                {error}
              </div>
            )}
          </div>
        </div>

        {/* Results */}
        {searched && (
          <div className="max-w-4xl mx-auto">
            {recordings.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-24 h-24 mx-auto mb-4 text-gray-400">
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M7 4V2a1 1 0 011-1h8a1 1 0 011 1v2M7 4h10M7 4L5.5 6M17 4l1.5 2M6 6v12a2 2 0 002 2h8a2 2 0 002-2V6M6 6h12" />
                  </svg>
                </div>
                <h3 className="text-xl font-medium text-gray-900 mb-2">
                  Nu am găsit înregistrări
                </h3>
                <p className="text-gray-500 mb-4">
                  Nu există înregistrări asociate cu adresa {email}
                </p>
                <p className="text-sm text-gray-400">
                  Verificați că ați introdus adresa de email corectă cu care ați participat la sesiune.
                </p>
              </div>
            ) : (
              <>
                <div className="mb-6">
                  <h2 className="text-2xl font-bold text-gray-800 mb-2">
                    Înregistrări pentru {email}
                  </h2>
                  <p className="text-gray-600">
                    {recordings.length} înregistrare{recordings.length !== 1 ? 'ri' : ''} găsit{recordings.length !== 1 ? 'e' : 'ă'}
                  </p>
                </div>

                <div className="grid gap-6">
                  {recordings.map((recording, index) => {
                    const statusInfo = getStatusInfo(recording);
                    
                    return (
                      <motion.div
                        key={recording.id || index}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-shadow p-6"
                      >
                        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
                          {/* Recording Info */}
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-3">
                              <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                                recording.type === 'group_conference'
                                  ? 'bg-purple-100 text-purple-800'
                                  : 'bg-blue-100 text-blue-800'
                              }`}>
                                {recording.typeLabel || (recording.type === 'group_conference' ? 'Conferință de Grup' : 'Consultație Individuală')}
                              </span>
                              <span className={`px-2 py-1 rounded text-xs font-medium ${statusInfo.color}`}>
                                {statusInfo.icon} {statusInfo.status}
                              </span>
                            </div>

                            <h3 className="text-xl font-semibold text-gray-900 mb-2">
                              {recording.title || `Înregistrare ${recording.meetingCode}`}
                            </h3>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm text-gray-600 mb-3">
                              {recording.date && (
                                <div className="flex items-center gap-2">
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                  </svg>
                                  <span>{moment(recording.date).format('DD MMM YYYY')}</span>
                                </div>
                              )}
                              
                              {recording.time && (
                                <div className="flex items-center gap-2">
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                  </svg>
                                  <span>{recording.time}</span>
                                </div>
                              )}

                              {recording.duration && (
                                <div className="flex items-center gap-2">
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                  </svg>
                                  <span>{formatDuration(recording.duration)}</span>
                                </div>
                              )}

                              {recording.size && (
                                <div className="flex items-center gap-2">
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                                  </svg>
                                  <span>{formatFileSize(recording.size)}</span>
                                </div>
                              )}
                            </div>

                            {!recording.downloadURL && (
                              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-3">
                                <div className="flex items-center gap-2 text-yellow-800">
                                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                  </svg>
                                  <span className="text-sm font-medium">
                                    Înregistrarea se procesează. Link-ul de descărcare va fi disponibil în curând.
                                  </span>
                                </div>
                              </div>
                            )}

                            {recording.createdAtFormatted && (
                              <p className="text-xs text-gray-500">
                                Creat pe {recording.createdAtFormatted}
                              </p>
                            )}
                          </div>

                          {/* Action Buttons */}
                          <div className="flex gap-3 mt-4 lg:mt-0">
                            {recording.downloadURL ? (
                              <button
                                onClick={() => handleDownload(recording)}
                                className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
                              >
                                📥 Descarcă
                              </button>
                            ) : (
                              <button
                                disabled
                                className="px-6 py-3 bg-gray-300 text-gray-500 rounded-lg cursor-not-allowed font-medium"
                                title="Înregistrarea se procesează..."
                              >
                                ⏳ Se procesează
                              </button>
                            )}
                            
                            <button
                              onClick={() => window.location.reload()}
                              className="px-4 py-3 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors font-medium"
                              title="Reîmprospătează pentru a verifica statusul"
                            >
                              🔄 Reîmprospătează
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>

                {/* Refresh Info */}
                <div className="mt-8 text-center">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 max-w-2xl mx-auto">
                    <div className="flex items-center justify-center gap-2 text-blue-800 mb-2">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span className="font-medium">Informații utile</span>
                    </div>
                    <p className="text-sm text-blue-700">
                      Dacă o înregistrare se procesează, reîmprospătați pagina după câteva minute. 
                      Link-urile de descărcare vor fi disponibile automat când procesarea se finalizează.
                    </p>
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
};

export default InregistrariAcces; 