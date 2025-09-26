import React, { useState, useEffect, useMemo, useCallback } from 'react';
import type { View, Alert, Telemetry, Drone, UserRole, User, DroneStatus, RiskLevel } from './types';

// --- Mock Data (for non-user features) ---

const mockTelemetry: Telemetry = {
  altitude: '121m',
  speed: '12 km/h',
  battery: '49', 
  signal: '75',
};

const mockAlerts: Alert[] = [
  { id: 1, risk: 'High', coords: { lat: 48.713898, lng: -74.095898 }, timestamp: '9/23/2024 at 08:00 PM', altitude: '123m', confidence: '95%', description: 'High confidence mains connection detected.', images: { rgb: 'https://images.unsplash.com/photo-1593941707882-68289634f19a?q=80&w=2070&auto=format&fit=crop', thermal: 'https://images.unsplash.com/photo-1615962843422-4758557b45f3?q=80&w=1974&auto=format&fit=crop' } },
  { id: 2, risk: 'Medium', coords: { lat: 48.7145, lng: -74.0945 }, timestamp: '9/23/2024 at 07:58 PM', altitude: '122m', confidence: '60%', description: 'Potential anomaly detected near substation.', images: { rgb: 'https://images.unsplash.com/photo-1593941707882-68289634f19a?q=80&w=2070&auto=format&fit=crop', thermal: null } },
  { id: 3, risk: 'Low', coords: { lat: 48.7125, lng: -74.0975 }, timestamp: '9/23/2024 at 07:55 PM', altitude: '115m', confidence: '45%', description: 'Low confidence detection - needs review.', images: { rgb: 'https://images.unsplash.com/photo-1593941707882-68289634f19a?q=80&w=2070&auto=format&fit=crop', thermal: 'https://images.unsplash.com/photo-1615962843422-4758557b45f3?q=80&w=1974&auto=format&fit=crop' } }
];

const mockDrones: Drone[] = [
    { id: 'PF-001', status: 'Active', mission: 'Perimeter Scan Alpha', coords: { lat: 48.7138, lng: -74.0958 }, missionProgress: 'En route to WP-2' },
    { id: 'PF-002', status: 'Idle', mission: null, coords: { lat: 48.7150, lng: -74.0930 } },
    { id: 'PF-003', status: 'Active', mission: 'Substation Inspection', coords: { lat: 48.7120, lng: -74.0980 }, missionProgress: 'Scanning Area B (45%)' },
    { id: 'PF-004', status: 'Offline', mission: null, coords: { lat: 48.7110, lng: -74.0965 } },
];

// --- SVG Icons ---

