// components/dashboard/ActivityFeed.tsx
// Recent Activity panel. Owns its loading and empty states so the page doesn't
// have to branch three ways around it, and absorbs the activityIcon helper that
// was floating at module scope in page.tsx.
import { Heart, Image as ImageIcon, Video, Music, Bell } from 'lucide-react';
import { DashboardActivity } from '@/app/data/dashboard';
import DashboardCard from './DashboardCard';
import { formatDate } from './formatDate';

function activityIcon(type: DashboardActivity['type']) {
  const props = { size: 16, className: 'text-[#c3195d] mt-1 shrink-0' };
  if (type === 'photo') return <ImageIcon {...props} />;
  if (type === 'video') return <Video {...props} />;
  if (type === 'audio') return <Music {...props} />;
  return <Heart {...props} />;
}

interface ActivityFeedProps {
  activity: DashboardActivity[];
  loading: boolean;
}

export default function ActivityFeed({ activity, loading }: ActivityFeedProps) {
  return (
    <DashboardCard padding="lg">
      <div className="flex items-center gap-2 mb-5">
        <Bell size={18} className="text-[#c3195d]" />
        <h3 className="font-semibold">Recent Activity</h3>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-8 rounded bg-neutral-100 animate-pulse" />
          ))}
        </div>
      ) : activity.length > 0 ? (
        <div className="space-y-4">
          {activity.map((item) => (
            <div key={item.id} className="flex items-start gap-3">
              {activityIcon(item.type)}
              <div>
                <p className="text-sm font-medium">{item.message}</p>
                <p className="text-xs text-neutral-500">{formatDate(item.date)}</p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-neutral-500">No recent activity yet.</p>
      )}
    </DashboardCard>
  );
}