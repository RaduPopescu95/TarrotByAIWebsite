import React, { useState } from 'react';
import { useRouter } from 'next/router';

const TestChatPage = () => {
  const router = useRouter();
  const [testConferenceId, setTestConferenceId] = useState('test-conference-' + Date.now());
  const [accessLink, setAccessLink] = useState('test-access-' + Date.now());

  const generateNewIds = () => {
    const newConferenceId = 'test-conference-' + Date.now();
    const newAccessLink = 'test-access-' + Date.now();
    setTestConferenceId(newConferenceId);
    setAccessLink(newAccessLink);
  };

  const openAdminLink = () => {
    const adminUrl = `/admin-conferinta-grup-video/${testConferenceId}`;
    window.open(adminUrl, '_blank');
  };

  const openUserLink = (userNumber) => {
    const userUrl = `/conferinta-grup/${accessLink}?user=${userNumber}`;
    window.open(userUrl, '_blank');
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    alert('Link copiat în clipboard!');
  };

  return (
    <div className="container mt-5">
      <div className="row justify-content-center">
        <div className="col-md-10">
          <div className="card">
            <div className="card-header bg-white text-white">
              <h3 className="mb-0">Generator Link-uri Test Chat Conferință</h3>
            </div>
            <div className="card-body">
              
              {/* Conference IDs Display */}
              {/* <div className="row mb-4">
                <div className="col-md-6">
                  <div className="alert alert-info">
                    <strong>Conference ID:</strong>
                    <br />
                    <code>{testConferenceId}</code>
                    <button 
                      className="btn btn-sm btn-outline-primary ms-2"
                      onClick={() => copyToClipboard(testConferenceId)}
                    >
                      Copiază
                    </button>
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="alert alert-info">
                    <strong>Access Link:</strong>
                    <br />
                    <code>{accessLink}</code>
                    <button 
                      className="btn btn-sm btn-outline-primary ms-2"
                      onClick={() => copyToClipboard(accessLink)}
                    >
                      Copiază
                    </button>
                  </div>
                </div>
              </div> */}

              <div className="text-center mb-4">
                <button 
                  className="btn btn-secondary"
                  onClick={generateNewIds}
                >
                  Generează ID-uri Noi
                </button>
              </div>

              {/* Admin Link */}
              <div className="row mb-4">
                <div className="col-12">
                  <div className="card border-danger">
                    <div className="card-header bg-danger text-white">
                      <h5 className="mb-0">Link Administrator</h5>
                    </div>
                    <div className="card-body">
                      <div className="d-flex justify-content-between align-items-center">
                        <div>
                          <strong>URL:</strong> 
                          <code className="ms-2">/admin-conferinta-grup-video/{testConferenceId}</code>
                        </div>
                        <div>
                          <button 
                            className="btn btn-danger me-2"
                            onClick={openAdminLink}
                          >
                            Deschide Admin
                          </button>
                          <button 
                            className="btn btn-outline-danger"
                            onClick={() => copyToClipboard(`${window.location.origin}/admin-conferinta-grup-video/${testConferenceId}`)}
                          >
                            Copiază Link
                          </button>
                        </div>
                      </div>
                      <small className="text-muted">
                        Controlul complet al conferinței + Chat RTM
                      </small>
                    </div>
                  </div>
                </div>
              </div>

              {/* User Links */}
              <div className="row">
                <div className="col-12">
                  <div className="card border-success">
                    <div className="card-header bg-success text-white">
                      <h5 className="mb-0">Link-uri Utilizatori</h5>
                    </div>
                    <div className="card-body">
                      
                      {[1, 2, 3].map(userNumber => (
                        <div key={userNumber} className="mb-3 p-3 border rounded">
                          <div className="d-flex justify-content-between align-items-center">
                            <div>
                              <strong>Utilizator {userNumber}:</strong> 
                              <code className="ms-2">/conferinta-grup/{accessLink}?user={userNumber}</code>
                            </div>
                            <div>
                              <button 
                                className="btn btn-success btn-sm me-2"
                                onClick={() => openUserLink(userNumber)}
                              >
                                Deschide User {userNumber}
                              </button>
                              <button 
                                className="btn btn-outline-success btn-sm"
                                onClick={() => copyToClipboard(`${window.location.origin}/conferinta-grup/${accessLink}?user=${userNumber}`)}
                              >
                                Copiază
                              </button>
                            </div>
                          </div>
                          <small className="text-muted">
                            Participant la conferință + Chat RTM
                          </small>
                        </div>
                      ))}

                    </div>
                  </div>
                </div>
              </div>

              {/* Instructions */}
              <div className="alert alert-warning mt-4">
                <h6><strong>Instrucțiuni de Test:</strong></h6>
                <ol>
                  <li>Deschide primul tab cu link-ul <strong>Administrator</strong></li>
                  <li>Deschide alte 3 tab-uri cu link-urile pentru <strong>Utilizatori 1, 2, 3</strong></li>
                  <li>Toate vor folosi același channel pentru video și chat</li>
                  <li>Testează funcționalitatea chat-ului RTM între toate conexiunile</li>
                  <li>Chat-ul va apărea automat în interfața video</li>
                </ol>
              </div>

              {/* Technical Info */}
              <div className="alert alert-info mt-3">
                <h6><strong>Informații Tehnice:</strong></h6>
                <ul className="mb-0">
                  <li><strong>Channel Video:</strong> {testConferenceId}</li>
                  <li><strong>Channel Chat RTM:</strong> {testConferenceId} (același cu video)</li>
                  <li><strong>Admin Role:</strong> Host cu control complet</li>
                  <li><strong>User Role:</strong> Audience cu acces chat</li>
                  <li><strong>RTM Username:</strong> auto-generat per user</li>
                </ul>
              </div>

              {/* Quick Actions */}
              <div className="text-center mt-4">
                <div className="btn-group" role="group">
                  <button 
                    className="btn btn-primary"
                    onClick={() => {
                      openAdminLink();
                      setTimeout(() => openUserLink(1), 1000);
                      setTimeout(() => openUserLink(2), 2000);
                      setTimeout(() => openUserLink(3), 3000);
                    }}
                  >
                    Deschide Toate Link-urile
                  </button>
                  <button 
                    className="btn btn-outline-primary"
                    onClick={() => router.push('/admin-conferinte-grup')}
                  >
                    Înapoi la Admin Conferințe
                  </button>
                </div>
              </div>

            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TestChatPage; 