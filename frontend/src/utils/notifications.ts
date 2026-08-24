export const requestNotificationPermission = () => {
  if (!("Notification" in window)) {
    console.warn("This browser does not support desktop notification");
    return;
  }
  
  if (Notification.permission === "default") {
    // Attempt directly first (some browsers might allow it)
    Notification.requestPermission();
    
    // Attach a one-time click listener to catch strict browser gesture rules
    const handleUserGesture = () => {
      if (Notification.permission === "default") {
        Notification.requestPermission();
      }
      document.removeEventListener('click', handleUserGesture);
    };
    document.addEventListener('click', handleUserGesture);
  }
};

export const sendNativeNotification = (title: string, options?: NotificationOptions) => {
  if (!("Notification" in window)) return;

  if (Notification.permission === "granted") {
    const notification = new Notification(title, {
      icon: '/vite.svg', // Assuming there's a default icon
      ...options
    });
    
    // Optional: Focus the window when notification is clicked
    notification.onclick = function() {
      window.focus();
      this.close();
    };
  } else if (Notification.permission !== "denied") {
    Notification.requestPermission().then((permission) => {
      if (permission === "granted") {
        const notification = new Notification(title, {
          icon: '/vite.svg',
          ...options
        });
        
        notification.onclick = function() {
          window.focus();
          this.close();
        };
      }
    });
  }
};
