const state={store:null,categoryId:null};
async function load(){
  try{
    const res=await fetch('data/store.json?v='+Date.now(),{cache:'no-store'});
    if(!res.ok) throw new Error('store.json '+res.status);
    state.store=await res.json();
    document.title=state.store.storeName||'店铺菜单';
    document.getElementById('storeName').textContent=state.store.storeName||'店铺菜单';
    document.getElementById('storeNotice').textContent=state.store.notice||'';
    state.categoryId=new URLSearchParams(location.search).get('category') || state.store.categories?.[0]?.id || null;
    renderCategories();renderProducts();
  }catch(e){
    document.getElementById('storeName').textContent='店铺菜单';
    document.getElementById('storeNotice').textContent='菜单暂时无法加载，请稍后再试';
    console.error(e);
  }
}
function renderCategories(){
  const bar=document.getElementById('categoryBar');bar.innerHTML='';
  for(const c of (state.store.categories||[])){
    const b=document.createElement('button');b.className='cat-btn'+(c.id===state.categoryId?' active':'');b.textContent=c.name;b.onclick=()=>{
      state.categoryId=c.id;history.replaceState(null,'','?category='+encodeURIComponent(c.id));renderCategories();renderProducts();
    };bar.appendChild(b);
  }
}
function renderProducts(){
  const wrap=document.getElementById('products');wrap.innerHTML='';
  const list=(state.store.products||[]).filter(p=>p.visible!==false && p.categoryId===state.categoryId);
  document.getElementById('empty').hidden=list.length!==0;
  for(const p of list){
    const card=document.createElement('article');card.className='product-card';
    const img=document.createElement('img');img.className='product-img';img.alt=p.name;img.src=(p.images&&p.images[0])||'data:image/svg+xml;charset=UTF-8,'+encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="600" height="600"><rect width="100%" height="100%" fill="#eef0f3"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-size="28" fill="#9ca3af">暂无图片</text></svg>');
    const info=document.createElement('div');info.className='product-info';
    const name=document.createElement('h3');name.className='product-name';name.textContent=p.name;
    const price=document.createElement('div');price.className='product-price';price.textContent='¥'+Number(p.price||0).toFixed(2);
    const desc=document.createElement('p');desc.className='product-desc';desc.textContent=p.desc||'';
    info.append(name,price,desc);card.append(img,info);card.onclick=()=>openProduct(p);wrap.appendChild(card);
  }
}
function openProduct(p){
  document.getElementById('modalTitle').textContent=p.name;
  document.getElementById('modalPrice').textContent='¥'+Number(p.price||0).toFixed(2);
  document.getElementById('modalDesc').textContent=p.desc||'';
  const wrap=document.getElementById('modalImageWrap');wrap.innerHTML='';
  const img=document.createElement('img');img.alt=p.name;img.src=(p.images&&p.images[0])||'';wrap.appendChild(img);
  document.getElementById('productModal').hidden=false;
}
document.getElementById('modalClose').onclick=()=>document.getElementById('productModal').hidden=true;
document.querySelector('.modal-backdrop').onclick=()=>document.getElementById('productModal').hidden=true;
document.getElementById('shareBtn').onclick=async()=>{try{await navigator.clipboard.writeText(location.href);alert('菜单链接已复制，直接发到 QQ 即可');}catch{alert(location.href)}};
load();
