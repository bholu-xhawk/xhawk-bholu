import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { setOnboardingComplete, setTheme, getTheme } from '../lib/onboarding.js';

export default function OnboardingWizard() {
  const [step, setStep] = useState(1);
  const [theme, setThemeState] = useState(getTheme() || 'light');
  const navigate = useNavigate();

  const next = () => setStep((s) => Math.min(s + 1, 3));
  const prev = () => setStep((s) => Math.max(s - 1, 1));

  const skip = () => {
    setOnboardingComplete(true);
    navigate('/', { replace: true });
  };

  const finish = () => {
    setTheme(theme);
    setOnboardingComplete(true);
    navigate('/', { replace: true });
  };

  return (
    <div className="bg-white shadow rounded p-6">
      {step === 1 && (
        <div>
          <h2 className="text-2xl font-semibold mb-2">Quick intro</h2>
          <p className="mb-4 text-gray-700">This short setup will personalize your visit.</p>
          <div className="flex gap-2">
            <button className="px-4 py-2 bg-gray-200 rounded" onClick={skip}>Skip</button>
            <button className="px-4 py-2 bg-blue-600 text-white rounded" onClick={next}>Continue</button>
          </div>
        </div>
      )}

      {step === 2 && (
        <div>
          <h2 className="text-2xl font-semibold mb-2">Choose a theme</h2>
          <div className="flex gap-3 mb-4">
            <button
              type="button"
              className={`px-4 py-2 rounded border ${theme === 'light' ? 'bg-blue-50 border-blue-600 text-blue-700' : 'bg-white border-gray-300'}`}
              onClick={() => setThemeState('light')}
            >
              Light
            </button>
            <button
              type="button"
              className={`px-4 py-2 rounded border ${theme === 'dark' ? 'bg-blue-50 border-blue-600 text-blue-700' : 'bg-white border-gray-300'}`}
              onClick={() => setThemeState('dark')}
            >
              Dark
            </button>
          </div>
          <div className="flex gap-2">
            <button className="px-4 py-2 bg-gray-200 rounded" onClick={prev}>Back</button>
            <button className="px-4 py-2 bg-blue-600 text-white rounded" onClick={next}>Next</button>
          </div>
        </div>
      )}

      {step === 3 && (
        <div>
          <h2 className="text-2xl font-semibold mb-2">All set!</h2>
          <p className="mb-4 text-gray-700">We will remember your preferences on this device.</p>
          <div className="flex gap-2">
            <button className="px-4 py-2 bg-gray-200 rounded" onClick={prev}>Back</button>
            <button className="px-4 py-2 bg-green-600 text-white rounded" onClick={finish}>Finish</button>
          </div>
        </div>
      )}
    </div>
  );
}