const Icon = ({ path, className = 'w-6 h-6' }: { path: string, className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d={path} />
  </svg>
);

const ICONS = {
    BOLT: "M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z",
    DASHBOARD: "M3.375 3C2.339 3 1.5 3.84 1.5 4.875v.75c0 1.036.84 1.875 1.875 1.875h17.25c1.035 0 1.875-.84 1.875-1.875v-.75C22.5 3.839 21.66 3 20.625 3H3.375zM1.5 9.75v4.5c0 1.036.84 1.875 1.875 1.875h17.25c1.035 0 1.875-.84 1.875-1.875v-4.5A1.875 1.875 0 0 0 20.625 7.5H3.375A1.875 1.875 0 0 0 1.5 9.75zM1.5 18.75v.375c0 1.035.84 1.875 1.875 1.875h17.25c1.035 0 1.875-.84 1.875-1.875v-.375a1.875 1.875 0 0 0-1.875-1.875H3.375A1.875 1.875 0 0 0 1.5 18.75z",
    TRACKING: "M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z M12 5.25a7.5 7.5 0 0 0-7.5 7.5c0 5.085 4.054 8.288 6.697 9.805a.75.75 0 0 0 .606 0c2.643-1.517 6.697-4.72 6.697-9.805a7.5 7.5 0 0 0-7.5-7.5Z",
    PLANNER: "M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m5.23 9.92-2.12-2.12a.75.75 0 0 0-1.061 0L8.25 14.25m9.75 3.375-2.625-2.625a.75.75 0 0 0-1.06 0l-2.122 2.122a.75.75 0 0 1-1.06 0l-2.122-2.122a.75.75 0 0 0-1.06 0L3 17.625m16.5-9.375a1.125 1.125 0 0 0-1.125-1.125h-1.5a1.125 1.125 0 0 0-1.125 1.125v1.5A1.125 1.125 0 0 0 16.5 9.75h1.5a1.125 1.125 0 0 0 1.125-1.125v-1.5Z",
    SETTINGS: "M9.594 3.94c.09-.542.56-1.008 1.112-1.265l.983-.442c.24-.108.497-.108.736 0l.983.442c.553.257 1.022.723 1.112 1.265l.16.962c.28.16.544.35.792.562l.849.601c.452.322.736.857.736 1.41l0 .034c0 .553-.284 1.088-.736 1.41l-.85.601c-.247.212-.512.401-.792.562l-.16.962c-.09.542-.56 1.008-1.112 1.265l-.983.442c-.24.108-.497-.108-.736 0l-.983-.442c-.553-.257-1.022-.723-1.112-1.265l-.16-.962a5.973 5.973 0 0 1-.792-.562l-.849-.601c-.452-.322-.736-.857-.736-1.41l0-.034c0-.553.284-1.088.736-1.41l.85-.601c.247-.212.512-.402.792-.562l.16-.962zM12 15.75a3.75 3.75 0 1 0 0-7.5 3.75 3.75 0 0 0 0 7.5z",
    USERS: "M15 19.128a9.38 9.38 0 0 0 2.625-.372 9.337 9.337 0 0 0 4.121 3.543c-2.372.536-4.885.666-7.5.345-2.615-.321-5.127-.959-7.5-1.895 4.224-2.28 4.224-5.334 0-7.614a9.337 9.337 0 0 0 4.121 3.543 9.38 9.38 0 0 0 2.625-.372M12 15.75a3.75 3.75 0 1 0 0-7.5 3.75 3.75 0 0 0 0 7.5z",
    CLOSE: "M6 18L18 6M6 6l12 12",
    IMAGE: "M2.25 15.75l5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5z",
    ALTITUDE: "m4.5 18.75 7.5-12.5 7.5 12.5h-15Z",
    SPEED: "M3.75 12a.75.75 0 0 1 .75-.75h14.355a.75.75 0 0 1 0 1.5H4.5a.75.75 0 0 1-.75-.75Zm0-4.5a.75.75 0 0 1 .75-.75h8.355a.75.75 0 0 1 0 1.5H4.5a.75.75 0 0 1-.75-.75Zm0 9a.75.75 0 0 1 .75-.75h6.355a.75.75 0 0 1 0 1.5H4.5a.75.75 0 0 1-.75-.75Z",
    BATTERY: "M7.5 7.5h9v9h-9v-9Z",
    SIGNAL: "M8.25 18.75a.75.75 0 0 1-.75-.75V10.5a.75.75 0 0 1 1.5 0v7.5a.75.75 0 0 1-.75-.75Zm3.75 0a.75.75 0 0 1-.75-.75V8.25a.75.75 0 0 1 1.5 0v9.75a.75.75 0 0 1-.75-.75Zm3.75 0a.75.75 0 0 1-.75-.75v-6a.75.75 0 0 1 1.5 0v6a.75.75 0 0 1-.75-.75Zm3.75 0a.75.75 0 0 1-.75-.75V9a.75.75 0 0 1 1.5 0v9a.75.75 0 0 1-.75-.75Z",
    VERIFIED: "M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z",
    PENDING: "M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z",
};

// --- Helper Functions ---

const getRiskColor = (risk: RiskLevel) => {
    switch (risk) {
        case 'High': return 'bg-red-500';
        case 'Medium': return 'bg-orange-500';
        case 'Low': return 'bg-yellow-500';
    }
};

const getStatusColor = (status: DroneStatus) => {
    switch(status) {
        case 'Active': return 'bg-green-500';
        case 'Idle': return 'bg-blue-500';
        case 'Offline': return 'bg-slate-500';
    }
};

const getStatusTextColor = (status: DroneStatus) => {
    switch(status) {
        case 'Active': return 'text-green-400';
        case 'Idle': return 'text-blue-400';
        case 'Offline': return 'text-slate-400';
    }
};

// --- App Components ---

const Header = ({ currentPath, navigate, onLogout, currentUser }: { currentPath: string; navigate: (path: string) => void; onLogout: () => void; currentUser: User }) => {
    const navItems: { path: string; label: string; icon: string }[] = [
        { path: '/dashboard', label: 'Dashboard', icon: ICONS.DASHBOARD },
        { path: '/tracking', label: 'Tracking', icon: ICONS.TRACKING },
        { path: '/planner', label: 'Mission Planner', icon: ICONS.PLANNER },
        { path: '/settings', label: 'Settings', icon: ICONS.SETTINGS },
    ];
    
    if (currentUser.role === 'Administrator') {
      navItems.splice(3, 0, { path: '/users', label: 'Users', icon: ICONS.USERS });
    }

    return (
        <header className="bg-slate-900/80 backdrop-blur-sm fixed top-0 left-0 right-0 z-20 flex items-center justify-between h-16 px-6 border-b border-slate-800">
            <div className="flex items-center gap-4">
                <Icon path={ICONS.BOLT} className="w-8 h-8 text-blue-500" />
                <span className="text-xl font-bold text-slate-100">PulseFly</span>
            </div>
            <nav className="flex items-center gap-2">
                {navItems.map(({ path, label, icon }) => (
                    <button
                        key={path}
                        onClick={() => navigate(path)}
                        className={`px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-2 ${currentPath === path ? 'bg-blue-600 text-white' : 'text-slate-300 hover:bg-slate-700 hover:text-white'}`}
                        aria-current={currentPath === path ? 'page' : undefined}
                    >
                        <Icon path={icon} className="w-5 h-5"/>
                        {label}
                    </button>
                ))}
            </nav>
            <div className="flex items-center gap-4">
                 <div className="text-right">
                    <div className="text-sm font-semibold text-slate-100">{currentUser.username}</div>
                    <div className="text-xs text-slate-400">{currentUser.role}</div>
                </div>
                <button onClick={onLogout} className="px-4 py-2 rounded-md text-sm font-medium bg-slate-700 text-slate-300 hover:bg-slate-600 hover:text-white transition-colors">
                    Logout
                </button>
            </div>
        </header>
    );
};

const LoginScreen = ({ onLogin }: { onLogin: (user: User) => void }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<UserRole>('Authority');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    
    try {
      const response = await fetch('/.netlify/functions/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Invalid credentials.');
      }
      
      if (data.role !== role) {
        throw new Error('Invalid role selected for this user.');
      }
      
      onLogin({ username: data.username, password: '', role: data.role });

    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const userRoles: UserRole[] = ['Authority', 'Drone Operator', 'Data Analyst', 'Field Inspector', 'Administrator'];

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900 p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-blue-500 tracking-wider">PulseFly</h1>
            <p className="text-slate-400 mt-2">Drone Detection & Mission Control</p>
        </div>
        <form onSubmit={handleSubmit} className="bg-slate-800 shadow-2xl rounded-lg px-8 pt-6 pb-8 mb-4">
          <div className="mb-4">
            <label className="block text-slate-300 text-sm font-bold mb-2" htmlFor="username">Username</label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="shadow appearance-none border border-slate-700 rounded w-full py-2 px-3 bg-slate-700 text-slate-200 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          <div className="mb-4">
            <label className="block text-slate-300 text-sm font-bold mb-2" htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="shadow appearance-none border border-slate-700 rounded w-full py-2 px-3 bg-slate-700 text-slate-200 mb-3 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          <div className="mb-6">
            <label className="block text-slate-300 text-sm font-bold mb-2" htmlFor="role">User Type</label>
            <select
              id="role"
              value={role}
              onChange={(e) => setRole(e.target.value as UserRole)}
              className="shadow appearance-none border border-slate-700 rounded w-full py-2 px-3 bg-slate-700 text-slate-200 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {userRoles.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>
          <div className="flex items-center justify-between">
            <button
              type="submit"
              disabled={isLoading}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline w-full transition-colors disabled:bg-slate-500 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Logging in...' : 'Login'}
            </button>
          </div>
          {error && <p className="text-red-500 text-center text-sm mt-4">{error}</p>}
        </form>
      </div>
    </div>
  );
};

