const $=s=>document.querySelector(s);
let D=JSON.parse($('#data').textContent),admin=false,dirty=false,cart={},TOKEN='';
try{TOKEN=sessionStorage.getItem('tok')||'';admin=!!TOKEN}catch(e){}
const H=()=>({'Content-Type':'application/json','Authorization':'Bearer '+TOKEN});
const esc=s=>String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function toast(t){const e=$('#toast');e.textContent=t;e.style.display='block';clearTimeout(toast.t);toast.t=setTimeout(()=>e.style.display='none',3200)}
function readImg(file,max){return new Promise(r=>{const fr=new FileReader();fr.onload=()=>{const i=new Image();i.onload=()=>{const k=Math.min(1,max/Math.max(i.width,i.height)),c=document.createElement('canvas');c.width=Math.round(i.width*k);c.height=Math.round(i.height*k);c.getContext('2d').drawImage(i,0,0,c.width,c.height);r(c.toDataURL('image/jpeg',.82))};i.src=fr.result};fr.readAsDataURL(file)})}
function modal(h){const o=$('#ov');o.innerHTML='<div class="box">'+h+'</div>';o.classList.add('on')}
function closeM(){const o=$('#ov');o.classList.remove('on');o.innerHTML=''}
$('#ov').addEventListener('mousedown',e=>{if(e.target.id==='ov')closeM()});
function render(){
  const bg=D.cover?`background-image:linear-gradient(rgba(0,0,0,.45),rgba(0,0,0,.55)),url('${D.cover}')`:'';
  const link=D.linkUrl?`<a class="btn o" style="color:#fff;border-color:#fff;margin-inline-start:8px" href="${esc(D.linkUrl)}" target="_blank" rel="noopener">${esc(D.linkLabel||'رابط')}</a>`:'';
  const prods=D.products.map(p=>`<div class="card ${p.on?'':'out'}"><div class="im">${p.img?`<img src="${p.img}" alt="${esc(p.name)}">`:'🥐'}</div><div class="b"><h3>${esc(p.name)}</h3><p>${esc(p.desc)}</p><div class="pr">${esc(p.price)} ${esc(D.currency)}</div>${p.on?`<button class="btn g s" onclick="add('${p.id}')">أضف للطلب</button>`:'<span style="color:var(--mu)">غير متوفر حاليًا</span>'}${admin?`<button class="btn o s" onclick="editP('${p.id}')">تعديل</button>`:''}</div></div>`).join('');
  $('#app').innerHTML=`<header><div class="logo">🌼 ${esc(D.name)}</div><nav><a href="#products" onclick="go('products')">المنتجات</a><a href="#order" onclick="go('order')">اطلب</a></nav></header>
<section class="hero" style="${bg}"><div><h1>${esc(D.heroTitle)}</h1><p>${esc(D.heroSub)}</p><button class="btn" onclick="go('order')">${esc(D.btnText)}</button>${link}</div>${D.main?`<img class="main" src="${D.main}" alt="">`:'<div class="main">🥖</div>'}</section>
<h2 id="products">منتجاتنا</h2><div class="grid">${prods||'<p>لا توجد منتجات بعد.</p>'}</div>
<h2 id="order">اطلب الآن</h2><div class="box"><div id="cartbox"></div>
<label>الاسم</label><input id="oname"><label>رقم الهاتف</label><input id="ophone" type="tel" dir="ltr"><label>العنوان</label><input id="oaddr"><label>ملاحظات</label><textarea id="onote" rows="2"></textarea>
<p style="margin:14px 0 0"><button class="btn g" onclick="send()">إرسال الطلب</button></p></div>
<footer><div>${esc(D.tagline)}</div>${D.address?`<div>📍 ${esc(D.address)}</div>`:''}${D.phone?`<div>📞 <a href="tel:${esc(D.phone)}" dir="ltr">${esc(D.phone)}</a></div>`:''}<div style="margin-top:10px;font-size:.85rem">© ${esc(D.name)} · <a href="#" onclick="event.preventDefault();${admin?'':'loginM()'}">${admin?'':'دخول الإدارة'}</a></div></footer>
${admin?`<div class="bar"><button class="btn g s" onclick="editP()">＋ منتج</button><button class="btn s" onclick="ordersM()">الطلبات</button><button class="btn s" onclick="settingsM()">الإعدادات والصور</button><button class="btn g s" onclick="save()">${dirty?'● ':''}حفظ ونشر</button><button class="btn r s" onclick="logout()">تسجيل خروج</button></div>`:''}`;
  cartUI();
}
function go(id){const e=document.getElementById(id);if(e)e.scrollIntoView({behavior:'smooth'})}
function add(id){cart[id]=(cart[id]||0)+1;cartUI();toast('تمت الإضافة للطلب')}
function chg(id,d){cart[id]=(cart[id]||0)+d;if(cart[id]<=0)delete cart[id];cartUI()}
function cartUI(){const b=$('#cartbox');if(!b)return;const ids=Object.keys(cart).filter(i=>D.products.some(p=>p.id===i));let tot=0;
  b.innerHTML=ids.length?ids.map(i=>{const p=D.products.find(x=>x.id===i);tot+=(parseFloat(p.price)||0)*cart[i];return`<div class="row"><span>${esc(p.name)}</span><span class="q"><button onclick="chg('${i}',-1)">−</button> <b>${cart[i]}</b> <button onclick="chg('${i}',1)">＋</button></span></div>`}).join('')+`<div class="row"><b>المجموع</b><b>${tot} ${esc(D.currency)}</b></div>`:'<p style="color:var(--mu);margin:0">اختر المنتجات من القائمة بالضغط على «أضف للطلب».</p>'}
