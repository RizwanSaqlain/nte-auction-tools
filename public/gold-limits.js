export function quantityLimit(item, quantities, items, limits){
  let count=0,slots=0,value=0;
  for(const other of items){if(other.id===item.id)continue;const q=Number(quantities[other.id])||0;count+=q;slots+=q*other.slot;value+=q*other.price;}
  return Math.max(0,Math.min(limits.maxPerItem,limits.maxCount-count,Math.floor((limits.maxSlots-slots)/item.slot),limits.target===null?Infinity:Math.floor((limits.target-value)/item.price)));
}
