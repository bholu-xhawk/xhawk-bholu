import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { setOnboardingComplete, setTheme, getTheme } from '../lib/onboarding.js';

export default function OnboardingFlow() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [themeChoice, setThemeChoice] = useState(getTheme() || 'light');

  const handleSkip = () => {
    setOnboardingComplete(true);
    navigate('/', { replace: true });
  };

  const handleFinish = () => {
    setOnboardingComplete(true);
    navigate('/', { replace: true });
  };

  const selectTheme = (choice) => {
    setThemeChoice(choice);
    setTheme(choice);
  };

  return (
    <div className="bg-white rounded shadow p-6">
      <div className="mb-6 text-sm text-gray-600">Step {step} of 3</div>

      {step === 1 && (
        <section>
          <h2 className="text-2xl font-semibold mb-2">Quick intro</h2>
          <p className="text-gray-700 mb-6">
            I built this portfolio to showcase projects and experiments. A couple of quick
            choices will personalize your visit.
          </p>
          <div className="flex gap-3">
            <button
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              onClick={() => setStep(2)}
            >
              Continue
            </button>
            <button
              className="px-4 py-2 border rounded"
              onClick={handleSkip}
            >
              Skip
            </button>
          </div>
        </section>
      )}

      {step === 2 && (
        <section>
          <h2 className="text-2xl font-semibold mb-2">Choose a theme</h2>
          <p className="text-gray-700 mb-4">Pick a theme you prefer. You can change it later.</p>
          <div className="flex gap-3 mb-6">
            <button
              className={`px-4 py-2 rounded border ${
                themeChoice === 'light' ? 'bg-blue-50 border-blue-600 text-blue-700' : ''
              }`}
              onClick={() => selectTheme('light')}
            >
              Light
            </button>
            <button
              className={`px-4 py-2 rounded border ${
                themeChoice === 'dark' ? 'bg-blue-50 border-blue-600 text-blue-700' : ''
              }`}
              onClick={() => selectTheme('dark')}
            >
              Dark
            </button>
          </div>
          <div className="flex gap-3">
            <button
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              onClick={() => setStep(3)}
            >
              Next
            </button>
            <button className="px-4 py-2 border rounded" onClick={() => setStep(1)}>
              Back
            </button>
          </div>
        </section>
      )}

      {step === 3 && (
        <section>
          <h2 className="text-2xl font-semibold mb-2">All set</h2>
          <p className="text-gray-700 mb-6">
            You chose the {themeChoice} theme. You can now explore the portfolio.
          </p>
          <div className="flex gap-3">
            <button
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              onClick={handleFinish}
            >
              Finish
            </button>
            <button className="px-4 py-2 border rounded" onClick={() => setStep(2)}>
              Back
            </button>
          </div>
        </section>
      )}
    </div>
  );
}
