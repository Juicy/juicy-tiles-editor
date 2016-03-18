﻿function fireEvent(obj, evt, ctrl) {
    var fireOnThis = obj;

    if (document.createEvent) {
        //var evObj = document.createEvent(evt.indexOf("mouse") > -1 ? "MouseEvents" : "KeyboardEvent");
        var evObj = document.createEvent("MouseEvents", { ctrlKey: true });
        evObj.ctrlKey = !!ctrl;
        evObj.initEvent(evt, true, false);
        fireOnThis.dispatchEvent(evObj);

    } else if (document.createEventObject) {
        var evObj = document.createEventObject();
        evObj.ctrlKey = !!ctrl;
        fireOnThis.fireEvent("on" + evt, evObj);
    }
}

function click(element, timeout) {
    if (!timeout) {
        element.click();
        return;
    }

    setTimeout(function () {
        click(element);
    }, timeout);
}

function dblclick(element, timeout) {
    if (!timeout) {
        fireEvent(element, "dblclick");
        return;
    }

    setTimeout(function () {
        dblclick(element);
    }, timeout);
}

function ctrlClick(element, timeout) {
    if (!timeout) {
        console.error("ctrlClick is not implemented");
        return;
    }

    setTimeout(function () {
        ctrlClick(element);
    }, timeout);
}

function getCellById(table, id) {
    return Polymer.dom(table.shadowRoot).querySelector("td[id='" + id + "']");
}

function getNthCell(table, n) {
    return Polymer.dom(table.shadowRoot).querySelector("td:nth-child(" + n + ")");
}

function getNthTile(table, n) {
    return table.querySelector("[juicytile]:nth-child(" + n + ")");
}

function getTileById(table, id) {
    return table.querySelector("[juicytile='" + id + "']");
}

function JuicyTileTableWrapper(table) {
    this.table = table;
}

JuicyTileTableWrapper.prototype.cells = function () {
    return Polymer.dom(this.table.shadowRoot).querySelectorAll("td");
};

JuicyTileTableWrapper.prototype.cell = function (id) {
    return getCellById(this.table, id);
};

JuicyTileTableWrapper.prototype.nthCell = function (n) {
    return getNthCell(this.table, n);
};

JuicyTileTableWrapper.prototype.tiles = function () {
    return this.table.querySelector("[juicytile]");
};

JuicyTileTableWrapper.prototype.tile = function (id) {
    return getTileById(this.table, id);
};

JuicyTileTableWrapper.prototype.nthTile = function (n) {
    return getNthTile(this.table, IDBCursor);
};