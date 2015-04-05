// ==UserScript==
// @name        MakabaCode
// @namespace   idinahuy
// @include     *2ch.*/pr*
// @version     1
// @grant       GM_xmlhttpRequest
// ==/UserScript==

var mcode = mcode || {};

mcode.tasks = {};
mcode.langs = ["abap", "as", "as3", "ada", "antlr", "antlr-as", "antlr-csharp", "antlr-cpp", "antlr-java",
    "antlr-objc", "antlr-perl", "antlr-python", "antlr-ruby", "apacheconf", "applescript", "aspectj", "aspx-cs",
    "aspx-vb", "asy", "ahk", "autoit", "awk", "basemake", "bash", "console", "bat", "bbcode", "befunge", "blitzmax",
    "boo", "brainfuck", "bro", "bugs", "c", "csharp", "cpp", "c-objdump", "ca65", "cbmbas", "ceylon", "cfengine3",
    "cfs", "cheetah", "clojure", "cmake", "cobol", "cobolfree", "coffee-script", "cfm", "common-lisp", "coq",
    "cpp-objdump", "croc", "css", "css+django", "css+genshitext", "css+lasso", "css+mako", "css+myghty", "css+php",
    "css+erb", "css+smarty", "cuda", "cython", "d", "d-objdump", "dpatch", "dart", "control", "sourceslist", "delphi",
    "dg", "diff", "django", "dtd", "duel", "dylan", "dylan-console", "dylan-lid", "ec", "ecl", "elixir", "iex",
    "ragel-em", "erb", "erlang", "erl", "evoque", "factor", "fancy", "fan", "felix", "fortran", "clipper", "fsharp",
    "gas", "genshi", "genshitext", "pot", "cucumber", "glsl", "gnuplot", "go", "gooddata-cl", "gosu", "gst", "groff",
    "groovy", "haml", "haskell", "hx", "html", "html+cheetah", "html+django", "html+evoque", "html+genshi",
    "html+lasso", "html+mako", "html+myghty", "html+php", "html+smarty", "html+velocity", "http", "haxeml", "hybris",
    "idl", "ini", "io", "ioke", "irc", "jade", "jags", "java", "jsp", "js", "js+cheetah", "js+django", "js+genshitext",
    "js+lasso", "js+mako", "js+myghty", "js+php", "js+erb", "js+smarty", "json", "julia", "jlcon", "kconfig", "koka",
    "kotlin", "lasso", "lighty", "lhs", "live-script", "llvm", "logos", "logtalk", "lua", "make", "mako", "maql",
    "mason", "matlab", "matlabsession", "minid", "modelica", "modula2", "trac-wiki", "monkey", "moocode", "moon",
    "mscgen", "mupad", "mxml", "myghty", "mysql", "nasm", "nemerle", "newlisp", "newspeak", "nginx", "nimrod", "nsis",
    "numpy", "objdump", "objective-c", "objective-c++", "objective-j", "ocaml", "octave", "ooc", "opa", "openedge",
    "perl", "php", "plpgsql", "psql", "postgresql", "postscript", "pov", "powershell", "prolog", "properties",
    "protobuf", "puppet", "pypylog", "python", "python3", "py3tb", "pycon", "pytb", "qml", "racket", "ragel",
    "ragel-c", "ragel-cpp", "ragel-d", "ragel-java", "ragel-objc", "ragel-ruby", "raw", "rconsole", "rd", "rebol",
    "redcode", "registry", "rst", "rhtml", "RobotFramework", "spec", "rb", "rbcon", "rust", "splus", "sass", "scala",
    "ssp", "scaml", "scheme", "scilab", "scss", "shell-session", "smali", "smalltalk", "smarty", "snobol", "sp", "sql",
    "sqlite3", "squidconf", "stan", "sml", "systemverilog", "tcl", "tcsh", "tea", "tex", "text", "treetop", "ts",
    "urbiscript", "vala", "vb.net", "velocity", "verilog", "vgl", "vhdl", "vim", "xml", "xml+cheetah", "xml+django",
    "xml+evoque", "xml+lasso", "xml+mako", "xml+myghty", "xml+php", "xml+erb", "xml+smarty", "xml+velocity", "xquery",
    "xslt", "xtend", "yaml", /*Here follows aliases*/
    "lisp", "c#", "f#"];

mcode.inLangs = function(lang) {
    if (!lang)
        return true;
    for (var i = 0; i < mcode.langs.length; ++i) {
        if (lang == mcode.langs[i])
            return true;
    }
    return false;
};

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
            if (last.length + line.length < 400)
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
    var lang = source.match(/lang\="?(\w|\+|\-| |#)+"?\]/gi);
    if (!lang)
        return null;
    lang = lang[0].replace("lang=", "").replace("]", "").split("\"").join("").replace(" ", "-");
    lang = lang.replace("++", "pp").toLowerCase();
    if ("lisp" == lang)
        lang = "common-lisp";
    else if ("c#" == lang)
        lang = "csharp";
    else if ("f#" == lang)
        lang = "fsharp";
    return lang;
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
    if (!lang) {
        lang = mcode.language(source);
        if (!mcode.inLangs(lang)) {
            delete mcode.tasks[element.id];
            return;
        }
    }
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
                    text = text.replace("overflow:auto;", "overflow:hidden;");
                    text = text.replace("<pre style=\"", "<pre style=\"overflow:hidden;");
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
                    delete mcode.tasks[element.id];
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
    var rx = /\[code(\s+lang\="?(\w|\+|\-| |#)+"?)?\].*?\[\/code\]/gi;
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
        return;
    for (var i = 0; i < elements.length; ++i)
        mcode.processBlockquote(elements[i]);
};

mcode.executeFirstTime = function() {
    mcode.execute();
    var navs = document.body.querySelectorAll(".thread-nav");
    document.addEventListener ("DOMNodeInserted", function(e) {
        var el = e.target;
        if (!el || !el.className)
            return;
        if ("post-wrapper" != el.className)
            return;
        mcode.execute();
    }, false);
};

mcode.addOnloadListener = function() {
    if (!document.addEventListener)
        return;
    document.addEventListener("DOMContentLoaded", mcode.executeFirstTime, false);
};

mcode.addOnloadListener();
