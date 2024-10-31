let x = 0;
let y = 0;
let z = 0;

function setx(n, e) {
    x = n;
    document.querySelectorAll(".colx").forEach(el => el.style.backgroundColor = 'transparent');
    e.style.backgroundColor = '#ff6b6b';
    recalc();
}

function sety(n, e) {
    y = n;
    document.querySelectorAll(".coly").forEach(el => el.style.backgroundColor = 'transparent');
    e.style.backgroundColor = '#ff6b6b';
    recalc();
}

function setz(n, e) {
    z = n;
    document.querySelectorAll(".colz").forEach(el => el.style.backgroundColor = 'transparent');
    e.style.backgroundColor = '#ff6b6b';
    recalc();
}

function recalc() {
    document.getElementById("first").textContent = (2 * x + 11);
    document.getElementById("second").textContent = ((2 * z + y) - 5);
    document.getElementById("third").textContent = Math.abs((y + z) - x);
}
