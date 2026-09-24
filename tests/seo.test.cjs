const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
function load(file, mocks = {}, env = {}) {
  const exports = {};
  const filename = path.resolve(file);
  const source = ts.transpileModule(fs.readFileSync(filename, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } }).outputText;
  vm.runInNewContext(source, {exports, URL, process:{env}, require:name => {
    if (name in mocks) return mocks[name];
    if (name === 'server-only') return {};
    if (name.startsWith('@/')) return load(name.slice(2)+'.ts',mocks,env);
    if (name.startsWith('.')) return load(path.resolve(path.dirname(filename),name+'.ts'),mocks,env);
    return require(name);
  }});
  return exports;
}
const metadata = load('lib/seo/metadata.ts');
test('canonical and translated alternatives use the production domain and matching paths',()=>{
  for(const locale of metadata.locales) {
    const data=metadata.pageMetadata(locale,'packs/natte','A name','A description');
    assert.equal(data.alternates.canonical,`https://pexxafloor.be/${locale}/packs/natte`);
    for(const other of metadata.locales) assert.equal(data.alternates.languages[other],`https://pexxafloor.be/${other}/packs/natte`);
    assert.equal(data.openGraph.url,data.alternates.canonical);
  }
  assert.notEqual(metadata.staticMetadata('fr','home').title.absolute, metadata.staticMetadata('nl','home').title.absolute);
  assert.equal(metadata.privateMetadata.robots.index,false);
});
test('descriptions are readable and bounded',()=>{
  assert.equal(metadata.descriptionText('<p>A &amp; B</p>'),'A & B');
  assert.ok(metadata.descriptionText('Heating '.repeat(100)).length <= 160);
});
test('product markup uses public VAT-inclusive prices and omits unknown stock and ratings',()=>{
  const named=(slug)=>({id:slug,slug,name_fr:slug,name_nl:slug,name_en:slug});
  const product={...named('tube'),description_fr:'<p>Tube</p>',price:10,reference:'TUBE-1',product_images:[{image_url:'https://example.com/tube.jpg'}],subcategory:{...named('pipes'),category:named('heating')},subsubcategory:null};
  const mod=load('lib/seo/product.ts',{'./catalog':{nameFor:(row)=>row.name_fr},react:{cache:fn=>fn}});
  const data=mod.productStructuredData(product,'fr');
  const offer=data['@graph'][0].offers;
  assert.equal(offer.price,'12.10');assert.equal(offer.priceCurrency,'EUR');
  assert.ok(offer.url.endsWith('/fr/categories/heating/pipes/default/tube'));
  assert.equal(offer.availability,undefined);assert.equal(data['@graph'][0].aggregateRating,undefined);
  assert.equal(data['@graph'][1].itemListElement.length,4);
});
test('sitemap paginates products and includes only valid public paths in every language',async()=>{
  const products=Array.from({length:501},(_,i)=>({id:`p${i}`,slug:`product-${i}`,subcategory_id:'s',subsub_id:null}));
  products.push({id:'orphan',slug:'orphan',subcategory_id:'missing'});
  const tables={categories:[{id:'c',slug:'heat'}],subcategories:[{id:'s',slug:'pipes',category_id:'c'}],subsubcategories:[],products,packs:[{id:'pack',slug:'natte',active:true},{id:'hidden',slug:'hidden',active:false}]};
  const mock={publicCatalog:()=>({from:table=>{
    let start=0,end=499,active;
    const query={select:()=>query,order:()=>query,range:(a,b)=>{start=a;end=b;return query;},eq:(_key,value)=>{active=value;return query;},then:resolve=>resolve({data:tables[table].filter(row=>active===undefined||row.active===active).slice(start,end+1),error:null})};
    return query;
  }})};
  const result=await load('app/sitemap.ts',{'@/lib/seo/catalog':mock}).default();
  const urls=result.map(row=>row.url);
  assert.ok(urls.includes('https://pexxafloor.be/fr/categories/heat/pipes/default/product-500'));
  assert.ok(urls.includes('https://pexxafloor.be/nl/packs/natte'));
  assert.ok(!urls.some(url=>/orphan|hidden|login|admin|profile/.test(url)));
  assert.equal(new Set(urls).size,urls.length);
});
test('production robots advertise sitemap; previews do not permit crawling',()=>{
  const prod=load('app/robots.ts').default();assert.equal(prod.sitemap,'https://pexxafloor.be/sitemap.xml');
  assert.ok(!prod.rules.disallow.includes('/fr/login'));
  const preview=load('app/robots.ts',{}, {VERCEL_ENV:'preview'}).default();assert.equal(preview.rules.disallow,'/');
});
