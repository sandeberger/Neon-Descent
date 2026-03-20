export var GestureType;
(function (GestureType) {
    GestureType[GestureType["NONE"] = 0] = "NONE";
    GestureType[GestureType["HOLD"] = 1] = "HOLD";
    GestureType[GestureType["SWIPE_DOWN"] = 2] = "SWIPE_DOWN";
    GestureType[GestureType["SWIPE_UP"] = 3] = "SWIPE_UP";
    GestureType[GestureType["DOUBLE_TAP"] = 4] = "DOUBLE_TAP";
})(GestureType || (GestureType = {}));
export function emptyInputFrame() {
    return {
        moveX: 0,
        fire: false,
        stomp: false,
        dash: false,
        special: false,
        aimTarget: null,
    };
}
