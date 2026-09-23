const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');

function loadModule(file, mocks = {}, env = {}) {
  const filename = path.resolve(file);
  const exports = {};
  const source = ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
  }).outputText;
  vm.runInNewContext(source, {
    exports, URL, Buffer, Date, process: { env }, console: { error() {} },
    setTimeout: fn => { fn(); },
    require: name => {
      if (Object.hasOwn(mocks, name)) return mocks[name];
      if (name.startsWith('@/')) return loadModule(`${name.slice(2)}.ts`, mocks, env);
      if (name.startsWith('.')) return loadModule(path.resolve(path.dirname(filename), `${name}.ts`), mocks, env);
      return require(name);
    },
  }, { filename });
  return exports;
}
const config = { RESEND_API_KEY: 'fake-key', RESEND_FROM_EMAIL: 'PexxaFloor <orders@example.com>', NEXT_PUBLIC_URL: 'https://shop.example.com' };
const order = { id: '12345678-1234-1234-1234-123456789012', user_id: 'owner-id', total: 24.2, items: [{type:'product', name:'<b>Tube & kit</b>', price:10, quantity:2}], status:'paid', language:'fr' };

test('all customer statuses render in all languages on the configured domain', () => {
  const { buildOrderMessage } = loadModule('lib/email/orderMessage.ts');
  for (const language of ['fr','nl','en','unsupported']) {
    for (const status of ['paid','preparing','packed','ready','delivering','delivered','cancelled']) {
      const message = buildOrderMessage({...order, language, status}, config.NEXT_PUBLIC_URL);
      assert.ok(message.subject.includes('#12345678'));
      assert.ok(message.html.includes(`https://shop.example.com/${language === 'unsupported' ? 'en' : language}/profile`));
      assert.ok(message.html.includes('&lt;b&gt;Tube &amp; kit&lt;/b&gt;'));
      assert.ok(message.html.includes('20.00 €'));
      assert.ok(message.text.includes('24.20 EUR'));
      assert.ok(!message.html.includes('undefined'));
    }
  }
});

function harness({ providerError = false, cached = null, dbError = false } = {}) {
  const entry = { id:'event-1', order_id:order.id, attempts:1, payload:order, request_payload:cached };
  let claimed = false;
  const updates = [], sends = [];
  const supabase = {
    auth: {admin:{getUserById:async id => {assert.equal(id, 'owner-id');return {data:{user:{email:'actual-customer@example.com'}},error:null};}}},
    rpc: async () => ({data: claimed ? [] : (claimed = true, [entry]), error:dbError ? {} : null}),
    from: () => ({
      update: values => {updates.push(values);const query={eq:()=>query,then: resolve=>resolve({error:null})};return query;},
      select: () => {const query={eq:()=>query,is:async()=>({count:providerError?1:0,error:null})};return query;},
    }),
  };
  class Resend { constructor() {this.emails={send:async (request, options)=>{sends.push({request,options});return providerError?{data:null,error:{name:'validation_error'}}:{data:{id:'resend-1'},error:null};}};} }
  const mocks = {'server-only':{},'@/lib/supabaseServer':{supabaseServer:supabase},resend:{Resend}};
  return { ...loadModule('lib/email/orderOutbox.ts',mocks,config), updates, sends, mocks };
}

test('send to the owner, persist the exact request and acknowledge only after acceptance', async () => {
  const h = harness();
  const result = await h.processOrderEmails(order.id);
  assert.equal(result.sent,1);assert.equal(result.failed,0);
  assert.equal(h.sends[0].request.to,'actual-customer@example.com');
  assert.equal(h.sends[0].request.from,config.RESEND_FROM_EMAIL);
  assert.equal(h.sends[0].options.idempotencyKey,'order-event/event-1');
  assert.equal(h.updates[0].request_payload,h.sends[0].request);
  assert.equal(h.updates[1].resend_id,'resend-1');
  assert.ok(h.updates[1].sent_at);
});

test('provider rejection stays pending and schedules a retry, without claiming success', async () => {
  const h=harness({providerError:true});const result=await h.notifyOrder(order.id);
  assert.equal(result.pending,true);assert.equal(result.failed,1);assert.equal(result.sent,0);
  assert.ok(h.updates.at(-1).available_at);assert.equal(h.updates.at(-1).locked_until,null);
  assert.ok(!h.updates.some(value=>value.sent_at));
});

test('retries reuse persisted payload and idempotency key', async () => {
  const cached={from:'old@example.com',to:'recipient@example.com',subject:'original',html:'original',text:'original'};
  const h=harness({cached});await h.processOrderEmails();
  assert.equal(h.sends[0].request,cached);assert.equal(h.sends[0].options.idempotencyKey,'order-event/event-1');
  assert.equal(h.updates.length,1);
});

test('missing configuration or migration cannot report successful delivery', async () => {
  const h=harness({dbError:true});assert.equal((await h.notifyOrder(order.id)).pending,true);
  const module=loadModule('lib/email/orderOutbox.ts',h.mocks,{});
  assert.equal((await module.notifyOrder(order.id)).pending,true);assert.equal(h.sends.length,0);
});

test('cron rejects requests without its secret and exposes failures to the scheduler', async () => {
  let calls=0;
  const mocks={
    'next/server':{NextResponse:{json:(body, options)=>({body,status:options?.status??200})}},
    '@/lib/email/orderOutbox':{processOrderEmails:async()=>{calls++;return {sent:0,failed:1};}},
  };
  const { GET }=loadModule('app/api/cron/emails/route.ts',mocks,{CRON_SECRET:'cron-test'});
  assert.equal((await GET({headers:new Headers()})).status,401);assert.equal(calls,0);
  assert.equal((await GET({headers:new Headers({authorization:'Bearer cron-test'})})).status,503);assert.equal(calls,1);
});

test('status handler enforces permissions, guards transitions and reports queued email', async () => {
  let authorized=false, updates=0, notifications=0, conflict=false;
  const mocks={
    'next/server':{NextResponse:{json:(body, options)=>({body,status:options?.status??200})}},
    '@/lib/requireRole':{requireRole:async()=>authorized?{ok:true}:{ok:false,response:{status:403}}},
    '@/lib/email/orderOutbox':{notifyOrder:async()=>{notifications++;return {pending:true};}},
    '@/lib/supabaseServer':{supabaseServer:{from:()=>({update:()=>{
      updates++;const query={eq:()=>query,in:(_column,values)=>{assert.equal(values[0],'paid');return query;},select:()=>query,maybeSingle:async()=>({data:conflict?null:{...order,status:'preparing'},error:null})};return query;
    }})}},
  };
  const post=loadModule('lib/orderStatus.ts',mocks).orderStatusHandler(['admin'],['paid'],'preparing');
  const req={json:async()=>({order_id:order.id})};
  assert.equal((await post(req)).status,403);assert.equal(updates,0);
  authorized=true;
  assert.equal((await post({json:async()=>({order_id:123})})).status,400);assert.equal(updates,0);
  const result=await post(req);assert.equal(result.status,200);assert.equal(result.body.notification.pending,true);
  conflict=true;assert.equal((await post(req)).status,409);assert.equal(notifications,1);
});
