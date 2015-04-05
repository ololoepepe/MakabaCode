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

mcode.filled = function(what, count) {
    var s = "";
    for (var i = 0; i < count; ++i)
        s += what;
    return s;
};

mcode.replaceTabs = function(s, tabWidth) {
    var i = 0;
    while (i < s.length) {
        if (s.charAt(i) == "\t") {
            var spcount = tabWidth - (i < tabWidth ? i : i % tabWidth);
            s = s.substr(0, i) + mcode.filled(" ", spcount ? spcount : tabWidth) + s.substr(i + 1);
            i += spcount;
        } else {
            ++i;
        }
    }
    return s;
};

mcode.parts = function(s) {
    var parts = [];
    s.split("\n").forEach(function(line) {
        if (parts.length >= 1) {
            var last = parts[parts.length - 1];
            if (last.length + line.length < 500)
                parts[parts.length - 1] += line + "\n";
            else
                parts.push(line + "\n");
        } else {
            parts.push(line + "\n");
        }
    });
    return parts;
};

mcode.language = function(source) {
    var lang = source.match(/lang\="?(\w|\+)+"?\]/gi);
    if (!lang)
        return null;
    return lang[0].replace("lang=", "").replace("]", "").split("\"").join("").split(" ").join("").replace("++", "pp").toLowerCase();
};

mcode.code = function(source) {
    var ind = source.indexOf("]");
    var code = source.substring(ind + 1, source.length - 7);
    code = code.split("<em>").join("*").split("</em>").join("*").split("<br>").join("\n");
    code = code.split("&lt;").join("<").split("&gt;").join(">").split("&quot;").join("\"").split("&amp;").join("&");
    code = code.split("#92;").join("\\");
    if (code.length < 1)
       return code;
    while (code.indexOf("\n") == 0)
        code = code.substr(1);
    while (code.lastIndexOf("\n") == code.length - 1)
        code = code.substr(0, code.length - 1);
    var lines = code.split("\n");
    for (var i = 0; i < lines.length; ++i)
        lines[i] = mcode.replaceTabs(lines[i], 4);
    code = lines.join("\n");
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

mcode.request = function(element, source, lang, parts, current, html) {
    if (!element || typeof source != "string")
        return;
    if (!lang)
        lang = mcode.language(source);
    if (!parts)
        parts = mcode.parts(mcode.code(source));
    if (!current)
        current = 0;
    if (!html)
        html = "";
    var params = "code=" + encodeURIComponent(parts[current]) + "&style=friendly&lexer="
        + (!!lang ? encodeURIComponent(lang) : "text");
    GM_xmlhttpRequest({
        method: "GET",
        url: "http://hilite.me/api?" + params,
        onload: function(res) {
            if (4 === res.readyState) {
                if (200 == res.status) {
                    var text = res.responseText;
                    if (html.length > 0) {
                        html = html.replace("\n</pre></div>", "");
                        text = text.replace(/<div.*?><pre.*?>/, "");
                    }
                    html += text;
                    if (current == parts.length - 1)
                        mcode.subtaskReceived(element, source, html);
                    else
                        mcode.request(element, source, lang, parts, current + 1, html);
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
    var rx = /\[code(\s+lang\="?(\w|\+)+"?)?\].*?\[\/code\]/gi;
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
