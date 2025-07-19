import React, { useState, useEffect, useContext } from 'react';
import { useRouter } from 'next/router';
import { AuthContext } from '../../context/AuthContext';
import { DatabaseContext } from '../../context/DatabaseContext';
import { collection, query, where, orderBy, getDocs, limit } from 'firebase/firestore';
import { db } from '../../firebase';
import Home1Header from '../../client/components/home/home-1/header';
import Footer from '../../components/Footer';
import ProtectedRoute from '../../components/ProtectedRoute';
import { motion } from 'framer-motion';
import moment from 'moment';
import 'moment/locale/ro';

moment.locale('ro');

const InregistrariDescarcare = () => {
  const router = useRouter();
  const { currentUser } = useContext(AuthContext);
  const { handleGetFirestore } = useContext(DatabaseContext);
  
  const [recordings, setRecordings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all'); // 'all', 'consultations', 'group_conferences'
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (currentUser) {
      loadRecordings();
    } else {
      router.push('/login');
    }
  }, [currentUser]);

  const loadRecordings = async () => {
    try {
      setLoading(true);
      setError('');

      console.log('🎥 Loading recordings for user:', currentUser?.email);

      // Load recordings from different collections
      const [simpleRecordings, generalRecordings, browserRecordings] = await Promise.all([
        loadFromCollection('SimpleRecordings'),
        loadFromCollection('Recordings'),
        loadFromCollection('BrowserRecordings')
      ]);

      // Combine and deduplicate recordings
      const allRecordings = [
        ...simpleRecordings,
        ...generalRecordings,
        ...browserRecordings
      ];

      // Remove duplicates based on meetingCode
      const uniqueRecordings = allRecordings.reduce((unique, recording) => {
        const existing = unique.find(r => r.meetingCode === recording.meetingCode);
        if (!existing) {
          unique.push(recording);
        } else if (recording.downloadURL && !existing.downloadURL) {
          // Replace with recording that has downloadURL
          const index = unique.indexOf(existing);
          unique[index] = recording;
        }
        return unique;
      }, []);

      // Enrich recordings with additional data
      const enrichedRecordings = await enrichRecordingsWithMetadata(uniqueRecordings);

      // Sort by creation date (newest first)
      enrichedRecordings.sort((a, b) => {
        const dateA = a.createdAt || a.uploadTime || a.startTimestamp || 0;
        const dateB = b.createdAt || b.uploadTime || b.startTimestamp || 0;
        return dateB - dateA;
      });

      setRecordings(enrichedRecordings);
      console.log('✅ Loaded recordings:', enrichedRecordings.length);

    } catch (error) {
      console.error('❌ Error loading recordings:', error);
      setError('Eroare la încărcarea înregistrărilor: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const loadFromCollection = async (collectionName) => {
    try {
      const snapshot = await getDocs(
        query(
          collection(db, collectionName),
          orderBy('createdAt', 'desc'),
          limit(100)
        )
      );

      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        collection: collectionName
      }));
    } catch (error) {
      console.error(`Error loading from ${collectionName}:`, error);
      return [];
    }
  };

  const enrichRecordingsWithMetadata = async (recordings) => {
    try {
      // Load conference and consultation data for context
      const [conferinte, consultatii] = await Promise.all([
        handleGetFirestore('ConferinteGrup'),
        handleGetFirestore('RezervariConsultatii')
      ]);

      return recordings.map(recording => {
        const enriched = { ...recording };

        // Determine recording type and add context
        if (recording.meetingCode?.startsWith('group_')) {
          enriched.type = 'group_conference';
          enriched.typeLabel = 'Conferință de Grup';
          
          // Find conference details
          const conferenceId = recording.meetingCode.replace('group_', '');
          const conferinta = conferinte?.find(c => c.documentId === conferenceId);
          
          if (conferinta) {
            enriched.title = conferinta.titlu;
            enriched.date = conferinta.dataInceput;
            enriched.time = conferinta.oraInceput;
            enriched.description = conferinta.descriere;
            enriched.participants = conferinta.participanti?.length || 0;
          }
        } else {
          enriched.type = 'consultation';
          enriched.typeLabel = 'Consultație Individuală';
          
          // Find consultation details
          const consultatie = consultatii?.find(c => 
            c.documentId === recording.meetingCode || 
            c.meetingCode === recording.meetingCode
          );
          
          if (consultatie) {
            enriched.title = `Consultație cu ${consultatie.nume || 'Client'}`;
            enriched.date = consultatie.data;
            enriched.time = consultatie.ora;
            enriched.clientName = consultatie.nume;
            enriched.clientEmail = consultatie.email;
          }
        }

        // Format file size
        if (enriched.size) {
          enriched.sizeFormatted = formatFileSize(enriched.size);
        }

        // Format duration
        if (enriched.duration) {
          enriched.durationFormatted = formatDuration(enriched.duration);
        }

        // Format date
        if (enriched.createdAt || enriched.uploadTime || enriched.startTimestamp) {
          const timestamp = enriched.createdAt || enriched.uploadTime || enriched.startTimestamp;
          enriched.createdAtFormatted = moment(timestamp).format('DD MMMM YYYY, HH:mm');
          enriched.createdAtRelative = moment(timestamp).fromNow();
        }

        return enriched;
      });
    } catch (error) {
      console.error('Error enriching recordings:', error);
      return recordings;
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

  const filteredRecordings = recordings.filter(recording => {
    const matchesFilter = filter === 'all' || 
      (filter === 'consultations' && recording.type === 'consultation') ||
      (filter === 'group_conferences' && recording.type === 'group_conference');

    const matchesSearch = !searchTerm || 
      recording.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      recording.meetingCode?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      recording.clientName?.toLowerCase().includes(searchTerm.toLowerCase());

    return matchesFilter && matchesSearch;
  });

  const handleDownload = async (recording) => {
    if (!recording.downloadURL) {
      alert('Link-ul de descărcare nu este disponibil pentru această înregistrare');
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

  const handleViewDetails = (recording) => {
    // Navigate to individual recording page for more details
    router.push(`/recording/${recording.meetingCode}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50">
        <Home1Header />
        <div className="container mx-auto px-4 py-20">
          <div className="flex justify-center items-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600"></div>
            <span className="ml-4 text-lg text-gray-600">Se încarcă înregistrările...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50">
        <Home1Header />
        
        <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-4">
            Înregistrări Disponibile
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Accesați și descărcați toate înregistrările dvs. din consultații și conferințe de grup
          </p>
        </div>

        {/* Filters and Search */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            {/* Filter buttons */}
            <div className="flex gap-2">
              <button
                onClick={() => setFilter('all')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  filter === 'all'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Toate ({recordings.length})
              </button>
              <button
                onClick={() => setFilter('consultations')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  filter === 'consultations'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Consultații ({recordings.filter(r => r.type === 'consultation').length})
              </button>
              <button
                onClick={() => setFilter('group_conferences')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  filter === 'group_conferences'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Conferințe ({recordings.filter(r => r.type === 'group_conference').length})
              </button>
            </div>

            {/* Search */}
            <div className="relative">
              <input
                type="text"
                placeholder="Căutați înregistrări..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-64 px-4 py-2 pl-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Error State */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-8">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4.5c-.77-.833-1.732-.833-2.5 0L4.268 15.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-800">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Recordings List */}
        {filteredRecordings.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-24 h-24 mx-auto mb-4 text-gray-400">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 className="text-xl font-medium text-gray-900 mb-2">
              Nu sunt înregistrări disponibile
            </h3>
            <p className="text-gray-500">
              {searchTerm || filter !== 'all' 
                ? 'Nu am găsit înregistrări care să corespundă căutării dvs.'
                : 'Înregistrările vor apărea aici după ce vor fi procesate.'
              }
            </p>
          </div>
        ) : (
          <div className="grid gap-6">
            {filteredRecordings.map((recording, index) => (
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
                        {recording.typeLabel}
                      </span>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        recording.status === 'completed'
                          ? 'bg-green-100 text-green-800'
                          : recording.status === 'processing'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {recording.status === 'completed' ? 'Gata' : 
                         recording.status === 'processing' ? 'Se procesează' : 'În curs'}
                      </span>
                    </div>

                    <h3 className="text-xl font-semibold text-gray-900 mb-2">
                      {recording.title || `Înregistrare ${recording.meetingCode}`}
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm text-gray-600">
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

                      {recording.durationFormatted && (
                        <div className="flex items-center gap-2">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                          </svg>
                          <span>{recording.durationFormatted}</span>
                        </div>
                      )}

                      {recording.sizeFormatted && (
                        <div className="flex items-center gap-2">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                          </svg>
                          <span>{recording.sizeFormatted}</span>
                        </div>
                      )}
                    </div>

                    {recording.createdAtRelative && (
                      <p className="text-xs text-gray-500 mt-2">
                        Creat {recording.createdAtRelative}
                      </p>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-3 mt-4 lg:mt-0">
                    <button
                      onClick={() => handleViewDetails(recording)}
                      className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
                    >
                      Detalii
                    </button>
                    
                    {recording.downloadURL ? (
                      <button
                        onClick={() => handleDownload(recording)}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                      >
                        Descarcă
                      </button>
                    ) : (
                      <button
                        disabled
                        className="px-4 py-2 bg-gray-300 text-gray-500 rounded-lg cursor-not-allowed font-medium"
                      >
                        Indisponibil
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

        <Footer />
      </div>
    </ProtectedRoute>
  );
};

// Force server-side rendering to avoid context issues during static generation
export async function getServerSideProps() {
  // This page requires authentication, so we use SSR instead of SSG
  return {
    props: {}
  };
}

export default InregistrariDescarcare; 