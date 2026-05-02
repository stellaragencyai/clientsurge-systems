import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '@/components/landing/Navbar';
import Footer from '@/components/landing/Footer';
import MedSpaDemoModal from '@/components/medspa/MedSpaDemoModal';

export default function Start() {
  const [showModal, setShowModal] = useState(true);
  const navigate = useNavigate();

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
