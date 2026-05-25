window.requestAnimFrame = (function () {
    return (
        window.requestAnimationFrame ||
        window.webkitRequestAnimationFrame ||
        window.mozRequestAnimationFrame ||
        function (callback) {
            window.setTimeout(callback, 1000 / 60);
        }
    );
})();

const canvas = document.getElementById("canvas");
const c = canvas.getContext("2d");

let w = window.innerWidth;
let h = window.innerHeight;

let oldW = w;
let oldH = h;

let mouse = {
    x: null,
    y: null
};

function dist(p1x, p1y, p2x, p2y) {
    return Math.sqrt(
        Math.pow(p2x - p1x, 2) +
        Math.pow(p2y - p1y, 2)
    );
}

class segment {
    constructor(parent, l, a, first) {
        this.first = first;

        if (first) {
            this.pos = {
                x: parent.x,
                y: parent.y
            };
        } else {
            this.pos = {
                x: parent.nextPos.x,
                y: parent.nextPos.y
            };
        }

        this.l = l;
        this.ang = a;

        this.nextPos = {
            x: this.pos.x + this.l * Math.cos(this.ang),
            y: this.pos.y + this.l * Math.sin(this.ang)
        };
    }

    update(t) {
        this.ang = Math.atan2(
            t.y - this.pos.y,
            t.x - this.pos.x
        );

        this.pos.x =
            t.x + this.l * Math.cos(this.ang - Math.PI);

        this.pos.y =
            t.y + this.l * Math.sin(this.ang - Math.PI);

        this.nextPos.x =
            this.pos.x + this.l * Math.cos(this.ang);

        this.nextPos.y =
            this.pos.y + this.l * Math.sin(this.ang);
    }

    fallback(t) {
        this.pos.x = t.x;
        this.pos.y = t.y;

        this.nextPos.x =
            this.pos.x + this.l * Math.cos(this.ang);

        this.nextPos.y =
            this.pos.y + this.l * Math.sin(this.ang);
    }

    show() {
        c.lineTo(this.nextPos.x, this.nextPos.y);
    }
}

class tentacle {
    constructor(x, y, l, n) {
        this.x = x;
        this.y = y;
        this.l = l;
        this.n = n;
        this.rand = Math.random();

        this.segments = [
            new segment(this, this.l / this.n, 0, true)
        ];

        for (let i = 1; i < this.n; i++) {
            this.segments.push(
                new segment(
                    this.segments[i - 1],
                    this.l / this.n,
                    0,
                    false
                )
            );
        }
    }

    move(last_target, target) {
        this.angle = Math.atan2(
            target.y - this.y,
            target.x - this.x
        );

        this.dt =
            dist(
                last_target.x,
                last_target.y,
                target.x,
                target.y
            ) + 5;

        this.t = {
            x:
                target.x -
                0.8 * this.dt * Math.cos(this.angle),

            y:
                target.y -
                0.8 * this.dt * Math.sin(this.angle)
        };

        this.segments[this.n - 1].update(this.t);

        for (let i = this.n - 2; i >= 0; i--) {
            this.segments[i].update(
                this.segments[i + 1].pos
            );
        }

        if (
            dist(
                this.x,
                this.y,
                target.x,
                target.y
            ) <= this.l + this.dt
        ) {
            this.segments[0].fallback({
                x: this.x,
                y: this.y
            });

            for (let i = 1; i < this.n; i++) {
                this.segments[i].fallback(
                    this.segments[i - 1].nextPos
                );
            }
        }
    }

    show(target) {
        if (
            dist(
                this.x,
                this.y,
                target.x,
                target.y
            ) <= this.l
        ) {
            c.globalCompositeOperation = "lighter";

            c.beginPath();
            c.moveTo(this.x, this.y);

            for (let i = 0; i < this.n; i++) {
                this.segments[i].show();
            }

            c.strokeStyle =
                "hsl(" +
                (this.rand * 60 + 180) +
                ",100%," +
                (this.rand * 60 + 25) +
                "%)";

            c.lineWidth = this.rand * 2;
            c.lineCap = "round";
            c.lineJoin = "round";

            c.stroke();

            c.globalCompositeOperation = "source-over";
        }
    }

