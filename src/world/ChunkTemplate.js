export var TileType;
(function (TileType) {
    TileType[TileType["EMPTY"] = 0] = "EMPTY";
    TileType[TileType["SOLID"] = 1] = "SOLID";
    TileType[TileType["PLATFORM"] = 2] = "PLATFORM";
    TileType[TileType["HAZARD"] = 3] = "HAZARD";
    TileType[TileType["BREAKABLE"] = 4] = "BREAKABLE";
    TileType[TileType["BOUNCE"] = 5] = "BOUNCE";
})(TileType || (TileType = {}));
