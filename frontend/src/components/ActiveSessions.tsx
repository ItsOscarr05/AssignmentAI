import React, { useEffect, useState } from 'react';
import { useToast } from '../contexts/ToastContext';
import { api } from '../lib/api';

interface Session {
  id: string;
  device: string;
  ip: string;
  lastActive: string;
  expiresAt: string;
}

interface ActiveSessionsProps {
  onSessionRevoked?: () => void;
}

export const ActiveSessions: React.FC<ActiveSessionsProps> = ({ onSessionRevoked }) => {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { showToast } = useToast();

  const fetchSessions = async () => {
    try {
      const response = await api.get('/auth/sessions');
      setSessions(response.data);
    } catch (error) {
      showToast('Failed to fetch active sessions', 'error');
      setSessions([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSessions();
  }, []);

  const handleRevokeSession = async (sessionId: string) => {
    try {
      await api.delete(`/auth/sessions/${sessionId}`);
      setSessions(sessions.filter(session => session.id !== sessionId));
      onSessionRevoked?.();
      showToast('Session revoked successfully', 'success');
    } catch (error) {
      showToast('Failed to revoke session', 'error');
      setSessions([]);
    }
  };

  const handleRevokeAllSessions = async () => {
    try {
      await api.delete('/auth/sessions');
      setSessions([]);
      onSessionRevoked?.();
      showToast('All sessions revoked successfully', 'success');
    } catch (error) {
      showToast('Failed to revoke all sessions', 'error');
      setSessions([]);
    }
  };

  if (isLoading) {
    return <div>Loading sessions...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Active Sessions</h2>
        {sessions.length > 0 && (
          <button
            onClick={handleRevokeAllSessions}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Revoke All Sessions
          </button>
        )}
      </div>

      {sessions.length === 0 ? (
        <p className="text-gray-500">No active sessions</p>
      ) : (
        <div className="space-y-4">
          {sessions.map(session => (
            <div
              key={session.id}
              className="p-4 border rounded-lg shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-medium">{session.device}</p>
                  <p className="text-sm text-gray-600">IP: {session.ip}</p>
                  <p className="text-sm text-gray-600">
                    Last active: {new Date(session.lastActive).toLocaleString()}
                  </p>
                  <p className="text-sm text-gray-600">
                    Expires: {new Date(session.expiresAt).toLocaleString()}
                  </p>
                </div>
                <button
                  onClick={() => handleRevokeSession(session.id)}
                  className="px-3 py-1 text-sm bg-red-100 text-red-600 rounded hover:bg-red-200"
                >
                  Revoke
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
