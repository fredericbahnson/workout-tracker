import { Crown } from 'lucide-react';
import { useEntitlement } from '@/contexts';
import { Card, CardContent } from '@/components/ui';

export function SubscriptionSection() {
  const { purchase } = useEntitlement();

  // Only show when user has a purchase (trial banner is shown in Settings.tsx)
  if (!purchase) {
    return null;
  }

  return (
    <Card>
      <CardContent>
        <div className="flex items-center gap-2 mb-2">
          <Crown className="w-4 h-4 text-purple-500" />
          <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">Subscription</h3>
          <span
            className={`ml-auto text-xs px-2 py-0.5 rounded font-medium ${
              purchase.tier === 'advanced'
                ? 'bg-purple-500/20 text-purple-700 dark:text-purple-300'
                : 'bg-gray-500/20 text-gray-700 dark:text-gray-300'
            }`}
          >
            {purchase.tier === 'advanced' ? 'Advanced' : 'Standard'}
          </span>
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-400">
          {purchase.type === 'lifetime'
            ? 'Lifetime access'
            : purchase.expiresAt
              ? `Renews ${purchase.expiresAt.toLocaleDateString()}`
              : 'Active subscription'}
        </p>
      </CardContent>
    </Card>
  );
}
