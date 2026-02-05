import { Link, useLocation } from 'react-router-dom';
import { useProfile } from '../../hooks/useProfile';
import { useOverviewStats, useForgottenTracks, useRecentlyDiscovered, useTracks, useYearlyStats } from '../../hooks/useApi';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import './vinyl.css';

function VinylNav() {
  const location = useLocation();
  const { profiles, selectedProfileId, setSelectedProfileId } = useProfile();
  
  return (
    <nav className="vinyl-nav">
      <div className="vinyl-logo">
        <div className="vinyl-logo-disc" />
        <span>Vinyl Dreams</span>
      </div>
      
      <ul className="vinyl-nav-links">
        <li>
          <Link 
            to="/1" 
            className={`vinyl-nav-link ${location.pathname === '/1' ? 'active' : ''}`}
          >
            Memories
          </Link>
        </li>
        <li>
          <Link 
            to="/1/forgotten" 
            className={`vinyl-nav-link ${location.pathname === '/1/forgotten' ? 'active' : ''}`}
          >
            Forgotten Gems
          </Link>
        </li>
        <li>
          <Link 
            to="/1/journey" 
            className={`vinyl-nav-link ${location.pathname === '/1/journey' ? 'active' : ''}`}
          >
            Your Journey
          </Link>
        </li>
      </ul>
      
      <div className="flex items-center gap-4">
        <select
          value={selectedProfileId}
          onChange={(e) => setSelectedProfileId(e.target.value === 'all' ? 'all' : Number(e.target.value))}
          className="vinyl-select"
        >
          <option value="all">All Collections</option>
          {profiles.map((p) => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>
        
        <div className="vinyl-design-switcher">
          {[1, 2, 3, 4, 5].map((n) => (
            <Link
              key={n}
              to={`/${n}`}
              className={`vinyl-design-btn ${n === 1 ? 'active' : ''}`}
            >
              {n}
            </Link>
          ))}
        </div>
      </div>
    </nav>
  );
}

function formatNumber(num: number): string {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
  return num.toString();
}

function formatMinutes(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  if (hours >= 24) {
    const days = Math.floor(hours / 24);
    return `${days} days`;
  }
  return `${hours}h ${Math.round(minutes % 60)}m`;
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return 'Unknown';
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
}

function daysSince(dateStr: string | null): number {
  if (!dateStr) return 0;
  const date = new Date(dateStr);
  const now = new Date();
  return Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
}

// Spinning vinyl record visualization
function VinylDisc({ size = 200, playing = false }: { size?: number; playing?: boolean }) {
  return (
    <div className="vinyl-disc-container" style={{ width: size, height: size }}>
      <div className={`vinyl-disc ${playing ? 'spinning' : ''}`} style={{ width: size, height: size }}>
        <div className="vinyl-grooves" />
        <div className="vinyl-label">
          <span>♪</span>
        </div>
      </div>
    </div>
  );
}

function VinylMemories() {
  const { selectedProfileId } = useProfile();
  const { data: overview, isLoading } = useOverviewStats(selectedProfileId);
  const { data: discovered } = useRecentlyDiscovered(selectedProfileId, 5);
  const { data: forgotten } = useForgottenTracks(selectedProfileId, 3);

  if (isLoading) {
    return (
      <div className="vinyl-loading">
        <VinylDisc size={80} playing />
      </div>
    );
  }

  return (
    <div className="vinyl-page p-8">
      {/* Hero */}
      <div className="vinyl-hero flex items-center gap-12 mb-12">
        <VinylDisc size={180} playing />
        <div>
          <h1 className="font-playfair text-5xl text-vinyl-cream mb-4">
            Your Musical <span className="text-vinyl-orange">Memories</span>
          </h1>
          <p className="text-vinyl-cream/60 text-lg mb-6">
            A nostalgic journey through your listening history
          </p>
          <div className="flex gap-8">
            <div className="vinyl-stat">
              <div className="vinyl-stat-value">{formatNumber(overview?.totalPlays || 0)}</div>
              <div className="vinyl-stat-label">plays</div>
            </div>
            <div className="vinyl-stat">
              <div className="vinyl-stat-value">{formatMinutes(overview?.totalMinutes || 0)}</div>
              <div className="vinyl-stat-label">listened</div>
            </div>
            <div className="vinyl-stat">
              <div className="vinyl-stat-value">{formatNumber(overview?.uniqueArtists || 0)}</div>
              <div className="vinyl-stat-label">artists</div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-8">
        {/* Recently Discovered */}
        <div className="vinyl-card">
          <h2 className="vinyl-section-title">✨ Fresh Discoveries</h2>
          <p className="text-vinyl-cream/50 text-sm mb-4">New tracks from the past 30 days</p>
          {discovered && discovered.length > 0 ? (
            <div className="space-y-3">
              {discovered.map((track, i) => (
                <div key={track.id} className="vinyl-track">
                  <div className="vinyl-track-number">{i + 1}</div>
                  <div className="vinyl-track-info">
                    <div className="vinyl-track-name">{track.name || track.trackName}</div>
                    <div className="vinyl-track-artist">{track.artistName}</div>
                  </div>
                  <div className="vinyl-track-meta">
                    <span className="text-vinyl-orange">{formatDate(track.firstPlay)}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-vinyl-cream/40 italic">No new discoveries recently</p>
          )}
        </div>

        {/* Forgotten Preview */}
        <div className="vinyl-card vinyl-card-aged">
          <h2 className="vinyl-section-title">💿 Forgotten Gems</h2>
          <p className="text-vinyl-cream/50 text-sm mb-4">Songs you loved but haven't played in 6+ months</p>
          {forgotten && forgotten.length > 0 ? (
            <div className="space-y-3">
              {forgotten.map((track, i) => (
                <div key={track.id} className="vinyl-track">
                  <div className="vinyl-track-number">{i + 1}</div>
                  <div className="vinyl-track-info">
                    <div className="vinyl-track-name">{track.name || track.trackName}</div>
                    <div className="vinyl-track-artist">{track.artistName}</div>
                  </div>
                  <div className="vinyl-track-meta">
                    <span className="text-vinyl-cream/40">{daysSince(track.lastPlay)} days ago</span>
                  </div>
                </div>
              ))}
              <Link to="/1/forgotten" className="vinyl-btn mt-4 inline-block">
                Rediscover More →
              </Link>
            </div>
          ) : (
            <p className="text-vinyl-cream/40 italic">No forgotten tracks found</p>
          )}
        </div>
      </div>
    </div>
  );
}

function VinylForgotten() {
  const { selectedProfileId } = useProfile();
  const { data: forgotten, isLoading } = useForgottenTracks(selectedProfileId, 20);

  return (
    <div className="vinyl-page p-8">
      <div className="mb-8">
        <h1 className="font-playfair text-4xl text-vinyl-cream mb-2">
          💿 Forgotten Gems
        </h1>
        <p className="text-vinyl-cream/60">
          Tracks you used to love but haven't played in over 6 months. Time to rediscover them!
        </p>
      </div>

      {isLoading ? (
        <div className="vinyl-loading"><VinylDisc size={80} playing /></div>
      ) : forgotten && forgotten.length > 0 ? (
        <div className="vinyl-card">
          <div className="space-y-2">
            {forgotten.map((track, i) => (
              <div key={track.id} className="vinyl-track vinyl-track-large">
                <div className="vinyl-track-number">{i + 1}</div>
                <div className="flex-1">
                  <div className="vinyl-track-name text-lg">{track.name || track.trackName}</div>
                  <div className="vinyl-track-artist">{track.artistName} • {track.albumName}</div>
                </div>
                <div className="text-right">
                  <div className="text-vinyl-orange font-semibold">{track.totalPlays} plays</div>
                  <div className="text-vinyl-cream/40 text-sm">
                    Last played {daysSince(track.lastPlay)} days ago
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="vinyl-card text-center py-12">
          <VinylDisc size={100} />
          <p className="text-vinyl-cream/60 mt-6">
            No forgotten gems found. Keep listening and check back later!
          </p>
        </div>
      )}
    </div>
  );
}

function VinylJourney() {
  const { selectedProfileId } = useProfile();
  const { data: yearly, isLoading } = useYearlyStats(selectedProfileId);
  const { data: tracksData } = useTracks({
    profileId: selectedProfileId,
    limit: 10,
    sortBy: 'firstPlay',
    sortOrder: 'ASC',
  });

  const oldestTracks = tracksData?.data || [];

  return (
    <div className="vinyl-page p-8">
      <div className="mb-8">
        <h1 className="font-playfair text-4xl text-vinyl-cream mb-2">
          📜 Your Musical Journey
        </h1>
        <p className="text-vinyl-cream/60">
          How your listening evolved through the years
        </p>
      </div>

      {isLoading ? (
        <div className="vinyl-loading"><VinylDisc size={80} playing /></div>
      ) : (
        <div className="grid grid-cols-2 gap-8">
          {/* Timeline Chart */}
          <div className="vinyl-card">
            <h2 className="vinyl-section-title">Through the Years</h2>
            <div className="h-64 mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={yearly || []}>
                  <defs>
                    <linearGradient id="vinylGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#ff6b35" stopOpacity={0.6} />
                      <stop offset="100%" stopColor="#3d2914" stopOpacity={0.2} />
                    </linearGradient>
                  </defs>
                  <XAxis 
                    dataKey="year" 
                    stroke="rgba(254, 245, 231, 0.3)"
                    tick={{ fill: 'rgba(254, 245, 231, 0.6)', fontSize: 12 }}
                  />
                  <YAxis 
                    stroke="rgba(254, 245, 231, 0.3)"
                    tick={{ fill: 'rgba(254, 245, 231, 0.6)', fontSize: 12 }}
                    tickFormatter={(v) => formatNumber(v)}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      background: '#2d1810', 
                      border: '1px solid rgba(255, 107, 53, 0.3)',
                      borderRadius: '8px',
                      color: '#fef5e7',
                    }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="plays" 
                    stroke="#ff6b35"
                    strokeWidth={2}
                    fill="url(#vinylGradient)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* First Listens */}
          <div className="vinyl-card vinyl-card-aged">
            <h2 className="vinyl-section-title">🎵 Your First Tracks</h2>
            <p className="text-vinyl-cream/50 text-sm mb-4">
              The earliest songs in your collection
            </p>
            <div className="space-y-2">
              {oldestTracks.slice(0, 8).map((track, i) => (
                <div key={track.id} className="vinyl-track">
                  <div className="vinyl-track-number">{i + 1}</div>
                  <div className="vinyl-track-info">
                    <div className="vinyl-track-name">{track.name || track.trackName}</div>
                    <div className="vinyl-track-artist">{track.artistName}</div>
                  </div>
                  <div className="vinyl-track-meta">
                    <span className="text-vinyl-orange/70">{formatDate(track.firstPlay)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function VinylApp() {
  const location = useLocation();
  
  return (
    <div className="vinyl-app">
      <VinylNav />
      
      {location.pathname === '/1' && <VinylMemories />}
      {location.pathname === '/1/forgotten' && <VinylForgotten />}
      {location.pathname === '/1/journey' && <VinylJourney />}
    </div>
  );
}
