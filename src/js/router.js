import { getSession, getCurrentUser } from '../lib/auth.js';

export class Router {
  constructor(routes, onNavigate, onRouteStart) {
    this.routes = routes; // object mapping path -> page handler
    this.onNavigate = onNavigate; // callback(pageName, params)
    this.onRouteStart = onRouteStart;
    this.isInitialAuthDone = false;
    this.videoEnded = false;
    this.pendingAuthFinish = false;
    this.routeVersion = 0;

    this.setupVideoListener();

    // Fallback Safety Timeout: 8 seconds max if video or network stalls
    this.safetyTimeoutId = setTimeout(() => {
      this.finishInitialAuth();
    }, 8000);

    this.init();
  }

  setupVideoListener() {
    const video = document.getElementById('intro-video');
    if (!video) {
      this.videoEnded = true;
      return;
    }

    // Try playing video in case browser autoplay was deferred
    video.play().catch(() => {});

    if (video.ended) {
      this.videoEnded = true;
    } else {
      const onEnd = () => {
        this.videoEnded = true;
        if (this.pendingAuthFinish) {
          this.finishInitialAuth();
        }
      };
      video.addEventListener('ended', onEnd, { once: true });
      video.addEventListener('error', onEnd, { once: true });
    }
  }

  init() {
    window.addEventListener('popstate', () => {
      this.handleRoute();
    });
  }

  async checkAuth() {
    try {
      const session = await getSession();
      return session?.user || null;
    } catch (err) {
      return null;
    }
  }

  async handleRoute() {
    const routeVersion = ++this.routeVersion;
    let path = window.location.pathname;
    if (path.endsWith('/') && path.length > 1) {
      path = path.slice(0, -1);
    }

    // Begin the visual transition before waiting for Supabase session access.
    // This is intentionally optimistic; guards below still enforce access.
    const pendingPage = path === '/app' ? 'dashboard' : path.startsWith('/app/') ? path.replace('/app/', '') : null;
    if (pendingPage && this.routes.includes(pendingPage)) this.onRouteStart?.(pendingPage);

    const user = await this.checkAuth();
    // A newer navigation started while session access was pending.
    if (routeVersion !== this.routeVersion) return;
    const isAuthenticated = !!user;

    // Redirect legacy routes to /app/*
    const legacyMap = {
      '/dashboard': '/app/dashboard',
      '/invoices': '/app/invoices',
      '/proposals': '/app/proposals',
      '/reminders': '/app/reminders',
      '/clients': '/app/clients'
    };

    if (legacyMap[path]) {
      this.navigate(legacyMap[path], true);
      return;
    }

    const isAppRoute = path === '/app' || path.startsWith('/app/');
    const authRoutes = ['/login', '/register'];

    // 1. Protected App routes guard: if not authenticated & accessing /app, redirect to /login
    if (isAppRoute && !isAuthenticated) {
      this.navigate('/login', true);
      return;
    }

    // 2. Authenticated user redirects: if authenticated & accessing /login, /register, or /, redirect to /app
    if (isAuthenticated && (authRoutes.includes(path) || path === '/' || path === '')) {
      this.navigate('/app', true);
      return;
    }

    // 3. Public Root Landing Page (unauthenticated)
    if (path === '/' || path === '') {
      if (this.onNavigate) {
        await this.onNavigate('landing', { isAuthenticated, user });
      }
      this.scheduleInitialAuthFinish();
      return;
    }

    // Map path to page name for component renderer
    let page = 'landing';
    if (path === '/app') {
      page = 'dashboard';
    } else if (path.startsWith('/app/')) {
      page = path.replace('/app/', '');
    } else if (path.startsWith('/')) {
      page = path.slice(1);
    }

    if (this.onNavigate) {
      await this.onNavigate(page, { isAuthenticated, user });
    }

    this.scheduleInitialAuthFinish();
  }

  scheduleInitialAuthFinish() {
    if (this.isInitialAuthDone) return;

    const video = document.getElementById('intro-video');

    // Ensure video plays until its 'ended' event fires
    if (this.videoEnded || !video || video.ended) {
      this.finishInitialAuth();
    } else {
      this.pendingAuthFinish = true;
    }
  }

  finishInitialAuth() {
    if (this.isInitialAuthDone) return;
    this.isInitialAuthDone = true;

    if (this.safetyTimeoutId) {
      clearTimeout(this.safetyTimeoutId);
      this.safetyTimeoutId = null;
    }

    const loader = document.getElementById('intro-loader') || document.getElementById('initial-auth-loader');
    const appContainer = document.getElementById('app');

    if (loader) {
      loader.style.transition = 'opacity 0.8s cubic-bezier(0.16, 1, 0.3, 1)';
      loader.style.opacity = '0';
      loader.classList.add('fade-out');
    }

    if (appContainer) {
      appContainer.classList.remove('auth-pending');
    }

    setTimeout(() => {
      if (loader) {
        loader.style.display = 'none';
        if (loader.parentNode) {
          loader.parentNode.removeChild(loader);
        }
      }
    }, 800);
  }

  navigate(path, replace = false) {
    if (replace) {
      window.history.replaceState({}, '', path);
    } else {
      window.history.pushState({}, '', path);
    }
    window.scrollTo({ top: 0, behavior: 'instant' });
    this.handleRoute();
  }
}
