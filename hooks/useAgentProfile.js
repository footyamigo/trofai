import { useState, useEffect } from 'react';

export default function useAgentProfile() {
  const [profile, setProfile] = useState({
    agentName: 'Your Name',
    agentPhotoUrl: '',
    agentEmail: '',
    agentPhone: '',
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const sessionToken = typeof window !== 'undefined' ? localStorage.getItem('session') : null;
    if (!sessionToken) {
      setLoading(false);
      return;
    }
    fetch('/api/agent/profile', {
      headers: { 'Authorization': `Bearer ${sessionToken}` }
    })
      .then(res => res.json())
      .then(data => {
        if (data.success && data.profile) {
          setProfile({
            agentName: data.profile.agentName || 'Your Name',
            agentPhotoUrl: data.profile.agentPhotoUrl || '',
            agentEmail: data.profile.agentEmail || '',
            agentPhone: data.profile.agentPhone || '',
          });
        }
        setLoading(false);
      })
      .catch((err) => {
        setError(err);
        setLoading(false);
      });
  }, []);

  return { ...profile, loading, error };
} 