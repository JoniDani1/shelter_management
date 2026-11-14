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

test('seed shelters are complete and valid', async () => {
  await withServer(async (base) => {
    const list = await (await fetch(`${base}/api/shelters`)).json();
    assert.ok(list.length >= 20);
    assert.equal(new Set(list.map((s) => s.id)).size, list.length, 'ids are unique');
    for (const s of list) {
      assert.match(s.id, /^[a-z0-9-]+$/);
      assert.ok(s.name && s.district && s.address, `${s.id}: name, district, address`);
      assert.ok(Number.isInteger(s.totalBeds) && s.totalBeds > 0, `${s.id}: totalBeds`);
      assert.ok(Number.isInteger(s.freeBeds) && s.freeBeds >= 0 && s.freeBeds <= s.totalBeds, `${s.id}: freeBeds`);
      assert.ok(['all', 'women', 'men'].includes(s.admits), `${s.id}: admits`);
      assert.match(s.opensAt, /^\d\d:\d\d$/);
      assert.match(s.closesAt, /^\d\d:\d\d$/);
      // Berlin bounding box, so a bad geocode shows up here.
      assert.ok(s.location.lat > 52.3 && s.location.lat < 52.7, `${s.id}: lat`);
      assert.ok(s.location.lng > 13.0 && s.location.lng < 13.8, `${s.id}: lng`);
    }
  });
});

test('plus and minus change free beds and clamp at the edges', async () => {
  await withServer(async (base) => {
    let s = await (await post(`${base}/api/shelters/lehrter-strasse/adjust`, { delta: -1 })).json();
    assert.equal(s.freeBeds, 13);
    s = await (await post(`${base}/api/shelters/containerbahnhof/adjust`, { delta: -1 })).json();
    assert.equal(s.freeBeds, 0);
    s = await (await post(`${base}/api/shelters/lehrter-strasse/adjust`, { delta: 1000 })).json();
    assert.equal(s.freeBeds, 100);
  });
});

test('invalid input is rejected', async () => {
  await withServer(async (base) => {
    assert.equal((await post(`${base}/api/shelters/lehrter-strasse/adjust`, { delta: 'x' })).status, 400);
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
    await post(`${base}/api/shelters/haus-sophie/adjust`, { delta: -2 });
    const list = await nextEvent();
    assert.equal(list.find((s) => s.id === 'haus-sophie').freeBeds, 7);
    await reader.cancel();
  });
});
