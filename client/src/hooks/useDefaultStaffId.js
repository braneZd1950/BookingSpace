import { useEffect } from 'react';

/** Keep staffId in sync with the first available trainer when the list changes. */
export function useDefaultStaffId(trainers, setStaffId) {
  useEffect(() => {
    if (!trainers?.length) {
      setStaffId('');
      return;
    }
    setStaffId((current) => {
      if (current && trainers.some((item) => String(item.id) === current)) return current;
      return String(trainers[0].id);
    });
  }, [trainers, setStaffId]);
}
