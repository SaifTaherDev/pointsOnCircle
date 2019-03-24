const canvas = document.body.querySelector("canvas");
const ctx = canvas.getContext("2d");
const inputs = document.body.querySelectorAll("#pointsBar input");
const randomButton = document.body.querySelector("#random");
const relocateButton = document.body.querySelector("#relocate");
const radiusDiv = document.body.querySelector("#radius");

const upButtons = document.body.querySelectorAll(".up .button");
const downButtons = document.body.querySelectorAll(".down .button");
const leftButtons = document.body.querySelectorAll(".left");
const rightButtons = document.body.querySelectorAll(".right");

const mapUp = document.body.querySelectorAll(".up .button")[3];
const mapDown = document.body.querySelectorAll(".down .button")[3];
const mapLeft = document.body.querySelectorAll(".left")[3];
const mapRight = document.body.querySelectorAll(".right")[3];


let moveMapUp = false;
let moveMapDown = false;
let moveMapLeft = false;
let moveMapRight = false;
let zoomInBool = false;
let zoomOutBool = false;

const zoomIn = document.body.querySelectorAll("#zoomInContainer .button")[0];
const zoomOut = document.body.querySelectorAll("#zoomInContainer .button")[1];
const resetZoom = document.body.querySelectorAll("#zoomInContainer .button")[2];
const zoomInFactorDisplay = document.body.querySelector("#zoomInContainer #zoomInFactorDisplay");

const upArr = [].slice.call(upButtons);
const downArr = [].slice.call(downButtons);
const leftArr = [].slice.call(leftButtons);
const rightArr = [].slice.call(rightButtons);

upArr.pop();
downArr.pop();
leftArr.pop();
rightArr.pop();

canvas.width = screen.width * 0.9;
canvas.height = canvas.width * 0.4;
const CW = canvas.width;
const CH = canvas.height;


canvas.style.left = screen.width / 2 - CW / 2 + "px";
canvas.style.top = screen.height / 2 - CH / 3 + "px";

const offSetLeft = canvas.offsetLeft;
const offSetTop = canvas.offsetTop;

const space = 4;
let points = [];
let center = { x: CW / 2, y: CH / 2 };
const radius = 5;
const minX = 0;
const maxX = CW;
const minY = 0;
const maxY = CH;
const incrementVal = 10;
let onPoint = false;
let pointIndex = 0;
let allOnLine = false;
let zoomFactor = 1;
const zoomIncrementVal = 0.025;
let circleRadius;

function calcCenter(factor) {
    const slope1 = -1 / calcLineSlope(points[0].x * factor, points[0].y * factor, points[1].x * factor, points[1].y * factor);
    const slope2 = -1 / calcLineSlope(points[1].x * factor, points[1].y * factor, points[2].x * factor, points[2].y * factor);
    const midPoint1 = calcMidPoint(points[0].x * factor, points[0].y * factor, points[1].x * factor, points[1].y * factor);
    const midPoint2 = calcMidPoint(points[1].x * factor, points[1].y * factor, points[2].x * factor, points[2].y * factor);

    const g1 = midPoint1.y - slope1 * midPoint1.x;
    const g2 = midPoint2.y - slope2 * midPoint2.x;

    let x;
    let y;

    if (Math.abs(slope1) == Infinity) {
        x = midPoint1.x;
        y = slope2 * x + g2;
    } else if (Math.abs(slope2) == Infinity) {
        x = midPoint2.x;
        y = slope1 * x + g1;
    } else {
        x = (g2 - g1) / (slope1 - slope2);
        y = slope1 * x + g1;
    }

    return { x: x, y: y, slope1: slope1, slope2: slope2 };
}

function calcLineSlope(x1, y1, x2, y2) {
    return (y2 - y1) / (x2 - x1);
}

function calcMidPoint(x1, y1, x2, y2) {
    return { x: (x1 + x2) / 2, y: (y1 + y2) / 2 };
}

function calcDistance(x1, y1, x2, y2) {
    return Math.sqrt(Math.pow((x1 - x2), 2) + Math.pow((y1 - y2), 2));
}

