// ========================================
// 📱 EXPERIENCIA MÓVIL NATIVA
// ========================================

import { isMobileDevice } from './utils.js';

// === GESTOS TÁCTILES ===
let touchStartX = 0;
let touchStartY = 0;
let touchEndX = 0;
let touchEndY = 0;

// === DETECCIÓN DE SWIPE ===
export function detectSwipe(element, onSwipeLeft, onSwipeRight, onSwipeUp, onSwipeDown) {
  let touchStartX = 0;
  let touchStartY = 0;
  let touchEndX = 0;
  let touchEndY = 0;

  const horizontalThreshold = 60;
  const verticalThreshold = 120;

  element.addEventListener('touchstart', (e) => {
    touchStartX = e.changedTouches[0].screenX;
    touchStartY = e.changedTouches[0].screenY;
  });

  element.addEventListener('touchend', (e) => {
    touchEndX = e.changedTouches[0].screenX;
    touchEndY = e.changedTouches[0].screenY;
    handleSwipe();
  });

  function handleSwipe() {
    const diffX = touchStartX - touchEndX;
    const diffY = touchStartY - touchEndY;

    if (Math.abs(diffX) > Math.abs(diffY)) {
      if (diffX > horizontalThreshold && onSwipeLeft) {
        onSwipeLeft();
      } else if (diffX < -horizontalThreshold && onSwipeRight) {
        onSwipeRight();
      }
    } else {
      if (diffY > verticalThreshold && onSwipeUp) {
        onSwipeUp();
      } else if (diffY < -verticalThreshold && onSwipeDown) {
        onSwipeDown();
      }
    }
  }
}

// === FEEDBACK TÁCTIL ===
export function hapticFeedback(type = 'light') {
  try {
    if ('vibrate' in navigator && navigator.vibrate) {
      switch (type) {
        case 'light':
          navigator.vibrate(10);
          break;
        case 'medium':
          navigator.vibrate(50);
          break;
        case 'heavy':
          navigator.vibrate(100);
          break;
        case 'success':
          navigator.vibrate([50, 50, 50]);
          break;
        case 'error':
          navigator.vibrate([100, 50, 100]);
          break;
      }
    }
  } catch (error) {
    console.debug('Vibración no disponible:', error.message);
  }
}

// === NOTIFICACIONES NATIVAS ===
export function showNativeNotification(title, options = {}) {
  if ('Notification' in window && Notification.permission === 'granted') {
    new Notification(title, {
      icon: './icons/icon-192.png',
      badge: './icons/icon-192.png',
      ...options
    });
  }
}

export async function requestNotificationPermission() {
  if ('Notification' in window && Notification.permission === 'default') {
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      showNativeNotification('TillUp', {
        body: 'Notificaciones activadas',
        tag: 'permission-granted'
      });
    }
  }
}

// === PULL-TO-REFRESH ===
export function setupPullToRefresh(container, onRefresh) {
  let startY = 0;
  let currentY = 0;
  let pullDistance = 0;
  const threshold = 200;
  let isPulling = false;
  let isScrolled = false;
  let hasMoved = false;

  container.addEventListener('touchstart', (e) => {
    startY = e.touches[0].clientY;
    isScrolled = container.scrollTop > 0;
    isPulling = !isScrolled;
    hasMoved = false;
  });

  container.addEventListener('touchmove', (e) => {
    if (!isPulling || isScrolled) return;
    
    currentY = e.touches[0].clientY;
    pullDistance = currentY - startY;
    
    if (pullDistance > 50) {
      hasMoved = true;
    }
    
    if (pullDistance > 0 && container.scrollTop === 0 && hasMoved) {
      if (pullDistance < threshold) {
        e.preventDefault();
        container.style.transform = `translateY(${Math.min(pullDistance * 0.2, threshold)}px)`;
      }
    }
  });

  container.addEventListener('touchend', () => {
    if (isPulling && pullDistance > threshold && !isScrolled && hasMoved) {
      setTimeout(() => {
        onRefresh();
        hapticFeedback('success');
      }, 100);
    }
    
    container.style.transform = '';
    container.style.transition = 'transform 0.3s ease-out';
    setTimeout(() => {
      container.style.transition = '';
    }, 300);
    
    isPulling = false;
    pullDistance = 0;
    hasMoved = false;
  });
}

// === PREVENIR RECARGAS ACCIDENTALES ===
export function preventMobileReload() {
  if (!isMobileDevice()) return;
  
  document.addEventListener('touchmove', (e) => {
    if (e.target === document.body || e.target === document.documentElement) {
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      if (scrollTop <= 0 && e.touches[0].clientY > 0) {
        if (e.touches[0].clientY > 50) {
          e.preventDefault();
        }
      }
    }
  }, { passive: false });
  
  let startX = 0;
  let startY = 0;
  
  document.addEventListener('touchstart', (e) => {
    startX = e.touches[0].clientX;
    startY = e.touches[0].clientY;
  });
  
  document.addEventListener('touchend', (e) => {
    const endX = e.changedTouches[0].clientX;
    const endY = e.changedTouches[0].clientY;
    const deltaX = Math.abs(endX - startX);
    const deltaY = Math.abs(endY - startY);
    
    if (deltaX > 100 && deltaY < 50) {
      e.preventDefault();
    }
  });
}

// === CONFIGURACIONES DE EXPERIENCIA ===
export function setupSmoothScroll() {
  const scrollElements = document.querySelectorAll('.movements-list-treinta, .products-grid-treinta, .clients-grid');
  
  scrollElements.forEach(element => {
    if (element !== document.body && element !== document.documentElement) {
      element.style.scrollBehavior = 'smooth';
      element.style.webkitOverflowScrolling = 'touch';
    }
  });
  
  document.body.style.scrollBehavior = 'auto';
  document.documentElement.style.scrollBehavior = 'auto';
}

export function setupButtonFeedback() {
  const buttons = document.querySelectorAll('.btn');
  
  buttons.forEach(button => {
    button.addEventListener('touchstart', () => {
      hapticFeedback('light');
    });
    
    button.addEventListener('click', () => {
      hapticFeedback('medium');
    });
  });
}

export function setupInputEnhancements() {
  const inputs = document.querySelectorAll('input, select, textarea');
  
  inputs.forEach(input => {
    input.addEventListener('focus', () => {
      if (window.innerWidth <= 768) {
        setTimeout(() => {
          input.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 300);
      }
    });
    
    if (input.type === 'number') {
      input.addEventListener('input', () => {
        hapticFeedback('light');
      });
    }
  });
}

// === INICIALIZACIÓN DE MEJORAS MÓVILES ===
export function initializeNativeEnhancements() {
  setupSmoothScroll();
  setupButtonFeedback();
  setupInputEnhancements();
  
  const mainContainer = document.getElementById('mainContent');
  if (mainContainer) {
    setupPullToRefresh(mainContainer, () => {
      // Callback para actualizar datos
      console.log('Datos actualizados sin recargar la página');
    });
  }
  
  preventMobileReload();
  requestNotificationPermission();
}