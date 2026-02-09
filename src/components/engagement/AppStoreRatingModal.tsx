import { Star, Mail } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';

interface AppStoreRatingModalProps {
  isOpen: boolean;
  onRate: () => void;
  onFeedback: () => void;
  onDismiss: () => void;
}

export function AppStoreRatingModal({
  isOpen,
  onRate,
  onFeedback,
  onDismiss,
}: AppStoreRatingModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={onDismiss} title="Love Ascend?" size="sm">
      <div className="space-y-4">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          If you're enjoying the app, rate us 5 stars — it helps others find Ascend! Not loving it?
          We'd love to hear how we can improve.
        </p>

        <div className="space-y-2">
          <Button variant="primary" className="w-full" onClick={onRate}>
            <Star className="w-4 h-4 mr-2 fill-current" />
            Rate 5 Stars
          </Button>
          <Button variant="ghost" className="w-full" onClick={onFeedback}>
            <Mail className="w-4 h-4 mr-2" />
            Send Us Feedback
          </Button>
        </div>
      </div>
    </Modal>
  );
}
