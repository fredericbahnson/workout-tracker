import { Trophy, Target, Calendar, ArrowRight } from 'lucide-react';
import { Button, Modal } from '../ui';
import type { Cycle } from '../../types';

interface CycleCompletionModalProps {
  isOpen: boolean;
  cycle: Cycle;
  onStartMaxTesting: () => void;
  onCreateNewCycle: () => void;
  onDismiss: () => void;
}

export function CycleCompletionModal({ 
  isOpen, 
  cycle, 
  onStartMaxTesting, 
  onCreateNewCycle,
  onDismiss 
}: CycleCompletionModalProps) {
  const isMaxTestingCycle = cycle.cycleType === 'max_testing';

  return (
    <Modal
      isOpen={isOpen}
      onClose={onDismiss}
      title=""
    >
      <div className="text-center py-4">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center">
          <Trophy className="w-8 h-8 text-white" />
        </div>
        
        <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">
          {isMaxTestingCycle ? 'Max Testing Complete!' : 'Cycle Complete!'}
        </h2>
        
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          {isMaxTestingCycle 
            ? "Great work testing your new maxes! You're ready to start a new training cycle."
            : `Congratulations on completing ${cycle.name}! What would you like to do next?`
          }
        </p>

        <div className="space-y-3">
          {isMaxTestingCycle ? (
            <Button onClick={onCreateNewCycle} className="w-full py-3">
              <Calendar className="w-5 h-5 mr-2" />
              Create New Training Cycle
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          ) : (
            <>
              <Button onClick={onStartMaxTesting} className="w-full py-3">
                <Target className="w-5 h-5 mr-2" />
                Test New Maxes
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
              
              <Button variant="secondary" onClick={onCreateNewCycle} className="w-full py-3">
                <Calendar className="w-5 h-5 mr-2" />
                Create New Cycle
              </Button>
            </>
          )}
          
          <button
            onClick={onDismiss}
            className="w-full text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 py-2"
          >
            Decide later
          </button>
        </div>
      </div>
    </Modal>
  );
}
