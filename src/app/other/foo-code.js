let a = 10;
const b = 20;
var c = 30;

function foo(alpha) {
  const fooval = 2002;
  function fooNested() {
    let aNested = 1000;
    let bNested = 1000;
  }
  console.log("foo");
}

function boo() {
  let d = 40;
  const e = 50;
  var f = 60;
  foo(f);
}

var cc = 330;

boo();

const doo = function (val) {
  const g = 70;
  let h = 80;
  var m = 90;
  console.log("doo");
};

const goo = () => {
  let o = 100;
  const p = 110;
  console.log("goo");
};

doo(130);
//-------------------------

const x = 1;
let y = 2;
var z = 3;

function foo(alpha) {
  const a = 10;
  let b = 20;
  var c = 30;

  function boo() {
    var d = 40;
    const e = 50;
    console.log();
  }

  boo();
}

foo(111);

let f = 70;
const g = 80;
