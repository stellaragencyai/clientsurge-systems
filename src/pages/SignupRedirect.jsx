import ProductSignup from './ProductSignup';

// /signup — renders the same safe self-contained Product Signup screen.
// Query params (e.g. ?package=growth) are read inside ProductSignup,
// so selected-plan behavior is identical to /product-signup.
export default function SignupRedirect() {
  return <ProductSignup />;
}