// --- Dashboard Components ---

const DashboardView = ({ onPinClick }: { onPinClick: (alert: Alert) => void }) => {
    const riskCounts = useMemo(() => mockAlerts.reduce((acc, alert) => {
        acc[alert.risk] = (acc[alert.risk] || 0) + 1;
        return acc;
    }, {} as Record<RiskLevel, number>), []);

    const pinPositions = [
      { top: '30%', left: '40%' },
      { top: '55%', left: '60%' },
      { top: '45%', left: '25%' },
    ];

    return (
        <div className="h-full w-full relative overflow-hidden">
            <img src="https://images.unsplash.com/photo-1506869640319-fe1a24fd76dc?q=80&w=2940&auto=format&fit=crop" alt="Dark grass field at night" className="absolute top-0 left-0 w-full h-full object-cover select-none" />
            <div className="absolute inset-0 bg-black/30"></div>
            
            {mockAlerts.map((alert, index) => (
                <button
                    key={alert.id}
                    className={`absolute w-4 h-4 rounded-full ${getRiskColor(alert.risk)} transform -translate-x-1/2 -translate-y-1/2 ring-2 ring-white/50 animate-pulse`}
                    style={pinPositions[index]}
                    onClick={() => onPinClick(alert)}
                    aria-label={`Alert ${alert.id}, Risk: ${alert.risk}`}
                />
            ))}

            <div className="absolute top-4 right-4 flex flex-col gap-4">
                <TelemetryPanel />
                <DetectionSummaryPanel riskCounts={riskCounts} />
            </div>
        </div>
    );
};

const TelemetryPanel = () => (
    <div className="w-64 bg-slate-800/80 backdrop-blur-md p-4 rounded-lg shadow-lg border border-slate-700">
        <h3 className="text-lg font-semibold text-slate-100 mb-4">Live Telemetry</h3>
        <div className="space-y-3">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-slate-300">
                    <Icon path={ICONS.ALTITUDE} className="w-5 h-5" />
                    <span>Altitude</span>
                </div>
                <span className="font-mono text-slate-100">{mockTelemetry.altitude}</span>
            </div>
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-slate-300">
                    <Icon path={ICONS.SPEED} className="w-5 h-5" />
                    <span>Speed</span>
                </div>
                <span className="font-mono text-slate-100">{mockTelemetry.speed}</span>
            </div>
             <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-2 text-slate-300">
                     <Icon path={ICONS.BATTERY} className="w-5 h-5 text-green-400" />
                    <span>Battery</span>
                </div>
                <div className="w-2/3 bg-slate-600 rounded-full h-2.5">
                    <div className="bg-green-500 h-2.5 rounded-full" style={{ width: `${mockTelemetry.battery}%` }}></div>
                </div>
                <span className="font-mono text-slate-100 text-xs w-8">{mockTelemetry.battery}%</span>
            </div>
             <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-2 text-slate-300">
                     <Icon path={ICONS.SIGNAL} className="w-5 h-5 text-blue-400" />
                    <span>Signal</span>
                </div>
                <div className="w-2/3 bg-slate-600 rounded-full h-2.5">
                    <div className="bg-blue-500 h-2.5 rounded-full" style={{ width: `${mockTelemetry.signal}%` }}></div>
                </div>
                <span className="font-mono text-slate-100 text-xs w-8">{mockTelemetry.signal}%</span>
            </div>
        </div>
    </div>
);

