// Defines the possible views the application can display.
export type View = 'dashboard' | 'planner' | 'settings' | 'tracking' | 'users';

// Defines the risk levels for alerts.
export type RiskLevel = 'High' | 'Medium' | 'Low';

// Defines the structure for alert data.
export interface Alert {
    id: number;
    risk: RiskLevel;
    coords: { lat: number; lng: number };
    timestamp: string;
    altitude: string;
    confidence: string;
    description: string;
    images: {
        rgb: string | null;
        thermal: string | null;
    };
}

// Defines the telemetry data structure.
export interface Telemetry {
    altitude: string;
    speed: string;
    battery: string;
    signal: string;
}

// Defines the drone status for the tracking view.
export type DroneStatus = 'Active' | 'Idle' | 'Offline';

// Defines the structure for a single drone.
export interface Drone {
    id: string;
    status: DroneStatus;
    mission: string | null;
    coords: { lat: number; lng: number };
    missionProgress?: string;
}

// Defines the available user roles in the system.
export type UserRole = 'Authority' | 'Drone Operator' | 'Data Analyst' | 'Field Inspector' | 'Administrator';

// Defines the structure for a user account.
export interface User {
    username: string;
    password: string;
    role: UserRole;
}