    show2(target) {
        c.beginPath();

        if (
            dist(
                this.x,
                this.y,
                target.x,
                target.y
            ) <= this.l
        ) {
            c.arc(
                this.x,
                this.y,
                2 * this.rand + 1,
                0,
                Math.PI * 2
            );

            c.fillStyle = "white";
        } else {
            c.arc(
                this.x,
                this.y,
                this.rand * 2,
                0,
                Math.PI * 2
            );

            c.fillStyle = "darkcyan";
        }

        c.fill();
    }
}

let maxl = 300;
let minl = 50;
let n = 30;
let numt = 500;

let tent = [];

function createTentacles() {
    for (let i = 0; i < numt; i++) {
        tent.push(
            new tentacle(
                Math.random() * w,
                Math.random() * h,
                Math.random() * (maxl - minl) + minl,
                n
            )
        );
    }
}

let target = {
    x: w / 2,
    y: h / 2
};

let last_target = {
    x: w / 2,
    y: h / 2
};

function resizeCanvas() {
    const dpr = window.devicePixelRatio || 1;

    const prevW = oldW;
    const prevH = oldH;

    w = window.innerWidth;
    h = window.innerHeight;

    canvas.width = w * dpr;
    canvas.height = h * dpr;

    canvas.style.width = w + "px";
    canvas.style.height = h + "px";

    c.setTransform(1, 0, 0, 1, 0, 0);
    c.scale(dpr, dpr);

    const scaleX = w / prevW;
    const scaleY = h / prevH;

    for (let i = 0; i < tent.length; i++) {
        tent[i].x *= scaleX;
        tent[i].y *= scaleY;
    }

    target.x *= scaleX;
    target.y *= scaleY;

    last_target.x *= scaleX;
    last_target.y *= scaleY;

    oldW = w;
    oldH = h;
}

window.addEventListener("resize", resizeCanvas);

createTentacles();
resizeCanvas();

canvas.addEventListener("mousemove", (e) => {
    const rect = canvas.getBoundingClientRect();

    mouse.x = e.clientX - rect.left;
    mouse.y = e.clientY - rect.top;
});

canvas.addEventListener("mouseleave", () => {
    mouse.x = null;
    mouse.y = null;
});

let t = 0;
let q = 10;

function draw() {
    if (mouse.x !== null) {
        target.errx = mouse.x - target.x;
        target.erry = mouse.y - target.y;
    } else {
        target.errx =
            w / 2 +
            ((h / 2 - q) *
                Math.sqrt(2) *
                Math.cos(t)) /
                (Math.pow(Math.sin(t), 2) + 1) -
            target.x;

        target.erry =
            h / 2 +
            ((h / 2 - q) *
                Math.sqrt(2) *
                Math.cos(t) *
                Math.sin(t)) /
                (Math.pow(Math.sin(t), 2) + 1) -
            target.y;
    }

    target.x += target.errx / 10;
    target.y += target.erry / 10;

    t += 0.01;

    c.beginPath();

    c.arc(
        target.x,
        target.y,
        dist(
            last_target.x,
            last_target.y,
            target.x,
            target.y
        ) + 5,
        0,
        Math.PI * 2
    );

    c.fillStyle = "hsl(210,100%,80%)";
    c.fill();

    for (let i = 0; i < numt; i++) {
        tent[i].move(last_target, target);
        tent[i].show2(target);
    }

    for (let i = 0; i < numt; i++) {
        tent[i].show(target);
    }

    last_target.x = target.x;
    last_target.y = target.y;
}

function animate() {
    c.clearRect(0, 0, w, h);

    draw();

    requestAnimFrame(animate);
}

animate();