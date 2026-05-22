import { useEffect, useState } from 'react';
import { isStandalonePwa } from '../utils/pwaStandalone';

export function AppSplash() {
  const [visible, setVisible] = useState(() => isStandalonePwa());

  useEffect(() => {
    if (!visible) return;
    const timer = setTimeout(() => setVisible(false), 900);
    return () => clearTimeout(timer);
  }, [visible]);

  if (!visible) return null;

  return (
    <div className="app-splash" role="presentation" aria-hidden="true">
      <img src="./icon.png" alt="" className="app-splash-icon" />
      <p className="app-splash-title">Julia Voca</p>
    </div>
  );
}
