const test = require('node:test');
const assert = require('node:assert');
const { createApp } = require('../src/server');
const { createMemoryStore } = require('../src/store/memory');

async function withServer(fn) {
  const server = createApp(createMemoryStore()).listen(0);
  const base = `http://localhost:${server.address().port}`;
  try { await fn(base); } finally { server.close(); }
}

const post = (url, body) => fetch(url, {
  method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
});

test('seed has 8 shelters with 20, 30 or 40 beds', async () => {
  await withServer(async (base) => {
    const list = await (await fetch(`${base}/api/shelters`)).json();
    assert.equal(list.length, 8);
    for (const s of list) {
      assert.ok([20, 30, 40].includes(s.totalBeds));
      assert.ok(['all', 'women', 'men'].includes(s.admits));
    }
  });
});

test('plus and minus change free beds and clamp at the edges', async () => {
  await withServer(async (base) => {
    let s = await (await post(`${base}/api/shelters/mitte/adjust`, { delta: -1 })).json();
    assert.equal(s.freeBeds, 11);
    s = await (await post(`${base}/api/shelters/neukoelln/adjust`, { delta: -1 })).json();
    assert.equal(s.freeBeds, 0);
    s = await (await post(`${base}/api/shelters/mitte/adjust`, { delta: 1000 })).json();
    assert.equal(s.freeBeds, 40);
  });
});

test('invalid input is rejected', async () => {
  await withServer(async (base) => {
    assert.equal((await post(`${base}/api/shelters/mitte/adjust`, { delta: 'x' })).status, 400);
    assert.equal((await post(`${base}/api/shelters/nope/adjust`, { delta: 1 })).status, 404);
  });
});

test('stream pushes changes to subscribers', async () => {
  await withServer(async (base) => {
    const res = await fetch(`${base}/api/stream`);
    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buf = '';
    const nextEvent = async () => {
      while (!buf.includes('\n\n')) buf += decoder.decode((await reader.read()).value);
      const i = buf.indexOf('\n\n');
      const ev = buf.slice(0, i); buf = buf.slice(i + 2);
      return JSON.parse(ev.split('data: ')[1]);
    };
    await nextEvent(); // initial snapshot
    await post(`${base}/api/shelters/wedding/adjust`, { delta: -2 });
    const list = await nextEvent();
    assert.equal(list.find((s) => s.id === 'wedding').freeBeds, 5);
    await reader.cancel();
  });
});
