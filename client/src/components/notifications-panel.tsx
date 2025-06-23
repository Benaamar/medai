import { useState } from 'react';
import { Bell, X, Check, Trash2, User, Calendar, Award, Pill, Stethoscope, FileText } from 'lucide-react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { useNotifications, type Notification } from '../hooks/use-notifications';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

const getNotificationIcon = (type: Notification['type']) => {
  switch (type) {
    case 'patient': return <User className="h-4 w-4" />;
    case 'consultation': return <Stethoscope className="h-4 w-4" />;
    case 'certificate': return <Award className="h-4 w-4" />;
    case 'prescription': return <Pill className="h-4 w-4" />;
    case 'appointment': return <Calendar className="h-4 w-4" />;
    default: return <FileText className="h-4 w-4" />;
  }
};

const getNotificationColor = (type: Notification['type']) => {
  switch (type) {
    case 'patient': return 'from-green-500 to-emerald-500';
    case 'consultation': return 'from-teal-500 to-cyan-500';
    case 'certificate': return 'from-amber-500 to-orange-500';
    case 'prescription': return 'from-emerald-500 to-teal-500';
    case 'appointment': return 'from-indigo-500 to-purple-500';
    default: return 'from-slate-500 to-slate-600';
  }
};

export default function NotificationsPanel() {
  const [isOpen, setIsOpen] = useState(false);
  const { notifications, unreadCount, markAsRead, markAllAsRead, deleteNotification, clearAll } = useNotifications();

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.read) {
      markAsRead(notification.id);
    }
  };

  return (
    <div className="relative">
      {/* Bouton de notification */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="text-slate-400 hover:text-slate-500 relative transition-colors"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <Badge className="absolute -top-1 -right-1 bg-red-500 text-white text-xs h-5 w-5 flex items-center justify-center p-0 rounded-full animate-pulse">
            {unreadCount > 99 ? '99+' : unreadCount}
          </Badge>
        )}
      </button>

      {/* Panneau de notifications */}
      {isOpen && (
        <>
          {/* Overlay pour fermer en cliquant à l'extérieur */}
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setIsOpen(false)}
          />
          
          {/* Panneau */}
          <div className="absolute right-0 top-8 z-50 w-80 bg-white rounded-xl shadow-2xl border border-slate-200 max-h-80 overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Bell className="h-4 w-4" />
                  <h3 className="font-semibold text-sm">Notifications</h3>
                  {unreadCount > 0 && (
                    <Badge className="bg-white/20 text-white text-xs px-1.5 py-0.5">
                      {unreadCount}
                    </Badge>
                  )}
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="text-white/80 hover:text-white transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              
              {/* Actions */}
              {notifications.length > 0 && (
                <div className="flex space-x-1 mt-2">
                  {unreadCount > 0 && (
                    <Button
                      onClick={markAllAsRead}
                      size="sm"
                      variant="outline"
                      className="bg-white/20 border-white/30 text-white hover:bg-white/30 text-xs px-2 py-1 h-6"
                    >
                      <Check className="h-3 w-3 mr-1" />
                      Marquer lu
                    </Button>
                  )}
                  <Button
                    onClick={clearAll}
                    size="sm"
                    variant="outline"
                    className="bg-white/20 border-white/30 text-white hover:bg-white/30 text-xs px-2 py-1 h-6"
                  >
                    <Trash2 className="h-3 w-3 mr-1" />
                    Effacer
                  </Button>
                </div>
              )}
            </div>

            {/* Liste des notifications */}
            <div className="max-h-60 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="p-6 text-center">
                  <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Bell className="h-6 w-6 text-slate-400" />
                  </div>
                  <h4 className="text-slate-900 font-medium mb-1 text-sm">Aucune notification</h4>
                  <p className="text-slate-500 text-xs">
                    Les nouvelles activités apparaîtront ici
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {notifications.map((notification) => (
                    <div
                      key={notification.id}
                      onClick={() => handleNotificationClick(notification)}
                      className={`p-3 hover:bg-slate-50 transition-colors cursor-pointer ${
                        !notification.read ? 'bg-blue-50/50 border-l-3 border-blue-500' : ''
                      }`}
                    >
                      <div className="flex items-start space-x-2">
                        <div className={`w-6 h-6 rounded-full bg-gradient-to-r ${getNotificationColor(notification.type)} flex items-center justify-center text-white flex-shrink-0`}>
                          <div className="scale-75">
                            {getNotificationIcon(notification.type)}
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <h4 className={`text-xs font-medium truncate ${
                              !notification.read ? 'text-slate-900' : 'text-slate-700'
                            }`}>
                              {notification.title}
                            </h4>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                deleteNotification(notification.id);
                              }}
                              className="text-slate-400 hover:text-red-500 transition-colors"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </div>
                          <p className="text-xs text-slate-600 mt-0.5 line-clamp-2 leading-relaxed">
                            {notification.message}
                          </p>
                          <p className="text-xs text-slate-400 mt-1">
                            {format(new Date(notification.timestamp), 'dd/MM à HH:mm', { locale: fr })}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
} 