import { config } from '../config/env.js';
import logger from './logger.js';

class ProxyRotator {
  constructor() {
    this.proxies = config.proxyList.filter(Boolean);
    this.currentIndex = 0;
  }

  getNext() {
    if (this.proxies.length === 0) return null;
    const proxy = this.proxies[this.currentIndex];
    this.currentIndex = (this.currentIndex + 1) % this.proxies.length;
    logger.debug(`Rotating to proxy: ${proxy}`);
    return proxy;
  }

  remove(proxy) {
    this.proxies = this.proxies.filter((p) => p !== proxy);
    logger.warn(`Removed proxy ${proxy}, ${this.proxies.length} remaining`);
  }

  get count() {
    return this.proxies.length;
  }
}

export default new ProxyRotator();
