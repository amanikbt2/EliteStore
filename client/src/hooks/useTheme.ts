import { useEffect } from 'react';

export function useTheme() {
  useEffect(() => {
    const fetchTheme = async () => {
      try {
        const apiUrl = import.meta.env.VITE_API_URL || 'http://127.0.0.1:5000';
        const response = await fetch(`${apiUrl}/api/settings/theme`);
        const data = await response.json();
        
        if (data.success) {
          const theme = data.data.theme;
          if (theme === 'dark') {
            document.documentElement.classList.add('dark');
          } else {
            document.documentElement.classList.remove('dark');
          }
        }
      } catch (error) {
        console.error('Failed to fetch theme', error);
      }
    };
    
    fetchTheme();
  }, []);
}
