/**
 * Cycle lifecycle modals - type selector, creation/edit wizard, and max
 * testing wizard, composed into one component so pages don't duplicate the
 * three-modal orchestration block.
 */

import { Modal } from '@/components/ui';
import { CycleWizard, CycleTypeSelector, MaxTestingWizard } from '@/components/cycles';
import type { Cycle, ProgressionMode } from '@/types';

interface CycleModalsProps {
  showTypeSelector: boolean;
  showWizard: boolean;
  showMaxTesting: boolean;
  /** When set, the wizard opens in edit mode for this cycle */
  editCycle?: Cycle;
  progressionMode: ProgressionMode;
  onSelectTraining: (mode: ProgressionMode) => void;
  onSelectMaxTesting: () => void;
  onCloseTypeSelector: () => void;
  onCloseWizard: () => void;
  onCloseMaxTesting: () => void;
  onWizardBackToSelector: () => void;
  onMaxTestingBackToSelector: () => void;
}

export function CycleModals({
  showTypeSelector,
  showWizard,
  showMaxTesting,
  editCycle,
  progressionMode,
  onSelectTraining,
  onSelectMaxTesting,
  onCloseTypeSelector,
  onCloseWizard,
  onCloseMaxTesting,
  onWizardBackToSelector,
  onMaxTestingBackToSelector,
}: CycleModalsProps) {
  return (
    <>
      <Modal isOpen={showTypeSelector} onClose={onCloseTypeSelector} title="Create New Cycle">
        <CycleTypeSelector
          onSelectTraining={onSelectTraining}
          onSelectMaxTesting={onSelectMaxTesting}
          onCancel={onCloseTypeSelector}
        />
      </Modal>

      <Modal
        isOpen={showWizard}
        onClose={onCloseWizard}
        title={editCycle ? 'Edit Cycle' : 'Create Training Cycle'}
        size="full"
      >
        <div className="h-[80vh]">
          <CycleWizard
            onComplete={onCloseWizard}
            onCancel={editCycle ? onCloseWizard : onWizardBackToSelector}
            editCycle={editCycle}
            initialProgressionMode={progressionMode}
          />
        </div>
      </Modal>

      {showMaxTesting && (
        <MaxTestingWizard
          onComplete={onCloseMaxTesting}
          onCancel={onCloseMaxTesting}
          onBackToSelector={onMaxTestingBackToSelector}
        />
      )}
    </>
  );
}