const DetectionSummaryPanel = ({ riskCounts }: { riskCounts: Record<RiskLevel, number> }) => (
    <div className="w-64 bg-slate-800/80 backdrop-blur-md p-4 rounded-lg shadow-lg border border-slate-700">
        <h3 className="text-lg font-semibold text-slate-100 mb-4">Detection Summary</h3>
        <div className="space-y-3">
            <h4 className="text-sm font-semibold text-slate-400">By Risk Level</h4>
            <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-red-500"></div><span className="text-slate-300">High Risk</span>
                </div>
                <span className="font-bold text-slate-100">{riskCounts['High'] || 0}</span>
            </div>
            <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-orange-500"></div><span className="text-slate-300">Medium Risk</span>
                </div>
                <span className="font-bold text-slate-100">{riskCounts['Medium'] || 0}</span>
            </div>
            <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-yellow-500"></div><span className="text-slate-300">Low Risk</span>
                </div>
                <span className="font-bold text-slate-100">{riskCounts['Low'] || 0}</span>
            </div>
            <div className="border-t border-slate-700 my-3"></div>
            <h4 className="text-sm font-semibold text-slate-400">By Status</h4>
            <div className="flex justify-between items-center">
                 <div className="flex items-center gap-2 text-slate-300">
                    <Icon path={ICONS.VERIFIED} className="w-5 h-5 text-green-400"/>
                    <span>Verified</span>
                 </div>
                <span className="font-bold text-slate-100">0</span>
            </div>
             <div className="flex justify-between items-center">
                 <div className="flex items-center gap-2 text-slate-300">
                    <Icon path={ICONS.PENDING} className="w-5 h-5 text-yellow-400"/>
                    <span>Pending</span>
                 </div>
                <span className="font-bold text-slate-100">3</span>
            </div>
        </div>
    </div>
);

const DetectionAlertModal = ({ alert, onClose }: { alert: Alert; onClose: () => void; }) => {
    const [activeTab, setActiveTab] = useState<'rgb' | 'thermal'>('rgb');

    return (
        <div className="fixed inset-0 bg-black/60 z-30 flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-slate-800 w-full max-w-2xl rounded-lg shadow-2xl border border-slate-700 overflow-hidden" onClick={e => e.stopPropagation()}>
                <div className={`flex justify-between items-center p-4 border-b border-slate-700 ${getRiskColor(alert.risk)}`}>
                    <h2 className="text-xl font-bold text-white">Detection Alert</h2>
                    <div className="flex items-center gap-4">
                        <span className="text-white text-sm font-semibold px-2 py-1 bg-black/20 rounded">{alert.risk} Risk</span>
                        <button onClick={onClose} className="text-white hover:text-slate-300">
                           <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d={ICONS.CLOSE}/></svg>
                        </button>
                    </div>
                </div>
                <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <h3 className="text-lg font-semibold mb-2 text-slate-200">Details</h3>
                        <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                            <strong className="text-slate-400">GPS Coordinates:</strong>
                            <span className="text-slate-300 font-mono">{`${alert.coords.lat}, ${alert.coords.lng}`}</span>
                            <strong className="text-slate-400">Timestamp:</strong>
                            <span className="text-slate-300">{alert.timestamp}</span>
                            <strong className="text-slate-400">Drone Altitude:</strong>
                            <span className="text-slate-300">{alert.altitude}</span>
                            <strong className="text-slate-400">Confidence:</strong>
                            <span className="text-slate-300">{alert.confidence}</span>
                        </div>
                         <h3 className="text-lg font-semibold mt-4 mb-2 text-slate-200">Description</h3>
                         <p className="text-sm text-slate-300 bg-slate-900 p-3 rounded-md">{alert.description}</p>
                         <h3 className="text-lg font-semibold mt-4 mb-2 text-slate-200">Map Location</h3>
                         <div className="aspect-video bg-slate-700 rounded-md overflow-hidden">
                             <img src="https://images.unsplash.com/photo-1613229725514-a24a3e2a3479?q=80&w=2070&auto=format&fit=crop" alt="Map snippet" className="w-full h-full object-cover select-none" />
                         </div>
                    </div>
                    <div>
                        <h3 className="text-lg font-semibold mb-2 text-slate-200">Evidence</h3>
                        <div className="flex border-b border-slate-600">
                            <button onClick={() => setActiveTab('rgb')} className={`px-4 py-2 text-sm font-medium ${activeTab === 'rgb' ? 'border-b-2 border-blue-500 text-blue-400' : 'text-slate-400 hover:text-white'}`}>RGB Image</button>
                            <button onClick={() => setActiveTab('thermal')} className={`px-4 py-2 text-sm font-medium ${activeTab === 'thermal' ? 'border-b-2 border-blue-500 text-blue-400' : 'text-slate-400 hover:text-white'}`}>Thermal Image</button>
                        </div>
                        <div className="mt-4 aspect-video bg-slate-900 rounded-md flex items-center justify-center">
                            {(activeTab === 'rgb' && alert.images.rgb) && <img src={alert.images.rgb} alt="RGB Evidence" className="w-full h-full object-cover select-none"/>}
                            {(activeTab === 'thermal' && alert.images.thermal) && <img src={alert.images.thermal} alt="Thermal Evidence" className="w-full h-full object-cover select-none"/>}
                            {((activeTab === 'rgb' && !alert.images.rgb) || (activeTab === 'thermal' && !alert.images.thermal)) && 
                                <div className="text-slate-500 flex flex-col items-center gap-2">
                                    <Icon path={ICONS.IMAGE} className="w-12 h-12" />
                                    <span>Image Not Available</span>
                                </div>
                            }
                        </div>
                         <h3 className="text-lg font-semibold mt-4 mb-2 text-slate-200">Notes & Comments</h3>
                         <textarea className="w-full h-24 bg-slate-900 text-slate-300 p-2 rounded-md border border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Add observations..."></textarea>
                    </div>
                </div>
            </div>
        </div>
    );
};

