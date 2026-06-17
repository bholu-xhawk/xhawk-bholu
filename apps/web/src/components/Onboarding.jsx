import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { setOnboardingComplete, setTheme, getTheme } from '../lib/onboarding.js';

export default function Onboarding() {
  const [step, setStep] = useState(1);
  const [theme, updateTheme] = useState(getTheme() || 'light');
  const navigate = useNavigate();

  useEffect(() => {
    // Persist theme selection as user chooses
    setTheme(theme);
    // Optionally reflect theme on document for demo purposes
    if (typeof document !== 'undefined') {
      if (theme === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    }
  }, [theme]);

  const finish = () => {
    setOnboardingComplete(true);
    navigate('/', { replace: true });
  };

  const skip = () => {
    finish();
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <div className="text-sm text-gray-600">Step {step} of 3</div>
        <div className="h-2 bg-gray-200 rounded mt-2">
          <div
            className="h-2 bg-blue-600 rounded"
            style={{ width: `${(step / 3) * 100}%` }}
          />
        </div>
      </div>

      {step === 1 && (
        <section>
          <h2 className="text-2xl font-semibold mb-2">Welcome aboard</h2>
          <p className="text-gray-700 mb-4">
            This brief setup helps tailor your viewing experience. You can skip anytime.
          </p>
          <div className="flex gap-2">
            <button className="px-4 py-2 bg-blue-600 text-white rounded" onClick={() => setStep(2)}>
              Continue
            </button>
            <button className="px-4 py-2 bg-gray-200 rounded" onClick={skip}>
              Skip
            </button>
          </div>
        </section>
      )}

      {step === 2 && (
        <section>
          <h2 className="text-2xl font-semibold mb-2">Choose a theme</h2>
          <p className="text-gray-700 mb-4">Select your preferred appearance.</p>
          <div className="flex gap-4 mb-4">
            <button
              aria-label="choose-light"
              className={`px-4 py-2 rounded border ${theme === 'light' ? 'bg-blue-50 border-blue-600' : 'bg-white'}`}
              onClick={() => updateTheme('light')}
            >
              Light
            </button>
            <button
              aria-label="choose-dark"
              className={`px-4 py-2 rounded border ${theme === 'dark' ? 'bg-blue-50 border-blue-600' : 'bg-white'}`}
              onClick={() => updateTheme('dark')}
            >
              Dark
            </button>
          </div>
          <div className="flex gap-2">
            <button className="px-4 py-2 bg-blue-600 text-white rounded" onClick={() => setStep(3)}>
              Next
            </button>
            <button className="px-4 py-2 bg-gray-200 rounded" onClick={skip}>
              Skip
            </button>
          </div>
        </section>
      )}

      {step === 3 && (
        <section>
          <h2 className="text-2xl font-semibold mb-2">All set!</h2>
          <p className="text-gray-700 mb-4">You're ready to explore the portfolio.</p>
          <div className="flex gap-2">
            <button className="px-4 py-2 bg-blue-600 text-white rounded" onClick={finish}>
              Finish
            </button>
            <button className="px-4 py-2 bg-gray-200 rounded" onClick={() => setStep(2)}>
              Back
            </button>
          </div>
        </section>
      )}
    </div>
  );
}
