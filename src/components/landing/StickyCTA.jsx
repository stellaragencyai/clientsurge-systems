import { useEffect, useState } from 'react';
import { ArrowRight } from 'lucide-react';

export default function StickyCTA() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const scrolled = window.scrollY > 600;
      const footer = document.querySelector('footer');
      const footerTop = footer ? footer.getBoundingClientRect().top + window.scrollY : window.innerHeight;
      const nearFooter = window.scrollY + window.innerHeight > footerTop - 100;

      setVisible(scrolled && !nearFooter);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return null;
}