// --- Other Views ---

const MissionPlannerView = () => {
    return (
        <div className="flex h-full">
            <div className="w-80 bg-slate-800 p-4 flex flex-col border-r border-slate-700">
                <h2 className="text-xl font-bold mb-4">Mission Details</h2>
                <div className="mb-4">
                    <label className="text-sm text-slate-400">Mission Name</label>
                    <input type="text" className="w-full bg-slate-700 p-2 rounded mt-1" defaultValue="Perimeter Scan Alpha"/>
                </div>
                 <div className="mb-4">
                    <label className="text-sm text-slate-400">Load Template</label>
                    <select className="w-full bg-slate-700 p-2 rounded mt-1">
                        <option>None</option>
                        <option>Substation Inspection</option>
                    </select>
                </div>

                <h3 className="text-lg font-semibold mt-4 mb-2">Waypoints</h3>
                <div className="flex-grow overflow-y-auto space-y-2 pr-2">
                     {[1,2,3,4].map(i => (
                         <div key={i} className="bg-slate-700 p-2 rounded flex items-center justify-between">
                            <span className="font-bold">WP-{i}</span>
                             <input type="text" className="w-20 bg-slate-600 p-1 text-center rounded" defaultValue="120m"/>
                            <select className="bg-slate-600 p-1 rounded">
                                <option>Scan</option>
                                <option>Hover</option>
                            </select>
                         </div>
                     ))}
                </div>
                <div className="flex gap-2 mt-2">
                     <button className="flex-1 bg-blue-600 p-2 rounded text-sm hover:bg-blue-700">Add</button>
                     <button className="flex-1 bg-slate-600 p-2 rounded text-sm hover:bg-slate-500">Delete</button>
                </div>
                
                 <div className="mt-6 border-t border-slate-700 pt-4">
                     <h3 className="text-lg font-semibold mb-2">Flight Parameters</h3>
                     <div className="text-sm space-y-1">
                         <div className="flex justify-between"><span className="text-slate-400">Distance:</span><span>4.2 km</span></div>
                         <div className="flex justify-between"><span className="text-slate-400">Est. Time:</span><span>22 min</span></div>
                         <div className="flex justify-between"><span className="text-slate-400">Battery Usage:</span><span>38%</span></div>
                     </div>
                 </div>

                 <div className="mt-auto pt-4 space-y-2">
                     <button className="w-full bg-green-600 text-white font-bold py-3 rounded hover:bg-green-700">Start Mission</button>
                      <div className="flex gap-2">
                        <button className="flex-1 bg-slate-600 p-2 rounded text-sm hover:bg-slate-500">Save Template</button>
                        <button className="flex-1 bg-slate-600 p-2 rounded text-sm hover:bg-slate-500">Export</button>
                     </div>
                 </div>
            </div>
            <div className="flex-grow relative">
                <img src="https://images.unsplash.com/photo-1444858291040-58f756a3bdd6?q=80&w=2878&auto=format&fit=crop" alt="Grassy field for mission planning" className="w-full h-full object-cover select-none"/>
                 {[1,2,3,4].map((i, idx) => (
                    <div key={i} className="absolute text-white font-bold bg-blue-600 w-8 h-8 rounded-full flex items-center justify-center ring-2 ring-white/50" style={{top: `${20 + idx * 15}%`, left: `${15 + idx * 20}%`}}>{i}</div>
                 ))}
            </div>
        </div>
    );
};

