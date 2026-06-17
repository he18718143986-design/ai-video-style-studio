import React from 'react';
import { AlertTriangle, ShieldCheck, XCircle } from 'lucide-react';

interface SafetyModalProps {
  isOpen: boolean;
  onProceed: () => void;
  onCancel: () => void;
}

const SafetyModal: React.FC<SafetyModalProps> = ({ isOpen, onProceed, onCancel }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-studio-900 border border-warning rounded-2xl max-w-md w-full p-6 shadow-2xl scale-100">
        <div className="flex items-center gap-4 mb-4">
          <div className="bg-warning/20 p-3 rounded-full">
            <AlertTriangle className="w-8 h-8 text-warning" />
          </div>
          <h3 className="text-xl font-bold text-white">Safety Check Triggered</h3>
        </div>
        
        <p className="text-studio-200 mb-6 leading-relaxed">
          The requested topic has been flagged as <strong>Medical or Safety-Critical</strong>. 
          <br/><br/>
          Per our safety protocols, automated content generation for this category requires human review of the final output before publication.
        </p>

        <div className="flex gap-3">
          <button 
            onClick={onCancel}
            className="flex-1 px-4 py-3 bg-studio-800 hover:bg-studio-700 text-studio-300 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
          >
            <XCircle className="w-4 h-4" />
            Cancel
          </button>
          <button 
            onClick={onProceed}
            className="flex-1 px-4 py-3 bg-warning hover:bg-warning/90 text-studio-900 rounded-lg font-bold transition-colors flex items-center justify-center gap-2"
          >
            <ShieldCheck className="w-4 h-4" />
            Proceed with Review
          </button>
        </div>
      </div>
    </div>
  );
};

export default SafetyModal;