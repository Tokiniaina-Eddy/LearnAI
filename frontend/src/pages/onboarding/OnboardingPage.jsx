import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Zap } from 'lucide-react';
import StepIndicator from '../../components/ui/StepIndicator';
import LearningProfileStep from './steps/LearningProfileStep';
import LearningGoalStep from './steps/LearningGoalStep';
import toast from 'react-hot-toast';

const STEPS = ['Profil', 'Objectif', 'C\'est parti !'];

export default function OnboardingPage() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [profileData, setProfileData] = useState(null);
  const [goalId, setGoalId] = useState(null);

  const handleProfileDone = (data) => {
    setProfileData(data);
    setCurrentStep(1);
  };

  const handleGoalDone = (id) => {
    setGoalId(id);
    setCurrentStep(2);
  };

  const handleStart = () => {
    toast.success('Parcours en cours de génération…');
    navigate(`/evaluation/${goalId}`);
  };

  return (
    <div className="min-h-screen bg-surface-950 flex flex-col items-center justify-center p-6">
      {/* Background glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-primary-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-xl relative z-10">
        {/* Logo */}
        <div className="flex items-center gap-3 justify-center mb-10">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center">
            <Zap className="w-6 h-6 text-white" />
          </div>
          <span className="font-bold text-xl gradient-text">LearnAI</span>
        </div>

        {/* Step indicator */}
        <div className="flex justify-center mb-10">
          <StepIndicator steps={STEPS} currentStep={currentStep} />
        </div>

        {/* Step content */}
        <div className="card card-body animate-in">
          {currentStep === 0 && (
            <LearningProfileStep onDone={handleProfileDone} />
          )}
          {currentStep === 1 && (
            <LearningGoalStep onDone={handleGoalDone} onBack={() => setCurrentStep(0)} />
          )}
          {currentStep === 2 && (
            <div className="text-center py-6 animate-in">
              <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center mx-auto mb-6 shadow-glow">
                <Zap className="w-10 h-10 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-slate-50 mb-3">Tout est prêt !</h2>
              <p className="text-slate-400 mb-8 leading-relaxed">
                On va d'abord évaluer ton niveau pour générer un parcours parfaitement adapté à toi.
                L'évaluation prend environ <span className="text-slate-200 font-medium">5 à 10 minutes</span>.
              </p>
              <button onClick={handleStart} className="btn-primary btn-lg w-full">
                Commencer l'évaluation initiale
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
