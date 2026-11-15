/* ===== data (ILLUSTRATIVE — replace with the extracted series) =====
   Copied from the design prototype. NOT real NASA data. Step 2 replaces this with
   public/tracks/<id>/track.json. */
export const D = (function () {
  const A = {1979:7.0,1980:7.7,1985:6.9,1990:6.2,1995:6.1,1996:7.9,2000:6.3,2002:6.0,2005:5.5,2007:4.3,2009:5.4,2011:4.6,2012:3.4,2013:5.2,2016:4.1,2019:4.2,2020:3.8,2022:4.7,2024:4.3};
  const K = Object.keys(A).map(Number).sort((a,b)=>a-b), years=[], norm=[];
  for (let y=1979;y<=2024;y++){ let i=0; while(K[i+1]!==undefined && K[i+1]<=y) i++; const a=K[i], b=K[Math.min(i+1,K.length-1)];
    const v = a===b ? A[a] : A[a]+(A[b]-A[a])*(y-a)/(b-a); years.push(y); norm.push(Math.max(0,Math.min(1,(v-3)/5))); }
  return {years, norm, records:[2002,2005,2007,2012]};
})();
