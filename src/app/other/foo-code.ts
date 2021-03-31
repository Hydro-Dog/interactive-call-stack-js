let a = 10;
const b = 20;
var c = 30;

function foo(alpha) {
  console.log('foo');
}

function boo() {
  let d = 40;
  const e = 50;
  var f = 60;
  foo(f);
}

const doo = function () {
  console.log('doo');
};

const goo = () => {
  console.log('goo');
};

boo();
