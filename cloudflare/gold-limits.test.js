import test from 'node:test';
import assert from 'node:assert/strict';
import {quantityLimit} from '../public/gold-limits.js';
const items=[{id:0,price:10,slot:3},{id:1,price:20,slot:5}],base={maxPerItem:5,maxCount:25,maxSlots:140,target:null};
test('quantity increment limits account for all other selected items',()=>{
 assert.equal(quantityLimit(items[0],{},items,base),5);
 assert.equal(quantityLimit(items[0],{1:2},items,{...base,maxCount:3}),1);
 assert.equal(quantityLimit(items[0],{1:2},items,{...base,maxSlots:12}),0);
 assert.equal(quantityLimit(items[0],{1:2},items,{...base,target:50}),1);
 assert.equal(quantityLimit(items[0],{0:5},items,{...base,maxPerItem:2}),2);
});
