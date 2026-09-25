import { mkdirSync } from 'node:fs';
import { writeFile, readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const PORT = 9223;
const BASE = process.env.SHOT_BASE || 'http://0.0.0.0:3000';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function getTab() {
  for (let i = 0; i < 40; i++) {
    try {
      const res = await fetch(`http://127.0.0.1:${PORT}/json`);
      const tabs = await res.json();
      const page = tabs.find((t) => t.type === 'page');
      if (page) return page.webSocketDebuggerUrl;
    } catch {}
    await sleep(500);
  }
  throw new Error('CDP not reachable');
}

let msgId = 0;
const pending = new Map();
let ws;

function send(method, params = {}) {
  return new Promise((resolveMsg, rejectMsg) => {
    const id = ++msgId;
    pending.set(id, { resolveMsg, rejectMsg });
    ws.send(JSON.stringify({ id, method, params }));
  });
}

async function waitForText(text, timeout = 30000) {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    const res = await send('Runtime.evaluate', {
      expression: `document.body && document.body.innerText.includes(${JSON.stringify(text)})`,
      returnByValue: true,
    });
    if (res.result?.value === true) return;
    await sleep(500);
  }
  const res = await send('Runtime.evaluate', {
    expression: 'document.body ? document.body.innerText.slice(0,200) : "no body"',
    returnByValue: true,
  });
  throw new Error(`Timeout waiting for: "${text}" — page shows: ${JSON.stringify(res.result?.value)}`);
}

async function evalJs(expression) {
  const res = await send('Runtime.evaluate', {
    expression,
    returnByValue: true,
    awaitPromise: true,
  });
  if (res.exceptionDetails) throw new Error('JS error: ' + (res.exceptionDetails.text || 'unknown'));
  return res.result?.value;
}

async function clickButtonByText(label, timeout = 20000) {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    const clicked = await evalJs(`
      (() => {
        const btns = [...document.querySelectorAll('button, [role="button"], a')];
        const b = btns.find((el) => el.innerText.trim().includes(${JSON.stringify(label)}));
        if (!b) return false;
        b.scrollIntoView({ block: 'center' });
        b.click();
        return true;
      })()
    `);
    if (clicked) return;
    await sleep(500);
  }
  throw new Error(`Button not found: "${label}"`);
}

async function clickTab(label) {
  return clickButtonByText(label);
}

async function capture(file, w, h, scenario) {
  await send('Page.enable');
  await send('Emulation.setDeviceMetricsOverride', {
    width: w,
    height: h,
    deviceScaleFactor: 1,
    mobile: false,
  });
  await send('Emulation.setTouchEmulationEnabled', { enabled: false });
  await send('Page.navigate', { url: BASE + '/' });
  await waitForText(scenario.landingText || 'مِنْبَر الخَطِيب');
  await sleep(1500);

  for (const step of scenario.steps || []) {
    if (step.tab) {
      await clickTab(step.tab);
    } else if (step.click) {
      await clickButtonByText(step.click);
    } else if (step.eval) {
      await evalJs(step.eval);
    }
    await sleep(step.wait || 900);
  }

  if (scenario.expect) {
    await waitForText(scenario.expect);
  }
  await sleep(500);

  const shot = await send('Page.captureScreenshot', {
    format: 'png',
    captureBeyondViewport: false,
  });
  const buf = Buffer.from(shot.data, 'base64');
  mkdirSync(resolve(import.meta.dirname, '..', 'release/play-listing/screenshots'), { recursive: true });
  mkdirSync(resolve(file).slice(0, resolve(file).lastIndexOf('/')), { recursive: true });
  await writeFile(resolve(file), buf);
  console.log('saved', file, buf.length, 'bytes');
}

const script = process.argv[2];
const file = process.argv[3];
const w = Number(process.argv[4]);
const h = Number(process.argv[5]);
const scenarioPath = process.argv[6];

ws = new WebSocket(await getTab());
await new Promise((res) => (ws.onopen = res));
ws.onmessage = (ev) => {
  const msg = JSON.parse(ev.data);
  if (msg.id && pending.has(msg.id)) {
    const { resolveMsg, rejectMsg } = pending.get(msg.id);
    pending.delete(msg.id);
    if (msg.error) rejectMsg(new Error(msg.error.message));
    else resolveMsg(msg.result);
  }
};
ws.onerror = (e) => console.error('ws error', e.message);

const scenarios = {
  guide: { steps: [{ tab: 'دليل الخطيب' }], expect: 'دليل الخطيب المنبري والبلاغي' },
  login: {
    steps: [{ tab: 'صياغة خطبة' }],
    expect: 'تسجيل الدخول بحساب Google',
  },
  categories: {
    steps: [{ click: 'عرض كافة الأقسام', wait: 1200 }, { eval: 'window.scrollTo({top: document.querySelector(".scroll-mt-24")?.offsetTop + 80 || 600, behavior: "instant"}); true', wait: 600 }],
    expect: 'ترتيب الخطب',
  },
  series: {
    steps: [{ eval: `(()=>{const s=[...document.querySelectorAll('*')].find(e=>e.children.length>0&&e.innerText.includes('أجزاء السلسلة'));if(s)s.scrollIntoView({block:'start'});return true})()`, wait: 900 }],
    expect: 'أجزاء السلسلة',
  },
  reader: {
    steps: [{ click: 'قراءة', wait: 1200 }],
    expect: 'تنزيل Word',
  },
  phone_home: { expect: 'أقسام الخطب' },
};

const s = scenarios[script];
if (!s) throw new Error('unknown scenario ' + script);
await capture(file, w, h, s);
process.exit(0);