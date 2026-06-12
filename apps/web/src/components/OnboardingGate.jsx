import React, { useEffect, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { isOnboardingComplete } from '../lib/onboarding.js';

export default function OnboardingGate({ children }) {
  const location = useLocation();
  const navigate = useNavigate();

  const atWelcome = location.pathname === '/welcome';
  const complete = useMemo(() => isOnboardingComplete(), [location.key]);
  const shouldRedirect = !complete && !atWelcome;

  useEffect(() => {
    if (shouldRedirect) {
      navigate('/welcome', { replace: true });
    }
  }, [shouldRedirect, navigate]);

  if (shouldRedirect) {
    return null;
  }

  return children;
}