function generateRandomPoints(number) {
    let randX;
    let randY;
    let slope1 = 0; //any random assignments to prevent an infinite loop
    let slope2 = 1; //due to undefined == undefined --> true
    const points = [];
    const clrs = ["red", "green", "blue"];
    const letters = ["X", "Y", "Z"]

    for (let i = 0; i < number; i++) {
        do {
            randX = (Math.random() * (maxX - minX) + minX) / zoomFactor;
            randY = (Math.random() * (maxY - minY) + minY) / zoomFactor;
            if (i == 2) {
                slope1 = calcLineSlope(points[points.length - 2].x, points[points.length - 2].y, points[points.length - 1].x, points[points.length - 1].y);
                slope2 = calcLineSlope(points[points.length - 1].x, points[points.length - 1].y, randX, randY);
            }
        } while (slope1 == slope2)
        points.push({ x: randX, y: randY, clr: clrs[i], letter: letters[i] });
    }

    return points;
}

function drawPoints(points, c) {
    c.save();
    c.translate(0, 0);
    c.scale(zoomFactor, zoomFactor);
    c.lineWidth = 1 / zoomFactor;
    c.beginPath();
    c.moveTo(points[0].x * zoomFactor, points[0].y * zoomFactor);
    for (let i = 1; i < points.length; i++) {
        c.lineTo(points[i].x * zoomFactor, points[i].y * zoomFactor);
    }
    c.closePath();
    c.strokeStyle = "purple";
    c.stroke();
    points.map(function (point) {
        c.beginPath();
        c.arc(point.x * zoomFactor, point.y * zoomFactor, radius * (1 / zoomFactor), 0, Math.PI * 2);
        c.closePath();
        c.fillStyle = point.clr;
        c.fill();
        c.font = (1 / zoomFactor) * 20 + "px Cambria";
        c.fillText(point.letter, point.x * zoomFactor + (10 * (1 / zoomFactor)), point.y * zoomFactor + (10 * (1 / zoomFactor)));
    })
    c.restore();
}

function drawCircle(points, c) {
    const x = calcCenter(zoomFactor).x;
    const y = calcCenter(zoomFactor).y;
    const slope1 = calcCenter(zoomFactor).slope1;
    const slope2 = calcCenter(zoomFactor).slope2;

    r = calcDistance(points[0].x * zoomFactor, points[0].y * zoomFactor, x, y);

    if (!((Math.abs(slope1) == Infinity && Math.abs(slope2) == Infinity) || slope1 == slope2)) {
        center = [x * zoomFactor, y * zoomFactor];
        c.save();
        c.translate(x * zoomFactor, y * zoomFactor);
        c.scale(zoomFactor, zoomFactor);
        c.lineWidth = 1 / zoomFactor;
        c.beginPath();
        c.arc(0, 0, r, 0, Math.PI * 2);
        c.closePath();
        c.stroke();
        c.beginPath();
        c.arc(0, 0, radius * (1 / zoomFactor), 0, Math.PI * 2);
        c.closePath();
        c.fill();
        c.font = (1 / zoomFactor) * 20 + "px Cambria";
        c.fillText("C", 10 * (1 / zoomFactor), 10 * (1 / zoomFactor));
        c.restore();
        allOnLine = false;
    } else {
        allOnLine = true;
    }

}

function allOnLineAlert(c) {
    c.save();
    c.translate(CW / 2, 0.2 * CH);
    c.font = "50px Cambria";
    c.textAlign = "center";
    c.fillStyle = "red";
    c.fillText("All points lie on the same line!", 0, 0);
    c.restore();
}

function relocatePoints(c) {
    zoomFactor = 1;
    zoomInFactorDisplay.innerHTML = "1.00";
    drawCircle(points, c);
    for (let i = 0; i < points.length; i++) {
        points[i].x = CW / 2 + center[0] - points[i].x;
        points[i].y = CH / 2 + center[1] - points[i].y;
    }
}

randomButton.onclick = function () {
    points = generateRandomPoints(3);
}

relocateButton.onclick = function () {
    relocatePoints(ctx);
}

upArr.map(function (button) {
    button.onclick = function () {
        points[upArr.indexOf(button)].y -= incrementVal;
    }
})

downArr.map(function (button) {
    button.onclick = function () {
        points[downArr.indexOf(button)].y += incrementVal;
    }
})

leftArr.map(function (button) {
    button.onclick = function () {
        points[leftArr.indexOf(button)].x -= incrementVal;
    }
})

rightArr.map(function (button) {
    button.onclick = function () {
        points[rightArr.indexOf(button)].x += incrementVal;
    }
})

