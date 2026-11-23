import { useEffect, useState } from 'react';

import { fetchLibraryBranches, getCachedLibraryBranches } from '@/services/tpl-libraries';

export function useLibraryBranches() {
  const [branches, setBranches] = useState(getCachedLibraryBranches);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let active = true;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 20000);
    void fetchLibraryBranches(controller.signal).then((items) => {
      if (active) setBranches(items);
    }).catch(() => {
      if (active) setError('Unable to load library locations. Check your connection and try again.');
    }).finally(() => {
      clearTimeout(timeout);
      if (active) setLoading(false);
    });
    return () => { active = false; clearTimeout(timeout); controller.abort(); };
  }, [attempt]);

  const refresh = () => {
    setError('');
    setLoading(true);
    setAttempt((value) => value + 1);
  };
  return { branches, loading, error, refresh };
}