function send(){const ids=Object.keys(cart).filter(i=>D.products.some(p=>p.id===i));
  if(!ids.length)return toast('أضف منتجًا واحدًا على الأقل');
  const n=$('#oname').value.trim(),ph=$('#ophone').value.trim();if(!n||!ph)return toast('الرجاء إدخال الاسم ورقم الهاتف');
  let tot=0;const lines=ids.map(i=>{const p=D.products.find(x=>x.id===i);tot+=(parseFloat(p.price)||0)*cart[i];return`- ${p.name} × ${cart[i]}`});
  const t=`طلب جديد من ${D.name}\n${lines.join('\n')}\nالمجموع: ${tot} ${D.currency}\nالاسم: ${n}\nالهاتف: ${ph}\nالعنوان: ${$('#oaddr').value}\nملاحظات: ${$('#onote').value}`;
  const wa=(D.whatsapp||'').replace(/\D/g,'');
  const url=wa?`https://wa.me/${wa}?text=${encodeURIComponent(t)}`:`mailto:${D.orderEmail}?subject=${encodeURIComponent('طلب جديد')}&body=${encodeURIComponent(t)}`;
  window.open(url,'_blank');
  fetch('/api/orders',{method:'POST',headers:{'Content-Type':'application/json'},keepalive:true,body:JSON.stringify({name:n,phone:ph,addr:$('#oaddr').value,note:$('#onote').value,text:lines.join('\n'),total:tot+' '+D.currency})}).then(r=>toast(r.ok?'تم تسجيل طلبك لدى المخبز':'تم فتح الرسالة')).catch(()=>{})}
