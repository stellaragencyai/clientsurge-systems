import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

// /signup → /product-signup (preserving query params)
export default function SignupRedirect() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const qs = searchParams.toString();
    navigate(`/product-signup${qs ? `?${qs}` : ''}`, { replace: true });
  }, [navigate, searchParams]);

  return null;
}