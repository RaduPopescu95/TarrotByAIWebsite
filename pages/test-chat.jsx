import React from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';

const TestChatPage = () => {
  const router = useRouter();

  return (
    <div className="container mt-5">
      <div className="row justify-content-center">
        <div className="col-md-8">
          <div className="card">
            <div className="card-header bg-warning text-dark text-center">
              <h3 className="mb-0">
                <i className="fa fa-exclamation-triangle me-2"></i>
                Chat Temporar Dezactivat
              </h3>
            </div>
            <div className="card-body text-center">
              <div className="mb-4">
                <i className="fa fa-comments fa-5x text-muted mb-3"></i>
                <h4>Funcționalitatea de chat este temporar indisponibilă</h4>
                <p className="lead text-muted">
                  Sistemul de chat pentru conferințe este în mentenanță și va fi disponibil în curând.
                </p>
              </div>
              
              <div className="alert alert-info">
                <i className="fa fa-info-circle me-2"></i>
                <strong>Notă:</strong> Conferințele video funcționează normal, doar chat-ul este dezactivat.
              </div>

              <div className="mt-4">
                <Link href="/admin-conferinte-grup" className="btn btn-primary me-3">
                  <i className="fa fa-arrow-left me-2"></i>
                  Înapoi la Admin Conferințe
                </Link>
                <Link href="/admin-consultatii" className="btn btn-outline-primary">
                  <i className="fa fa-dashboard me-2"></i>
                  Dashboard Admin
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TestChatPage;

/*
// CONȚINUT ORIGINAL - TEMPORAR COMENTAT

import React, { useState } from 'react';
import { useRouter } from 'next/router';

const TestChatPageOriginal = () => {
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

  // ... REST OF ORIGINAL CODE ...
};
*/ 