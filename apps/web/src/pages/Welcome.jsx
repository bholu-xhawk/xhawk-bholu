import React from 'react';
import OnboardingFlow from '../components/OnboardingFlow.jsx';

export default function Welcome() {
  return (
    <div className="max-w-3xl mx-auto">
      <header className="text-center mb-8">
        <h1 className="text-4xl font-bold mb-2">Welcome</h1>
        <p className="text-gray-700">
          Thanks for stopping by! A quick setup will personalize your experience.
        </p>
      </header>
      <OnboardingFlow />
    </div>
  );
}

