import React, { useState, useEffect } from 'react';
import { NavigationTab, CamouflageMode } from './types';
import { Header } from './components/Header';
import { BottomNav } from './components/BottomNav';
import { HomeScreen } from './components/HomeScreen';
import { ChatScreen } from './components/ChatScreen';
import { JournalScreen } from './components/JournalScreen';
import { ActivitiesScreen } from './components/ActivitiesScreen';
import { ProfileScreen } from './components/ProfileScreen';
import { SupportScreen } from './components/SupportScreen';
import { CamouflageOverlay } from './components/CamouflageOverlay';
import { ComfortModals } from './components/ComfortModals';
import { ClinicalMonitorModal } from './components/ClinicalMonitorModal';
import { soundEngine } from './utils/audioSynth';

export default function App() {
  const [currentTab, setCurrentTab] = useState<NavigationTab>('home');
  const [camouflageMode, setCamouflageMode] = useState<CamouflageMode>('none');
  const [comfortModal, setComfortModal] = useState<'sounds' | 'story' | 'checklist' | null>(null);
  const [isClinicalMonitorOpen, setIsClinicalMonitorOpen] = useState(false);

  // Gentle audio chime on tab switch
  const handleNavigate = (tab: NavigationTab) => {
    soundEngine.playChime();
    setCurrentTab(tab);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleTriggerCamouflage = (mode: CamouflageMode) => {
    setCamouflageMode(mode);
  };

  // Shake detection listener where supported
  useEffect(() => {
    let lastX = 0, lastY = 0, lastZ = 0;
    let lastTime = 0;

    const handleMotion = (event: DeviceMotionEvent) => {
      const current = event.accelerationIncludingGravity;
      if (!current || current.x === null || current.y === null || current.z === null) return;

      const currentTime = Date.now();
      const diffTime = currentTime - lastTime;

      if (diffTime > 150) {
        const speed =
          Math.abs(current.x + current.y + current.z - lastX - lastY - lastZ) / diffTime * 10000;

        if (speed > 800) {
          // Trigger instant camouflage
          setCamouflageMode('weather');
        }

        lastTime = currentTime;
        lastX = current.x;
        lastY = current.y;
        lastZ = current.z;
      }
    };

    window.addEventListener('devicemotion', handleMotion);
    return () => window.removeEventListener('devicemotion', handleMotion);
  }, []);

  return (
    <div className="min-h-screen bg-[#F2EDE2] text-[#2C2824] flex flex-col relative selection:bg-[#E7B9B2]/60">
      {/* Top Header */}
      <Header
        currentTab={currentTab}
        onNavigate={handleNavigate}
        onTriggerCamouflage={handleTriggerCamouflage}
      />

      {/* Main View Screen */}
      <div className="flex-1 flex flex-col">
        {currentTab === 'home' && (
          <HomeScreen
            onNavigate={handleNavigate}
            onOpenComfort={(type) => setComfortModal(type)}
          />
        )}
        {currentTab === 'chat' && (
          <ChatScreen
            onNavigate={handleNavigate}
            onTriggerCamouflage={handleTriggerCamouflage}
          />
        )}
        {currentTab === 'journal' && (
          <JournalScreen
            onTriggerCamouflage={handleTriggerCamouflage}
          />
        )}
        {currentTab === 'activities' && <ActivitiesScreen />}
        {currentTab === 'profile' && (
          <ProfileScreen
            onTriggerCamouflage={handleTriggerCamouflage}
          />
        )}
        {currentTab === 'support' && (
          <SupportScreen
            onNavigate={handleNavigate}
            onTriggerCamouflage={handleTriggerCamouflage}
          />
        )}
      </div>

      {/* Bottom Dock Navigation Island */}
      <BottomNav
        currentTab={currentTab}
        onNavigate={handleNavigate}
        onOpenClinicalMonitor={() => setIsClinicalMonitorOpen(true)}
        isClinicalMonitorOpen={isClinicalMonitorOpen}
      />

      {/* Camouflage Disguised Overlays (Pantry, Weather, Calculator) */}
      <CamouflageOverlay
        mode={camouflageMode}
        onExit={() => setCamouflageMode('none')}
      />

      {/* Gentle Comforts Interactive Modals */}
      <ComfortModals
        type={comfortModal}
        onClose={() => setComfortModal(null)}
      />

      {/* Clinical Distress Monitor & AI Backend Diagnostic Panel */}
      <ClinicalMonitorModal
        isOpen={isClinicalMonitorOpen}
        onClose={() => setIsClinicalMonitorOpen(false)}
      />
    </div>
  );
}
