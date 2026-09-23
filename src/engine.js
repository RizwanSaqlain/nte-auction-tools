export const ITEMS = [
  { name:'Artwork: Deep Forest', price:6069, file:'ArtworkDeepForest.png', short:'Deep Forest' },
  { name:'Asahi Inori Figurine', price:30264, file:'AsahiInoriFigurine.png', short:'Asahi Inori' },
  { name:'Ghostfire Wisp', price:260423, file:'GhostfireWisp.png', short:'Ghostfire Wisp' },
  { name:'Lost Armor', price:3626, file:'LostArmor.png', short:'Lost Armor' },
  { name:'New Flavor Out Now!', price:2745, file:'NewFlavorOut.png', short:'New Flavor' },
  { name:'Nine-Bite Snack Box', price:240208, file:'NineBiteSnackBox.png', short:'Nine-Bite Snack Box' },
  { name:'Thud-Thud Hammer', price:100000, file:'ThudThudHammer.png', short:'Thud-Thud Hammer' },
  { name:'Wheelchair Model', price:27159, file:'WheelChairModel.png', short:'Wheelchair Model' }
];
export function findBundles(bundles, {average=null,tolerance=2,size=0,minimum=null,maximum=null,known={}}={}) {
  return bundles.filter(b => (!size || b.size===size)
    && (average===null || Math.abs(Math.round(b.average)-Math.round(average))<=tolerance)
    && (minimum===null || b.sum>=minimum) && (maximum===null || b.sum<=maximum)
    && Object.entries(known).every(([i,count]) => {
      const quantity=b.items.filter(n=>n===ITEMS[Number(i)]?.name).length;
      return count===-1 ? quantity===0 : quantity>=count;
    })).sort((a,b)=>(average===null ? 0 : Math.abs(Math.round(a.average)-Math.round(average))-Math.abs(Math.round(b.average)-Math.round(average))) || a.sum-b.sum || a.size-b.size);
}
export function summarize(matches,bid=0,margin=10) {
  if (!matches.length) return null;
  const sums=matches.map(b=>b.sum).sort((a,b)=>a-b);
  const n=sums.length;
  return { min:sums[0],max:sums[n-1],median:n%2?sums[(n-1)/2]:(sums[n/2-1]+sums[n/2])/2,
    ceiling:Math.floor(sums[0]*(1-margin/100)), worst:sums[0]-bid,best:sums[n-1]-bid };
}
