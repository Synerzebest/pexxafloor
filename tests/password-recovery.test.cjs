const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');

function recoveryRoute({ reject = false } = {}) {
  const calls = [];
  const cookies = [];
  const exports = {};
  const mocks = {
    'next/server': { NextResponse: { redirect: url => ({ url: url.toString(), headers: new Headers() }) } },
    'next/headers': { cookies: async () => ({ getAll: () => [], set: (...args) => cookies.push(args) }) },
    '@supabase/ssr': { createServerClient: (_url, _key, options) => ({ auth: {
      verifyOtp: async input => {
        calls.push(input);
        if (!reject) options.cookies.setAll([{name:'session', value:'test', options:{httpOnly:true}}]);
        return {error: reject ? {message:'expired'} : null};
      },
      exchangeCodeForSession: async code => {calls.push(code);return {error:reject ? {} : null};},
    } }) },
  };
  vm.runInNewContext(ts.transpileModule(fs.readFileSync('app/auth/recovery/route.ts','utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS },
  }).outputText, { exports, URL, process:{env:{}}, require:name=>mocks[name] });
  return { GET:exports.GET, calls, cookies };
}

test('verified recovery opens the password form and saves the session without a role lookup', async () => {
  const route = recoveryRoute();
  const response = await route.GET({url:'https://pexxafloor.be/auth/recovery?token_hash=test&next=/fr/admin&type=signup'});
  assert.equal(response.url,'https://pexxafloor.be/fr/update-password');
  assert.equal(route.calls[0].type,'recovery');
  assert.equal(route.cookies.length,1);
  assert.equal(response.headers.get('cache-control'),'no-store');
  assert.equal(response.headers.get('referrer-policy'),'no-referrer');
  assert.ok(!response.url.includes('token_hash'));
});

test('expired or missing tokens show the invalid-link state even with an existing session', async () => {
  for (const suffix of ['', '?token_hash=expired', '?error=access_denied&token_hash=test']) {
    const route = recoveryRoute({reject:true});
    const response = await route.GET({url:'https://pexxafloor.be/auth/recovery'+suffix});
    assert.equal(response.url,'https://pexxafloor.be/fr/update-password?recoveryError=1');
    assert.equal(route.cookies.length,0);
  }
});

test('ConfirmationURL code links preserve supported locales and cannot redirect externally', async () => {
  for (const locale of ['fr','en','nl','https://evil.example']) {
    const route = recoveryRoute();
    const response = await route.GET({url:`https://pexxafloor.be/auth/recovery?code=test&locale=${encodeURIComponent(locale)}`});
    assert.equal(response.url,`https://pexxafloor.be/${['fr','en','nl'].includes(locale)?locale:'fr'}/update-password`);
    assert.equal(route.calls[0],'test');
  }
});
