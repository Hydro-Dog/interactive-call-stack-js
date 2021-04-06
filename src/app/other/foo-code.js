let a = 10;
const b = 20;
var c = 30;

function foo(alpha) {
  function fooNested() {
    let aNested = 1000;
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

boo();

doo(130);
