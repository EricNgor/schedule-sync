// let x = [1,2,3];
// let y = x.findAll(e=>e>=2);
// console.log(y);

let x = [[1,2,3],[4,5,6],[7,8,9]];
// for (a of x) {for (b of a) {console.log(b)}}
let y = x.map(a=>a.map(b=>++b));
console.log(y);