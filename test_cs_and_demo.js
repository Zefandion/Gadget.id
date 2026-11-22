const fs = require('fs');
const path = require('path');
const vm = require('vm');

console.log('--- TESTING CS FLOATING BUTTON IMPLEMENTATION ---');

// 1. Verify shared.css has required styles
const cssContent = fs.readFileSync(path.join(__dirname, 'shared.css'), 'utf-8');
const checksCSS = [
  '.global-floating-cs',
  'bottom: 24px;',
  'right: 24px;',
  'z-index: 1500;',
  '.floating-cs-badge',
  '.floating-cs-icon',
  '.floating-cs-text',
  'csFloatEntrance',
  'csPulse'
];

let cssPassed = true;
checksCSS.forEach(token => {
  if (cssContent.includes(token)) {
    console.log(`[PASS] CSS contains: ${token}`);
  } else {
    console.error(`[FAIL] CSS missing: ${token}`);
    cssPassed = false;
  }
});

// 2. Simulate browser environment for shared.js
class FakeElement {
  constructor(tagName) {
    this.tagName = tagName.toUpperCase();
    this.id = '';
    this.className = '';
    this.innerHTML = '';
    this.href = '';
    this.attributes = {};
    this.children = [];
    this.parentNode = null;
    this.classList = {
      add: (c) => { if (!this.className.includes(c)) this.className += ' ' + c; },
      remove: (c) => { this.className = this.className.replace(c, '').trim(); },
      contains: (c) => this.className.includes(c),
      toggle: (c) => { this.classList.contains(c) ? this.classList.remove(c) : this.classList.add(c); }
    };
  }
  setAttribute(k, v) { this.attributes[k] = v; }
  getAttribute(k) { return this.attributes[k]; }
  appendChild(child) {
    child.parentNode = this;
    this.children.push(child);
    return child;
  }
  removeChild(child) {
    const idx = this.children.indexOf(child);
    if (idx !== -1) this.children.splice(idx, 1);
    child.parentNode = null;
  }
  remove() {
    if (this.parentNode) this.parentNode.removeChild(this);
  }
}

class FakeDocument {
  constructor() {
    this.body = new FakeElement('body');
    this.readyState = 'complete';
    this.listeners = {};
  }
  createElement(tag) { return new FakeElement(tag); }
  getElementById(id) {
    const search = (node) => {
      if (node.id === id) return node;
      for (const child of node.children) {
        const found = search(child);
        if (found) return found;
      }
      return null;
    };
    return search(this.body);
  }
  addEventListener(event, fn) {
    this.listeners[event] = this.listeners[event] || [];
    this.listeners[event].push(fn);
  }
}

// Helper to run shared.js in a simulated window
function simulatePage(pageName, pathname, currentUser = null) {
  const doc = new FakeDocument();
  // Nav container
  const navContainer = doc.createElement('div');
  navContainer.id = 'navbarContainer';
  doc.body.appendChild(navContainer);

  const windowObj = {
    location: {
      pathname: pathname,
      search: '',
      href: 'http://localhost/' + pathname
    },
    localStorage: {
      data: {
        'gadgetid_users_db': '[]',
        'gadgetid_cart': '[]',
        'gadgetid_wishlist': '[]',
        'gadgetid_current_user': currentUser ? JSON.stringify(currentUser) : 'null'
      },
      getItem(k) { return this.data[k] || null; },
      setItem(k, v) { this.data[k] = String(v); },
      removeItem(k) { delete this.data[k]; }
    },
    sessionStorage: {
      data: {},
      getItem(k) { return this.data[k] || null; },
      setItem(k, v) { this.data[k] = String(v); },
      removeItem(k) { delete this.data[k]; }
    },
    document: doc
  };

  const context = vm.createContext({
    window: windowObj,
    document: doc,
    localStorage: windowObj.localStorage,
    sessionStorage: windowObj.sessionStorage,
    setTimeout: setTimeout,
    clearTimeout: clearTimeout,
    setInterval: setInterval,
    clearInterval: clearInterval,
    console: console,
    products: []
  });

  const jsContent = fs.readFileSync(path.join(__dirname, 'shared.js'), 'utf-8');
  vm.runInContext(jsContent, context);

  // Call renderNavbar as pages do
  if (pageName && windowObj.renderNavbar) {
    windowObj.renderNavbar(pageName);
  } else if (pageName && context.renderNavbar) {
    context.renderNavbar(pageName);
  }

  return { doc, windowObj, context };
}

console.log('\n--- SIMULATION 1: index.html (Halaman Utama SEBELUM LOGIN) ---');
const sim1 = simulatePage('welcome', '/index.html', null);
const csBtn1 = sim1.doc.getElementById('globalFloatingCS');
if (csBtn1 && (csBtn1.href === 'cs.html' || csBtn1.attributes['href'] === 'cs.html')) {
  console.log('[PASS] Floating CS button found on index.html (before login)!');
  console.log('       id =', csBtn1.id);
  console.log('       href =', csBtn1.href || csBtn1.attributes['href']);
  console.log('       className =', csBtn1.className);
  console.log('       innerHTML =', csBtn1.innerHTML);
} else {
  console.error('[FAIL] Floating CS button NOT found on index.html!');
}

console.log('\n--- SIMULATION 2: home.html (Halaman Utama SETELAH LOGIN) ---');
const sim2 = simulatePage('home', '/home.html', { id: 1, name: 'Budi Santoso', email: 'budi@gmail.com' });
const csBtn2 = sim2.doc.getElementById('globalFloatingCS');
if (csBtn2 && (csBtn2.href === 'cs.html' || csBtn2.attributes['href'] === 'cs.html')) {
  console.log('[PASS] Floating CS button found on home.html (after login)!');
  console.log('       id =', csBtn2.id);
  console.log('       href =', csBtn2.href || csBtn2.attributes['href']);
  console.log('       className =', csBtn2.className);
  console.log('       innerHTML =', csBtn2.innerHTML);
} else {
  console.error('[FAIL] Floating CS button NOT found on home.html!');
}

console.log('\n--- SIMULATION 3: cs.html (Halaman Customer Service itu sendiri) ---');
const sim3 = simulatePage('cs', '/cs.html', { id: 1, name: 'Budi Santoso' });
const csBtn3 = sim3.doc.getElementById('globalFloatingCS');
if (!csBtn3) {
  console.log('[PASS] Floating CS button is properly NOT rendered on cs.html itself.');
} else {
  console.error('[FAIL] Floating CS button should not be on cs.html!');
}

console.log('\n--- VERIFICATION FINISHED ---');