function loginM(){modal(`<h2 style="margin-top:0">دخول الإدارة</h2><label>البريد الإلكتروني</label><input id="le" type="email" dir="ltr"><label>كلمة المرور</label><input id="lp" type="password" dir="ltr"><div class="err" id="lerr"></div><p><button class="btn g" onclick="login()">دخول</button> <button class="btn o" onclick="closeM()">إلغاء</button></p>`)}
async function login(){try{const r=await fetch('/api/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email:$('#le').value.trim(),password:$('#lp').value})});const j=await r.json();
  if(r.ok){TOKEN=j.token;admin=true;try{sessionStorage.setItem('tok',TOKEN)}catch(x){}closeM();render();toast('أهلاً بك في لوحة الإدارة')}else $('#lerr').textContent=j.error||'خطأ'}catch(e){$('#lerr').textContent='تعذّر الاتصال بالخادم'}}
function logout(){try{fetch('/api/logout',{method:'POST',headers:H()})}catch(e){}TOKEN='';admin=false;try{sessionStorage.removeItem('tok')}catch(e){}render();toast('تم تسجيل الخروج')}
let tmpImg='';
function editP(id){const p=id?D.products.find(x=>x.id===id):{name:'',price:'',desc:'',img:'',on:true};tmpImg=p.img;
  modal(`<h2 style="margin-top:0">${id?'تعديل منتج':'منتج جديد'}</h2><label>الاسم</label><input id="pn" value="${esc(p.name)}"><label>السعر (${esc(D.currency)})</label><input id="pp" value="${esc(p.price)}" inputmode="decimal"><label>الوصف</label><textarea id="pd" rows="2">${esc(p.desc)}</textarea><label>الصورة</label><input type="file" accept="image/*" onchange="pimg(this)"><div id="pv">${tmpImg?`<img class="pv" src="${tmpImg}">`:''}</div><label><input type="checkbox" id="po" style="width:auto" ${p.on?'checked':''}> متوفر</label><p><button class="btn g" onclick="saveP('${id||''}')">حفظ المنتج</button> <button class="btn o" onclick="closeM()">إلغاء</button> ${id?`<button class="btn r" id="del" onclick="delP('${id}')">حذف</button>`:''}</p>`)}
async function pimg(el){if(!el.files[0])return;tmpImg=await readImg(el.files[0],700);$('#pv').innerHTML=`<img class="pv" src="${tmpImg}">`}
function saveP(id){const n=$('#pn').value.trim();if(!n)return toast('أدخل اسم المنتج');
  const o={id:id||'p'+Date.now(),name:n,price:$('#pp').value.trim(),desc:$('#pd').value.trim(),img:tmpImg,on:$('#po').checked};
  if(id)D.products[D.products.findIndex(x=>x.id===id)]=o;else D.products.push(o);
  dirty=true;closeM();render();toast('تم الحفظ — اضغط «حفظ ونشر» ليراها الزبائن')}
function delP(id){const b=$('#del');if(b.dataset.c!=='1'){b.dataset.c='1';b.textContent='تأكيد الحذف؟';return}
  D.products=D.products.filter(x=>x.id!==id);delete cart[id];dirty=true;closeM();render()}
function settingsM(){const f=(k,l,d)=>`<label>${l}</label><input id="s_${k}" value="${esc(D[k])}" ${d||''}>`;tmpImg='';
  modal(`<h2 style="margin-top:0">الإعدادات والصور</h2><label>صورة الغلاف (الخلفية)</label><input type="file" accept="image/*" onchange="simg(this,'cover',1400)"><div id="pc">${D.cover?`<img class="pv" src="${D.cover}">`:''}</div>${D.cover?'<button class="btn o s" onclick="D.cover=\'\';settingsM()">إزالة الغلاف</button>':''}
<label>الصورة الرئيسية (الدائرية)</label><input type="file" accept="image/*" onchange="simg(this,'main',600)"><div id="pm">${D.main?`<img class="pv" src="${D.main}">`:''}</div>${D.main?'<button class="btn o s" onclick="D.main=\'\';settingsM()">إزالة الصورة</button>':''}
${f('name','اسم المخبز')}${f('heroTitle','العنوان الرئيسي')}${f('heroSub','النص تحت العنوان')}${f('btnText','نص الزر الرئيسي')}${f('tagline','شعار أسفل الصفحة')}
<label>الرابط (اسم الزر)</label><input id="s_linkLabel" value="${esc(D.linkLabel)}" placeholder="مثال: صفحتنا على إنستغرام"><label>الرابط (العنوان)</label><input id="s_linkUrl" value="${esc(D.linkUrl)}" dir="ltr" placeholder="https://...">
<label>رقم واتساب لاستقبال الطلبات (مع رمز الدولة)</label><input id="s_whatsapp" value="${esc(D.whatsapp)}" dir="ltr" placeholder="9705XXXXXXXX">${f('phone','رقم الهاتف','dir="ltr"')}${f('address','العنوان')}${f('currency','العملة')}${f('orderEmail','بريد استقبال الطلبات (إذا لم يوجد واتساب)','dir="ltr"')}
<p><button class="btn g" onclick="saveS()">حفظ</button> <button class="btn o" onclick="closeM()">إغلاق</button></p>`)}
async function simg(el,k,m){if(!el.files[0])return;D[k]=await readImg(el.files[0],m);dirty=true;$(k==='cover'?'#pc':'#pm').innerHTML=`<img class="pv" src="${D[k]}">`}
function saveS(){['name','heroTitle','heroSub','btnText','tagline','linkLabel','linkUrl','whatsapp','phone','address','currency','orderEmail'].forEach(k=>D[k]=$('#s_'+k).value.trim());
  if(D.linkUrl&&!/^https?:\/\//i.test(D.linkUrl))D.linkUrl='https://'+D.linkUrl;
  dirty=true;closeM();render();toast('تم الحفظ — اضغط «حفظ ونشر»')}
async function save(){toast('جارٍ الحفظ...');try{const r=await fetch('/api/data',{method:'PUT',headers:H(),body:JSON.stringify(D)});
  if(r.status===401){logout();return toast('انتهت الجلسة، سجّل الدخول من جديد')}
  if(!r.ok)throw 0;dirty=false;try{localStorage.setItem(CK,JSON.stringify(D))}catch(e){}render();toast('تم الحفظ على الخادم ونسخة في المتصفح')}catch(e){toast('تعذّر الحفظ على الخادم')}}
function ordersM(){modal('<h2 style="margin-top:0">الطلبات</h2><div id="ol">جارٍ التحميل...</div><p><button class="btn o" onclick="closeM()">إغلاق</button></p>');
  fetch('/api/orders',{headers:H()}).then(r=>r.ok?r.json():Promise.reject()).then(a=>{$('#ol').innerHTML=a.length?a.map(o=>`<div class="row" style="display:block"><b>${esc(o.name)}</b> · <span dir="ltr">${esc(o.phone)}</span><br><small style="color:var(--mu)">${new Date(o.t).toLocaleString('ar')}</small><pre style="white-space:pre-wrap;font:inherit;margin:4px 0">${esc(o.text)}</pre></div>`).join(''):'لا توجد طلبات بعد.'}).catch(()=>{$('#ol').textContent='تعذّر تحميل الطلبات'})}
const CK='yb_cache';
async function init(){try{const c=localStorage.getItem(CK);if(c){D=JSON.parse(c);render()}}catch(e){}
  try{const r=await fetch('/api/data');if(r.ok){D=await r.json();try{localStorage.setItem(CK,JSON.stringify(D))}catch(e){}}}catch(e){}render()}
init();
