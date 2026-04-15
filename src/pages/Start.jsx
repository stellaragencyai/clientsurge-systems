import { useState } from 'react';
import MedSpaDemoModal from '@/components/medspa/MedSpaDemoModal';

export default function Start() {
  const [showModal, setShowModal] = useState(true);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-card to-background flex items-center justify-center px-6 py-12">
      {showModal && <MedSpaDemoModal onClose={() => setShowModal(false)} />}
    </div>
  );
}