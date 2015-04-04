// ==UserScript==
// @name        MakabaCode
// @namespace   idinahuy
// @include     *2ch.*/pr*
// @version     1
// @grant       GM_xmlhttpRequest
// ==/UserScript==

var mcode = mcode || {};

mcode.tasks = {};

mcode.isEmpty = function(obj) {
    if (!obj)
        return true;
    for (p in obj) {
        if (obj.hasOwnProperty(p))
            return false;
    }
    return true;
};

mcode.language = function(source) {
    var lang = source.match(/lang\="?\w+"?\]/gi);
    if (!lang)
        return null;
    return lang[0].replace("lang=", "").replace("]", "").split("\"").join("").split(" ").join("").toLowerCase();
};

mcode.code = function(source) {
    var ind = source.indexOf("]");
    var code = source.substring(ind + 1, source.length - 7);
    code = code.split("<em>").join("*").split("</em>").join("*").split("<br>").join("\n");
    code = code.split("&lt;").join("<").split("&gt;").join(">").split("&quot;").join("\"").split("&amp;").join("&");
    return code;
};

mcode.subtaskReceived = function(element, source, target) {
    var task = {
        "source": source,
        "target": target
    };
    mcode.tasks[element.id]["subtasks"].push(task);
    if (mcode.tasks[element.id]["subtasks"].length == mcode.tasks[element.id]["subtaskCount"]) {
        mcode.doTask(element, mcode.tasks[element.id]["subtasks"]);
        delete mcode.tasks[element.id];
        if (mcode.isEmpty(mcode.tasks))
            setTimeout(mcode.execute, 15 * 1000);
    }
};

mcode.doTask = function(element, subtasks) {
    if (!element || !subtasks || 0 === subtasks.length)
        return;
    var html = element.innerHTML;
    subtasks.forEach(function(task) {
        var source = task["source"];
        var target = task["target"];
        html = html.replace(source, target);
    });
    element.innerHTML = html;
};

mcode.request = function(element, source) {
    if (!element || typeof source != "string")
        return;
    var lang = mcode.language(source);
    var code = mcode.code(source);
    var params = "code=" + encodeURIComponent(code) + (!!lang ? ("&lexer=" + encodeURIComponent(lang)) : "");
    GM_xmlhttpRequest({
        method: "GET",
        url: "http://hilite.me/api?" + params,
        onload: function(res) {
            if (4 === res.readyState) {
                if (200 == res.status) {
                    var html = res.responseText;
                    mcode.subtaskReceived(element, source, html);
                } else {
                    alert(res.statusText);
                }
            }
        }
    });
};

mcode.processBlockquote = function(element) {
    if (!element || !element.childNodes)
        return;
    element["makaba-code"] = "true";
    var html = element.innerHTML;
    var rx = /\[code(\s+lang\="?\w+"?)?\].*?\[\/code\]/gi;
    var matches = html.match(rx);
    if (!matches)
        return;
    mcode.tasks[element.id] = {
        "subtasks": [],
        "subtaskCount": matches.length,
    };
    matches.forEach(function(source) {
        mcode.request(element, source);
    });
};

mcode.execute = function() {
    var elements = document.body.querySelectorAll("blockquote.post-message:not([makaba-code='true'])");
    if (!elements || elements.length < 1)
        return setTimeout(mcode.execute, 15 * 1000);
    for (var i = 0; i < elements.length; ++i)
        mcode.processBlockquote(elements[i]);
};

mcode.executeFirstTime = function() {
    mcode.execute();
    var navs = document.body.querySelectorAll(".thread-nav");
    for (var i = 0; i < navs.length; ++i) {
        var nav = navs[i];
        nav.appendChild(document.createTextNode(" ["));
        var a = document.createElement("a");
        a.href = "javascript:void(0);";
        a.onclick = mcode.execute;
        a.appendChild(document.createTextNode("Подсветить синтаксис"));
        nav.appendChild(a);
        nav.appendChild(document.createTextNode("]"));
    }
};

mcode.addOnloadListener = function() {
    if (!document.addEventListener)
        return;
    document.addEventListener("DOMContentLoaded", mcode.executeFirstTime, false);
};

mcode.addOnloadListener();