const SettingsView = ({currentUser}: {currentUser: User}) => {
    return (
        <div className="p-8 max-w-4xl mx-auto">
            <h1 className="text-3xl font-bold mb-8">Settings</h1>
            <div className="space-y-8">
                {/* User Profile Card */}
                <div className="bg-slate-800 p-6 rounded-lg border border-slate-700">
                    <h2 className="text-xl font-semibold mb-4">User Profile</h2>
                    <div className="flex items-center gap-4">
                        <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center text-2xl font-bold text-white">
                            {currentUser.username.charAt(0).toUpperCase()}
                        </div>
                        <div>
                            <p className="font-bold text-lg">{currentUser.username}</p>
                            <p className="text-slate-400">{currentUser.role}</p>
                        </div>
                        <button className="ml-auto bg-slate-600 hover:bg-slate-500 text-white py-2 px-4 rounded-md text-sm">Reset Password</button>
                    </div>
                </div>

                {/* Offline & Sync Card */}
                <div className="bg-slate-800 p-6 rounded-lg border border-slate-700">
                     <h2 className="text-xl font-semibold mb-4">Offline & Sync</h2>
                     <div className="space-y-4">
                         <div className="flex items-center justify-between"><label htmlFor="offline-mode">Offline Mode</label><input id="offline-mode" type="checkbox" className="toggle"/></div>
                         <div className="flex items-center justify-between"><label htmlFor="auto-sync">Automatic Sync</label><input id="auto-sync" type="checkbox" className="toggle" defaultChecked/></div>
                         <div className="border-t border-slate-700 mt-4 pt-4">
                             <p className="mb-2">Sync Status: <span className="text-green-400">Up to date</span></p>
                             <div className="w-full bg-slate-700 rounded-full h-2.5 mb-2"><div className="bg-blue-600 h-2.5 rounded-full" style={{width: '100%'}}></div></div>
                             <button className="bg-slate-600 hover:bg-slate-500 text-white py-2 px-4 rounded-md text-sm">Manual Sync</button>
                         </div>
                     </div>
                </div>

                {/* Notifications Card */}
                <div className="bg-slate-800 p-6 rounded-lg border border-slate-700">
                     <h2 className="text-xl font-semibold mb-4">Notifications</h2>
                     <div className="space-y-4">
                         <div className="flex items-center justify-between"><label htmlFor="push-notifications">Push Notifications</label><input id="push-notifications" type="checkbox" className="toggle" defaultChecked/></div>
                         <div className="pl-6 border-l-2 border-slate-700 space-y-4 mt-4">
                             <div className="flex items-center justify-between"><label htmlFor="high-risk-alerts">High risk alerts</label><input id="high-risk-alerts" type="checkbox" className="toggle" defaultChecked/></div>
                             <div className="flex items-center justify-between"><label htmlFor="mission-completion">Mission completion</label><input id="mission-completion" type="checkbox" className="toggle" defaultChecked/></div>
                             <div className="flex items-center justify-between"><label htmlFor="system-maintenance">System maintenance</label><input id="system-maintenance" type="checkbox" className="toggle"/></div>
                         </div>
                     </div>
                </div>
            </div>
        </div>
    );
};

