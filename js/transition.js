(() => {
  'use strict';
  const root=document.documentElement;
  let navigating=false;
  root.classList.add('page-ready');
  document.addEventListener('click',e=>{
    const a=e.target.closest('a[href]');
    if(!a||navigating||a.target==='_blank'||e.ctrlKey||e.metaKey||e.shiftKey||e.altKey)return;
    const raw=a.getAttribute('href'); if(!raw||raw.startsWith('#')||raw.startsWith('javascript:'))return;
    let u;try{u=new URL(raw,location.href)}catch{return}
    if(u.origin!==location.origin||u.href===location.href)return;
    e.preventDefault(); navigating=true; root.classList.add('page-leaving');
    setTimeout(()=>location.assign(u.href),120);
  },{passive:false});
  window.addEventListener('pageshow',()=>{navigating=false;root.classList.remove('page-leaving');root.classList.add('page-ready')});
})();
