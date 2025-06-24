import { useEffect, useCallback } from 'react';
import { useLocation } from 'wouter';
import { useQueryClient } from '@tanstack/react-query';

const INACTIVITY_TIMEOUT = 20 * 60 * 1000; // 20 minutes en millisecondes

export function useAutoLogout() {
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();

  const logout = useCallback(() => {
    localStorage.removeItem('token');
    localStorage.removeItem('lastActivity');
    queryClient.clear();
    setLocation('/login');
  }, [setLocation, queryClient]);

  const updateActivity = useCallback(() => {
    localStorage.setItem('lastActivity', Date.now().toString());
  }, []);

  const checkInactivity = useCallback(() => {
    const lastActivity = localStorage.getItem('lastActivity');
    const token = localStorage.getItem('token');
    
    if (!token) return; // Pas connecté
    
    if (!lastActivity) {
      // Pas d'activité enregistrée, déconnecter
      logout();
      return;
    }

    const timeSinceLastActivity = Date.now() - parseInt(lastActivity);
    
    if (timeSinceLastActivity > INACTIVITY_TIMEOUT) {
      logout();
    }
  }, [logout]);

  useEffect(() => {
    // Vérifier l'inactivité au montage
    checkInactivity();

    // Vérifier l'inactivité toutes les minutes
    const interval = setInterval(checkInactivity, 60000);

    // Événements qui mettent à jour l'activité
    const activityEvents = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
    
    const handleActivity = () => {
      updateActivity();
    };

    // Ajouter les écouteurs d'événements
    activityEvents.forEach(event => {
      document.addEventListener(event, handleActivity, true);
    });

    // Nettoyage
    return () => {
      clearInterval(interval);
      activityEvents.forEach(event => {
        document.removeEventListener(event, handleActivity, true);
      });
    };
  }, [checkInactivity, updateActivity]);

  return { updateActivity };
}