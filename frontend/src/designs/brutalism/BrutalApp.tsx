import { Link, useLocation } from 'react-router-dom';
import { useProfile } from '../../hooks/useProfile';
import { useOverviewStats, useTopArtists, useYearlyStats, useTracks, useDayOfWeek } from '../../hooks/useApi';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import './brutal.css';

function BrutalNav() {
  const location = useLocation();
  const { profiles, selectedProfileId, setSelectedProfileId } = useProfile();
  
  return (
    <nav className="brutal-nav">
      <div className="brutal-logo">
        <div className="brutal-logo-box"><span>♫</span></div>
        <span>LOUD STATS</span>
      </div>
      
      <ul className="brutal-nav-links">
        <li>
          <Link 
            to="/4" 
            className={`brutal-nav-link ${location.pathname === '/4' ? 'active' : ''}`}
          >
            Home
          </Link>
        </li>
        <li>
          <Link 
            to="/4/charts" 
            className={`brutal-nav-link ${location.pathname === '/4/charts' ? 'active' : ''}`}
          >
            Charts
          </Link>
        </li>
        <li>
          <Link 
            to="/4/collection" 
            className={`brutal-nav-link ${location.pathname === '/4/collection' ? 'active' : ''}`}
          >
            Collection
          </Link>
        </li>
      </ul>
      
      <div className="flex items-center gap-4">
        <select
          value={selectedProfileId}
          onChange={(e) => setSelectedProfileId(e.target.value === 'all' ? 'all' : Number(e.target.value))}
          className="brutal-select"
        >
          <option value="all">ALL PROFILES</option>
          {profiles.map((p) => (
            <option key={p.id} value={p.id}>{p.name.toUpperCase()}</option>
          ))}
        </select>
        
        <div className="brutal-design-switcher">
          {[1, 2, 3, 4, 5].map((n) => (
            <Link
              key={n}
              to={`/${n}`}
              className={`brutal-design-btn ${n === 4 ? 'active' : ''}`}
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
    return `${days}D`;
  }
  return `${hours}H`;
}

function BrutalDashboard() {
  const { selectedProfileId } = useProfile();
  const { data: overview, isLoading } = useOverviewStats(selectedProfileId);
  const { data: topArtists, isLoading: loadingArtists } = useTopArtists(selectedProfileId, 5);
  const { data: tracksData } = useTracks({ 
    profileId: selectedProfileId, 
    limit: 5, 
    sortBy: 'totalPlays', 
    sortOrder: 'DESC' 
  });

  if (isLoading) {
    return (
      <div className="brutal-loading">
        <div className="brutal-loading-box" />
      </div>
    );
  }

  const topTracks = tracksData?.data || [];

  return (
    <div className="p-8">
      {/* Hero */}
      <div className="mb-12">
        <h1 className="brutal-section-title text-4xl mb-6" style={{ transform: 'rotate(-2deg)' }}>
          YOUR MUSIC IS LOUD
        </h1>
      </div>

      {/* Stats */}
      <div className="brutal-grid brutal-grid-4 mb-12">
        <div className="brutal-card brutal-card-yellow brutal-offset-1">
          <div className="brutal-stat-value">{formatNumber(overview?.totalPlays || 0)}</div>
          <div className="brutal-stat-label">PLAYS</div>
        </div>
        <div className="brutal-card brutal-card-red brutal-offset-2">
          <div className="brutal-stat-value">{formatMinutes(overview?.totalMinutes || 0)}</div>
          <div className="brutal-stat-label">LISTENED</div>
        </div>
        <div className="brutal-card brutal-offset-3">
          <div className="brutal-stat-value">{formatNumber(overview?.uniqueTracks || 0)}</div>
          <div className="brutal-stat-label">TRACKS</div>
        </div>
        <div className="brutal-card brutal-card-black">
          <div className="brutal-stat-value">{formatNumber(overview?.uniqueArtists || 0)}</div>
          <div className="brutal-stat-label">ARTISTS</div>
        </div>
      </div>

      <div className="brutal-grid brutal-grid-2 gap-8">
        {/* Top Artists */}
        <div className="brutal-card">
          <div className="brutal-badge brutal-badge-red mb-4">TOP ARTISTS</div>
          {loadingArtists ? (
            <div className="brutal-loading"><div className="brutal-loading-box" /></div>
          ) : (
            <div>
              {topArtists?.map((artist, index) => (
                <div key={artist.id} className="brutal-track">
                  <div className="brutal-track-number">{index + 1}</div>
                  <div className="brutal-track-info">
                    <div className="brutal-track-name">{artist.name}</div>
                    <div className="brutal-track-artist">{formatMinutes(artist.minutes)} played</div>
                  </div>
                  <div className="brutal-track-plays">{formatNumber(artist.plays)}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Top Tracks */}
        <div className="brutal-card brutal-card-yellow">
          <div className="brutal-badge mb-4">TOP TRACKS</div>
          <div>
            {topTracks.map((track, index) => (
              <div key={track.id} className="brutal-track">
                <div className="brutal-track-number">{index + 1}</div>
                <div className="brutal-track-info">
                  <div className="brutal-track-name">{track.name || track.trackName}</div>
                  <div className="brutal-track-artist">{track.artistName}</div>
                </div>
                <div className="brutal-track-plays" style={{ background: '#1a1a1a' }}>
                  {formatNumber(track.totalPlays)}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Marquee */}
      <div className="brutal-marquee mt-12">
        <div className="brutal-marquee-content">
          {[...Array(10)].map((_, i) => (
            <span key={i} className="mx-8">
              ★ {formatNumber(overview?.totalPlays || 0)} PLAYS ★ {formatNumber(overview?.uniqueTracks || 0)} TRACKS ★ {formatNumber(overview?.uniqueArtists || 0)} ARTISTS
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

function BrutalCharts() {
  const { selectedProfileId } = useProfile();
  const { data: yearly, isLoading } = useYearlyStats(selectedProfileId);
  const { data: dayOfWeek } = useDayOfWeek(selectedProfileId);

  const COLORS = ['#ff3366', '#ffe135', '#1a1a1a', '#ff3366', '#ffe135', '#1a1a1a', '#ff3366'];
  const DAYS = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

  const dowData = dayOfWeek?.map((d) => ({
    day: DAYS[d.dow],
    plays: d.plays,
  })) || [];

  return (
    <div className="p-8">
      <h1 className="brutal-section-title mb-8">THE NUMBERS</h1>
      
      <div className="brutal-grid brutal-grid-2 gap-8">
        {isLoading ? (
          <div className="brutal-loading"><div className="brutal-loading-box" /></div>
        ) : (
          <>
            <div className="brutal-card">
              <div className="brutal-badge brutal-badge-yellow mb-4">YEARLY</div>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={yearly || []}>
                    <XAxis 
                      dataKey="year" 
                      stroke="#1a1a1a"
                      strokeWidth={2}
                      tick={{ fill: '#1a1a1a', fontFamily: 'Space Mono', fontWeight: 700 }}
                    />
                    <YAxis 
                      stroke="#1a1a1a"
                      strokeWidth={2}
                      tick={{ fill: '#1a1a1a', fontFamily: 'Space Mono', fontWeight: 700 }}
                      tickFormatter={(v) => formatNumber(v)}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        background: '#fffdf7', 
                        border: '3px solid #1a1a1a',
                        boxShadow: '4px 4px 0 #1a1a1a',
                        fontFamily: 'Space Mono',
                        fontWeight: 700,
                      }}
                      formatter={(value: number) => [formatNumber(value), 'PLAYS']}
                    />
                    <Bar dataKey="plays">
                      {yearly?.map((_, index) => (
                        <Cell key={index} fill={index % 2 === 0 ? '#ff3366' : '#ffe135'} stroke="#1a1a1a" strokeWidth={2} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="brutal-card brutal-card-black">
              <div className="brutal-badge mb-4">DAY OF WEEK</div>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={dowData}>
                    <XAxis 
                      dataKey="day" 
                      stroke="#fffdf7"
                      strokeWidth={2}
                      tick={{ fill: '#fffdf7', fontFamily: 'Space Mono', fontWeight: 700, fontSize: 10 }}
                    />
                    <YAxis 
                      stroke="#fffdf7"
                      strokeWidth={2}
                      tick={{ fill: '#fffdf7', fontFamily: 'Space Mono', fontWeight: 700, fontSize: 10 }}
                      tickFormatter={(v) => formatNumber(v)}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        background: '#1a1a1a', 
                        border: '3px solid #fffdf7',
                        color: '#fffdf7',
                        fontFamily: 'Space Mono',
                        fontWeight: 700,
                      }}
                    />
                    <Bar dataKey="plays">
                      {dowData.map((_, index) => (
                        <Cell key={index} fill={COLORS[index]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function BrutalCollection() {
  const { selectedProfileId } = useProfile();
  const { data: tracksData, isLoading } = useTracks({ 
    profileId: selectedProfileId, 
    limit: 15, 
    sortBy: 'totalPlays', 
    sortOrder: 'DESC' 
  });

  const tracks = tracksData?.data || [];

  return (
    <div className="p-8">
      <h1 className="brutal-section-title mb-8">COLLECTION</h1>
      
      {isLoading ? (
        <div className="brutal-loading"><div className="brutal-loading-box" /></div>
      ) : (
        <div className="brutal-card">
          {tracks.map((track, index) => (
            <div key={track.id} className="brutal-track">
              <div className="brutal-track-number">{String(index + 1).padStart(2, '0')}</div>
              <div className="brutal-track-info">
                <div className="brutal-track-name">{track.name || track.trackName}</div>
                <div className="brutal-track-artist">
                  {track.artistName} — {track.albumName}
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="brutal-progress w-24">
                  <div 
                    className="brutal-progress-fill" 
                    style={{ width: `${Math.min(100, (track.totalPlays / 100) * 100)}%` }}
                  />
                </div>
                <div className="brutal-track-plays">{formatNumber(track.totalPlays)}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function BrutalApp() {
  const location = useLocation();
  
  return (
    <div className="brutal-app">
      <div className="brutal-content">
        <BrutalNav />
        
        {location.pathname === '/4' && <BrutalDashboard />}
        {location.pathname === '/4/charts' && <BrutalCharts />}
        {location.pathname === '/4/collection' && <BrutalCollection />}
      </div>
    </div>
  );
}
