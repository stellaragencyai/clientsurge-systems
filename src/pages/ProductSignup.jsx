import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

// /signup redirects safely to /start, preserving any ?plan= query param as ?package=
export default function ProductSignup() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const plan = searchParams.get('plan') || '';
    const dest = plan ? `/start?package=${plan}` : '/start';
    navigate(dest, { replace: true });
  }, []);

  return null;
}