function zoomInFunction() {
    if (zoomFactor < 3.00) {
        zoomFactor += zoomIncrementVal;
        zoomFactor = Math.round(zoomFactor * 100) / 100;
        const numDecimals = (zoomFactor != Math.floor(zoomFactor)) ? (zoomFactor.toString()).split('.')[1].length : 0;
        if (numDecimals == 0) {
            zoomInFactorDisplay.innerHTML = zoomFactor + ".00";
        }
        else if (numDecimals == 1) {
            zoomInFactorDisplay.innerHTML = zoomFactor + "0";
        } else {
            zoomInFactorDisplay.innerHTML = zoomFactor;
        }
    }
}

function zoomOutFunction() {
    if (zoomFactor > 0.25) {
        zoomFactor -= zoomIncrementVal;
        zoomFactor = Math.round(zoomFactor * 100) / 100;
        const numDecimals = (zoomFactor != Math.floor(zoomFactor)) ? (zoomFactor.toString()).split('.')[1].length : 0;
        if (numDecimals == 0) {
            zoomInFactorDisplay.innerHTML = zoomFactor + ".00";
        }
        else if (numDecimals == 1) {
            zoomInFactorDisplay.innerHTML = zoomFactor + "0";
        } else {
            zoomInFactorDisplay.innerHTML = zoomFactor;
        }
    }
}


function moveMap() {
    if (moveMapUp) {
        for (let i = 0; i < points.length; i++) {
            points[i].y += incrementVal * (1 / zoomFactor);
        }
    } else if (moveMapDown) {
        for (let i = 0; i < points.length; i++) {
            points[i].y -= incrementVal * (1 / zoomFactor);
        }
    } else if (moveMapLeft) {
        for (let i = 0; i < points.length; i++) {
            points[i].x += incrementVal * (1 / zoomFactor);
        }
    } else if (moveMapRight) {
        for (let i = 0; i < points.length; i++) {
            points[i].x -= incrementVal * (1 / zoomFactor);
        }
    }
}


resetZoom.onclick = function () {
    zoomFactor = 1;
    zoomInFactorDisplay.innerHTML = "1.00";
}

canvas.onclick = function (e) {
    const posX = e.clientX - offSetLeft;
    const posY = e.clientY - offSetTop;
    const rgb = [ctx.getImageData(posX, posY, 1, 1).data[0], ctx.getImageData(posX, posY, 1, 1).data[1], ctx.getImageData(posX, posY, 1, 1).data[2]];
    if (rgb[0] == 255) {
        onPoint = !onPoint;
        pointIndex = 0;
    } else if (rgb[1] == 128) {
        onPoint = !onPoint;
        pointIndex = 1;
    } else if (rgb[2] == 255) {
        onPoint = !onPoint;
        pointIndex = 2;
    }
}

zoomIn.onmousedown = function () {
    zoomInBool = true;
}

zoomOut.onmousedown = function () {
    zoomOutBool = true;
}

zoomIn.onmouseup = function () {
    zoomInBool = false;
}

zoomOut.onmouseup = function () {
    zoomOutBool = false;
}

mapUp.onmousedown = function () {
    moveMapUp = true;
}

mapDown.onmousedown = function () {
    moveMapDown = true;
}

mapLeft.onmousedown = function () {
    moveMapLeft = true;
}

mapRight.onmousedown = function () {
    moveMapRight = true;
}


mapUp.onmouseup = function () {
    moveMapUp = false;
}

mapDown.onmouseup = function () {
    moveMapDown = false;
}

mapLeft.onmouseup = function () {
    moveMapLeft = false;
}

mapRight.onmouseup = function () {
    moveMapRight = false;
}

canvas.onmousemove = function (e) {
    if (onPoint) {
        points[pointIndex].x = (e.clientX - offSetLeft) / zoomFactor / zoomFactor;
        points[pointIndex].y = (e.clientY - offSetTop) / zoomFactor / zoomFactor;
    }
}

function mainLoop() {
    if(zoomInBool){
        zoomInFunction();
    }else if(zoomOutBool){
        zoomOutFunction();
    }
    const center = calcCenter(1);
    circleRadius = Math.round(100 * Math.sqrt(Math.pow(center.x - points[0].x, 2) + Math.pow(center.y - points[0].y, 2))) / 100;
    radiusDiv.innerHTML = "radius: " + circleRadius;
    ctx.clearRect(0, 0, CW, CH);
    moveMap();
    drawCircle(points, ctx);
    drawPoints(points, ctx);
    if (allOnLine) {
        allOnLineAlert(ctx);
    }
    requestAnimationFrame(mainLoop);
}

points = generateRandomPoints(3);

mainLoop();