import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '@/components/landing/Navbar';
import Footer from '@/components/landing/Footer';
import MedSpaDemoModal from '@/components/medspa/MedSpaDemoModal';
import { setPageMetadata } from '@/lib/seo';

export default function Start() {
  const [showModal, setShowModal] = useState(true);
  const navigate = useNavigate();

  useEffect(() => setPageMetadata({
    title: 'Start Your AI Automation Audit | ClientSurge Systems',
    description: 'Launch the guided ClientSurge demo flow and see the fastest AI automation wins for your service business.',
    canonicalPath: '/start',
    ogTitle: 'Start Your ClientSurge Audit',
    ogDescription: 'Begin the guided demo flow to see where ClientSurge can tighten lead response and booking follow-up.',
  }), []);

  const handleClose = () => {
    setShowModal(false);
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-card to-background flex flex-col">
      <Navbar />
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        {showModal
          ? <MedSpaDemoModal onClose={handleClose} />
          : (
            <div className="text-center">
              <p className="text-muted-foreground text-lg mb-4">Redirecting you back...</p>
            </div>
          )
        }
      </div>
      <Footer />
    </div>
  );
}