const TrackingView = () => {
    const [drones, setDrones] = useState<Drone[]>(mockDrones);
    const [selectedDrone, setSelectedDrone] = useState<Drone | null>(drones.find(d => d.status === 'Active') || drones[0]);

    useEffect(() => {
        const interval = setInterval(() => {
            setDrones(prevDrones => 
                prevDrones.map(drone => {
                    if (drone.status === 'Active') {
                        const newLat = drone.coords.lat + (Math.random() - 0.5) * 0.0002;
                        const newLng = drone.coords.lng + (Math.random() - 0.5) * 0.0002;
                        return { ...drone, coords: { lat: parseFloat(newLat.toFixed(6)), lng: parseFloat(newLng.toFixed(6)) } };
                    }
                    return drone;
                })
            );
        }, 2000);

        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        if (selectedDrone) {
            const updatedSelectedDrone = drones.find(d => d.id === selectedDrone.id);
            if (updatedSelectedDrone) {
                setSelectedDrone(updatedSelectedDrone);
            }
        }
    }, [drones, selectedDrone?.id]);

    const mapBounds = { north: 48.7160, south: 48.7100, east: -74.0920, west: -74.0990 };
    const latRange = mapBounds.north - mapBounds.south;
    const lngRange = mapBounds.east - mapBounds.west;

    const getPosition = (coords: { lat: number; lng: number }) => {
        const clampedLat = Math.max(mapBounds.south, Math.min(mapBounds.north, coords.lat));
        const clampedLng = Math.max(mapBounds.west, Math.min(mapBounds.east, coords.lng));
        const top = ((mapBounds.north - clampedLat) / latRange) * 100;
        const left = ((clampedLng - mapBounds.west) / lngRange) * 100;
        return { top: `${top}%`, left: `${left}%` };
    };

    return (
        <div className="flex h-full">
            <div className="w-[480px] bg-slate-800 p-4 flex flex-col border-r border-slate-700">
                <h2 className="text-xl font-bold mb-4">Drone Fleet</h2>
                <div className="flex-grow overflow-y-auto space-y-2 pr-2">
                    {drones.map(drone => (
                        <button key={drone.id} onClick={() => setSelectedDrone(drone)} className={`w-full text-left p-3 rounded-md flex items-center gap-3 transition-colors ${selectedDrone?.id === drone.id ? 'bg-blue-600' : 'bg-slate-700 hover:bg-slate-600'}`}>
                            <span className={`w-3 h-3 rounded-full ${getStatusColor(drone.status)}`}></span>
                            <div>
                                <p className="font-semibold">{drone.id}</p>
                                <p className={`text-xs ${selectedDrone?.id === drone.id ? 'text-blue-200' : 'text-slate-400'}`}>{drone.mission || drone.status}</p>
                            </div>
                        </button>
                    ))}
                </div>
                {selectedDrone && (
                    <div className="mt-4 border-t border-slate-700 pt-4">
                        <h3 className="text-lg font-semibold mb-2">Selection Details</h3>
                        <div className="text-sm space-y-2 bg-slate-900 p-3 rounded-md">
                            <div className="flex justify-between"><span className="text-slate-400">ID:</span><span className="font-mono">{selectedDrone.id}</span></div>
                            <div className="flex justify-between"><span className="text-slate-400">Status:</span><span>{selectedDrone.status}</span></div>
                            <div className="flex justify-between"><span className="text-slate-400">GPS:</span><span className="font-mono">{`${selectedDrone.coords.lat}, ${selectedDrone.coords.lng}`}</span></div>
                            {selectedDrone.missionProgress && <div className="flex justify-between"><span className="text-slate-400">Progress:</span><span>{selectedDrone.missionProgress}</span></div>}
                        </div>
                    </div>
                )}
            </div>
            <div className="flex-grow relative bg-slate-700">
                 <img src="https://images.unsplash.com/photo-1469474968028-56623f02e42e?q=80&w=2942&auto=format&fit=crop" alt="Landscape map" className="w-full h-full object-cover select-none" />
                 <div className="absolute inset-0 bg-black/20"></div>
                 {drones.map(drone => (
                     <div key={drone.id} 
                        onClick={() => setSelectedDrone(drone)}
                        className={`absolute transform -translate-x-1/2 -translate-y-1/2 flex flex-col items-center group transition-all duration-1000 linear cursor-pointer ${selectedDrone?.id === drone.id ? 'z-10' : ''}`}
                        style={getPosition(drone.coords)}>
                          <div className={`p-1 bg-black/60 rounded-md text-xs font-bold text-white mb-2 transition-opacity duration-300 select-none ${selectedDrone?.id === drone.id ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                              {drone.id}
                          </div>
                         <div className={`w-7 h-7 drop-shadow-lg transition-all duration-300 ${selectedDrone?.id === drone.id ? 'scale-125' : ''}`}>
                            <Icon path={ICONS.BOLT} className={`w-full h-full ${selectedDrone?.id === drone.id ? 'text-yellow-300' : getStatusTextColor(drone.status)}`} />
                         </div>
                         {selectedDrone?.id === drone.id && <div className="absolute w-12 h-12 bg-blue-400/30 rounded-full animate-ping"></div>}
                     </div>
                 ))}
            </div>
        </div>
    );
};

const UsersView = ({ users, fetchUsers }: { users: User[]; fetchUsers: () => void; }) => {
    const [newUsername, setNewUsername] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [newRole, setNewRole] = useState<UserRole>('Data Analyst');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [message, setMessage] = useState('');

    useEffect(() => {
        fetchUsers();
    }, [fetchUsers]);

    const handleAddUser = async (e: React.FormEvent) => {
        e.preventDefault();
        if (newUsername && newPassword) {
            setIsLoading(true);
            setError('');
            setMessage('');
            try {
                const response = await fetch('/.netlify/functions/signup', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ username: newUsername, password: newPassword, role: newRole }),
                });
                const data = await response.json();
                if (!response.ok) {
                    throw new Error(data.message || 'Failed to create user.');
                }
                setMessage(`User ${data.uid} created successfully!`);
                setNewUsername('');
                setNewPassword('');
                fetchUsers(); // Refresh the user list
            } catch (err: any) {
                setError(err.message);
            } finally {
                setIsLoading(false);
            }
        }
    };
    
    return (
        <div className="p-8 max-w-6xl mx-auto">
            <h1 className="text-3xl font-bold mb-8">User Management</h1>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="md:col-span-2 bg-slate-800 p-6 rounded-lg border border-slate-700">
                    <h2 className="text-xl font-semibold mb-4">Existing Users</h2>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="text-xs text-slate-400 uppercase bg-slate-700/50">
                                <tr>
                                    <th scope="col" className="px-6 py-3">Username</th>
                                    <th scope="col" className="px-6 py-3">Role</th>
                                    <th scope="col" className="px-6 py-3">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {users.map(user => (
                                    <tr key={user.username} className="border-b border-slate-700 hover:bg-slate-700/30">
                                        <td className="px-6 py-4 font-medium text-slate-100">{user.username}</td>
                                        <td className="px-6 py-4 text-slate-300">{user.role}</td>
                                        <td className="px-6 py-4"><button className="font-medium text-blue-500 hover:underline">Edit</button></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
                <div className="bg-slate-800 p-6 rounded-lg border border-slate-700">
                    <h2 className="text-xl font-semibold mb-4">Create New User</h2>
                    <form onSubmit={handleAddUser} className="space-y-4">
                        <div>
                             <label className="block text-slate-300 text-sm font-bold mb-2" htmlFor="new-username">Username</label>
                             <input id="new-username" type="text" value={newUsername} onChange={e => setNewUsername(e.target.value)} className="w-full bg-slate-700 p-2 rounded" required/>
                        </div>
                        <div>
                             <label className="block text-slate-300 text-sm font-bold mb-2" htmlFor="new-password">Password</label>
                             <input id="new-password" type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} className="w-full bg-slate-700 p-2 rounded" required/>
                        </div>
                        <div>
                             <label className="block text-slate-300 text-sm font-bold mb-2" htmlFor="new-role">Role</label>
                             <select id="new-role" value={newRole} onChange={e => setNewRole(e.target.value as UserRole)} className="w-full bg-slate-700 p-2 rounded">
                                 <option>Data Analyst</option>
                                 <option>Drone Operator</option>
                                 <option>Field Inspector</option>
                                 <option>Authority</option>
                                 <option>Administrator</option>
                             </select>
                        </div>
                        <button type="submit" disabled={isLoading} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded disabled:bg-slate-500">
                            {isLoading ? 'Creating...' : 'Create User'}
                        </button>
                        {error && <p className="text-red-500 text-center text-sm mt-2">{error}</p>}
                        {message && <p className="text-green-500 text-center text-sm mt-2">{message}</p>}
                    </form>
                </div>
            </div>
        </div>
    );
}

// --- Main App ---

const App: React.FC = () => {
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [users, setUsers] = useState<User[]>([]);
    const [selectedAlert, setSelectedAlert] = useState<Alert | null>(null);

    const getCurrentPath = () => window.location.hash.substring(1) || '/';
    const [currentPath, setCurrentPath] = useState(getCurrentPath());

    const navigate = useCallback((path: string) => {
        const newHash = `#${path}`;
        if (window.location.hash !== newHash) {
            window.location.hash = newHash;
        }
    }, []);
    
    const fetchUsers = useCallback(async () => {
        try {
            const response = await fetch('/.netlify/functions/get-users');
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to fetch users');
            }
            const data = await response.json();
            const formattedUsers = data.map((user: any) => ({
                username: user.uid,
                password: '',
                role: user.role,
            }));
            setUsers(formattedUsers);
        } catch (error) {
            console.error("Error fetching users:", error);
        }
    }, []);

    useEffect(() => {
        const handleHashChange = () => {
            setCurrentPath(getCurrentPath());
        };
        window.addEventListener('hashchange', handleHashChange);
        return () => {
            window.removeEventListener('hashchange', handleHashChange);
        };
    }, []);
    
    useEffect(() => {
        const protectedRoutes = ['/dashboard', '/tracking', '/planner', '/settings', '/users'];
        const isProtectedRoute = protectedRoutes.includes(currentPath);
        const isLoginRoute = currentPath === '/login';

        if (currentPath === '/') {
            navigate(isLoggedIn ? '/dashboard' : '/login');
            return;
        }
        
        if (!isLoggedIn && isProtectedRoute) {
            navigate('/login');
        }

        if (isLoggedIn && isLoginRoute) {
            navigate('/dashboard');
        }
    }, [currentPath, isLoggedIn, navigate]);

    const handleLogin = (user: User) => {
        setCurrentUser(user);
        setIsLoggedIn(true);
    };

    const handleLogout = () => {
        setCurrentUser(null);
        setIsLoggedIn(false);
    };
    
    const handlePinClick = (alert: Alert) => {
        setSelectedAlert(alert);
    };

    const handleCloseModal = () => {
        setSelectedAlert(null);
    };

    if (!isLoggedIn) {
        return <LoginScreen onLogin={handleLogin} />;
    }

    const renderContent = () => {
        if (currentPath === '/users' && currentUser?.role !== 'Administrator') {
            return <DashboardView onPinClick={handlePinClick} />;
        }

        switch (currentPath) {
            case '/dashboard': return <DashboardView onPinClick={handlePinClick} />;
            case '/planner': return <MissionPlannerView />;
            case '/settings': return <SettingsView currentUser={currentUser!} />;
            case '/tracking': return <TrackingView />;
            case '/users': return <UsersView users={users} fetchUsers={fetchUsers} />;
            default: 
                 return <DashboardView onPinClick={handlePinClick} />;
        }
    };

    return (
        <div className="h-screen w-screen bg-slate-900 flex flex-col">
            <Header currentPath={currentPath} navigate={navigate} onLogout={handleLogout} currentUser={currentUser!}/>
            <main className="flex-grow pt-16">
                {renderContent()}
            </main>
            {selectedAlert && <DetectionAlertModal alert={selectedAlert} onClose={handleCloseModal} />}
        </div>
    );
};

export default App;

