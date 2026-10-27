global.FILT = require('./filt.json'); global.CAT = require('./catalog.json');
const MG = require('./engine.js');
const D=[[0.6,127.4],[0.8,40.8],[1,25.5],[1.6,11],[2,7.6],[2.5,5.3],[3,3.6],[4,2],[5,1.2],[6,0.7],[8,0.3],[10,0.1]];
const data=D.map(([L,VI])=>({L,s:1,VI,rho:MG.rhoA(L,1,VI)}));
data.forEach((d,i)=>console.log(i+1,d.L,MG.K(d.L,1).toFixed(2),d.rho.toFixed(1),MG.codX(d.L).toFixed(2),MG.codY(d.rho).toFixed(2)));
console.log('dec', MG.decX(17.74), MG.decY(84.02));
// homogeneo
console.log('homog', MG.rhoAmodel(5,1,[100,100],[1]), MG.rhoAideal(50,[100],[]));
// 2 capas limites
console.log('2c', MG.rhoAideal(0.01,[10,100],[1]), MG.rhoAideal(1e4,[10,100],[1]));
// modelo de la guia
const rho=[22.0963,110.48,14.36], h=[0.19224,2.8836];
data.forEach(d=>console.log(d.L, d.rho.toFixed(1), MG.rhoAmodel(d.L,1,rho,h).toFixed(1), MG.rhoAideal(d.L,rho,h).toFixed(1)));
let t=Date.now(); MG.buildLibrary(); console.log('lib ms',Date.now()-t);
t=Date.now(); const hom=MG.homologar(data.map(d=>d.L),data.map(d=>d.rho)); console.log('hom ms',Date.now()-t);
hom.slice(0,8).forEach(c=>console.log(c.n,c.mu.join(':'),c.nu.join(),'E1',c.E1.toFixed(3),'r1',c.rho1.toFixed(2),'rms',c.rms.toFixed(1),'Ec',c.Ec.toFixed(2),'rc',c.rhoc.toFixed(2)));
const k10=hom.filter(c=>c.mu[1]===5&&c.mu[2]===0.65&&c.nu[0]===15)[0]; console.log('K10/15',k10&&[k10.E1,k10.rho1,k10.rms,k10.Ec,k10.rhoc]);
t=Date.now(); const aj=MG.ajustar(data,hom); console.log('aj ms',Date.now()-t);
for(const n of [2,3,4]) console.log(n,aj[n].rho.map(x=>x.toFixed(1)).join(' '),aj[n].h.map(x=>x.toFixed(2)).join(' '),'rms',aj[n].rms.toFixed(2), MG.tipo(aj[n].rho));
console.log('rec',aj.rec);
const m=MG.malla({a:20,b:10,ca:5,cl:5,d:0.0105,h:0.6});
const by=MG.burgsdorf(aj[3].rho,aj[3].h,m.S,0.6); console.log(m, by);
console.log('R schwarz',MG.schwarz(by.rhoEq,m),'laurent',MG.laurent(by.rhoEq,m));
console.log(MG.onderdonk(10,0.5,40,250));
const by2=MG.burgsdorf([22.1,110.5,14.4],[0.19,2.88],200,0.6); console.log(by2.rows.map(r=>[r.z,r.F.toFixed(4)]), by2.rhoEq, MG.schwarz(by2.rhoEq,m));
